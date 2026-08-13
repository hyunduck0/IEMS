import { getStatusAccentColor, getStatusColor } from "@/lib/status";
import type { LogRecord } from "@/lib/types";

interface EquipmentHistoryListProps {
  records: LogRecord[];
}

export default function EquipmentHistoryList({ records }: EquipmentHistoryListProps) {
  if (records.length === 0) {
    return (
      <p className="rounded-sm border border-grid bg-panel p-4 font-readout text-sm text-muted">
        이력이 없습니다.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {records.map((record) => (
        <li
          key={record.timestamp}
          className={`border-l-2 bg-panel p-4 text-sm ${getStatusAccentColor(record.status).replace("text-", "border-")}`}
        >
          <div className="flex items-center gap-3">
            <span className="font-readout text-muted">{record.timestamp}</span>
            <span className={`inline-block rounded-sm px-2 py-0.5 text-xs ${getStatusColor(record.status)}`}>
              {record.status}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-1 text-text sm:grid-cols-2">
            <div>
              <span className="text-muted">원인 </span>
              {record.cause}
            </div>
            {record.actionStatus && (
              <div>
                <span className="text-muted">조치 상태 </span>
                {record.actionStatus}
              </div>
            )}
            {record.note && (
              <div className="sm:col-span-2">
                <span className="text-muted">조치 내용 </span>
                {record.note}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
