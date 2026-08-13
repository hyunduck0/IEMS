import { getPool } from "./db.ts";
import type { ActionStatus, EquipmentStatus, LogRecord } from "./types";

// equipment_events 테이블 조회 전용 모듈. 가동률 계산은 lib/utilization.ts,
// 조치 보고(action_reports)는 lib/actionReports.ts에 있다 (lib/data.ts가 셋을 재노출).

const CAUSE_MAX_LENGTH = 100;
const NOTE_MAX_LENGTH = 150;

/**
 * 필수 필드 규칙을 검증하고 위반 사항을 문자열 목록으로 반환한다.
 * - 멈춤·알람은 원인(cause) 필수, 정상은 원인이 비어 있어야 한다.
 * - 원인은 100자, 비고는 150자를 넘으면 안 된다.
 * - 조치 상태(actionStatus)는 알람일 때만 채워져 있어야 한다.
 * DB의 check 제약이 같은 규칙을 강제하므로, 이 함수는 삽입 전 이중 확인(seed 스크립트 등)에 쓴다.
 */
export function validateRecord(record: LogRecord): string[] {
  const problems: string[] = [];
  const label = `${record.line}라인 ${record.position} (${record.timestamp})`;

  if ((record.status === "멈춤" || record.status === "알람") && !record.cause) {
    problems.push(`${label}: ${record.status} 상태인데 원인(cause)이 없습니다`);
  }
  if (record.status === "정상" && record.cause) {
    problems.push(`${label}: 정상 상태인데 원인(cause)이 채워져 있습니다`);
  }
  if (record.cause && record.cause.length > CAUSE_MAX_LENGTH) {
    problems.push(`${label}: 원인(cause)이 ${CAUSE_MAX_LENGTH}자를 초과합니다 (${record.cause.length}자)`);
  }
  if (record.note && record.note.length > NOTE_MAX_LENGTH) {
    problems.push(`${label}: 비고(note)가 ${NOTE_MAX_LENGTH}자를 초과합니다 (${record.note.length}자)`);
  }
  if (record.status === "알람" && !record.actionStatus) {
    problems.push(`${label}: 알람 상태인데 조치 상태(actionStatus)가 없습니다`);
  }
  if (record.status !== "알람" && record.actionStatus) {
    problems.push(`${label}: ${record.status} 상태인데 조치 상태(actionStatus)가 채워져 있습니다`);
  }

  return problems;
}

interface EquipmentEventRow {
  id: number;
  occurred_at: Date;
  line: number;
  position: string;
  status: string;
  cause: string | null;
  action_status: string | null;
  note: string | null;
}

const EVENT_COLUMNS = "id, occurred_at, line, position, status, cause, action_status, note";

function toLogRecord(row: EquipmentEventRow): LogRecord {
  return {
    id: row.id,
    timestamp: row.occurred_at.toISOString(),
    line: row.line,
    position: row.position as LogRecord["position"],
    status: row.status as EquipmentStatus,
    cause: row.cause ?? undefined,
    actionStatus: (row.action_status ?? undefined) as ActionStatus | undefined,
    note: row.note ?? undefined,
  };
}

/** 라인·설비별 가장 최근 상태(현재 스냅샷) 18건을 반환한다. */
export async function getEquipmentStatus(): Promise<LogRecord[]> {
  const { rows } = await getPool().query<EquipmentEventRow>(
    `select distinct on (line, position) ${EVENT_COLUMNS}
     from equipment_events
     order by line, position, occurred_at desc, id desc`
  );
  return rows.map(toLogRecord);
}

/** 알람·멈춤 이력 전체를 최신순으로 반환한다. 라인·날짜·개수 필터는 화면에서 처리한다. */
export async function getAlarmRecords(): Promise<LogRecord[]> {
  const { rows } = await getPool().query<EquipmentEventRow>(
    `select ${EVENT_COLUMNS}
     from equipment_events
     where status <> '정상'
     order by occurred_at desc`
  );
  return rows.map(toLogRecord);
}

export async function getEquipmentHistory(line: number, position: "정면" | "배면"): Promise<LogRecord[]> {
  const { rows } = await getPool().query<EquipmentEventRow>(
    `select ${EVENT_COLUMNS}
     from equipment_events
     where line = $1 and position = $2 and status <> '정상'
     order by occurred_at desc`,
    [line, position]
  );
  return rows.map(toLogRecord);
}

/** id로 이벤트 하나를 조회한다. 조치 보고 입력 화면에서 대상 이벤트 정보를 보여줄 때 쓴다. */
export async function getEventById(id: number): Promise<LogRecord | null> {
  const { rows } = await getPool().query<EquipmentEventRow>(
    `select ${EVENT_COLUMNS} from equipment_events where id = $1`,
    [id]
  );
  return rows.length === 0 ? null : toLogRecord(rows[0]);
}

/** 한 라인(정면+배면)의 전체 이벤트 이력을 시간순으로 반환한다. 가동률 계산(lib/utilization.ts)이 쓴다. */
export async function getLineEvents(line: number): Promise<LogRecord[]> {
  const { rows } = await getPool().query<EquipmentEventRow>(
    `select ${EVENT_COLUMNS}
     from equipment_events
     where line = $1
     order by occurred_at asc`,
    [line]
  );
  return rows.map(toLogRecord);
}
