import {
  calculateEquipmentUtilization,
  getHourlyUtilizationTimeline,
  getLineStatusBreakdown,
  getUtilizationTimeline,
  loadLineEventsMap,
  type UtilizationBucket,
} from "@/lib/data";
import { getUtilizationColorClass } from "@/lib/status";
import UtilizationChart from "@/components/UtilizationChart";
import StatusBreakdownPieChart from "@/components/StatusBreakdownPieChart";

// 실시간 가동률 통계이므로 빌드 시점에 정적 생성하지 않고 요청마다 DB를 조회한다.
export const dynamic = "force-dynamic";

const LINES = Array.from({ length: 9 }, (_, i) => i + 1);

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 font-readout text-xs uppercase tracking-widest text-signal">{children}</h2>;
}

function UtilizationTable({ rowLabel, buckets }: { rowLabel: string; buckets: UtilizationBucket[] }) {
  return (
    <div className="overflow-x-auto rounded-sm border border-grid">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-grid bg-panel-raised text-left font-readout text-xs uppercase tracking-wider text-muted">
            <th className="p-3 font-normal">{rowLabel}</th>
            <th className="p-3 font-normal">전체</th>
            {LINES.map((line) => (
              <th key={line} className="p-3 font-normal">
                {line}라인
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.label} className="border-b border-grid bg-panel font-readout last:border-0 hover:bg-panel-raised">
              <td className="p-3 text-text">{bucket.label}</td>
              <td className={`p-3 ${getUtilizationColorClass(bucket.overall)}`}>{bucket.overall.toFixed(1)}%</td>
              {LINES.map((line) => (
                <td key={line} className={`p-3 ${getUtilizationColorClass(bucket.byLine[line])}`}>
                  {bucket.byLine[line].toFixed(1)}%
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function StatsPage() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 이 페이지의 모든 가동률 계산이 같은 9개 라인 이벤트를 반복해서 쓰므로,
  // DB에서 한 번만 불러와(N+1 방지) 아래 계산에 전부 재사용한다.
  const cache = await loadLineEventsMap(LINES);

  const [daily, weekly, hourly, lineBreakdowns, equipmentUtilization] = await Promise.all([
    getUtilizationTimeline("day", 7, cache),
    getUtilizationTimeline("week", 1, cache),
    getHourlyUtilizationTimeline(1, cache),
    Promise.all(LINES.map((line) => getLineStatusBreakdown(line, weekAgo, now, cache))),
    Promise.all(
      LINES.map(async (line) => ({
        line,
        정면: await calculateEquipmentUtilization(line, "정면", weekAgo, now, cache),
        배면: await calculateEquipmentUtilization(line, "배면", weekAgo, now, cache),
      }))
    ),
  ]);

  const latestDay = daily[daily.length - 1];
  const latestWeek = weekly[weekly.length - 1];

  const dailyOverallData = daily.map((b) => ({ label: b.label, value: b.overall }));
  const dailyByLineData = LINES.map((line) => ({ label: `${line}라인`, value: latestDay.byLine[line] }));
  const weeklyByLineData = LINES.map((line) => ({ label: `${line}라인`, value: latestWeek.byLine[line] }));

  return (
    <main className="min-h-screen p-8">
      <div className="mb-6">
        <div className="font-readout text-xs uppercase tracking-[0.3em] text-muted">System / Metrics</div>
        <h1 className="font-hud text-3xl text-text">통계</h1>
      </div>

      <section className="mt-6">
        <SectionHeading>일별</SectionHeading>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UtilizationChart title="전체 가동률 추이" data={dailyOverallData} type="line" />
          <UtilizationChart title={`라인별 가동률 (${latestDay.label})`} data={dailyByLineData} />
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading>주별</SectionHeading>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UtilizationChart title="전체 가동률" data={[{ label: latestWeek.label, value: latestWeek.overall }]} />
          <UtilizationChart title={`라인별 가동률 (${latestWeek.label})`} data={weeklyByLineData} />
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading>상세 표 (일별, 최근 7일)</SectionHeading>
        <UtilizationTable rowLabel="날짜" buckets={daily} />
      </section>

      <section className="mt-8">
        <SectionHeading>라인별 주간 상태 비율 (가동 / 멈춤 / 알람)</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LINES.map((line, i) => (
            <StatusBreakdownPieChart key={line} title={`${line}라인`} breakdown={lineBreakdowns[i]} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading>라인별 · 설비별 가동률 (최근 7일)</SectionHeading>
        <div className="overflow-x-auto rounded-sm border border-grid">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-grid bg-panel-raised text-left font-readout text-xs uppercase tracking-wider text-muted">
                <th className="p-3 font-normal">라인</th>
                <th className="p-3 font-normal">정면</th>
                <th className="p-3 font-normal">배면</th>
              </tr>
            </thead>
            <tbody>
              {equipmentUtilization.map((row) => (
                <tr key={row.line} className="border-b border-grid bg-panel font-readout last:border-0 hover:bg-panel-raised">
                  <td className="p-3 text-text">{row.line}라인</td>
                  <td className={`p-3 ${getUtilizationColorClass(row.정면)}`}>{row.정면.toFixed(1)}%</td>
                  <td className={`p-3 ${getUtilizationColorClass(row.배면)}`}>{row.배면.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading>시간별 가동 현황 (1시간 간격)</SectionHeading>
        <UtilizationTable rowLabel="시간대" buckets={hourly} />
      </section>
    </main>
  );
}
