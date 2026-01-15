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
import "./bond.css";

import type { BondPoint } from "./bond.types";

Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    TimeScale,
    Tooltip,
    Filler
);

type Range = "1m" | "3m" | "6m" | "1y";

type Props = {
    title: string;
    primaryColor: string;
    series: Record<
        string,
        {
            label: string;
            color: string;
            data: BondPoint[];
        }
    >;
};

/* =========================
   util
========================= */

function getLatestInfo(list: BondPoint[]) {
    if (!list || list.length < 2) return null;

    const last = list[list.length - 1];
    const prev = list[list.length - 2];

    return {
        value: last.close,
        diff: last.close - prev.close,
        date: last.date
    };
}

export default function BondChartCard({ title, primaryColor, series }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartRef = useRef<Chart<"line"> | null>(null);
    const [range, setRange] = useState<Range>("3m");

    /* =========================
       최신 요약 / 기준일
    ========================= */

    const summary = Object.values(series)
        .map(s => ({
            label: s.label,
            info: getLatestInfo(s.data)
        }))
        .filter(v => v.info !== null) as {
            label: string;
            info: ReturnType<typeof getLatestInfo>;
        }[];

    const baseDate = summary
        .map(v => v.info!.date)
        .sort()
        .at(-1);

    /* =========================
       chart
    ========================= */

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        const now = new Date();
        const from = new Date();

        if (range === "1m") from.setMonth(now.getMonth() - 1);
        if (range === "3m") from.setMonth(now.getMonth() - 3);
        if (range === "6m") from.setMonth(now.getMonth() - 6);
        if (range === "1y") from.setFullYear(now.getFullYear() - 1);

        const datasets = Object.values(series).map(s => ({
            label: s.label,
            data: s.data.map(d => ({
                x: Date.parse(d.date),
                y: d.close
            })),
            borderColor: s.color,
            backgroundColor: s.color
                .replace("rgb(", "rgba(")
                .replace(")", ", 0.18)"),
            tension: 0.15,
            pointRadius: 0,
            fill: true
        }));

        if (!chartRef.current) {
            const config: ChartConfiguration<"line"> = {
                type: "line",
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 400,
                        easing: "easeOutQuart"
                    },
                    interaction: {
                        mode: "nearest",
                        intersect: false
                    },
                    plugins: {
                        legend: { display: false  },
                        tooltip: {
                            mode: "nearest",
                            intersect: false,
                            backgroundColor: "rgba(0,0,0,0.85)",
                            padding: 10,
                            displayColors: false,
                            callbacks: {
                                title: items => {
                                    const x = items[0]?.parsed?.x;
                                    if (!x) return "";
                                    return new Date(x).toISOString().slice(0, 10);
                                },
                                label: ctx => {
                                    const y = ctx.parsed.y;
                                    if (y == null) return "";
                                    return `${ctx.dataset.label}: ${y.toFixed(2)}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: "time",
                            time: {
                                unit: "day",
                                displayFormats: { day: "yyyy-MM-dd" }
                            },
                            ticks: {
                                autoSkip: true,
                                maxRotation: 45,
                                minRotation: 45
                            },
                            min: from.getTime(),
                            max: now.getTime(),
                            grid: { display: false }
                        },
                        y: {
                            grid: { display: false },
                            ticks: {
                                callback: v => `${Number(v).toFixed(2)}%`
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
    }, [range, series]);

    /* =========================
       render
    ========================= */

    return (
        <div
            className="card shadow-sm"
            style={{ "--bond-primary": primaryColor } as React.CSSProperties}
        >
            <div className="card-header bond-header">
                {/* 왼쪽 */}
                <span className="fw-bold">{title}</span>

                {/* 가운데 */}
                <div className="latest-info">
                    {summary.map(({ label, info }) => (
                        <span key={label} className="rate-item">
                            {label} {info!.value.toFixed(2)}%
                            {info!.diff > 0 && <span className="up"> ▲</span>}
                            {info!.diff < 0 && <span className="down"> ▼</span>}
                        </span>
                    ))}
                </div>

                {/* 오른쪽 */}
                <div className="header-right">
                    <span className="base-date">기준일: {baseDate}</span>

                    <div className="btn-group btn-group-sm">
                        {(["1m", "3m", "6m", "1y"] as Range[]).map(r => (
                            <button
                                key={r}
                                className={`bond-range-btn ${range === r ? "active" : ""}`}
                                onClick={() => setRange(r)}
                            >
                                {r.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== 만기 범례 ===== */}
            <div className="bond-legend">
                {Object.values(series).map(s => (
                    <div key={s.label} className="bond-legend-item">
                        <span
                            className="legend-box"
                            style={{ borderColor: s.color }}
                        />
                        <span className="legend-label">{s.label}</span>
                    </div>
                ))}
            </div>


            <div className="card-body" style={{ height: 360 }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
}
