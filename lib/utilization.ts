import { getLineEvents } from "./events.ts";
import { resolveStatus } from "./status.ts";
import type { EquipmentStatus, LogRecord } from "./types";

// 가동률·상태 비율 계산 전용 모듈. 원본 이벤트 조회는 lib/events.ts에 있다
// (lib/data.ts가 events/utilization/actionReports 세 모듈을 재노출).

/** 라인별 이벤트 캐시. loadLineEventsMap으로 한 번에 채워 여러 계산에서 재사용한다. */
export type LineEventsCache = Map<number, LogRecord[]>;

/**
 * 여러 라인의 이벤트를 한 번에 미리 불러와 맵으로 반환한다.
 * 통계 화면처럼 같은 라인 데이터를 여러 계산(가동률·상태 비율·설비별 가동률)에서 반복 조회하면
 * 매번 DB 왕복이 생기므로(N+1), 호출부에서 이 함수로 한 번만 불러와 아래 함수들에 캐시로 넘긴다.
 */
export async function loadLineEventsMap(lines: number[]): Promise<LineEventsCache> {
  const unique = Array.from(new Set(lines));
  const results = await Promise.all(unique.map((line) => getLineEvents(line)));
  return new Map(unique.map((line, i) => [line, results[i]]));
}

async function eventsFor(line: number, cache?: LineEventsCache): Promise<LogRecord[]> {
  const cached = cache?.get(line);
  return cached ?? getLineEvents(line);
}

function splitByPosition(records: LogRecord[]): { front: LogRecord[]; back: LogRecord[] } {
  return {
    front: records.filter((r) => r.position === "정면").sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    back: records.filter((r) => r.position === "배면").sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
  };
}

function statusAtOrBefore(events: LogRecord[], ms: number): EquipmentStatus | undefined {
  let result: EquipmentStatus | undefined;
  for (const event of events) {
    if (new Date(event.timestamp).getTime() <= ms) result = event.status;
    else break;
  }
  return result;
}

/**
 * 정면·배면 이력(이미 시간순 정렬됨)을 합쳐, 두 설비가 동시에 "정상"이었던 시간(normalMs)과
 * 두 설비 상태를 모두 알 수 있었던 전체 시간(totalMs)을 구한다.
 * 정면·배면 중 하나라도 멈춤·알람이면 그 구간은 "비가동"으로 센다.
 */
function computeLineNormalMsPure(
  frontEvents: LogRecord[],
  backEvents: LogRecord[],
  from: Date,
  to: Date
): { normalMs: number; totalMs: number } {
  const fromMs = from.getTime();
  const toMs = to.getTime();

  let currentFront = statusAtOrBefore(frontEvents, fromMs);
  let currentBack = statusAtOrBefore(backEvents, fromMs);

  const changePoints = [
    ...frontEvents.map((e) => ({ position: e.position, status: e.status, ms: new Date(e.timestamp).getTime() })),
    ...backEvents.map((e) => ({ position: e.position, status: e.status, ms: new Date(e.timestamp).getTime() })),
  ]
    .filter((e) => e.ms > fromMs && e.ms < toMs)
    .sort((a, b) => a.ms - b.ms);

  let normalMs = 0;
  let totalMs = 0;
  let cursor = fromMs;

  const accumulate = (segmentEnd: number) => {
    if (segmentEnd <= cursor) return;
    const duration = segmentEnd - cursor;
    if (currentFront !== undefined && currentBack !== undefined) {
      totalMs += duration;
      if (currentFront === "정상" && currentBack === "정상") normalMs += duration;
    }
    cursor = segmentEnd;
  };

  for (const point of changePoints) {
    accumulate(point.ms);
    if (point.position === "정면") currentFront = point.status;
    else currentBack = point.status;
  }
  accumulate(toMs);

  return { normalMs, totalMs };
}

/**
 * 가동률(%) = 구간 [from, to) 동안 라인이 "가동"(정면·배면 동시 정상) 상태였던 시간의 비율.
 * 정면·배면 중 하나라도 멈춤·알람이면 그 라인은 비가동으로 센다.
 * line을 지정하면 그 라인만, 생략하면 9개 라인 전체를 시간 가중 평균한다.
 * cache를 넘기면 DB를 다시 조회하지 않고 loadLineEventsMap이 미리 불러온 이벤트를 재사용한다.
 * 이 함수가 유일한 계산식이며, 화면은 이 함수의 결과만 표시한다.
 */
export async function calculateUtilization(options: {
  line?: number;
  from: Date;
  to: Date;
  cache?: LineEventsCache;
}): Promise<number> {
  const { line, from, to, cache } = options;
  const lines = line !== undefined ? [line] : Array.from({ length: 9 }, (_, i) => i + 1);

  let normalMs = 0;
  let totalMs = 0;
  for (const l of lines) {
    const { front, back } = splitByPosition(await eventsFor(l, cache));
    const result = computeLineNormalMsPure(front, back, from, to);
    normalMs += result.normalMs;
    totalMs += result.totalMs;
  }

  return totalMs === 0 ? 0 : (normalMs / totalMs) * 100;
}

/**
 * 정면·배면 이력을 시간순으로 합쳐, 매 순간 라인의 대표 상태(resolveStatus: 알람 > 멈춤 > 정상)를
 * 판정하고 상태별로 머문 시간(ms)을 집계한다. 파이차트 등 "가동/멈춤/알람 비율" 표시에 쓴다.
 */
export async function getLineStatusBreakdown(
  line: number,
  from: Date,
  to: Date,
  cache?: LineEventsCache
): Promise<Record<EquipmentStatus, number>> {
  const fromMs = from.getTime();
  const toMs = to.getTime();
  const { front: frontEvents, back: backEvents } = splitByPosition(await eventsFor(line, cache));

  let currentFront = statusAtOrBefore(frontEvents, fromMs);
  let currentBack = statusAtOrBefore(backEvents, fromMs);

  const changePoints = [
    ...frontEvents.map((e) => ({ position: e.position, status: e.status, ms: new Date(e.timestamp).getTime() })),
    ...backEvents.map((e) => ({ position: e.position, status: e.status, ms: new Date(e.timestamp).getTime() })),
  ]
    .filter((e) => e.ms > fromMs && e.ms < toMs)
    .sort((a, b) => a.ms - b.ms);

  const breakdown: Record<EquipmentStatus, number> = { 정상: 0, 멈춤: 0, 알람: 0 };
  let cursor = fromMs;

  const accumulate = (segmentEnd: number) => {
    if (segmentEnd <= cursor) return;
    const duration = segmentEnd - cursor;
    if (currentFront !== undefined && currentBack !== undefined) {
      breakdown[resolveStatus([currentFront, currentBack])] += duration;
    }
    cursor = segmentEnd;
  };

  for (const point of changePoints) {
    accumulate(point.ms);
    if (point.position === "정면") currentFront = point.status;
    else currentBack = point.status;
  }
  accumulate(toMs);

  return breakdown;
}

/** 라인·설비(정면 또는 배면) 하나만의 단독 정상 비율(%). 라인 AND 로직과 달리 그 설비 자신의 이력만 본다. */
export async function calculateEquipmentUtilization(
  line: number,
  position: "정면" | "배면",
  from: Date,
  to: Date,
  cache?: LineEventsCache
): Promise<number> {
  const fromMs = from.getTime();
  const toMs = to.getTime();

  const records = (await eventsFor(line, cache))
    .filter((r) => r.position === position)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  let current = statusAtOrBefore(records, fromMs);
  const changePoints = records
    .map((e) => ({ status: e.status, ms: new Date(e.timestamp).getTime() }))
    .filter((e) => e.ms > fromMs && e.ms < toMs);

  let normalMs = 0;
  let totalMs = 0;
  let cursor = fromMs;

  const accumulate = (segmentEnd: number) => {
    if (segmentEnd <= cursor) return;
    const duration = segmentEnd - cursor;
    if (current !== undefined) {
      totalMs += duration;
      if (current === "정상") normalMs += duration;
    }
    cursor = segmentEnd;
  };

  for (const point of changePoints) {
    accumulate(point.ms);
    current = point.status;
  }
  accumulate(toMs);

  return totalMs === 0 ? 0 : (normalMs / totalMs) * 100;
}

export interface UtilizationBucket {
  label: string;
  from: Date;
  to: Date;
  overall: number;
  byLine: Record<number, number>;
}

function formatBucketLabel(date: Date, granularity: "day" | "week"): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return granularity === "day" ? `${mm}/${dd}` : `${mm}/${dd} 주`;
}

/**
 * 최근 `count`개의 일/주 구간별 가동률(전체 + 라인별)을 계산한다.
 * 각 구간의 계산은 calculateUtilization 하나만 사용한다.
 * cache를 넘기지 않으면 9개 라인 이벤트를 한 번만 미리 불러와(N+1 방지) 모든 구간 계산에 재사용한다.
 */
export async function getUtilizationTimeline(
  granularity: "day" | "week",
  count: number,
  cache?: LineEventsCache
): Promise<UtilizationBucket[]> {
  const lineCache = cache ?? (await loadLineEventsMap(Array.from({ length: 9 }, (_, i) => i + 1)));
  const bucketMs = (granularity === "day" ? 1 : 7) * 24 * 60 * 60 * 1000;
  const now = new Date();

  const buckets: UtilizationBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const to = new Date(now.getTime() - i * bucketMs);
    const from = new Date(to.getTime() - bucketMs);

    const byLine: Record<number, number> = {};
    for (let line = 1; line <= 9; line++) {
      byLine[line] = await calculateUtilization({ line, from, to, cache: lineCache });
    }

    buckets.push({
      label: formatBucketLabel(from, granularity),
      from,
      to,
      overall: await calculateUtilization({ from, to, cache: lineCache }),
      byLine,
    });
  }

  return buckets;
}

/**
 * 오늘(00시~24시)을 `intervalHours`시간 간격으로 나눠 구간별 가동률(전체 + 라인별)을 계산한다.
 * 예: intervalHours=1 -> 00시, 01시, ..., 23시로 24구간 표시.
 * cache를 넘기지 않으면 9개 라인 이벤트를 한 번만 미리 불러와(N+1 방지) 모든 구간 계산에 재사용한다.
 */
export async function getHourlyUtilizationTimeline(
  intervalHours: number,
  cache?: LineEventsCache
): Promise<UtilizationBucket[]> {
  const lineCache = cache ?? (await loadLineEventsMap(Array.from({ length: 9 }, (_, i) => i + 1)));
  const bucketMs = intervalHours * 60 * 60 * 1000;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const count = (24 * 60 * 60 * 1000) / bucketMs;
  const pad = (n: number) => String(n).padStart(2, "0");

  const buckets: UtilizationBucket[] = [];
  for (let i = 0; i < count; i++) {
    const from = new Date(startOfDay.getTime() + i * bucketMs);
    const to = new Date(from.getTime() + bucketMs);

    const byLine: Record<number, number> = {};
    for (let line = 1; line <= 9; line++) {
      byLine[line] = await calculateUtilization({ line, from, to, cache: lineCache });
    }

    buckets.push({
      label: `${pad(from.getHours())}시`,
      from,
      to,
      overall: await calculateUtilization({ from, to, cache: lineCache }),
      byLine,
    });
  }

  return buckets;
}
