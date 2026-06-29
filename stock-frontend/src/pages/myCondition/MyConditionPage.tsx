import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { runScreenerWithFilters } from "../../api/screenerApi";
import { fetchKodexSummary, fetchKodexHoldings } from "../../api/kodexApi";
import { fetchTigerSummary, fetchTigerHoldings } from "../../api/tigerApi";
import "./MyConditionPage.css";
import "../result/result-detail.css"; // ResultDetail 공통 테이블 스타일을 재사용합니다.

/* 조건식 필터 옵션 인터페이스 정의 */
interface FilterOption {
  baseKey: string;
  label: string;
  hasCurrency: boolean; /* 통화 기호 (원 / $) 표시 여부 */
  onlyKR?: boolean; /* 한국 시장 전용 여부 */
}

/* 화면에 표시할 후보 필터 조건 목록 (접미사를 제외한 Base Key 구조) */
const FILTER_OPTIONS: FilterOption[] = [
  { baseKey: "DAILY_120D_NEW_HIGH", label: "120일 신고가", hasCurrency: true },
  { baseKey: "DAILY_120D_NEW_LOW", label: "120일 신저가", hasCurrency: true },
  { baseKey: "DAILY_BB_LOWER_TOUCH", label: "볼린저밴드 하단선 터치값", hasCurrency: true },
  { baseKey: "DAILY_BB_UPPER_TOUCH", label: "볼린저밴드 상단선 터치값", hasCurrency: true },
  { baseKey: "DAILY_TOUCH_MA60", label: "60일선 터치값", hasCurrency: true },
  { baseKey: "RSI_30_UNHEATED", label: "RSI 하단 (30 이하) 진입값", hasCurrency: false },
  { baseKey: "RSI_70_OVERHEATED", label: "RSI 상단 (70 이상) 진입값", hasCurrency: false },
  // { baseKey: "WEEKLY_52W_NEW_HIGH", label: "52주 신고가", hasCurrency: true },
  // { baseKey: "WEEKLY_52W_NEW_LOW", label: "52주 신저가", hasCurrency: true },
  // { baseKey: "WEEKLY_TOUCH_MA60", label: "주봉 60주선 터치값", hasCurrency: true },
  { baseKey: "DAILY_TOP20_VOLUME", label: "상위 20 거래량", hasCurrency: true },
  { baseKey: "DAILY_DROP_SPIKE", label: "급락 스파이크", hasCurrency: true },
  { baseKey: "DAILY_RISE_SPIKE", label: "급등 스파이크", hasCurrency: true },
];

export default function MyConditionPage() {
  const navigate = useNavigate();

  /* 상태 관리: 현재 선택한 시장 (kr: 한국 시장, us: 미국 시장) */
  const [market, setMarket] = useState<"kr" | "us">("kr");

  /* 상태 관리: 체크된 필터 조건의 baseKey 목록 */
  const [checkedFilterKeys, setCheckedFilterKeys] = useState<string[]>([]);

  /* 상태 관리: 시가총액 필터 선택 ("" | "RANK_MARKET_CAP_30" | "RANK_MARKET_CAP_100" | "RANK_MARKET_CAP_200") */
  const [marketCapFilter, setMarketCapFilter] = useState<string>("");

  /* 상태 관리: 백엔드로부터 응답받은 스크리닝 결과 종목 리스트 */
  const [results, setResults] = useState<any[]>([]);

  /* 상태 관리: 테이블에서 다중 선택된 종목 코드 리스트 (사용되지 않아 임시 주석 처리) */
  // const [checkedCodes, setCheckedCodes] = useState<string[]>([]);

  /* 상태 관리: 로그인 인증 완료 여부 (사용되지 않아 임시 주석 처리) */
  // const [authenticated, setAuthenticated] = useState<boolean>(false);

  /* 상태 관리: 스크리닝 실행 로딩 여부 */
  const [isRunning, setIsRunning] = useState<boolean>(false);

  /* 상태 관리: 에러 발생 메시지 */
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* 컴포넌트 마운트 시 유저 인증 세션 체크 (사용되지 않아 임시 주석 처리)
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false));
  }, []);
  */

  /* ========================================================
     특정 ETF 구성 종목 필터링용 상태 및 훅 정의
     ======================================================== */
  const useEtfFilter = true; /* ETF 선택 영역은 항상 활성화하여 노출합니다. */
  const [etfBrand, setEtfBrand] = useState<"KODEX" | "TIGER">("KODEX");
  const [etfQuery, setEtfQuery] = useState<string>("");
  const [etfSearchInput, setEtfSearchInput] = useState<string>("");
  const [etfList, setEtfList] = useState<{ etfId: string; etfName: string }[]>([]);
  const [selectedEtfs, setSelectedEtfs] = useState<{ etfId: string; etfName: string }[]>([]);
  const [etfHoldings, setEtfHoldings] = useState<Set<string>>(new Set());
  const [etfLoading, setEtfLoading] = useState<boolean>(false);

  /* ETF 요약 목록 조회 API 훅 */
  useEffect(() => {
    if (!useEtfFilter) return;
    setEtfLoading(true);

    if (etfBrand === "KODEX") {
      fetchKodexSummary(etfQuery || undefined, true)
        .then((data) => {
          setEtfList(data.map((item) => ({ etfId: item.etfId, etfName: item.etfName })));
        })
        .catch(() => setEtfList([]))
        .finally(() => setEtfLoading(false));
    } else {
      fetchTigerSummary(etfQuery || undefined, true)
        .then((data) => {
          setEtfList(data.map((item) => ({ etfId: item.etfId, etfName: item.etfName })));
        })
        .catch(() => setEtfList([]))
        .finally(() => setEtfLoading(false));
    }
  }, [etfBrand, etfQuery, useEtfFilter]);

  /* 선택한 다중 ETF들의 구성 종목(Holdings) 코드 목록 조회 및 브랜드별 내부 교집합 후 브랜드 간 교집합 병합 API 훅 */
  useEffect(() => {
    if (!useEtfFilter || selectedEtfs.length === 0) {
      setEtfHoldings(new Set());
      return;
    }

    setEtfLoading(true);

    // KODEX와 TIGER 그룹으로 분류합니다.
    const kodexEtfs = selectedEtfs.filter((etf) => !etf.etfName.toUpperCase().includes("TIGER"));
    const tigerEtfs = selectedEtfs.filter((etf) => etf.etfName.toUpperCase().includes("TIGER"));

    // 특정 그룹 내 ETF들의 종목코드 교집합(AND)을 구하는 헬퍼 함수
    const fetchHoldingsForList = async (etfListForBrand: typeof selectedEtfs, isTiger: boolean) => {
      const promises = etfListForBrand.map((etf) => {
        if (isTiger) {
          return fetchTigerHoldings(etf.etfId)
            .then((data) => (Array.isArray(data) ? data.map((item) => item.stockCode) : []))
            .catch(() => [] as string[]);
        } else {
          return fetchKodexHoldings(etf.etfId)
            .then((data) => (Array.isArray(data) ? data.map((item) => item.stockCode) : []))
            .catch(() => [] as string[]);
        }
      });

      const resultsArray = await Promise.all(promises);
      const validArrays = resultsArray.filter((arr) => Array.isArray(arr) && arr.length > 0);

      if (validArrays.length === 0) {
        return new Set<string>();
      }

      // 첫 번째 유효 ETF의 구성 종목 목록을 기준으로 교집합(AND)을 구합니다.
      let intersectionSet = new Set<string>(validArrays[0]);
      for (let i = 1; i < validArrays.length; i++) {
        const currentSet = new Set<string>(validArrays[i]);
        const nextIntersection = new Set<string>();
        intersectionSet.forEach((code) => {
          if (currentSet.has(code)) {
            nextIntersection.add(code);
          }
        });
        intersectionSet = nextIntersection;
      }
      return intersectionSet;
    };

    const processAll = async () => {
      try {
        const [kodexIntersection, tigerIntersection] = await Promise.all([
          kodexEtfs.length > 0 ? fetchHoldingsForList(kodexEtfs, false) : Promise.resolve(null),
          tigerEtfs.length > 0 ? fetchHoldingsForList(tigerEtfs, true) : Promise.resolve(null),
        ]);

        if (kodexIntersection && tigerIntersection) {
          // KODEX 내부 교집합 그룹과 TIGER 내부 교집합 그룹 간의 최종 교집합(AND)을 구합니다.
          const finalIntersection = new Set<string>();
          kodexIntersection.forEach((code) => {
            if (tigerIntersection.has(code)) {
              finalIntersection.add(code);
            }
          });
          setEtfHoldings(finalIntersection);
        } else if (kodexIntersection) {
          // KODEX만 선택된 경우에는 KODEX 내부 교집합 적용
          setEtfHoldings(kodexIntersection);
        } else if (tigerIntersection) {
          // TIGER만 선택된 경우에는 TIGER 내부 교집합 적용
          setEtfHoldings(tigerIntersection);
        } else {
          setEtfHoldings(new Set());
        }
      } catch {
        setEtfHoldings(new Set());
      } finally {
        setEtfLoading(false);
      }
    };

    processAll();
  }, [selectedEtfs, useEtfFilter]);

  /* 시장이 바뀔 때 기존 선택 정보 및 결과 데이터 초기화 */
  const handleMarketChange = (newMarket: "kr" | "us") => {
    setMarket(newMarket);
    setCheckedFilterKeys([]);
    setResults([]);
    // setCheckedCodes([]);
    setErrorMessage(null);
    setMarketCapFilter("");
    setEtfBrand("KODEX");
    setEtfQuery("");
    setEtfSearchInput("");
    setEtfList([]);
    setSelectedEtfs([]);
    setEtfHoldings(new Set());
  };

  /* ETF 칩 추가 함수 (최대 5개 제한) */
  const addEtfChip = (etfId: string, etfName: string) => {
    if (!etfId) return;
    if (selectedEtfs.some((item) => item.etfId === etfId)) {
      alert("이미 선택된 ETF입니다.");
      return;
    }
    if (selectedEtfs.length >= 5) {
      alert("ETF는 최대 5개까지만 선택 가능합니다.");
      return;
    }
    setSelectedEtfs([...selectedEtfs, { etfId, etfName }]);
  };

  /* ETF 칩 제거 함수 */
  const removeEtfChip = (etfId: string) => {
    setSelectedEtfs(selectedEtfs.filter((item) => item.etfId !== etfId));
  };

  /* 조건 체크박스 선택/해제 이벤트 */
  const handleCheckboxChange = (filterKey: string) => {
    if (checkedFilterKeys.includes(filterKey)) {
      setCheckedFilterKeys(checkedFilterKeys.filter((key) => key !== filterKey));
    } else {
      setCheckedFilterKeys([...checkedFilterKeys, filterKey]);
    }
  };

  /* 결과 테이블 개별 종목 선택 토글 (사용되지 않아 임시 주석 처리)
  const toggleOneCode = (code: string) => {
    setCheckedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };
  */

  /* 결과 테이블 전체 종목 선택 토글 (사용되지 않아 임시 주석 처리)
  const toggleAllCodes = (checked: boolean) => {
    setCheckedCodes(checked ? results.map((r) => r.code) : []);
  };
  */

  /* '조건 검색 실행' 버튼 클릭 시 백엔드 호출 */
  const handleRunSearch = async () => {
    const finalFilters = checkedFilterKeys.map((key) => `${key}_${market.toUpperCase()}`);

    // 시가총액 단일 선택 필터가 지정되어 있다면 필터 목록에 결합하여 함께 전달합니다.
    if (marketCapFilter) {
      finalFilters.push(`${marketCapFilter}_${market.toUpperCase()}`);
    }

    const etfCodes = selectedEtfs.length > 0 ? Array.from(etfHoldings) : [];

    // 조건 필터도 없고 ETF 선택 목록도 비어 있는 경우 조회를 방지합니다.
    if (finalFilters.length === 0 && etfCodes.length === 0) {
      alert("최소 한 개 이상의 조건을 선택하거나 ETF 필터를 추가해 주세요.");
      return;
    }

    setIsRunning(true);
    setErrorMessage(null);
    setResults([]);
    // setCheckedCodes([]);

    try {
      /* 조립된 필터 키 목록과 선택한 ETF의 교집합 종목 코드 목록을 백엔드로 직접 전송 */
      const response = await runScreenerWithFilters(finalFilters, etfCodes);

      if (response && response.status === "success" && Array.isArray(response.data)) {
        setResults(response.data);
      } else {
        throw new Error(response.message || "올바르지 않은 응답 포맷입니다.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "스크리닝 연동 중 오류가 발생했습니다.");
    } finally {
      setIsRunning(false);
    }
  };

  /* 선택된 종목들을 내 관심 종목으로 일괄 추가하는 함수 (사용되지 않아 임시 주석 처리)
  const handleAddMyStock = () => {
    if (!authenticated) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }

    if (checkedCodes.length === 0) {
      alert("선택된 종목이 없습니다.");
      return;
    }

    const today = new Date().toISOString().substring(0, 10);
    const payload = results
      .filter((r) => checkedCodes.includes(r.code))
      .map((r) => ({
        code: r.code,
        name: r.name,
        strategyName: "나만의 조건식",
        priceAtAdd: r.currentPrice,
        memo: `${today} 포착`,
      }));

    fetch("/api/mystock/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        alert("선택한 종목들이 내 관심 종목에 추가되었습니다.");
        setCheckedCodes([]);
      })
      .catch(() => alert("관심 종목 등록에 실패했습니다. 로그인 상태를 다시 확인해 주세요."));
  };
  */

  /* 시장 선택에 맞춘 필터 조건 라벨명을 얻는 헬퍼 함수 */
  const getFilterLabel = (filter: FilterOption) => {
    if (filter.hasCurrency) {
      return `${filter.label} (${market === "kr" ? "원" : "$"})`;
    }
    return filter.label;
  };

  return (
    <div className="mycondition-container">
      {/* 상단 타이틀 영역 */}
      <div className="mycondition-header">
        <h1 className="mycondition-title">나만의 조건식</h1>
        <p className="mycondition-subtitle">
          원하는 투자 조건들을 선택하고 여러 조건들을 동시에 만족하는 교집합 종목들을 실시간으로 추출합니다.
        </p>
      </div>

      <div className="mycondition-content" style={{ gridTemplateColumns: "1fr" }}>
        <div className="mycondition-main">
          {/* 에러 발생 시 알림 배너 */}
          {errorMessage && (
            <div className="error-banner" style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "15px" }}>
              {errorMessage}
            </div>
          )}

          {/* 1단계: 시장 선택 카드 (미국 주식 기능은 임시 주석 처리합니다) */}
          <div className="detail-card" style={{ marginBottom: "10px" }}>
            <h3 className="detail-title">
              <span className="step-badge">Step 01</span>
              대상 시장 선택
            </h3>
            <p className="detail-desc">분석을 진행할 주식 시장을 선택해 주세요.</p>

            <div style={{ display: "flex", gap: "15px" }}>
              <button
                type="button"
                onClick={() => handleMarketChange("kr")}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "1rem",
                  fontWeight: "700",
                  borderRadius: "8px",
                  border: "2px solid #2563eb",
                  background: "#eff6ff",
                  color: "#1e40af",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                국내 시장 (KR)
              </button>
            </div>
          </div>

          {/* 2단계: 조건 필터 선택 카드 */}
          <div className="detail-card">
            <h3 className="detail-title">
              <span className="step-badge">Step 02</span>
              조건 필터 체크
            </h3>
            <p className="detail-desc">적용할 주식 스크리닝 필터를 선택해 주세요 (선택한 모든 조건의 교집합 종목이 추출됩니다).</p>

            <div className="filter-checkbox-grid">
              {FILTER_OPTIONS
                .filter((filter) => !filter.onlyKR || market === "kr")
                .map((filter) => {
                  const isChecked = checkedFilterKeys.includes(filter.baseKey);
                  return (
                    <label
                      key={filter.baseKey}
                      className={`filter-checkbox-label ${isChecked ? "checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="filter-checkbox-input"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(filter.baseKey)}
                      />
                      <div className="filter-checkbox-text">
                        <span className="filter-checkbox-name">
                          {getFilterLabel(filter)}
                        </span>
                        <span className="filter-checkbox-code">
                          {filter.baseKey}_{market.toUpperCase()}
                        </span>
                      </div>
                    </label>
                  );
                })}
            </div>

            {/* 시가총액 랭킹 조건 단일 선택 그룹 (택 1) */}
            <div className="cap-radio-container">
              <span className="cap-radio-title">
                시가총액 상위 랭킹 필터 (택 1)
              </span>
              <div className="cap-radio-group">
                {[
                  { val: "", label: "적용 안 함" },
                  { val: "RANK_MARKET_CAP_30", label: "상위 30" },
                  { val: "RANK_MARKET_CAP_100", label: "상위 100" },
                  { val: "RANK_MARKET_CAP_200", label: "상위 200" }
                ].map((item) => (
                  <label
                    key={item.val}
                    className={`cap-radio-label ${marketCapFilter === item.val ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="market-cap-radio"
                      className="cap-radio-input"
                      checked={marketCapFilter === item.val}
                      onChange={() => setMarketCapFilter(item.val)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            {/* 특정 ETF 구성 종목 필터 옵션 (항상 활성화하여 상설 노출) */}
            <div className="etf-filter-panel">
              <div className="etf-panel-header">
                <span className="etf-panel-title">
                  특정 ETF 구성 종목으로 결과 필터링 (교집합 추출)
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* 운용사 브랜드 선택 버튼 그룹 */}
                <div className="etf-row">
                  <span className="etf-row-label">운용사 선택:</span>
                  <button
                    type="button"
                    className={`btn-brand-tab ${etfBrand === "KODEX" ? "active" : ""}`}
                    onClick={() => setEtfBrand("KODEX")}
                  >
                    KODEX
                  </button>
                  <button
                    type="button"
                    className={`btn-brand-tab ${etfBrand === "TIGER" ? "active" : ""}`}
                    onClick={() => setEtfBrand("TIGER")}
                  >
                    TIGER
                  </button>
                </div>

                {/* ETF 이름 찾기 검색창 */}
                <div className="etf-row">
                  <span className="etf-row-label">ETF 검색:</span>
                  <input
                    type="text"
                    className="etf-search-input"
                    placeholder="예: 200, 레버리지, 반도체 등"
                    value={etfSearchInput}
                    onChange={(e) => setEtfSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setEtfQuery(etfSearchInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-etf-search"
                    onClick={() => setEtfQuery(etfSearchInput)}
                  >
                    찾기
                  </button>
                </div>

                {/* 불러온 ETF 선택 셀렉트 박스 */}
                <div className="etf-row">
                  <span className="etf-row-label">ETF 선택:</span>
                  <select
                    value=""
                    className="etf-select-dropdown"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const targetOption = etfList.find((item) => item.etfId === val);
                        if (targetOption) {
                          addEtfChip(val, targetOption.etfName);
                        }
                      }
                    }}
                  >
                    <option value="">-- 필터링할 ETF를 검색 및 선택해 주세요 (최대 5개) --</option>
                    {etfList.map((item) => (
                      <option key={item.etfId} value={item.etfId}>
                        [{item.etfId}] {item.etfName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 선택된 ETF 목록 칩 표시 */}
                {selectedEtfs.length > 0 && (
                  <div style={{ display: "flex", gap: "5px", alignItems: "flex-start", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "#4b5563" }}>선택된 ETF 목록 ({selectedEtfs.length}/5):</span>
                    <div className="etf-chips-container">
                      {selectedEtfs.map((etf) => (
                        <span key={etf.etfId} className="etf-chip">
                          {etf.etfName}
                          <button
                            type="button"
                            className="etf-chip-delete"
                            onClick={() => removeEtfChip(etf.etfId)}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {etfLoading && (
                  <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>ETF 구성 종목을 불러오는 중입니다...</span>
                )}
                {!etfLoading && etfList.length === 0 && (
                  <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>검색된 ETF가 없습니다. 운용사 선택 및 검색어를 확인하세요.</span>
                )}

              </div>
            </div>

            <div className="detail-actions" style={{ border: "none", paddingTop: 0 }}>
              <button
                className="btn-run-screening"
                onClick={handleRunSearch}
                disabled={isRunning}
              >
                {isRunning ? "조건 만족 종목 스크리닝 중..." : `${market.toUpperCase()} 시장 조건 검색 실행`}
              </button>
            </div>
          </div>

          {/* 3단계: 스크리닝 포착 종목 목록 카드 (관심종목 추가 기능 버튼들은 임시 제거) */}
          {(() => {
            /* ETF 필터 선택 여부에 따라 교집합 필터링된 최종 목록을 생성합니다. results가 배열인지 안전 검사를 수행합니다. */
            const displayedResults = (Array.isArray(results) ? results : []).filter((r) => {
              if (useEtfFilter && selectedEtfs.length > 0) {
                return etfHoldings.has(r.code);
              }
              return true;
            });

            return (
              <div className="result-card" style={{ marginTop: "15px" }}>
                <div className="result-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span>포착 종목 목록 (전체 {displayedResults.length}개)</span>
                  {displayedResults.length > 200 && (
                    <span style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: "normal" }}>
                      * 렌더링 성능 유지를 위해 상위 200개 종목만 표에 출력됩니다.
                    </span>
                  )}
                </div>

                <div className="result-table-wrapper" style={{ overflowX: "auto" }}>
                  <table className="detail-table align-table" style={{ width: "100%" }}>
                    <colgroup>
                      <col style={{ width: "120px" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "120px" }} />
                      <col style={{ width: "150px" }} />
                      <col style={{ width: "125px" }} />
                      <col style={{ width: "125px" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="col-code">종목코드</th>
                        <th className="col-name">종목명</th>
                        <th className="col-detail"></th>
                        <th className="col-num">현재가(종가)</th>
                        <th className="col-num">고가</th>
                        <th className="col-num">저가</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isRunning ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
                            조건에 부합하는 종목을 실시간으로 스크리닝 중입니다. 잠시만 기다려 주세요.
                          </td>
                        </tr>
                      ) : displayedResults.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
                            {errorMessage ? "에러가 발생하여 조회가 중단되었습니다." : "상단의 필터를 선택하고 실행 버튼을 눌러 스크리닝된 종목 리스트를 확인하세요."}
                          </td>
                        </tr>
                      ) : (
                        /* 대용량 데이터로 인한 React 렌더링 정지(Unresponsive)를 방지하기 위해 최대 200개로 슬라이스하여 매핑합니다. */
                        displayedResults.slice(0, 200).map((r) => (
                          <tr key={r.code}>
                            <td className="col-code" style={{ fontFamily: "monospace" }}>{r.code}</td>
                            <td className="col-name" style={{ fontWeight: 600 }}>{r.name}</td>
                            <td className="col-detail">
                              <button
                                className="detail-link-btn"
                                onClick={() => navigate(`/stock/searchStock?code=${encodeURIComponent(r.code)}&name=${encodeURIComponent(r.name)}`)}
                              >
                                종목상세
                              </button>
                            </td>
                            <td className="col-num">
                              {r.currentPrice ? `${r.currentPrice.toLocaleString()} ${market === "kr" ? "원" : "$"}` : "-"}
                            </td>
                            <td className="col-num" style={{ color: "#dc2626" }}>
                              {r.high ? `${r.high.toLocaleString()} ${market === "kr" ? "원" : "$"}` : "-"}
                            </td>
                            <td className="col-num" style={{ color: "#2563eb" }}>
                              {r.low ? `${r.low.toLocaleString()} ${market === "kr" ? "원" : "$"}` : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
