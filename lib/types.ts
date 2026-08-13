export type EquipmentStatus = "정상" | "멈춤" | "알람";
export type ActionStatus = "확인전" | "확인중" | "조치완료" | "조치불가 추가 확인 필요";

export interface LogRecord {
  id?: number; // equipment_events.id (DB에서 읽은 레코드에만 존재)
  timestamp: string; // ISO 8601로 변환 후 저장
  line: number; // 1~9
  position: "정면" | "배면";
  status: EquipmentStatus;
  cause?: string; // 멈춤/알람일 때만, 100자 이내
  actionStatus?: ActionStatus; // 알람일 때만
  note?: string; // 조치 내용, 150자 이내
}

// 조치 보고: 종합 이력의 멈춤·알람 행에 대해 사용자가 입력하는 유일한 쓰기 데이터.
export type ReportStatus = "확인전" | "확인후" | "조치완료";
export type ReportResult = "조작 미스" | "점검" | "기타";

export interface ActionReport {
  id: number;
  eventId: number;
  reportedAt: string; // ISO 8601
  assignee: string;
  status: ReportStatus;
  result?: ReportResult;
  content: string;
}
