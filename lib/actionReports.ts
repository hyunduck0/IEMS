import { getPool } from "./db.ts";
import type { ActionReport, ReportResult, ReportStatus } from "./types";

// action_reports(조치 보고) 테이블 전용 모듈. 설비 이벤트 조회는 lib/events.ts에 있다
// (lib/data.ts가 events/utilization/actionReports 세 모듈을 재노출).

interface ActionReportRow {
  id: number;
  event_id: number;
  reported_at: Date;
  assignee: string;
  status: string;
  result: string | null;
  content: string;
}

function toActionReport(row: ActionReportRow): ActionReport {
  return {
    id: row.id,
    eventId: row.event_id,
    reportedAt: row.reported_at.toISOString(),
    assignee: row.assignee,
    status: row.status as ReportStatus,
    result: (row.result ?? undefined) as ReportResult | undefined,
    content: row.content,
  };
}

/** 특정 이벤트(멈춤·알람 행)에 쌓인 조치 보고를 최신순으로 반환한다. */
export async function getActionReportsForEvent(eventId: number): Promise<ActionReport[]> {
  const { rows } = await getPool().query<ActionReportRow>(
    `select id, event_id, reported_at, assignee, status, result, content
     from action_reports
     where event_id = $1
     order by reported_at desc`,
    [eventId]
  );
  return rows.map(toActionReport);
}

/** 이벤트별 가장 최근 조치 보고를 한 번에 조회한다. 종합 이력 표의 조치 현황/결과 컬럼에 쓴다. */
export async function getLatestActionReports(): Promise<Map<number, ActionReport>> {
  const { rows } = await getPool().query<ActionReportRow>(
    `select distinct on (event_id) id, event_id, reported_at, assignee, status, result, content
     from action_reports
     order by event_id, reported_at desc`
  );
  return new Map(rows.map((row) => [row.event_id, toActionReport(row)]));
}

/** 새 조치 보고를 추가한다(수정·삭제 없음 — 항상 새 보고를 누적). */
export async function createActionReport(input: {
  eventId: number;
  reportedAt: Date;
  assignee: string;
  status: ReportStatus;
  result?: ReportResult;
  content: string;
}): Promise<void> {
  await getPool().query(
    `insert into action_reports (event_id, reported_at, assignee, status, result, content)
     values ($1, $2, $3, $4, $5, $6)`,
    [input.eventId, input.reportedAt, input.assignee, input.status, input.result ?? null, input.content]
  );
}
