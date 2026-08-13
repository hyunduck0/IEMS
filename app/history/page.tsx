import { getAlarmRecords, getLatestActionReports } from "@/lib/data";
import AlarmHistoryExplorer from "@/components/AlarmHistoryExplorer";

// 실시간 이력 조회이므로 빌드 시점에 정적 생성하지 않고 요청마다 DB를 조회한다.
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [records, latestActionsMap] = await Promise.all([getAlarmRecords(), getLatestActionReports()]);
  const latestActions = Object.fromEntries(latestActionsMap);

  return (
    <main className="min-h-screen p-8">
      <div className="mb-6">
        <div className="font-readout text-xs uppercase tracking-[0.3em] text-muted">System / Log</div>
        <h1 className="font-hud text-3xl text-text">종합 이력</h1>
      </div>
      <AlarmHistoryExplorer records={records} latestActions={latestActions} />
    </main>
  );
}
