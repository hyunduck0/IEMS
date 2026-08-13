import type { EquipmentStatus } from "./types";

// 상태 색상 우선순위: 알람 > 멈춤 > 정상. 이 순서 하나만 화면 전체(카드·이력)에서 재사용한다.
const STATUS_PRIORITY: EquipmentStatus[] = ["알람", "멈춤", "정상"];

const STATUS_COLORS: Record<EquipmentStatus, string> = {
  알람: "bg-alarm-dim text-alarm border border-alarm/50 animate-pulse",
  멈춤: "bg-warn-dim text-warn border border-warn/50",
  정상: "bg-normal-dim text-normal border border-normal/40",
};

/** 여러 상태가 동시에 존재하는 경우 우선순위(알람 > 멈춤 > 정상)가 가장 높은 상태를 고른다. */
export function resolveStatus(statuses: EquipmentStatus[]): EquipmentStatus {
  for (const candidate of STATUS_PRIORITY) {
    if (statuses.includes(candidate)) return candidate;
  }
  return "정상";
}

/** 상태에 대응하는 색상 클래스. 카드·이력 화면 전체가 이 함수 하나만 사용한다. */
export function getStatusColor(status: EquipmentStatus): string {
  return STATUS_COLORS[status];
}

const STATUS_BORDER_COLORS: Record<EquipmentStatus, string> = {
  알람: "border-alarm shadow-[0_0_16px_-2px_var(--color-alarm)]",
  멈춤: "border-warn shadow-[0_0_16px_-4px_var(--color-warn)]",
  정상: "border-grid",
};

/** 카드 테두리에 쓰는 상태별 강조(알람·멈춤은 발광 테두리, 정상은 기본 그리드 선). */
export function getStatusBorderColor(status: EquipmentStatus): string {
  return STATUS_BORDER_COLORS[status];
}

const STATUS_ACCENT_COLORS: Record<EquipmentStatus, string> = {
  알람: "text-alarm",
  멈춤: "text-warn",
  정상: "text-grid-bright",
};

/** 코너 브래킷·아이콘 틴트·스캔라인처럼 "글자색 하나"만 필요한 곳에 쓰는 상태별 강조색. */
export function getStatusAccentColor(status: EquipmentStatus): string {
  return STATUS_ACCENT_COLORS[status];
}

const STATUS_ICONS: Record<EquipmentStatus, string> = {
  알람: "⚠",
  멈춤: "⏸",
  정상: "✓",
};

/** 색맹 사용자도 구분할 수 있도록 색상 외에 함께 표시하는 아이콘. */
export function getStatusIcon(status: EquipmentStatus): string {
  return STATUS_ICONS[status];
}

const UTILIZATION_WARN_MAX = 80;
const UTILIZATION_ALARM_MAX = 50;

/**
 * 가동률(%) 임계값 색상. 80% 이하는 노란색(경고), 50% 이하는 빨간색(위험), 그 외는 정상색.
 * 가동률을 텍스트로 표시하는 곳(상세 표 등)이 이 함수 하나만 사용한다.
 */
export function getUtilizationColorClass(pct: number): string {
  if (pct <= UTILIZATION_ALARM_MAX) return "text-alarm";
  if (pct <= UTILIZATION_WARN_MAX) return "text-warn";
  return "text-normal";
}

const UTILIZATION_HEX = { normal: "#2dd4bf", warn: "#fbbf24", alarm: "#fb3a4b" } as const;

/** 가동률(%) 임계값 색상의 hex 값. Chart.js처럼 CSS 클래스를 못 쓰는 곳에서 쓴다. */
export function getUtilizationColorHex(pct: number): string {
  if (pct <= UTILIZATION_ALARM_MAX) return UTILIZATION_HEX.alarm;
  if (pct <= UTILIZATION_WARN_MAX) return UTILIZATION_HEX.warn;
  return UTILIZATION_HEX.normal;
}
