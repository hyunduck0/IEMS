"use client";

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";
import { getStatusIcon } from "@/lib/status";
import type { EquipmentStatus } from "@/lib/types";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS: Record<EquipmentStatus, string> = {
  정상: "#2dd4bf",
  멈춤: "#fbbf24",
  알람: "#fb3a4b",
};

const ORDER: EquipmentStatus[] = ["정상", "멈춤", "알람"];

interface StatusBreakdownPieChartProps {
  title: string;
  breakdown: Record<EquipmentStatus, number>;
}

export default function StatusBreakdownPieChart({ title, breakdown }: StatusBreakdownPieChartProps) {
  const total = ORDER.reduce((sum, status) => sum + breakdown[status], 0);
  const percentages = ORDER.map((status) => (total === 0 ? 0 : (breakdown[status] / total) * 100));

  const data = {
    labels: ORDER.map((status) => `${getStatusIcon(status)} ${status}`),
    datasets: [
      {
        data: percentages,
        backgroundColor: ORDER.map((status) => `${COLORS[status]}cc`),
        borderColor: "#131b24",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: "#7c8b9c", boxWidth: 10, font: { size: 10 } },
      },
      tooltip: {
        backgroundColor: "#131b24",
        borderColor: "#223041",
        borderWidth: 1,
        titleColor: "#e8edf2",
        bodyColor: "#e8edf2",
        callbacks: {
          label: (ctx: { label?: string; parsed: number }) => `${ctx.label ?? ""}: ${ctx.parsed.toFixed(1)}%`,
        },
      },
    },
  };

  return (
    <div className="rounded-sm border border-grid bg-panel p-4">
      <h3 className="font-readout text-xs uppercase tracking-widest text-muted">{title}</h3>
      <div className="mt-2" style={{ height: 180 }}>
        <Pie data={data} options={options} />
      </div>
    </div>
  );
}
