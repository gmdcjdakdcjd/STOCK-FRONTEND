import { useNavigate } from "react-router-dom";
import { useIssueData } from "./useIssueData";
import IssueTable from "./IssueTable";
import { getIssueTitle } from "./issue.utils";
import "./issue.css";

// 사용자의 요구사항에 맞추어 전략 지표들을 3대 대분류 그룹으로 지정합니다.
// 1. 한국 종목 (한국 개별 주식 전략 3개)
const STRATEGIES_KR = [
  "DAILY_DROP_SPIKE_KR",
  "DAILY_RISE_SPIKE_KR",
  "DAILY_TOP20_VOLUME_KR"
];

// 2. 미국 종목 (미국 개별 주식 전략 3개)
const STRATEGIES_US = [
  "DAILY_DROP_SPIKE_US",
  "DAILY_RISE_SPIKE_US",
  "DAILY_TOP20_VOLUME_US"
];

// 3. ETF 통합 (한국 ETF 전략 2개 + 미국 ETF 전략 1개 통합)
const STRATEGIES_ETF = [
  "KODEX_TOP20_VOLUME_KR",
  "TIGER_TOP20_VOLUME_KR",
  "ETF_TOP20_VOLUME_US"
];

export default function IssuePage() {
  const { data, loading } = useIssueData();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="container mt-4">이슈 데이터를 불러오는 중입니다...</div>
    );
  }

  if (!data) {
    return (
      <div className="container mt-4">이슈 데이터를 불러오지 못했습니다.</div>
    );
  }

  // 상단 요약 카드를 클릭했을 때 하단의 해당 상세 리스트 영역으로 부드럽게 스크롤 이동시키는 함수입니다.
  const handleScrollToChart = (id: string) => {
    const targetElement = document.getElementById(id);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="container mt-4 issue-page">
      {/* ==========================================================================
          [1] 상단부: 3대 요약 대시보드 연속 선배치 영역 (한국, 미국, ETF 통합 순)
          ========================================================================== */}
      
      {/* 한국 종목 요약 */}
      <h3 className="fw-bold mt-4 mb-3">한국 종목 요약 (Top 5)</h3>
      <div className="issue-strategy-grid">
        {STRATEGIES_KR.map((key) => {
          const list = data[key as keyof typeof data];
          if (!list || list.length === 0) return null;

          const top5 = list.slice(0, 5);
          const title = getIssueTitle(key);
          const latestDate = list[0]?.signalDate || "-";

          return (
            <div
              key={key}
              className="strategy-list-card"
              onClick={() => handleScrollToChart(key)}
              style={{ cursor: "pointer" }}
              title="클릭 시 하단 해당 상세 종목 테이블로 이동"
            >
              <div className="strategy-card-header">
                <span className="strategy-card-title">{title}</span>
                <span className="strategy-card-date-badge">{latestDate}</span>
              </div>
              
              <div className="strategy-card-body">
                <table className="strategy-mini-table">
                  <thead>
                    <tr>
                      <th>종목명</th>
                      <th style={{ textAlign: "right" }}>현재가</th>
                      <th style={{ textAlign: "right" }}>
                        {key.includes("VOLUME") ? "거래량" : "등락률"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {top5.map((item) => {
                      const priceDiff = item.price - item.prevClose;
                      const rate = item.prevClose ? (priceDiff / item.prevClose) * 100 : 0;
                      const isUp = priceDiff > 0;
                      const isDown = priceDiff < 0;

                      return (
                        <tr key={item.code}>
                          <td
                            className="strat-td-name"
                            onClick={(e) => {
                              e.stopPropagation(); // 카드 스크롤 점프 이벤트로 전파되는 현상 차단
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
                          {key.includes("VOLUME") ? (
                            <td className="strat-td-rate" style={{ textAlign: "right", fontWeight: "700" }}>
                              {item.volume ? item.volume.toLocaleString() : "0"}주
                            </td>
                          ) : (
                            <td
                              className={`strat-td-rate ${isUp ? "trend-up" : isDown ? "trend-down" : "trend-flat"}`}
                              style={{ textAlign: "right", fontWeight: "700" }}
                            >
                              {isUp ? "+" : ""}
                              {rate.toFixed(2)}%
                            </td>
                          )}
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

      {/* 미국 종목 요약 */}
      <h3 className="fw-bold mt-5 mb-3">미국 종목 요약 (Top 5)</h3>
      <div className="issue-strategy-grid">
        {STRATEGIES_US.map((key) => {
          const list = data[key as keyof typeof data];
          if (!list || list.length === 0) return null;

          const top5 = list.slice(0, 5);
          const title = getIssueTitle(key);
          const latestDate = list[0]?.signalDate || "-";

          return (
            <div
              key={key}
              className="strategy-list-card"
              onClick={() => handleScrollToChart(key)}
              style={{ cursor: "pointer" }}
              title="클릭 시 하단 해당 상세 종목 테이블로 이동"
            >
              <div className="strategy-card-header">
                <span className="strategy-card-title">{title}</span>
                <span className="strategy-card-date-badge">{latestDate}</span>
              </div>
              
              <div className="strategy-card-body">
                <table className="strategy-mini-table">
                  <thead>
                    <tr>
                      <th>종목명</th>
                      <th style={{ textAlign: "right" }}>현재가</th>
                      <th style={{ textAlign: "right" }}>
                        {key.includes("VOLUME") ? "거래량" : "등락률"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {top5.map((item) => {
                      const priceDiff = item.price - item.prevClose;
                      const rate = item.prevClose ? (priceDiff / item.prevClose) * 100 : 0;
                      const isUp = priceDiff > 0;
                      const isDown = priceDiff < 0;

                      return (
                        <tr key={item.code}>
                          <td
                            className="strat-td-name"
                            onClick={(e) => {
                              e.stopPropagation(); // 카드 스크롤 점프 이벤트로 전파되는 현상 차단
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
                          {key.includes("VOLUME") ? (
                            <td className="strat-td-rate" style={{ textAlign: "right", fontWeight: "700" }}>
                              {item.volume ? item.volume.toLocaleString() : "0"}주
                            </td>
                          ) : (
                            <td
                              className={`strat-td-rate ${isUp ? "trend-up" : isDown ? "trend-down" : "trend-flat"}`}
                              style={{ textAlign: "right", fontWeight: "700" }}
                            >
                              {isUp ? "+" : ""}
                              {rate.toFixed(2)}%
                            </td>
                          )}
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

      {/* ETF 통합 요약 */}
      <h3 className="fw-bold mt-5 mb-3">ETF 통합 요약 (Top 5)</h3>
      <div className="issue-strategy-grid">
        {STRATEGIES_ETF.map((key) => {
          const list = data[key as keyof typeof data];
          if (!list || list.length === 0) return null;

          const top5 = list.slice(0, 5);
          const title = getIssueTitle(key);
          const latestDate = list[0]?.signalDate || "-";
          const isUS = key === "ETF_TOP20_VOLUME_US";

          return (
            <div
              key={key}
              className="strategy-list-card"
              onClick={() => handleScrollToChart(key)}
              style={{ cursor: "pointer" }}
              title="클릭 시 하단 해당 상세 종목 테이블로 이동"
            >
              <div className="strategy-card-header">
                <span className="strategy-card-title">{title}</span>
                <span className="strategy-card-date-badge">{latestDate}</span>
              </div>
              
              <div className="strategy-card-body">
                <table className="strategy-mini-table">
                  <thead>
                    <tr>
                      <th>종목명</th>
                      <th style={{ textAlign: "right" }}>현재가</th>
                      <th style={{ textAlign: "right" }}>거래량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top5.map((item) => {
                      return (
                        <tr key={item.code}>
                          <td
                            className="strat-td-name"
                            onClick={(e) => {
                              e.stopPropagation(); // 카드 스크롤 점프 이벤트로 전파되는 현상 차단
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
                            {isUS ? `$${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `${item.price.toLocaleString()}원`}
                          </td>
                          <td className="strat-td-rate" style={{ textAlign: "right", fontWeight: "700" }}>
                            {item.volume ? item.volume.toLocaleString() : "0"}주
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
          [2] 하단부: 상세 테이블 목록 집결 영역 (한국, 미국, ETF 통합 순)
          ========================================================================== */}
      
      {/* 한국 종목 상세 리스트 */}
      <h3 className="fw-bold mt-4 mb-3">한국 종목 상세 리스트</h3>
      <div className="issue-tables-section mb-5">
        {STRATEGIES_KR.map((key) => {
          const list = data[key as keyof typeof data];
          if (!list || list.length === 0) return null;
          return (
            <div id={key} key={key} className="issue-table-wrapper">
              <IssueTable
                title={getIssueTitle(key)}
                list={list}
                market="KR"
              />
            </div>
          );
        })}
      </div>

      {/* 미국 종목 상세 리스트 */}
      <h3 className="fw-bold mt-5 mb-3">미국 종목 상세 리스트</h3>
      <div className="issue-tables-section mb-5">
        {STRATEGIES_US.map((key) => {
          const list = data[key as keyof typeof data];
          if (!list || list.length === 0) return null;
          return (
            <div id={key} key={key} className="issue-table-wrapper">
              <IssueTable
                title={getIssueTitle(key)}
                list={list}
                market="US"
              />
            </div>
          );
        })}
      </div>

      {/* ETF 통합 상세 리스트 */}
      <h3 className="fw-bold mt-5 mb-3">ETF 통합 상세 리스트</h3>
      <div className="issue-tables-section mb-5">
        {STRATEGIES_ETF.map((key) => {
          const list = data[key as keyof typeof data];
          if (!list || list.length === 0) return null;
          const isUS = key === "ETF_TOP20_VOLUME_US";
          return (
            <div id={key} key={key} className="issue-table-wrapper">
              <IssueTable
                title={getIssueTitle(key)}
                list={list}
                market={isUS ? "US" : "KR"}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
