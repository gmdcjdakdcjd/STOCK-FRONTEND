import { useEffect, useRef, useState } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Filler,
  type ChartConfiguration
} from "chart.js";
import "chartjs-adapter-date-fns";
import "./exchange.css";
import { INDICATOR_COLORS, type IndicatorKey } from "./exchangeColors";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Filler
);

export type MarketIndicator = {
  date: string;
  close: number;
  changeAmount: number;
  changeRate: number;
};

type Range = "1m" | "3m" | "6m" | "1y";

type Props = {
  title: string;
  data: MarketIndicator[];
  colorKey: IndicatorKey;
};

export default function IndicatorCard({
  title,
  data,
  colorKey
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<"line"> | null>(null);
  const [range, setRange] = useState<Range>("3m");

  const last = data.at(-1);
  const prev = data.at(-2);

  const diff = last && prev ? last.close - prev.close : 0;
  const rate = last && prev ? (diff / prev.close) * 100 : 0;

  const { border, background } = INDICATOR_COLORS[colorKey];

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const now = new Date();
    const from = new Date();

    if (range === "1m") from.setMonth(now.getMonth() - 1);
    if (range === "3m") from.setMonth(now.getMonth() - 3);
    if (range === "6m") from.setMonth(now.getMonth() - 6);
    if (range === "1y") from.setFullYear(now.getFullYear() - 1);

    const dataset = {
      data: data.map(d => ({
        x: Date.parse(d.date),
        y: d.close
      })),
      borderColor: border,
      backgroundColor: background,
      fill: true,
      tension: 0.15,
      pointRadius: 0
    };

    if (!chartRef.current) {
      const config: ChartConfiguration<"line"> = {
        type: "line",
        data: { datasets: [dataset] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "nearest", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: "nearest",
              intersect: false,
              backgroundColor: "rgba(0,0,0,0.85)",
              padding: 10,
              displayColors: false,
              callbacks: {
                title: items => {
                  const x = items[0]?.parsed?.x;
                  return x ? new Date(x).toISOString().slice(0, 10) : "";
                },
                label: ctx => {
                  const y = ctx.parsed.y;
                  if (y == null) return "";
                  return `환율: ${y.toLocaleString()}원`;
                }
              }
            }
          },
          scales: {
            x: {
              type: "time",
              min: from.getTime(),
              max: now.getTime(),
              grid: { display: false },
              ticks: {
                maxRotation: 45,
                minRotation: 45,
                callback: value =>
                  new Date(value as number).toISOString().slice(0, 10)
              }
            },
            y: {
              grid: { display: false },
              ticks: {
                callback: v => `${Number(v).toLocaleString()}원`
              }
            }
          }
        }
      };

      chartRef.current = new Chart(ctx, config);
    } else {
      chartRef.current.options.scales!.x!.min = from.getTime();
      chartRef.current.options.scales!.x!.max = now.getTime();
      chartRef.current.update();
    }
  }, [data, range, colorKey]);

  return (
    <div className="card shadow-sm">
      <div className="card-header bond-header">
        {/* 좌 */}
        <span className="fw-bold">{title}</span>

        {/* 중앙 (환율 정보 - KRW 기준) */}
        {last && (
          <div className="latest-info">
            {last.close.toLocaleString()}원
            {diff > 0 && <span className="up"> ▲</span>}
            {diff < 0 && <span className="down"> ▼</span>}
            <span className="rate">
              {rate > 0 ? "+" : ""}
              {rate.toFixed(2)}%
            </span>
          </div>
        )}

        {/* 우 */}
        <div className="header-right">
          <div
            className="btn-group btn-group-sm"
            style={{ ["--indicator-color" as any]: border }}
          >
            {(["1m", "3m", "6m", "1y"] as Range[]).map(r => (
              <button
                key={r}
                className={`btn ${range === r ? "active" : ""}`}
                onClick={() => setRange(r)}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card-body">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
