import { notFound } from "next/navigation";
import { getActionReportsForEvent, getEventById } from "@/lib/data";
import { getStatusColor } from "@/lib/status";
import ActionReportForm from "@/components/ActionReportForm";
import { submitActionReport } from "./actions";

// 조치 보고는 저장 즉시 반영돼야 하므로 빌드 시점에 정적 생성하지 않는다.
export const dynamic = "force-dynamic";

export default async function ActionReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventId = Number(id);
  const event = Number.isFinite(eventId) ? await getEventById(eventId) : null;
  if (!event) notFound();

  const reports = await getActionReportsForEvent(eventId);
  const saveAction = submitActionReport.bind(null, eventId, false);
  const saveAndCloseAction = submitActionReport.bind(null, eventId, true);

  return (
    <main className="min-h-screen p-8">
      <div className="mb-6">
        <div className="font-readout text-xs uppercase tracking-[0.3em] text-muted">System / Action Report</div>
        <h1 className="font-hud text-3xl text-text">
          {event.line}라인 {event.position} 조치 보고
        </h1>
      </div>

      <div className="mb-6 rounded-sm border border-grid bg-panel p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-block rounded-sm px-2 py-0.5 text-xs ${getStatusColor(event.status)}`}>
            {event.status}
          </span>
          <span className="font-readout text-sm text-muted">{event.timestamp}</span>
        </div>
        <div className="mt-3 text-sm text-text">
          <span className="text-muted">원인 </span>
          {event.cause}
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-readout text-xs uppercase tracking-widest text-signal">조치 보고 입력</h2>
        <ActionReportForm action={saveAction} saveAndCloseAction={saveAndCloseAction} />
      </section>

      <section>
        <h2 className="mb-3 font-readout text-xs uppercase tracking-widest text-signal">이전 조치 보고</h2>
        {reports.length === 0 ? (
          <p className="rounded-sm border border-grid bg-panel p-4 font-readout text-sm text-muted">
            등록된 조치 보고가 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reports.map((report) => (
              <li key={report.id} className="rounded-sm border border-grid bg-panel p-4 text-sm">
                <div className="flex flex-wrap items-center gap-3 font-readout text-muted">
                  <span>{report.reportedAt}</span>
                  <span className="text-text">{report.assignee}</span>
                  <span className="text-signal">{report.status}</span>
                  {report.result && <span>{report.result}</span>}
                </div>
                <div className="mt-2 text-text">{report.content}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
