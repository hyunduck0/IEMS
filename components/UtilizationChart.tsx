"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { getUtilizationColorHex } from "@/lib/status";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

const SIGNAL = "#38bdf8";
const GRID = "#223041";
const MUTED = "#7c8b9c";

interface UtilizationChartProps {
  title: string;
  data: { label: string; value: number }[];
  type?: "bar" | "line";
}

export default function UtilizationChart({ title, data, type = "bar" }: UtilizationChartProps) {
  // 막대 그래프는 라인마다 값이 다르므로 가동률 임계값 색상을 막대별로 적용한다.
  // 추이를 보는 선 그래프는 시그널 색 하나로 유지한다.
  const barColors = data.map((d) => getUtilizationColorHex(d.value));

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: type === "line" ? "transparent" : barColors.map((c) => `${c}55`),
        borderColor: type === "line" ? SIGNAL : barColors,
        pointBackgroundColor: SIGNAL,
        pointRadius: type === "line" ? 3 : 0,
        borderWidth: type === "line" ? 2 : 1,
        borderRadius: type === "line" ? 0 : 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#131b24",
        borderColor: GRID,
        borderWidth: 1,
        titleColor: "#e8edf2",
        bodyColor: SIGNAL,
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) => `${Number(ctx.parsed.y ?? 0).toFixed(1)}%`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: GRID },
        border: { color: GRID },
        ticks: { color: MUTED, callback: (value: number | string) => `${value}%` },
      },
      x: {
        grid: { color: GRID },
        border: { color: GRID },
        ticks: { color: MUTED },
      },
    },
  };

  return (
    <div className="rounded-sm border border-grid bg-panel p-4">
      <h3 className="font-readout text-xs uppercase tracking-widest text-muted">{title}</h3>
      <div className="mt-3" style={{ height: 220 }}>
        {type === "line" ? <Line data={chartData} options={options} /> : <Bar data={chartData} options={options} />}
      </div>
    </div>
  );
}
