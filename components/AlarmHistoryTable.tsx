"use client";

import { useRouter } from "next/navigation";
import { getStatusColor } from "@/lib/status";
import type { ActionReport, LogRecord } from "@/lib/types";

interface AlarmHistoryTableProps {
  records: LogRecord[];
  latestActions: Record<number, ActionReport>;
}

export default function AlarmHistoryTable({ records, latestActions }: AlarmHistoryTableProps) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-sm border border-grid">
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-grid bg-panel-raised text-left font-readout text-xs uppercase tracking-wider text-muted">
            <th className="p-3 font-normal">시간</th>
            <th className="p-3 font-normal">라인</th>
            <th className="p-3 font-normal">설비</th>
            <th className="p-3 font-normal">상태</th>
            <th className="p-3 font-normal">내용</th>
            <th className="p-3 font-normal">조치 현황</th>
            <th className="p-3 font-normal">조치 결과</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const latest = record.id !== undefined ? latestActions[record.id] : undefined;
            return (
              <tr
                key={`${record.line}-${record.position}-${record.timestamp}`}
                onClick={() => record.id !== undefined && router.push(`/history/${record.id}`)}
                className="cursor-pointer border-b border-grid bg-panel last:border-0 hover:bg-panel-raised"
              >
                <td className="p-3 font-readout text-muted">{record.timestamp}</td>
                <td className="p-3 text-text">{record.line}라인</td>
                <td className="p-3 text-text">{record.position}</td>
                <td className="p-3">
                  <span className={`inline-block rounded-sm px-2 py-0.5 text-xs ${getStatusColor(record.status)}`}>
                    {record.status}
                  </span>
                </td>
                <td className="p-3 text-text">{record.cause}</td>
                <td className="p-3 text-text">{latest ? latest.status : <span className="text-muted">-</span>}</td>
                <td className="p-3 text-text">{latest?.result ?? <span className="text-muted">-</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
