import Link from "next/link";
import { getStatusAccentColor, getStatusBorderColor, getStatusColor, getStatusIcon } from "@/lib/status";
import type { LogRecord } from "@/lib/types";
import EquipmentIcon from "./EquipmentIcon";

interface EquipmentCardProps {
  record: LogRecord;
}

export default function EquipmentCard({ record }: EquipmentCardProps) {
  const isAbnormal = record.status !== "정상";
  const accent = getStatusAccentColor(record.status);

  return (
    <Link
      href={`/equipment/${record.line}/${record.position}`}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-sm border bg-panel p-3 transition-colors hover:bg-panel-raised ${getStatusBorderColor(record.status)}`}
    >
      <span className={`pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t ${accent}`} />
      <span className={`pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t ${accent}`} />
      <span className={`pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l ${accent}`} />
      <span className={`pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r ${accent}`} />
      {isAbnormal && <span className={`scan-sweep pointer-events-none absolute inset-0 ${accent}`} />}

      <EquipmentIcon className={`h-9 w-9 shrink-0 ${accent}`} />
      <div className="relative">
        <div className="font-readout text-[10px] uppercase tracking-widest text-muted">
          L{String(record.line).padStart(2, "0")} · {record.position === "정면" ? "FRONT" : "REAR"}
        </div>
        <div className="text-sm text-text">
          {record.line}라인 {record.position}
        </div>
        <div className={`mt-1 inline-block rounded-sm px-2 py-0.5 text-xs ${getStatusColor(record.status)}`}>
          {getStatusIcon(record.status)} {record.status}
        </div>
      </div>
    </Link>
  );
}
