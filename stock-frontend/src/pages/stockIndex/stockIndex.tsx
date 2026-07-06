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
import "./stockIndex.css";
import { INDICATOR_COLORS, type IndicatorKey } from "./stockIndexColors";
import { format } from "date-fns";

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
  hideRangeSelector?: boolean; // 상단 기간 선택 버튼 숨김 여부
  indexSelector?: React.ReactNode; // 지수 탭 선택기 추가
  hidePriceDetail?: boolean; // 현재가 및 등락율 배지 숨김 여부
};

export default function IndicatorCard({
  title,
  data,
  colorKey,
  hideRangeSelector = false,
  indexSelector,
  hidePriceDetail = false
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

    const lastDataDate = data.length > 0 ? new Date(data[data.length - 1].date) : new Date();
    const from = new Date(lastDataDate);

    // 기간 선택기를 숨긴 경우 강제로 3개월 범위("3m")를 기준 삼고, 그렇지 않으면 상태값 range를 사용
    const activeRange = hideRangeSelector ? "3m" : range;

    if (activeRange === "1m") from.setMonth(lastDataDate.getMonth() - 1);
    if (activeRange === "3m") from.setMonth(lastDataDate.getMonth() - 3);
    if (activeRange === "6m") from.setMonth(lastDataDate.getMonth() - 6);
    if (activeRange === "1y") from.setFullYear(lastDataDate.getFullYear() - 1);

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
                  return x ? format(new Date(x), "yyyy-MM-dd") : "";
                },
                label: ctx => {
                  const y = ctx.parsed.y;
                  if (y == null) return "";
                  return `지수: ${y.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            x: {
              type: "time",
              min: from.getTime(),
              max: lastDataDate.getTime(),
              grid: { display: false },
              ticks: {
                maxRotation: 45,
                minRotation: 45,
                callback: value => format(new Date(value), "yyyy-MM-dd")
              }
            },

            y: {
              grid: { display: false },
              ticks: {
                callback: v => Number(v).toLocaleString()
              }
            }
          }
        }
      };

      chartRef.current = new Chart(ctx, config);
    } else {
      chartRef.current.options.scales!.x!.min = from.getTime();
      chartRef.current.options.scales!.x!.max = lastDataDate.getTime();
      // 데이터셋 갱신 처리
      chartRef.current.data.datasets[0].borderColor = border;
      chartRef.current.data.datasets[0].backgroundColor = background;
      chartRef.current.data.datasets[0].data = data.map(d => ({
        x: Date.parse(d.date),
        y: d.close
      }));
      chartRef.current.update();
    }
  }, [data, range, colorKey, hideRangeSelector, border, background]);

  return (
    <div className="card shadow-sm">
      <div className="card-header bond-header">
        {/* 좌 */}
        <span className="fw-bold">{title}</span>

        {/* 중앙 (지수 정보) */}
        {!hidePriceDetail && last && (
          <div className="latest-info">
            {last.close.toLocaleString()}
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
          {indexSelector ? (
            indexSelector
          ) : !hideRangeSelector ? (
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
          ) : (
            <span className="badge text-bg-light border" style={{ fontSize: "0.75rem", padding: "4px 8px" }}>
              3개월
            </span>
          )}
        </div>
      </div>

      <div className="card-body">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
