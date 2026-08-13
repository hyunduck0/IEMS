import { getEquipmentStatus } from "@/lib/data";
import { getUtilizationColorClass } from "@/lib/status";
import type { LogRecord } from "@/lib/types";
import LineRow from "@/components/LineRow";

// 실시간 설비 현황이므로 빌드 시점에 정적 생성하지 않고 요청마다 DB를 조회한다.
export const dynamic = "force-dynamic";

interface LineEntry {
  line: number;
  front: LogRecord;
  back: LogRecord;
}

export default async function Home() {
  const records = await getEquipmentStatus();

  // db:seed가 TRUNCATE 직후~재삽입 완료 전 사이에는 18건 미만이 잠깐 반환될 수 있다.
  // non-null 단언(!) 대신 그 순간의 라인은 건너뛰어 런타임 크래시를 피한다.
  const lines = Array.from({ length: 9 }, (_, i) => i + 1)
    .map((line) => ({
      line,
      front: records.find((r) => r.line === line && r.position === "정면"),
      back: records.find((r) => r.line === line && r.position === "배면"),
    }))
    .filter((entry): entry is LineEntry => entry.front !== undefined && entry.back !== undefined);

  const lineCount = lines.length;
  const fullyNormalLines = lines.filter(
    ({ front, back }) => front.status === "정상" && back.status === "정상"
  ).length;
  const frontNormalCount = lines.filter(({ front }) => front.status === "정상").length;
  const frontCounts = {
    정상: frontNormalCount,
    멈춤: lines.filter(({ front }) => front.status === "멈춤").length,
    알람: lines.filter(({ front }) => front.status === "알람").length,
  };
  const backCounts = {
    정상: lines.filter(({ back }) => back.status === "정상").length,
    멈춤: lines.filter(({ back }) => back.status === "멈춤").length,
    알람: lines.filter(({ back }) => back.status === "알람").length,
  };

  const pct = (count: number) => (lineCount === 0 ? 0 : Math.round((count / lineCount) * 100));

  return (
    <main className="min-h-screen p-8">
      <div className="mb-6">
        <div className="font-readout text-xs uppercase tracking-[0.3em] text-muted">System / Overview</div>
        <h1 className="font-hud text-3xl text-text">대시보드</h1>
      </div>

      <div className="grid grid-cols-1 rounded-sm border border-grid bg-panel sm:grid-cols-3">
        <div className="border-b border-grid p-5 sm:row-span-2 sm:border-b-0 sm:border-r sm:flex sm:flex-col sm:justify-center">
          <div className="font-readout text-xs uppercase tracking-widest text-muted">라인 가동</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`font-hud text-4xl ${getUtilizationColorClass(pct(fullyNormalLines))}`}>
              {pct(fullyNormalLines)}%
            </span>
            <span className="font-readout text-sm text-muted">
              {fullyNormalLines}/{lineCount}
            </span>
          </div>
        </div>

        <div className="border-b border-grid p-5 sm:border-r">
          <div className="font-readout text-xs uppercase tracking-widest text-muted">정면 정상</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`font-hud text-4xl ${getUtilizationColorClass(pct(frontNormalCount))}`}>
              {pct(frontNormalCount)}%
            </span>
            <span className="font-readout text-sm text-muted">
              {frontNormalCount}/{lineCount}
            </span>
          </div>
        </div>

        <div className="border-b border-grid p-5">
          <div className="font-readout text-xs uppercase tracking-widest text-muted">배면 정상</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`font-hud text-4xl ${getUtilizationColorClass(pct(backCounts.정상))}`}>
              {pct(backCounts.정상)}%
            </span>
            <span className="font-readout text-sm text-muted">
              {backCounts.정상}/{lineCount}
            </span>
          </div>
        </div>

        <div className="p-5 sm:border-r">
          <div className="font-readout text-xs uppercase tracking-widest text-muted">정면 현황</div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-readout text-sm">
            <span className="text-warn">
              멈춤 {pct(frontCounts.멈춤)}% ({frontCounts.멈춤}/{lineCount})
            </span>
            <span className="text-alarm">
              알람 {pct(frontCounts.알람)}% ({frontCounts.알람}/{lineCount})
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="font-readout text-xs uppercase tracking-widest text-muted">배면 현황</div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-readout text-sm">
            <span className="text-warn">
              멈춤 {pct(backCounts.멈춤)}% ({backCounts.멈춤}/{lineCount})
            </span>
            <span className="text-alarm">
              알람 {pct(backCounts.알람)}% ({backCounts.알람}/{lineCount})
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {lines.map(({ line, front, back }) => (
          <LineRow key={line} line={line} front={front} back={back} />
        ))}
      </div>
    </main>
  );
}
