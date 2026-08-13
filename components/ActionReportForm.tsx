"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ASSIGNEES } from "@/lib/assignees";
import type { ReportResult, ReportStatus } from "@/lib/types";

const STATUS_OPTIONS: ReportStatus[] = ["확인전", "확인후", "조치완료"];
const RESULT_OPTIONS: ReportResult[] = ["조작 미스", "점검", "기타"];
const DEFAULT_STATUS: ReportStatus = "확인전";

function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface ActionReportFormProps {
  action: (formData: FormData) => void; // 저장 (같은 화면 유지)
  saveAndCloseAction: (formData: FormData) => void; // 저장 후 닫기 (종합 이력으로 이동)
}

export default function ActionReportForm({ action, saveAndCloseAction }: ActionReportFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const saveAndCloseButtonRef = useRef<HTMLButtonElement>(null);

  // lazy initializer: 클라이언트에서 이 컴포넌트가 처음 렌더될 때 한 번만 "현재 시간"을 계산한다.
  const [reportedAt, setReportedAt] = useState(() => toLocalDateTimeInputValue(new Date()));
  const [assignee, setAssignee] = useState("");
  const [status, setStatus] = useState<ReportStatus>(DEFAULT_STATUS);
  const [result, setResult] = useState("");
  const [content, setContent] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const isDirty = assignee !== "" || status !== DEFAULT_STATUS || result !== "" || content.trim() !== "";

  function handleClose() {
    if (isDirty) {
      setShowConfirm(true);
    } else {
      router.push("/history");
    }
  }

  function handleConfirmSaveAndClose() {
    setShowConfirm(false);
    // "저장 후 닫기" 버튼을 제출자로 지정해 saveAndCloseAction 경로로 폼을 제출한다.
    formRef.current?.requestSubmit(saveAndCloseButtonRef.current);
  }

  function handleConfirmDiscard() {
    setShowConfirm(false);
    router.push("/history");
  }

  const fieldClass =
    "rounded-sm border border-grid bg-panel px-2.5 py-1.5 text-sm text-text outline-none focus:border-signal focus:ring-1 focus:ring-signal/50";
  const labelClass = "font-readout text-[10px] uppercase tracking-widest text-muted";

  return (
    <>
      <form ref={formRef} action={action} className="flex flex-col gap-4 rounded-sm border border-grid bg-panel p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>시간</span>
            <input
              type="datetime-local"
              name="reportedAt"
              value={reportedAt}
              onChange={(e) => setReportedAt(e.target.value)}
              required
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>담당자</span>
            <select
              name="assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              required
              className={fieldClass}
            >
              <option value="" disabled>
                선택
              </option>
              {ASSIGNEES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>조치 현황</span>
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ReportStatus)}
              required
              className={fieldClass}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>조치 결과</span>
            <select name="result" value={result} onChange={(e) => setResult(e.target.value)} className={fieldClass}>
              <option value="">미선택</option>
              {RESULT_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>조치 내용</span>
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            className={fieldClass}
            placeholder="조치 내용을 입력하세요"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-sm border border-signal/50 bg-signal/10 px-4 py-2 text-sm text-signal transition-colors hover:bg-signal/20"
          >
            저장
          </button>
          <button
            type="submit"
            formAction={saveAndCloseAction}
            ref={saveAndCloseButtonRef}
            className="rounded-sm border border-signal/50 bg-signal/10 px-4 py-2 text-sm text-signal transition-colors hover:bg-signal/20"
          >
            저장 후 닫기
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-sm border border-grid px-4 py-2 text-sm text-muted transition-colors hover:text-text"
          >
            닫기
          </button>
        </div>
      </form>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 p-4">
          <div className="w-full max-w-sm rounded-sm border border-grid bg-panel p-5">
            <p className="text-sm text-text">값이 변경되었습니다. 저장하고 닫으시겠습니까?</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="rounded-sm border border-grid px-4 py-1.5 text-sm text-muted transition-colors hover:text-text"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveAndClose}
                className="rounded-sm border border-signal/50 bg-signal/10 px-4 py-1.5 text-sm text-signal transition-colors hover:bg-signal/20"
              >
                예
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
