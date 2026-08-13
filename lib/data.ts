// 데이터 계층 진입점. 실제 구현은 세 모듈에 나뉘어 있고(각 300줄 이내), 여기서는 재노출만 한다.
// 화면 코드는 계속 "@/lib/data" 하나에서 import하면 된다.
//
// - lib/events.ts        equipment_events 조회 (현재 상태, 이력, 단건 조회)
// - lib/utilization.ts   가동률·상태 비율 계산 (lib/events.ts에 의존)
// - lib/actionReports.ts action_reports(조치 보고) 조회·생성
//
// 상태 색상·아이콘 유틸(getStatusColor 등)은 DB에 의존하지 않는 lib/status.ts에 있다.
// 이 배럴은 PostgreSQL을 조회하는 모듈만 모아두므로, 클라이언트 컴포넌트는
// lib/status.ts를 직접 import해야 한다.

export * from "./events.ts";
export * from "./utilization.ts";
export * from "./actionReports.ts";
