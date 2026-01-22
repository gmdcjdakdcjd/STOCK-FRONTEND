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
import "./physical.css";
import { INDICATOR_COLORS, type IndicatorKey } from "./physicalColors";

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

/* =========================
   가격 포맷 (값만)
========================= */
function formatValue(key: IndicatorKey, value: number): string {
  switch (key) {
    // USD
    case "DUBAI":
    case "WTI":
    case "GOLD_GLOBAL":
    case "SILVER":
    case "COPPER":
    case "RICE":
      return `$${value.toLocaleString()}`;

    // CENT
    case "CORN":
    case "SUGAR":
    case "BEAN":
    case "COTTON":
    case "COFFEE":
      return `${value.toLocaleString()}¢`;

    // KRW
    case "GOLD_KR":
      return `${value.toLocaleString()}원`;

    default:
      return value.toLocaleString();
  }
}

/* =========================
   통화 라벨
========================= */
function getCurrencyLabel(key: IndicatorKey): string {
  switch (key) {
    case "DUBAI":
    case "WTI":
    case "GOLD_GLOBAL":
    case "SILVER":
    case "COPPER":
    case "RICE":
      return "USD";

    case "CORN":
    case "SUGAR":
    case "BEAN":
    case "COTTON":
    case "COFFEE":
      return "CENT";

    case "GOLD_KR":
      return "KRW";

    default:
      return "";
  }
}

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
                  const unit = getCurrencyLabel(colorKey);
                  return `가격: ${formatValue(colorKey, y)}${
                    unit ? ` (${unit})` : ""
                  }`;
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
                callback: v =>
                  new Date(v as number).toISOString().slice(0, 10)
              }
            },
            y: {
              grid: { display: false },
              ticks: {
                callback: v => formatValue(colorKey, Number(v))
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
        <span className="fw-bold">{title}</span>

        {last && (
          <div className="latest-info">
            {formatValue(colorKey, last.close)}
            {getCurrencyLabel(colorKey) && (
              <span className="currency-label">
                {" "}({getCurrencyLabel(colorKey)})
              </span>
            )}
            {diff > 0 && <span className="up"> ▲</span>}
            {diff < 0 && <span className="down"> ▼</span>}
            <span className="rate">
              {rate > 0 ? "+" : ""}
              {rate.toFixed(2)}%
            </span>
          </div>
        )}

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
