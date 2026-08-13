"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createActionReport } from "@/lib/data";
import type { ReportResult, ReportStatus } from "@/lib/types";

const VALID_STATUS: ReportStatus[] = ["확인전", "확인후", "조치완료"];
const VALID_RESULT: ReportResult[] = ["조작 미스", "점검", "기타"];

export async function submitActionReport(eventId: number, closeAfterSave: boolean, formData: FormData) {
  const reportedAtRaw = formData.get("reportedAt");
  const assignee = formData.get("assignee");
  const status = formData.get("status");
  const result = formData.get("result");
  const content = formData.get("content");

  if (typeof reportedAtRaw !== "string" || !reportedAtRaw) {
    throw new Error("시간을 입력하세요.");
  }
  const reportedAt = new Date(reportedAtRaw);
  if (Number.isNaN(reportedAt.getTime())) {
    throw new Error("유효한 시간을 입력하세요.");
  }
  if (typeof assignee !== "string" || !assignee.trim()) {
    throw new Error("담당자를 선택하세요.");
  }
  if (typeof status !== "string" || !VALID_STATUS.includes(status as ReportStatus)) {
    throw new Error("조치 현황을 선택하세요.");
  }
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("조치 내용을 입력하세요.");
  }

  const resultValue = typeof result === "string" && result !== "" ? (result as ReportResult) : undefined;
  if (resultValue && !VALID_RESULT.includes(resultValue)) {
    throw new Error("조치 결과 값이 올바르지 않습니다.");
  }

  await createActionReport({
    eventId,
    reportedAt,
    assignee,
    status: status as ReportStatus,
    result: resultValue,
    content: content.trim(),
  });

  revalidatePath(`/history/${eventId}`);
  revalidatePath("/history");
  redirect(closeAfterSave ? "/history" : `/history/${eventId}`);
}
