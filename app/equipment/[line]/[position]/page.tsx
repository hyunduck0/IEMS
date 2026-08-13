import { notFound } from "next/navigation";
import { getEquipmentHistory } from "@/lib/data";
import EquipmentHistoryList from "@/components/EquipmentHistoryList";

// 실시간 설비 이력이므로 빌드 시점에 정적 생성하지 않고 요청마다 DB를 조회한다.
export const dynamic = "force-dynamic";

const VALID_POSITIONS = ["정면", "배면"] as const;

export default async function EquipmentHistoryPage({
  params,
}: {
  params: Promise<{ line: string; position: string }>;
}) {
  const { line: rawLine, position: rawPosition } = await params;
  const lineNumber = Number(rawLine);
  const decodedPosition = decodeURIComponent(rawPosition);

  if (!Number.isInteger(lineNumber) || lineNumber < 1 || lineNumber > 9) {
    notFound();
  }
  if (!VALID_POSITIONS.includes(decodedPosition as (typeof VALID_POSITIONS)[number])) {
    notFound();
  }

  const line = lineNumber;
  const position = decodedPosition as (typeof VALID_POSITIONS)[number];
  const records = await getEquipmentHistory(line, position);

  return (
    <main className="min-h-screen p-8">
      <div className="mb-6">
        <div className="font-readout text-xs uppercase tracking-[0.3em] text-muted">
          System / Trace / L{String(line).padStart(2, "0")}
        </div>
        <h1 className="font-hud text-3xl text-text">
          {line}라인 {position} 상세 이력
        </h1>
      </div>
      <EquipmentHistoryList records={records} />
    </main>
  );
}
