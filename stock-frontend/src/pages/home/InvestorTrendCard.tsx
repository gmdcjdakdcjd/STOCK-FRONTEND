import { useEffect, useRef, useState } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  type ChartConfiguration
} from "chart.js";
import { useInvestorTrendData } from "../marketTrend/useMarketTrendData";

// Chart.js 수동 등록 (Legend는 커스텀 구현하므로 미등록)
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip
);

type LegendType = "all" | "individual" | "foreigner" | "institutional";

export default function InvestorTrendCard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<"line"> | null>(null);

  // 클릭하여 고정 활성화할 선택 상태 정의 (기본값: 전체)
  const [selectedLegend, setSelectedLegend] = useState<LegendType>("all");

  // 마우스 임시 호버 상태 정의 (범례 텍스트 호버 배경색 전용)
  const [hoveredLegend, setHoveredLegend] = useState<LegendType | null>(null);

  // 1개월 영업일(20일) 순매수 데이터 호출
  const { data, loading, error } = useInvestorTrendData(1, 20);

  // 선택 상태(selectedLegend)에 따라 차트 선의 색상 및 두께 정보를 결정하는 헬퍼 함수
  const getLineStyle = (type: LegendType) => {
    const isAllActive = selectedLegend === "all";
    const isSelfActive = selectedLegend === type;

    if (type === "individual") {
      return {
        color: isSelfActive || isAllActive ? "#3B82F6" : "rgba(59, 130, 246, 0.12)",
        width: isSelfActive ? 3.5 : isAllActive ? 2 : 1.2
      };
    }
    if (type === "foreigner") {
      return {
        color: isSelfActive || isAllActive ? "#EF4444" : "rgba(239, 68, 68, 0.12)",
        width: isSelfActive ? 3.5 : isAllActive ? 2 : 1.2
      };
    }
    // 기관계
    return {
      color: isSelfActive || isAllActive ? "#10B981" : "rgba(16, 185, 129, 0.12)",
      width: isSelfActive ? 3.5 : isAllActive ? 2 : 1.2
    };
  };

  // 1. 초기 차트 마운트 및 데이터 설정 Effect
  useEffect(() => {
    if (!canvasRef.current || !data || !data.dtoList || data.dtoList.length === 0) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // 날짜 오름차순 과거 -> 최신 정렬
    const sortedList = [...data.dtoList].reverse();

    const indStyle = getLineStyle("individual");
    const forStyle = getLineStyle("foreigner");
    const insStyle = getLineStyle("institutional");

    const datasetIndividual = {
      label: "개인",
      data: sortedList.map(item => item.individual),
      borderColor: indStyle.color,
      backgroundColor: "transparent",
      fill: false,
      tension: 0.15,
      pointRadius: 0,
      borderWidth: indStyle.width
    };

    const datasetForeigner = {
      label: "외국인",
      data: sortedList.map(item => item.foreigner),
      borderColor: forStyle.color,
      backgroundColor: "transparent",
      fill: false,
      tension: 0.15,
      pointRadius: 0,
      borderWidth: forStyle.width
    };

    const datasetInstitutional = {
      label: "기관계",
      data: sortedList.map(item => item.institutional),
      borderColor: insStyle.color,
      backgroundColor: "transparent",
      fill: false,
      tension: 0.15,
      pointRadius: 0,
      borderWidth: insStyle.width
    };

    // 마우스 호버 시 수직 십자 안내 세로선을 그리기 위한 커스텀 플러그인 정의
    const verticalLinePlugin = {
      id: "verticalLine",
      afterDraw: (chart: any) => {
        if (chart.tooltip?._active?.length) {
          const activePoint = chart.tooltip._active[0];
          const ctx = chart.ctx;
          const x = activePoint.element.x;
          const topY = chart.chartArea.top;
          const bottomY = chart.chartArea.bottom;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x, topY);
          ctx.lineTo(x, bottomY);
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = "rgba(100, 116, 139, 0.4)"; // Slate 500 세련된 반투명 세로선
          ctx.setLineDash([4, 4]); // 점선 형태
          ctx.stroke();
          ctx.restore();
        }
      }
    };

    if (!chartRef.current) {
      const config: ChartConfiguration<"line"> = {
        type: "line",
        data: {
          labels: sortedList.map(item => item.baseDate ? item.baseDate.slice(0, 10) : ""),
          datasets: [datasetIndividual, datasetForeigner, datasetInstitutional]
        },
        plugins: [verticalLinePlugin],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          // 마우스 호버 효과 제거 (onHover 비활성화)
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: "index",
              intersect: false,
              backgroundColor: "rgba(0,0,0,0.85)",
              padding: 10,
              displayColors: false,
              callbacks: {
                title: items => {
                  return items[0]?.label || "";
                },
                label: ctx => {
                  const label = ctx.dataset.label || "";
                  const y = ctx.parsed.y;
                  if (y == null) return "";
                  return `${label}: ${y.toLocaleString()} 억 원`;
                }
              }
            }
          },
          scales: {
            x: {
              type: "category",
              grid: { display: false },
              ticks: {
                maxRotation: 45,
                minRotation: 45,
                font: { family: "inherit" }
              }
            },
            y: {
              grid: { color: "#f1f5f9" },
              ticks: {
                font: { family: "inherit" },
                callback: v => `${Number(v).toLocaleString()}억`
              }
            }
          }
        }
      };

      chartRef.current = new Chart(ctx, config);
    } else {
      // 데이터 셋 업데이트
      chartRef.current.data.labels = sortedList.map(item => item.baseDate ? item.baseDate.slice(0, 10) : "");
      chartRef.current.data.datasets[0].data = datasetIndividual.data;
      chartRef.current.data.datasets[1].data = datasetForeigner.data;
      chartRef.current.data.datasets[2].data = datasetInstitutional.data;
      chartRef.current.update();
    }
  }, [data]);

  // 2. 고정 선택 상태(selectedLegend) 변경 시에만 차트 하이라이트/연하게 필터링 적용 Effect
  useEffect(() => {
    if (!chartRef.current) return;

    const indStyle = getLineStyle("individual");
    const forStyle = getLineStyle("foreigner");
    const insStyle = getLineStyle("institutional");

    chartRef.current.data.datasets[0].borderColor = indStyle.color;
    chartRef.current.data.datasets[0].borderWidth = indStyle.width;

    chartRef.current.data.datasets[1].borderColor = forStyle.color;
    chartRef.current.data.datasets[1].borderWidth = forStyle.width;

    chartRef.current.data.datasets[2].borderColor = insStyle.color;
    chartRef.current.data.datasets[2].borderWidth = insStyle.width;

    chartRef.current.update("none");
  }, [selectedLegend]); // 오직 선택 상태가 바뀔 때만 동기화

  // 텍스트 범례 평시 및 활성화 탭 버튼 스타일 헬퍼 (평시에도 테마 컬러 배경 적용)
  const getLegendStyle = (type: LegendType) => {
    const isActive = selectedLegend === type;
    const isHovered = hoveredLegend === type;

    let bg = "rgba(241, 245, 249, 0.7)"; // all 평시
    let color = "#64748b";
    let border = "1px solid #e2e8f0";

    if (type === "all") {
      if (isActive || isHovered) {
        bg = "#e2e8f0";
        color = "#1e293b";
        border = "1px solid #cbd5e1";
      }
    } else if (type === "individual") {
      if (isActive || isHovered) {
        bg = "rgba(59, 130, 246, 0.16)";
        color = "#1d4ed8";
        border = "1px solid rgba(59, 130, 246, 0.35)";
      } else {
        bg = "rgba(59, 130, 246, 0.05)";
        color = "#3b82f6";
        border = "1px solid rgba(59, 130, 246, 0.15)";
      }
    } else if (type === "foreigner") {
      if (isActive || isHovered) {
        bg = "rgba(239, 68, 68, 0.16)";
        color = "#b91c1c";
        border = "1px solid rgba(239, 68, 68, 0.35)";
      } else {
        bg = "rgba(239, 68, 68, 0.05)";
        color = "#ef4444";
        border = "1px solid rgba(239, 68, 68, 0.15)";
      }
    } else if (type === "institutional") {
      if (isActive || isHovered) {
        bg = "rgba(16, 185, 129, 0.16)";
        color = "#047857";
        border = "1px solid rgba(16, 185, 129, 0.35)";
      } else {
        bg = "rgba(16, 185, 129, 0.05)";
        color = "#10b981";
        border = "1px solid rgba(16, 185, 129, 0.15)";
      }
    }

    return {
      backgroundColor: bg,
      color: color,
      border: border,
      padding: "4px 12px",
      borderRadius: "6px",
      fontSize: "0.8rem",
      fontWeight: isActive || isHovered ? "700" : "600",
      cursor: "pointer",
      transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    };
  };

  const titleMapping: Record<LegendType, string> = {
    all: "전체",
    individual: "개인",
    foreigner: "외국인",
    institutional: "기관계"
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bond-header" style={{ justifyContent: "space-between" }}>
        {/* 좌측 타이틀 */}
        <span className="fw-bold">투자자별 일자별 순매수 흐름</span>

        {/* 우측 4대 지수 탭과 정밀 대칭되는 4대 범례 선택기 */}
        <div className="header-right" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "4px", marginRight: "12px" }}>
            {(["all", "individual", "foreigner", "institutional"] as LegendType[]).map((type) => (
              <span
                key={type}
                style={getLegendStyle(type)}
                onMouseEnter={() => setHoveredLegend(type)}
                onMouseLeave={() => setHoveredLegend(null)}
                onClick={() => setSelectedLegend(type)}
              >
                {titleMapping[type]}
              </span>
            ))}
          </div>

          <span className="badge text-bg-light border" style={{ fontSize: "0.75rem", padding: "4px 8px" }}>
            단위: 억 원 (1개월)
          </span>
        </div>
      </div>

      <div className="card-body">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center h-100" style={{ height: "360px" }}>
            <span>순매수 추이를 분석하고 있습니다...</span>
          </div>
        ) : error ? (
          <div className="d-flex justify-content-center align-items-center h-100" style={{ height: "360px" }}>
            <span className="text-danger">순매수 데이터를 로드하지 못했습니다.</span>
          </div>
        ) : (
          <canvas ref={canvasRef} />
        )}
      </div>
    </div>
  );
}
