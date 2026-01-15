import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  type ChartOptions,
  type ScriptableContext
} from "chart.js";
import { Line } from "react-chartjs-2";

// =====================
// Chart.js Register
// =====================
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

// =====================
// Props
// =====================
interface Props {
  labels: string[];
  values: number[];
  isKR: boolean;
}

// =====================
// Component
// =====================
function StockLineChart({ labels, values, isKR }: Props) {

  // ---------------------
  // Data
  // ---------------------
  const data = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: "#5a33ff",
        borderWidth: 2.5,
        tension: 0.35,
        pointRadius: 0,
        fill: true,

        backgroundColor: (ctx: ScriptableContext<"line">) => {
          const { chart } = ctx;
          const { ctx: canvasCtx, chartArea } = chart;

          // 최초 렌더 시 chartArea 없음
          if (!chartArea) {
            return "rgba(90,51,255,0.12)";
          }

          const gradient = canvasCtx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom
          );

          gradient.addColorStop(0, "rgba(90,51,255,0.22)");
          gradient.addColorStop(1, "rgba(90,51,255,0.03)");

          return gradient;
        }
      }
    ]
  };

  // ---------------------
  // Options
  // ---------------------
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,

    animation: {
      duration: 400,
      easing: "easeOutCubic"
    },
    interaction: {
      mode: "nearest",
      intersect: false,
      axis: "x"
    },

    elements: {
      point: {
        radius: 0,        // 점은 안 보이게
        hitRadius: 10,    // ← 이게 민감도 핵심
        hoverRadius: 4
      }
    },

    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: "#111827",
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed.y;

            if (value == null) {
              return "종가: -";
            }

            return isKR
              ? `종가: ${value.toLocaleString()}원`
              : `종가: $${value.toLocaleString()}`;
          }
        }
      }
    },

    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#6b7280",
          maxTicksLimit: 6
        }
      },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: {
          color: "#6b7280",
          callback: (value) =>
            isKR
              ? `${Number(value).toLocaleString()}원`
              : `$${Number(value).toLocaleString()}`
        }
      }
    }
  };


  // ---------------------
  // Render
  // ---------------------
  return <Line data={data} options={options} />;
}

export default StockLineChart;
