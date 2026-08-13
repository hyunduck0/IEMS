"use client";

import { useMemo, useState } from "react";
import type { ActionReport, LogRecord } from "@/lib/types";
import AlarmHistoryTable from "./AlarmHistoryTable";

interface AlarmHistoryExplorerProps {
  records: LogRecord[];
  latestActions: Record<number, ActionReport>;
}

const COUNT_OPTIONS = ["10", "20", "50", "전체"] as const;
const PAGE_SIZE = 20;

export default function AlarmHistoryExplorer({ records, latestActions }: AlarmHistoryExplorerProps) {
  const [line, setLine] = useState("전체");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [count, setCount] = useState<(typeof COUNT_OPTIONS)[number]>("20");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    // record.timestamp는 UTC ISO 문자열이고 fromDate/toDate는 <input type="date">가 주는 로컬 날짜다.
    // 문자열을 그대로 비교하면 KST-UTC 시차(최대 9시간)만큼 날짜 경계가 어긋나므로,
    // 로컬 자정 기준 Date 객체로 변환해 실제 시각(instant)끼리 비교한다.
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;

    return records.filter((record) => {
      if (line !== "전체" && record.line !== Number(line)) return false;
      const recordDate = new Date(record.timestamp);
      if (from && recordDate < from) return false;
      if (to && recordDate > to) return false;
      return true;
    });
  }, [records, line, fromDate, toDate]);

  const isPaged = count === "전체";
  const pageCount = isPaged ? Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)) : 1;
  const currentPage = Math.min(page, pageCount - 1);

  const visible = isPaged
    ? filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)
    : filtered.slice(0, Number(count));

  function updateFilter(update: () => void) {
    update();
    setPage(0);
  }

  const fieldClass =
    "rounded-sm border border-grid bg-panel px-2.5 py-1.5 text-text outline-none focus:border-signal focus:ring-1 focus:ring-signal/50";
  const labelClass = "font-readout text-[10px] uppercase tracking-widest text-muted";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-4 rounded-sm border border-grid bg-panel p-4 text-sm">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>라인</span>
          <select value={line} onChange={(e) => updateFilter(() => setLine(e.target.value))} className={fieldClass}>
            <option value="전체">전체</option>
            {Array.from({ length: 9 }, (_, i) => i + 1).map((l) => (
              <option key={l} value={l}>
                {l}라인
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>시작일</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => updateFilter(() => setFromDate(e.target.value))}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>종료일</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => updateFilter(() => setToDate(e.target.value))}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>표시 개수</span>
          <select
            value={count}
            onChange={(e) => updateFilter(() => setCount(e.target.value as (typeof COUNT_OPTIONS)[number]))}
            className={fieldClass}
          >
            {COUNT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "전체" ? "전체 (20개 단위)" : `${opt}개`}
              </option>
            ))}
          </select>
        </label>

        <div className="font-readout text-signal">총 {filtered.length}건</div>
      </div>

      <AlarmHistoryTable records={visible} latestActions={latestActions} />

      {isPaged && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="rounded-sm border border-grid px-3 py-1.5 text-muted transition-colors hover:border-signal/50 hover:text-signal disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-grid disabled:hover:text-muted"
          >
            이전
          </button>
          <span className="font-readout text-muted">
            {currentPage + 1} / {pageCount} 페이지
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={currentPage >= pageCount - 1}
            className="rounded-sm border border-grid px-3 py-1.5 text-muted transition-colors hover:border-signal/50 hover:text-signal disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-grid disabled:hover:text-muted"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
