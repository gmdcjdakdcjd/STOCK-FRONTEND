import { useNavigate } from "react-router-dom";
import { useDualMomentumData } from "./useDualMomentumData";
import DualMomentumCard from "./DualMomentumCard";
import { parseStrategyTitle } from "./dualMomentum.utils";
import "./dualMomentum.css";

// 듀얼 모멘텀 전략 표시 순서 정의
const STRATEGY_ORDER = [
  "DUAL_MOMENTUM_1M_KR",
  "DUAL_MOMENTUM_3M_KR",
  "DUAL_MOMENTUM_6M_KR",
  "DUAL_MOMENTUM_1Y_KR",
  "DUAL_MOMENTUM_1M_US",
  "DUAL_MOMENTUM_3M_US",
  "DUAL_MOMENTUM_6M_US",
  "DUAL_MOMENTUM_1Y_US"
] as const;

// 1. 한국 듀얼 모멘텀 (4개)
const STRATEGIES_KR = [
  "DUAL_MOMENTUM_1M_KR",
  "DUAL_MOMENTUM_3M_KR",
  "DUAL_MOMENTUM_6M_KR",
  "DUAL_MOMENTUM_1Y_KR"
];

// 2. 미국 듀얼 모멘텀 (4개)
const STRATEGIES_US = [
  "DUAL_MOMENTUM_1M_US",
  "DUAL_MOMENTUM_3M_US",
  "DUAL_MOMENTUM_6M_US",
  "DUAL_MOMENTUM_1Y_US"
];

export default function DualMomentumPage() {
  const { data, loading } = useDualMomentumData();
  const navigate = useNavigate();

  if (loading) {
    return <div className="container mt-4">듀얼 모멘텀 데이터를 불러오는 중입니다...</div>;
  }

  if (!data) {
    return <div className="container mt-4">듀얼 모멘텀 데이터를 불러오지 못했습니다.</div>;
  }

  // 상단 요약 카드를 클릭했을 때 하단의 해당 상세 리스트 영역으로 부드럽게 스크롤 이동시키는 함수입니다.
  const handleScrollToChart = (id: string) => {
    const targetElement = document.getElementById(id);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // 최신 신호 날짜(signalDate) 및 측정 주기(key)에 부합하는 기준 시작일을 동적으로 역산하여 기간 포맷 문자열을 반환합니다.
  const getMomentumPeriod = (signalDate: string, key: string): string => {
    if (!signalDate || signalDate === "-") return "";
    
    const date = new Date(signalDate);
    if (isNaN(date.getTime())) return signalDate;
    
    const startDate = new Date(date);
    if (key.includes("1M")) {
      startDate.setMonth(date.getMonth() - 1);
    } else if (key.includes("3M")) {
      startDate.setMonth(date.getMonth() - 3);
    } else if (key.includes("6M")) {
      startDate.setMonth(date.getMonth() - 6);
    } else if (key.includes("1Y")) {
      startDate.setFullYear(date.getFullYear() - 1);
    }
    
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return `${formatDate(startDate)} ~ ${signalDate}`;
  };

  return (
    <div className="container mt-4 momentum-page">
      {/* ==========================================================================
          [1] 상단부: 듀얼 모멘텀 요약 대시보드 카드 섹션 (한국 4*1, 미국 4*1)
          ========================================================================== */}
      
      {/* 한국 듀얼 모멘텀 요약 */}
      <h3 className="fw-bold mt-4 mb-3">한국 듀얼 모멘텀 요약 (Top 5)</h3>
      <div className="issue-strategy-grid">
        {STRATEGIES_KR.map((key) => {
          const list = data[key as keyof typeof data];
          if (!list || list.length === 0) return null;

          const top5 = list.slice(0, 5);
          const { title } = parseStrategyTitle(key);
          const latestDate = list[0]?.signalDate || "-";

          return (
            <div
              key={key}
              className="strategy-list-card"
              onClick={() => handleScrollToChart(key)}
              style={{ cursor: "pointer" }}
              title="클릭 시 하단 해당 상세 테이블로 이동"
            >
              <div className="strategy-card-header">
                <span className="strategy-card-title">{title}</span>
                <span className="strategy-card-date-badge" style={{ fontSize: "0.62rem" }}>
                  {getMomentumPeriod(latestDate, key)}
                </span>
              </div>
              
              <div className="strategy-card-body">
                <table className="strategy-mini-table">
                  <thead>
                    <tr>
                      <th>종목명</th>
                      <th style={{ textAlign: "right" }}>현재가</th>
                      <th style={{ textAlign: "right" }}>변동</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top5.map((item) => {
                      return (
                        <tr key={item.code}>
                          <td
                            className="strat-td-name"
                            onClick={(e) => {
                              e.stopPropagation(); // 스크롤 점프 전파 차단
                              navigate(
                                `/stock/searchStock?code=${encodeURIComponent(item.code)}&name=${encodeURIComponent(item.name)}`
                              );
                            }}
                            style={{ cursor: "pointer" }}
                            title="클릭 시 종목 상세 검색으로 이동"
                          >
                            {item.name}
                          </td>
                          <td className="strat-td-price" style={{ textAlign: "right" }}>
                            {item.price.toLocaleString()}원
                          </td>
                          <td
                            className={`strat-td-rate ${item.diff > 0 ? "trend-up" : item.diff < 0 ? "trend-down" : "trend-flat"}`}
                            style={{ textAlign: "right", fontWeight: "700" }}
                          >
                            {item.diff > 0 ? "+" : ""}{Math.trunc(item.diff)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* 미국 듀얼 모멘텀 요약 */}
      <h3 className="fw-bold mt-5 mb-3">미국 듀얼 모멘텀 요약 (Top 5)</h3>
      <div className="issue-strategy-grid">
        {STRATEGIES_US.map((key) => {
          const list = data[key as keyof typeof data];
          if (!list || list.length === 0) return null;

          const top5 = list.slice(0, 5);
          const { title } = parseStrategyTitle(key);
          const latestDate = list[0]?.signalDate || "-";

          return (
            <div
              key={key}
              className="strategy-list-card"
              onClick={() => handleScrollToChart(key)}
              style={{ cursor: "pointer" }}
              title="클릭 시 하단 해당 상세 테이블로 이동"
            >
              <div className="strategy-card-header">
                <span className="strategy-card-title">{title}</span>
                <span className="strategy-card-date-badge" style={{ fontSize: "0.62rem" }}>
                  {getMomentumPeriod(latestDate, key)}
                </span>
              </div>
              
              <div className="strategy-card-body">
                <table className="strategy-mini-table">
                  <thead>
                    <tr>
                      <th>종목명</th>
                      <th style={{ textAlign: "right" }}>현재가</th>
                      <th style={{ textAlign: "right" }}>변동</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top5.map((item) => {
                      return (
                        <tr key={item.code}>
                          <td
                            className="strat-td-name"
                            onClick={(e) => {
                              e.stopPropagation(); // 스크롤 점프 전파 차단
                              navigate(
                                `/stock/searchStock?code=${encodeURIComponent(item.code)}&name=${encodeURIComponent(item.name)}`
                              );
                            }}
                            style={{ cursor: "pointer" }}
                            title="클릭 시 종목 상세 검색으로 이동"
                          >
                            {item.name}
                          </td>
                          <td className="strat-td-price" style={{ textAlign: "right" }}>
                            ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td
                            className={`strat-td-rate ${item.diff > 0 ? "trend-up" : item.diff < 0 ? "trend-down" : "trend-flat"}`}
                            style={{ textAlign: "right", fontWeight: "700" }}
                          >
                            {item.diff > 0 ? "+" : ""}{Math.trunc(item.diff)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <hr className="my-5" />

      {/* ==========================================================================
          [2] 하단부: 기존 듀얼 모멘텀 상세 리스트 집결 영역
          ========================================================================== */}
      <h3 className="fw-bold mt-4 mb-3">전략별 상세 리스트</h3>
      {STRATEGY_ORDER
        .filter(key => data[key] && data[key].length > 0)
        .map(key => (
          <div id={key} key={key} className="momentum-table-wrapper">
            <DualMomentumCard
              strategyKey={key}
              list={data[key]}
            />
          </div>
        ))}
    </div>
  );
}
