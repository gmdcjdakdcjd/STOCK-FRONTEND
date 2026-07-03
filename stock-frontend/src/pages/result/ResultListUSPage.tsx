import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchUsResultList } from "../../api/resultApi";
import type {
  StrategyCode,
  StrategyResult,
  PageResponse
} from "../../api/resultApi";
import "./result.css";

const STRATEGY_GROUPS = [
  {
    title: "📊 거래량 & 스파이크",
    codes: ["DAILY_TOP20_VOLUME", "DAILY_DROP_SPIKE", "DAILY_RISE_SPIKE"]
  },
  {
    title: "📈 신고가 & 신저가",
    codes: ["DAILY_120D_NEW_HIGH", "DAILY_120D_NEW_LOW", "WEEKLY_52W_NEW_HIGH", "WEEKLY_52W_NEW_LOW"]
  },
  {
    title: "🔵 볼린저 밴드",
    codes: ["DAILY_BB_LOWER_TOUCH", "DAILY_BB_UPPER_TOUCH", "WEEKLY_BB_LOWER_TOUCH", "WEEKLY_BB_UPPER_TOUCH"]
  },
  {
    title: "⚡ RSI 지표",
    codes: ["RSI_30_UNHEATED", "RSI_70_OVERHEATED", "RSI_30_UNHEATED_WEEKLY", "RSI_70_OVERHEATED_WEEKLY"]
  },
  {
    title: "🏆 듀얼 모멘텀",
    codes: ["DUAL_MOMENTUM_1M", "DUAL_MOMENTUM_3M", "DUAL_MOMENTUM_6M", "DUAL_MOMENTUM_1Y"]
  },
  {
    title: "📅 일봉 이동평균선",
    codes: ["DAILY_TOUCH_MA20", "DAILY_TOUCH_MA60", "DAILY_TOUCH_MA120"]
  },
  {
    title: "📆 주봉 이동평균선",
    codes: ["WEEKLY_TOUCH_MA20", "WEEKLY_TOUCH_MA60", "WEEKLY_TOUCH_MA120"]
  }
];

export default function BoardListUSPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [strategyList, setStrategyList] = useState<StrategyCode[]>([]);
  const [strategyLabelMap, setStrategyLabelMap] =
    useState<Record<string, string>>({});
  const [rows, setRows] = useState<StrategyResult[]>([]);
  const [pageInfo, setPageInfo] =
    useState<PageResponse<StrategyResult> | null>(null);

  /* =========================
     URL 파라미터
     ========================= */
  const page = params.get("page") ?? "1";
  const size = params.get("size") ?? "10";
  const strategy = params.get("strategy") ?? "";
  const regDate = params.get("regDate") ?? "";

  /* =========================
     검색 조건 state
     ========================= */
  const [searchDate, setSearchDate] = useState("");

  /* =========================
     URL → 검색 조건 동기화
     ========================= */
  useEffect(() => {
    setSearchDate(regDate);
  }, [regDate]);

  /* =========================
     데이터 조회
     ========================= */
  useEffect(() => {
    const q = new URLSearchParams({
      page,
      size,
      ...(strategy && { strategy }),
      ...(regDate && { regDate })
    });

    fetchUsResultList(q)
      .then(data => {
        setStrategyList(data.strategyList);

        const map: Record<string, string> = {};
        data.strategyList.forEach(s => {
          map[s.code] = s.label;
        });
        setStrategyLabelMap(map);

        //  핵심 수정: null 방어
        setRows(data.response.dtoList ?? []);
        setPageInfo(data.response);
      })
      .catch(() => {
        alert("미국 전략 목록을 불러오지 못했습니다.");
        setRows([]);          //  안전 처리
        setPageInfo(null);
      });
  }, [page, size, strategy, regDate]);

  /* =========================
     검색
     ========================= */
  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const next = new URLSearchParams();
    next.set("page", "1");
    next.set("size", size);
    if (strategy) next.set("strategy", strategy);
    if (searchDate) next.set("regDate", searchDate);

    setParams(next);
  };

  /* =========================
     페이지 이동
     ========================= */
  const movePage = (p: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    setParams(next);
  };

  /* =========================
     초기화
     ========================= */
  const resetFilter = () => {
    setSearchDate("");

    setParams(
      new URLSearchParams({
        page: "1",
        size
      })
    );
  };

  /* =========================
     전략 선택 카드 클릭 이벤트
     ========================= */
  const handleStrategyChange = (code: string) => {
    const next = new URLSearchParams(params);
    next.set("page", "1");
    next.set("strategy", code);
    setParams(next);
  };

  /* =========================
     오늘 날짜 입력 (미국장은 시차로 인해 한국 오늘 기준 하루 전 날짜로 자동 셋팅)
     ========================= */
  const setTodayDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1); // 하루 전날
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    setSearchDate(`${yyyy}-${mm}-${dd}`);
  };

  // 한국 오늘 기준 하루 전(어제) 날짜 문자열 구하기
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const isYesterday = searchDate === getYesterdayStr();

  return (
    <div className="container mt-4" style={{ maxWidth: 1440 }}>
      <div className="result-layout">

        {/* 좌측 사이드바: 전략 리스트 세로 배치 */}
        <aside className="result-sidebar">
          <h4 className="fw-bold mb-4">📈 전략 목록</h4>

          {STRATEGY_GROUPS.map((group) => {
            const groupStrategies = strategyList.filter(s => {
              const baseKey = s.code.replace(/_(KR|US)$/i, "");
              return group.codes.includes(baseKey);
            });

            if (groupStrategies.length === 0) return null;

            return (
              <div key={group.title} className="strategy-group-section">
                <h5 className="strategy-group-title">{group.title}</h5>
                <div className="strategy-grid">
                  {groupStrategies.map(s => (
                    <div
                      key={s.code}
                      className={`strategy-card ${strategy === s.code ? "selected" : ""}`}
                      onClick={() => handleStrategyChange(s.code)}
                    >
                      <div className="strategy-card-indicator" />
                      <div className="strategy-card-info">
                        <span className="strategy-card-label">{s.label}</span>
                        <span className="strategy-card-code">{s.code}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* 미분류된 기타 전략이 있을 경우 출력 */}
          {(() => {
            const categorizedCodes = STRATEGY_GROUPS.flatMap(g => g.codes);
            const remainingStrategies = strategyList.filter(s => {
              const baseKey = s.code.replace(/_(KR|US)$/i, "");
              return !categorizedCodes.includes(baseKey);
            });

            if (remainingStrategies.length === 0) return null;

            return (
              <div className="strategy-group-section">
                <h5 className="strategy-group-title">⚙️ 기타 지표 전략</h5>
                <div className="strategy-grid">
                  {remainingStrategies.map(s => (
                    <div
                      key={s.code}
                      className={`strategy-card ${strategy === s.code ? "selected" : ""}`}
                      onClick={() => handleStrategyChange(s.code)}
                    >
                      <div className="strategy-card-indicator" />
                      <div className="strategy-card-info">
                        <span className="strategy-card-label">{s.label}</span>
                        <span className="strategy-card-code">{s.code}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </aside>

        {/* 우측 메인 콘텐츠 영역: 필터 및 결과 목록 테이블 */}
        <main className="result-main">
          <div className="market-toggle-container">
            <div className="market-toggle-tabs">
              <button
                type="button"
                className="market-toggle-btn"
                onClick={() => navigate("/result/listKR")}
              >
                대한민국 (KR)
              </button>
              <button
                type="button"
                className="market-toggle-btn active"
                onClick={() => navigate("/result/listUS")}
              >
                미국 (US)
              </button>
            </div>

            {/* US 시차 안내 알림 배너 */}
            <div className="us-timezone-notice">
              {isYesterday ? (
                <span>ℹ️ 시차 적용으로 인해, 미국 시장의 경우 검색 날짜를 한국 날짜 기준에서 <strong>하루(1일) 뺀 값으로 조회됩니다.</strong></span>
              ) : (
                <span>ℹ️ 시차 적용으로 인해, 미국 시장의 경우 검색 날짜를 한국 날짜 기준에서 <strong>하루(1일) 빼고</strong> 조회해 주세요.</span>
              )}
            </div>
          </div>

          <h3 className="fw-bold mb-4">
            📈 {strategyLabelMap[strategy] ? `${strategyLabelMap[strategy]} 결과 목록` : "미국 전략 결과 목록"}
          </h3>

          {/* Filter */}
          <form className="result-filter" onSubmit={onSearch}>
            <div className="result-filter-row">
              <div className="result-filter-group">
                <span className="result-filter-label">날짜</span>
                <div className="date-input-wrapper">
                  <input
                    type="date"
                    className="result-filter-input"
                    value={searchDate}
                    onChange={e => setSearchDate(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-today"
                    onClick={setTodayDate}
                  >
                    오늘
                  </button>
                </div>
              </div>

              <div className="result-filter-actions">
                <button type="submit" className="btn-search">
                  검색
                </button>
                <button
                  type="button"
                  className="btn-reset"
                  onClick={resetFilter}
                >
                  초기화
                </button>
              </div>
            </div>
          </form>

          {/* Result */}
          <div className="result-card">
            <div className="result-card-header">전략 결과</div>

            <div className="result-table-header">
              <div>전략명</div>
              <div>포착일</div>
              <div>포착 데이터 수</div>
            </div>

            {rows.length === 0 && (
              <div className="result-empty">
                조회된 결과가 없습니다.
              </div>
            )}

            {rows.map(r => (
              <div
                key={`${r.strategyName}-${r.signalDate}`}
                className="result-table-row"
                onClick={() =>
                  navigate(
                    `/result/detailUS?strategy=${encodeURIComponent(
                      r.strategyName
                    )}&date=${r.signalDate}`
                  )
                }
              >
                <div className="result-col-strategy">
                  {strategyLabelMap[r.strategyName] ?? r.strategyName}
                </div>
                <div>{r.signalDate}</div>
                <div>{r.totalData}</div>
              </div>
            ))}

            {pageInfo && (
              <div className="result-pagination">
                {pageInfo.prev && (
                  <button
                    className="page-link"
                    onClick={() => movePage(pageInfo.start - 1)}
                  >
                    Previous
                  </button>
                )}

                {Array.from(
                  { length: pageInfo.end - pageInfo.start + 1 },
                  (_, i) => pageInfo.start + i
                ).map(p => (
                  <button
                    key={p}
                    className={`page-link ${pageInfo.page === p ? "active" : ""}`}
                    onClick={() => movePage(p)}
                  >
                    {p}
                  </button>
                ))}

                {pageInfo.next && (
                  <button
                    className="page-link"
                    onClick={() => movePage(pageInfo.end + 1)}
                  >
                    Next
                  </button>
                )}
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  );
}
