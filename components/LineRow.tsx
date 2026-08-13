import { getStatusAccentColor, resolveStatus } from "@/lib/status";
import type { LogRecord } from "@/lib/types";
import EquipmentCard from "./EquipmentCard";

interface LineRowProps {
  line: number;
  front: LogRecord;
  back: LogRecord;
}

export default function LineRow({ line, front, back }: LineRowProps) {
  const trackAccent = getStatusAccentColor(resolveStatus([front.status, back.status]));

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-grid bg-panel font-hud text-signal">
        {String(line).padStart(2, "0")}
      </div>
      <div className="flex flex-1 items-center gap-3">
        <EquipmentCard record={front} />
        <div className="flex flex-1 items-center gap-0">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${trackAccent} bg-current`} />
          <span className={`h-px flex-1 ${trackAccent} bg-current opacity-50`} />
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${trackAccent} bg-current`} />
        </div>
        <EquipmentCard record={back} />
      </div>
    </div>
  );
}
