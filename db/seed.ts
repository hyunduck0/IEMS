import { Pool } from "pg";
import { validateRecord } from "../lib/data.ts";
import type { ActionStatus, EquipmentStatus, LogRecord } from "../lib/types.ts";

const NOW = new Date();

function hoursAgo(hours: number): Date {
  return new Date(NOW.getTime() - hours * 60 * 60 * 1000);
}

type Position = "정면" | "배면";

interface Entry {
  line: number;
  position: Position;
  status: EquipmentStatus;
  cause?: string;
  actionStatus?: ActionStatus;
  note?: string;
  timestamp: Date;
}

const ACTION_STATUSES: ActionStatus[] = ["확인전", "확인중", "조치완료", "조치불가 추가 확인 필요"];

const STOP_CAUSES = [
  "원자재 공급 지연으로 정지",
  "정기 점검을 위해 수동 정지",
  "컨베이어 벨트 걸림으로 정지",
  "공압 압력 부족으로 정지",
];

const ALARM_CAUSES = [
  "온도 센서 임계값 초과",
  "모터 과부하 알람 발생",
  "비전 카메라 인식 오류",
  "냉각수 압력 이상 감지",
  "축 위치 오차 한계 초과",
];

/**
 * 라인(정면+배면) 단위 현재 상태 배정.
 * "가동" = 정면·배면이 동시에 정상일 때만이므로, 한쪽만 이상이어도 그 라인은 비가동이다.
 *   - 2라인: 배면 알람 (정면 정상)
 *   - 3라인: 정면 알람 (배면 정상)
 *   - 4라인: 배면 멈춤 (정면 정상)
 *   - 5라인: 정면·배면 모두 알람 (최악의 경우)
 *   - 나머지(1, 6~9라인): 완전 가동 (정면+배면 모두 정상)
 */
const LINE_PLAN: Record<number, Record<Position, EquipmentStatus>> = {
  1: { 정면: "정상", 배면: "정상" },
  2: { 정면: "정상", 배면: "알람" },
  3: { 정면: "알람", 배면: "정상" },
  4: { 정면: "정상", 배면: "멈춤" },
  5: { 정면: "알람", 배면: "알람" },
  6: { 정면: "정상", 배면: "정상" },
  7: { 정면: "정상", 배면: "정상" },
  8: { 정면: "정상", 배면: "정상" },
  9: { 정면: "정상", 배면: "정상" },
};

function currentStateFor(line: number, position: Position): Omit<Entry, "line" | "position" | "timestamp"> {
  const status = LINE_PLAN[line][position];
  if (status === "정상") return { status };

  const offset = line * 2 + (position === "배면" ? 1 : 0);
  if (status === "멈춤") {
    return { status, cause: STOP_CAUSES[offset % STOP_CAUSES.length] };
  }
  return {
    status,
    cause: ALARM_CAUSES[offset % ALARM_CAUSES.length],
    actionStatus: ACTION_STATUSES[offset % ACTION_STATUSES.length],
    note: "현장 담당자 확인 요청",
  };
}

function variantStateFor(
  line: number,
  position: Position,
  status: EquipmentStatus,
  episodeIndex: number
): Omit<Entry, "line" | "position" | "timestamp"> {
  const offset = line * 2 + (position === "배면" ? 1 : 0) + episodeIndex + 3;
  if (status === "멈춤") {
    return { status, cause: STOP_CAUSES[offset % STOP_CAUSES.length] };
  }
  return {
    status,
    cause: ALARM_CAUSES[offset % ALARM_CAUSES.length],
    actionStatus: ACTION_STATUSES[offset % ACTION_STATUSES.length],
    note: "현장 담당자 확인 요청",
  };
}

// 상세 표(7일)·주간 파이차트가 지난 7일(168시간) 전체를 커버해야 하므로,
// "항상 정상"인 라인도 168시간보다 먼저 이력이 시작하도록 200시간 전에 기준 이벤트를 둔다.
const HISTORY_DEPTH_HOURS = 200;

function buildPositionHistory(line: number, position: Position, entries: Entry[]) {
  const state = currentStateFor(line, position);
  const jitter = (line + (position === "배면" ? 0.3 : 0)) * 0.4; // 라인·설비 간 타임스탬프 겹침 방지용 미세 오프셋

  if (state.status === "정상") {
    entries.push({ line, position, status: "정상", timestamp: hoursAgo(HISTORY_DEPTH_HOURS - jitter) });
    return;
  }

  // 최초 발생(약 7.9일 전) -> 정상 복구 -> 재발(약 5.8일 전, 8시간 지속) -> 정상 복구 -> 현재(스냅샷과 동일).
  // 7일 상세 표·주간 파이차트에서 알람 구간이 실제로 보이도록 최근 7일 안에 재발 이벤트를 둔다.
  const episodeHoursAgo = [HISTORY_DEPTH_HOURS - 10, 140, 1 + line * 0.4];

  episodeHoursAgo.forEach((baseHrsAgo, i) => {
    const isLast = i === episodeHoursAgo.length - 1;
    const epState = isLast ? state : variantStateFor(line, position, state.status, i);
    const eventHrsAgo = baseHrsAgo - jitter;

    entries.push({ line, position, ...epState, timestamp: hoursAgo(eventHrsAgo) });

    if (!isLast) {
      const recoveryHrsAgo = eventHrsAgo - 8;
      entries.push({ line, position, status: "정상", timestamp: hoursAgo(recoveryHrsAgo) });
    }
  });
}

function buildEntries(): Entry[] {
  const entries: Entry[] = [];
  for (let line = 1; line <= 9; line++) {
    buildPositionHistory(line, "정면", entries);
    buildPositionHistory(line, "배면", entries);
  }
  entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return entries;
}

function toLogRecord(entry: Entry): LogRecord {
  return {
    timestamp: entry.timestamp.toISOString(),
    line: entry.line,
    position: entry.position,
    status: entry.status,
    cause: entry.cause,
    actionStatus: entry.actionStatus,
    note: entry.note,
  };
}

async function seed() {
  const entries = buildEntries();

  for (const entry of entries) {
    const problems = validateRecord(toLogRecord(entry));
    if (problems.length > 0) {
      throw new Error(`시드 데이터 검증 실패: ${problems.join(", ")}`);
    }
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // action_reports가 equipment_events를 참조하므로 함께 truncate해야 한다.
    await pool.query("truncate table equipment_events, action_reports restart identity cascade");

    for (const entry of entries) {
      await pool.query(
        `insert into equipment_events (occurred_at, line, position, status, cause, action_status, note)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [entry.timestamp, entry.line, entry.position, entry.status, entry.cause ?? null, entry.actionStatus ?? null, entry.note ?? null]
      );
    }

    const abnormalCount = entries.filter((e) => e.status !== "정상").length;
    console.log(`equipment_events 시드 완료: 총 ${entries.length}건 (알람·멈춤 ${abnormalCount}건)`);
  } finally {
    await pool.end();
  }
}

seed();
