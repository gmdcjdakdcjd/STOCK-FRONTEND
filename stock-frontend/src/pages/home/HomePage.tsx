import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import IndicatorCard from "../stockIndex/stockIndex";
import { useIndicatorData } from "../stockIndex/useStockIndexData";
import { useIndicatorData as usePhysicalData } from "../physical/usePhysicalData";
import { useIndicatorData as useExchangeData } from "../exchange/useExchangeData";
import { INDICATOR_COLORS } from "../stockIndex/stockIndexColors";
import { getScreenerConditions, runScreenerWithFilters } from "../../api/screenerApi";
import { fetchKodexHoldings } from "../../api/kodexApi";
import { fetchTigerHoldings } from "../../api/tigerApi";
import InvestorTrendCard from "./InvestorTrendCard";
import "./HomePage.css";

// 볼 수 있는 지수들의 키 정의
type IndexKey = "snp500" | "nasdaq" | "kospi" | "kosdaq";

// 조건식 상세 종목 행 타입 정의
type DetailRow = {
  code: string;
  name: string;
  price: number;
  prevClose: number;
  diff: number;
  volume: number;
  createdAt: string;
};

// 조건식 카드 데이터 타입 정의
type StrategyCardData = {
  code: string;
  label: string;
  date: string;
  items: DetailRow[];
};

// 조건식 필터 영문 키 -> 한글 라벨 변환 맵 정의
const FILTER_LABEL_MAP: Record<string, string> = {
  DAILY_DROP_SPIKE: "급락 스파이크",
  DAILY_RISE_SPIKE: "급등 스파이크",
  DAILY_120D_NEW_HIGH: "120일 신고가",
  DAILY_120D_NEW_LOW: "120일 신저가",
  WEEKLY_52W_NEW_HIGH: "52주 신고가",
  WEEKLY_52W_NEW_LOW: "52주 신저가",
  DAILY_BB_LOWER_TOUCH: "BB 하단 터치",
  DAILY_BB_UPPER_TOUCH: "BB 상단 터치",
  WEEKLY_BB_LOWER_TOUCH: "주봉 BB 하단 터치",
  WEEKLY_BB_UPPER_TOUCH: "주봉 BB 상단 터치",
  RSI_30_UNHEATED: "RSI 30 이하",
  RSI_70_OVERHEATED: "RSI 70 이상",
  RSI_30_UNHEATED_WEEKLY: "주봉 RSI 30 이하",
  RSI_70_OVERHEATED_WEEKLY: "주봉 RSI 70 이상",
  DAILY_TOUCH_MA20: "20일선 터치",
  DAILY_TOUCH_MA60: "60일선 터치",
  DAILY_TOUCH_MA120: "120일선 터치",
  WEEKLY_TOUCH_MA20: "20주선 터치",
  WEEKLY_TOUCH_MA60: "60주선 터치",
  WEEKLY_TOUCH_MA120: "120주선 터치",
  
  // 순위 필터 그룹
  RANK_MARKET_CAP_10: "시총 상위 10",
  RANK_MARKET_CAP_30: "시총 상위 30",
  RANK_MARKET_CAP_50: "시총 상위 50",
  RANK_MARKET_CAP_100: "시총 상위 100",
  RANK_MARKET_CAP_200: "시총 상위 200",
  RANK_VOLUME_10: "거래량 상위 10",
  RANK_VOLUME_20: "거래량 상위 20",
  RANK_VOLUME_30: "거래량 상위 30",
  RANK_VOLUME_40: "거래량 상위 40",
  RANK_VOLUME_50: "거래량 상위 50",
  RANK_AMOUNT_10: "거래대금 상위 10",
  RANK_AMOUNT_30: "거래대금 상위 30",
  RANK_AMOUNT_50: "거래대금 상위 50",
  RANK_AMOUNT_100: "거래대금 상위 100",
  RANK_AMOUNT_200: "거래대금 상위 200",
  PRICE_CHANGE_UP: "주가 상승",
  PRICE_CHANGE_DOWN: "주가 하락"
};

// 조건식에 선택된 상세 조건 목록을 한글 요약 배열 리스트로 가공해주는 헬퍼 함수
const getConditionSummaryList = (cond: any): string[] => {
  const summaryList: string[] = [];

  // 1. 일반 지표 필터 파싱
  if (cond.filters && Array.isArray(cond.filters)) {
    cond.filters.forEach((f: string) => {
      const cleanKey = f.replace(/_(KR|US)$/i, "");
      if (FILTER_LABEL_MAP[cleanKey]) {
        summaryList.push(FILTER_LABEL_MAP[cleanKey]);
      }
    });
  }

  // 2. 선택된 ETF 필터명 파싱 (KODEX, TIGER 접두사 정제)
  if (cond.selectedEtfs && Array.isArray(cond.selectedEtfs)) {
    cond.selectedEtfs.forEach((etf: any) => {
      const cleanEtfName = etf.etfName 
        ? etf.etfName.replace(/TIGER|KODEX/gi, "").trim() 
        : etf.etfId;
      summaryList.push(`ETF: ${cleanEtfName}`);
    });
  }

  return summaryList;
};

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 로그인 상태 확인 및 유저 정보 보관
  const [authenticated, setAuthenticated] = useState(false);

  // 지수 API 데이터 조회
  const { data: indexData, loading: indexLoading, error: indexError } = useIndicatorData();

  // 실물자산 API 데이터 조회
  const { data: physicalData, loading: physicalLoading, error: physicalError } = usePhysicalData();

  // 환율 API 데이터 조회
  const { data: exchangeData, loading: exchangeLoading, error: exchangeError } = useExchangeData();

  // 현재 선택된 지수 상태 (기본값: KOSPI)
  const [selectedIndex, setSelectedIndex] = useState<IndexKey>("kospi");
  
  // 지수 선택 탭 마우스 호버 상태 관리
  const [hoveredIndex, setHoveredIndex] = useState<IndexKey | null>(null);

  // 조건식 시장(한국/미국) 선택 상태 (기본값: KR)
  const [selectedMarket, setSelectedMarket] = useState<"KR" | "US">("KR");
  const [hoveredMarket, setHoveredMarket] = useState<"KR" | "US" | null>(null);

  // 4대 한국 조건식 상태 및 로딩 관리
  const [strategyCardsKr, setStrategyCardsKr] = useState<StrategyCardData[]>([]);
  const [cardsLoadingKr, setCardsLoadingKr] = useState(true);

  // 4대 미국 조건식 상태 및 로딩 관리
  const [strategyCardsUs, setStrategyCardsUs] = useState<StrategyCardData[]>([]);
  const [cardsLoadingUs, setCardsLoadingUs] = useState(true);

  // 나만의 조건식 상태 관리
  const [myConditions, setMyConditions] = useState<any[]>([]);
  const [selectedMyCondIndex, setSelectedMyCondIndex] = useState<number>(-1);
  const [myCondItems, setMyCondItems] = useState<any[]>([]);
  const [myCondLoading, setMyCondLoading] = useState(false);
  const [myCondsListLoading, setMyCondsListLoading] = useState(false);
  const [hoveredMyCondIdx, setHoveredMyCondIdx] = useState<number | null>(null);

  // 커스텀 토스트 알림 상태 관리
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // 지수 키에 따른 한글/영문 표시용 타이틀 맵핑
  const titleMapping: Record<IndexKey, string> = {
    snp500: "S&P 500",
    nasdaq: "NASDAQ",
    kospi: "KOSPI",
    kosdaq: "KOSDAQ",
  };

  // 4대 타겟 조건식 - 한국 (순서: 신고가 -> 거래량 -> 급등 -> 급락)
  const TARGET_STRATEGIES_KR = [
    { code: "DAILY_120D_NEW_HIGH_KR", label: "120일 신고가" },
    { code: "DAILY_TOP20_VOLUME_KR", label: "거래량 Top 20" },
    { code: "DAILY_RISE_SPIKE_KR", label: "급등 스파이크" },
    { code: "DAILY_DROP_SPIKE_KR", label: "급락 스파이크" }
  ];

  // 4대 타겟 조건식 - 미국 (순서: 신고가 -> 거래량 -> 급등 -> 급락)
  const TARGET_STRATEGIES_US = [
    { code: "DAILY_120D_NEW_HIGH_US", label: "120일 신고가" },
    { code: "DAILY_TOP20_VOLUME_US", label: "거래량 Top 20" },
    { code: "DAILY_RISE_SPIKE_US", label: "급등 스파이크" },
    { code: "DAILY_DROP_SPIKE_US", label: "급락 스파이크" }
  ];

  // 0. 로그인 확인 API 호출
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false));
  }, [location]);

  // 1. 한국 조건식 포착 종목 데이터 수집 Effect
  useEffect(() => {
    setCardsLoadingKr(true);
    const fetchPromises = TARGET_STRATEGIES_KR.map(async (strat) => {
      try {
        // 1. 해당 전략의 신호 리스트에서 가장 최신 signalDate 조회
        const listRes = await fetch(`/api/result/kr?strategy=${strat.code}&page=1&size=5`);
        if (!listRes.ok) throw new Error();
        const listData = await listRes.json();
        const dtoList = listData.response?.dtoList || [];
        
        if (dtoList.length === 0) {
          return { code: strat.code, label: strat.label, date: "-", items: [] };
        }
        
        // 최신 시그널 날짜 획득
        const latestDate = dtoList[0].signalDate;
        
        // 2. 최신 날짜 기준 상세 포착 종목 리스트 조회
        const detailRes = await fetch(`/api/result/kr/detail?strategy=${strat.code}&date=${latestDate}`);
        if (!detailRes.ok) throw new Error();
        const detailData = await detailRes.json();
        let detailList: DetailRow[] = detailData.detailList || [];
        
        // 정렬 규칙 분기
        if (strat.code === "DAILY_TOP20_VOLUME_KR") {
          detailList.sort((a, b) => b.volume - a.volume);
        } else if (strat.code === "DAILY_DROP_SPIKE_KR") {
          // 급락 스파이크의 경우 하락폭이 가장 큰 종목(음수 등락률이 가장 낮은 순)으로 오름차순 정렬합니다.
          detailList.sort((a, b) => {
            const rateA = a.prevClose ? ((a.price - a.prevClose) / a.prevClose) * 100 : 0;
            const rateB = b.prevClose ? ((b.price - b.prevClose) / b.prevClose) * 100 : 0;
            return rateA - rateB;
          });
        } else {
          detailList.sort((a, b) => {
            const rateA = a.prevClose ? ((a.price - a.prevClose) / a.prevClose) * 100 : 0;
            const rateB = b.prevClose ? ((b.price - b.prevClose) / b.prevClose) * 100 : 0;
            return rateB - rateA;
          });
        }
        
        return {
          code: strat.code,
          label: strat.label,
          date: latestDate,
          items: detailList.slice(0, 5) // 상위 5개 추출
        };
      } catch (err) {
        console.error(`KR ${strat.label} 수집 실패:`, err);
        return { code: strat.code, label: strat.label, date: "-", items: [] };
      }
    });

    Promise.all(fetchPromises)
      .then((results) => {
        setStrategyCardsKr(results);
        setCardsLoadingKr(false);
      })
      .catch((err) => {
        console.error("KR 전략 수집 에러:", err);
        setCardsLoadingKr(false);
      });
  }, []);

  // 2. 미국 조건식 포착 종목 데이터 수집 Effect
  useEffect(() => {
    setCardsLoadingUs(true);
    const fetchPromises = TARGET_STRATEGIES_US.map(async (strat) => {
      try {
        // 1. 해당 전략의 신호 리스트에서 가장 최신 signalDate 조회
        const listRes = await fetch(`/api/result/us?strategy=${strat.code}&page=1&size=5`);
        if (!listRes.ok) throw new Error();
        const listData = await listRes.json();
        const dtoList = listData.response?.dtoList || [];
        
        if (dtoList.length === 0) {
          return { code: strat.code, label: strat.label, date: "-", items: [] };
        }
        
        // 최신 시그널 날짜 획득
        const latestDate = dtoList[0].signalDate;
        
        // 2. 최신 날짜 기준 상세 포착 종목 리스트 조회
        const detailRes = await fetch(`/api/result/us/detail?strategy=${strat.code}&date=${latestDate}`);
        if (!detailRes.ok) throw new Error();
        const detailData = await detailRes.json();
        let detailList: DetailRow[] = detailData.detailList || [];
        
        // 정렬 규칙 분기
        if (strat.code === "DAILY_TOP20_VOLUME_US") {
          detailList.sort((a, b) => b.volume - a.volume);
        } else if (strat.code === "DAILY_DROP_SPIKE_US") {
          // 급락 스파이크의 경우 하락폭이 가장 큰 종목(음수 등락률이 가장 낮은 순)으로 오름차순 정렬합니다.
          detailList.sort((a, b) => {
            const rateA = a.prevClose ? ((a.price - a.prevClose) / a.prevClose) * 100 : 0;
            const rateB = b.prevClose ? ((b.price - b.prevClose) / b.prevClose) * 100 : 0;
            return rateA - rateB;
          });
        } else {
          detailList.sort((a, b) => {
            const rateA = a.prevClose ? ((a.price - a.prevClose) / a.prevClose) * 100 : 0;
            const rateB = b.prevClose ? ((b.price - b.prevClose) / b.prevClose) * 100 : 0;
            return rateB - rateA;
          });
        }
        
        return {
          code: strat.code,
          label: strat.label,
          date: latestDate,
          items: detailList.slice(0, 5) // 상위 5개 추출
        };
      } catch (err) {
        console.error(`US ${strat.label} 수집 실패:`, err);
        return { code: strat.code, label: strat.label, date: "-", items: [] };
      }
    });

    Promise.all(fetchPromises)
      .then((results) => {
        setStrategyCardsUs(results);
        setCardsLoadingUs(false);
      })
      .catch((err) => {
        console.error("US 전략 수집 에러:", err);
        setCardsLoadingUs(false);
      });
  }, []);

  // 3. 나만의 조건식 리스트 수집 Effect
  useEffect(() => {
    if (!authenticated) {
      setMyConditions([]);
      setSelectedMyCondIndex(-1);
      return;
    }
    setMyCondsListLoading(true);
    getScreenerConditions()
      .then((data) => {
        const list = data || [];
        setMyConditions(list);
        if (list.length > 0) {
          setSelectedMyCondIndex(0);
        }
      })
      .catch((err) => {
        console.error("나만의 조건식 리스트 조회 실패:", err);
      })
      .finally(() => {
        setMyCondsListLoading(false);
      });
  }, [authenticated]);

  // 4. 선택된 나만의 조건식의 포착 종목 스크리닝 실행 Effect
  useEffect(() => {
    if (selectedMyCondIndex < 0 || myConditions.length === 0) {
      setMyCondItems([]);
      return;
    }

    const runScreening = async () => {
      setMyCondLoading(true);
      const cond = myConditions[selectedMyCondIndex];
      
      // 런타임 에러 방지용 가드
      if (!cond) {
        setMyCondItems([]);
        setMyCondLoading(false);
        return;
      }

      try {
        // ETF 구성 종목 복원 로직 구현
        let etfCodes: string[] = [];
        if (cond.selectedEtfs && cond.selectedEtfs.length > 0) {
          const holdingsSet = new Set<string>();
          let isFirst = true;

          for (const etf of cond.selectedEtfs) {
            const fetchFunc = etf.etfId.startsWith("TIGER") || etf.etfName?.includes("TIGER")
              ? fetchTigerHoldings
              : fetchKodexHoldings;

            const rawHoldings = await fetchFunc(etf.etfId);
            const cleanCodes = rawHoldings.map((item: any) => item.stockCode);
            const currentHoldings = new Set<string>(cleanCodes);

            if (isFirst) {
              currentHoldings.forEach(code => holdingsSet.add(code));
              isFirst = false;
            } else {
              holdingsSet.forEach(code => {
                if (!currentHoldings.has(code)) {
                  holdingsSet.delete(code);
                }
              });
            }
          }
          etfCodes = Array.from(holdingsSet);
        }

        // 스크리너 필터 실행 API 호출
        const searchRes = await runScreenerWithFilters(cond.filters || [], etfCodes, cond.market || "kr");
        const list = searchRes && Array.isArray(searchRes.data) ? searchRes.data : [];
        
        // 등락률(changeRate) 기준 내림차순(Desc) 정렬 후 스크리닝된 전체 종목 노출
        list.sort((a: any, b: any) => {
          const rateA = a.changeRate ?? a.rate ?? a.change_rate ?? 0;
          const rateB = b.changeRate ?? b.rate ?? b.change_rate ?? 0;
          return rateB - rateA;
        });
        setMyCondItems(list);
      } catch (err) {
        console.error("나만의 조건식 종목 스크리닝 실패:", err);
        setMyCondItems([]);
      } finally {
        setMyCondLoading(false);
      }
    };

    runScreening();
  }, [selectedMyCondIndex, myConditions]);

  // 커스텀 토스트 트리거 헬퍼
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // 비로그인 회원 대상 마이페이지 링크 클릭 차단 및 알림 헬퍼
  const handleMyPageLinkClick = (path: string) => {
    if (!authenticated) {
      showToast("💡 로그인 또는 회원가입이 필요합니다.", "error");
    } else {
      navigate(path);
    }
  };

  // 선택된 지수에 해당하는 실시간 데이터 조회
  const getSelectedData = () => {
    if (!indexData) return [];
    switch (selectedIndex) {
      case "snp500":
        return indexData.snp500;
      case "nasdaq":
        return indexData.nasdaq;
      case "kospi":
        return indexData.kospi;
      case "kosdaq":
        return indexData.kosdaq;
      default:
        return [];
    }
  };

  // 지수 탭 버튼 스타일 획득 헬퍼
  const getIndexLegendStyle = (key: IndexKey) => {
    const isActive = selectedIndex === key;
    const isHovered = hoveredIndex === key;

    if (!isActive && !isHovered) {
      return {
        backgroundColor: "transparent",
        color: "#4B5563",
        padding: "4px 10px",
        borderRadius: "6px",
        fontSize: "0.8rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.18s ease"
      };
    }

    const baseColor = INDICATOR_COLORS[key].border;
    const bg = `${baseColor}1a`;

    return {
      backgroundColor: bg,
      color: baseColor,
      padding: "4px 10px",
      borderRadius: "6px",
      fontSize: "0.8rem",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.18s ease"
    };
  };

  // 조건식 시장(한국/미국) 탭 버튼 스타일 획득 헬퍼
  const getMarketTabStyle = (market: "KR" | "US") => {
    const isActive = selectedMarket === market;
    const isHovered = hoveredMarket === market;

    if (!isActive && !isHovered) {
      return {
        backgroundColor: "transparent",
        color: "#475569",
        padding: "4px 12px",
        borderRadius: "6px",
        fontSize: "0.8rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.18s ease"
      };
    }

    const baseColor = "#3b82f6";
    const bg = `${baseColor}1a`;

    return {
      backgroundColor: bg,
      color: baseColor,
      padding: "4px 12px",
      borderRadius: "6px",
      fontSize: "0.8rem",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.18s ease"
    };
  };

  // 나만의 조건식 세로형 탭 스타일 획득 헬퍼
  const getMyCondTabStyle = (idx: number) => {
    const isActive = selectedMyCondIndex === idx;
    const isHovered = hoveredMyCondIdx === idx;

    if (!isActive && !isHovered) {
      return {
        backgroundColor: "transparent",
        color: "#475569",
        padding: "12px 14px",
        borderRadius: "8px",
        fontSize: "0.8rem",
        fontWeight: "600",
        cursor: "pointer",
        display: "block",
        width: "100%",
        textAlign: "left" as const,
        marginBottom: "6px",
        border: "1px solid transparent",
        transition: "all 0.15s ease"
      };
    }

    const baseColor = "#3b82f6";
    const bg = `${baseColor}10`;

    return {
      backgroundColor: bg,
      color: baseColor,
      padding: "12px 14px",
      borderRadius: "8px",
      fontSize: "0.8rem",
      fontWeight: "700",
      cursor: "pointer",
      display: "block",
      width: "100%",
      textAlign: "left" as const,
      marginBottom: "6px",
      border: `1px solid ${baseColor}30`,
      transition: "all 0.15s ease"
    };
  };

  // 지수 카드 헤더 우측에 심어줄 탭 선택기 노드 정의
  const indexSelectorNode = (
    <div style={{ display: "flex", gap: "4px", marginRight: "12px", alignItems: "center" }}>
      {(["kospi", "kosdaq", "snp500", "nasdaq"] as IndexKey[]).map((key) => (
        <span
          key={key}
          style={getIndexLegendStyle(key)}
          onMouseEnter={() => setHoveredIndex(key)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => setSelectedIndex(key)}
        >
          {titleMapping[key]}
        </span>
      ))}
    </div>
  );

  // 가장 최신 데이터의 가격, 전일대비, 등락률을 파싱하는 자산 카드 전용 헬퍼 함수
  const getAssetDetails = (indicatorData?: any[], type?: string) => {
    if (!indicatorData || indicatorData.length === 0) return null;
    const last = indicatorData.at(-1);
    const prev = indicatorData.length > 1 ? indicatorData.at(-2) : null;
    
    if (!last) return null;

    const close = last.close;
    const diff = prev ? close - prev.close : 0;
    const rate = prev ? (diff / prev.close) * 100 : 0;

    // 유형별 포맷팅
    let formattedPrice = "";
    if (type === "usd" || type === "jpy") {
      formattedPrice = `${close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}원`;
    } else if (type === "wti" || type === "dubai" || type === "gold_global") {
      formattedPrice = `$${close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (type === "gold_kr") {
      formattedPrice = `${close.toLocaleString()}원`;
    } else {
      formattedPrice = close.toLocaleString();
    }

    return {
      date: last.date,
      close: formattedPrice,
      diff,
      rate,
      isUp: diff > 0,
      isDown: diff < 0
    };
  };

  // 6개 카드 대상 데이터 세팅
  const wti = getAssetDetails(physicalData?.WTI, "wti");
  const dubai = getAssetDetails(physicalData?.DUBAI, "dubai");
  const goldKr = getAssetDetails(physicalData?.GOLD_KR, "gold_kr");
  const goldGlobal = getAssetDetails(physicalData?.GOLD_GLOBAL, "gold_global");
  const usd = getAssetDetails(exchangeData?.usd, "usd");
  const jpy = getAssetDetails(exchangeData?.jpy, "jpy");

  // 전체 로딩 상태 결합
  const isGlobalLoading = indexLoading || physicalLoading || exchangeLoading;

  // 전체 에러 상태 결합
  const hasGlobalError = indexError || physicalError || exchangeError;

  return (
    <div className="container mt-4">
      {/* 메인 단일 차트 컨테이너 영역 */}
      <main className="home-single-chart-content" style={{ padding: "0 0 24px 0" }}>
        {isGlobalLoading ? (
          <div className="home-loading-fallback">
            <div className="loading-spinner"></div>
            <p className="loading-text">금융 자산 및 지수 데이터를 수집하고 있습니다...</p>
          </div>
        ) : hasGlobalError || !indexData ? (
          <div className="home-error-fallback">
            <div className="no-data-icon">⚠️</div>
            <p className="error-text">대시보드 데이터를 불러오는 데 실패했습니다.</p>
            <p className="error-sub">네트워크 연결 상태를 확인한 후 다시 시도해 주세요.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>

            {/* 상단 7:3 레이아웃 구역 */}
            <div className="home-main-layout-grid">
              {/* 좌측 7 구역 (차트 판넬) */}
              <div className="home-left-charts-panel">
                <div className="home-single-chart-wrapper">
                  <IndicatorCard
                    title={titleMapping[selectedIndex]}
                    data={getSelectedData()}
                    colorKey={selectedIndex}
                    hideRangeSelector={true}
                    indexSelector={indexSelectorNode}
                  />
                </div>

                <div className="home-single-chart-wrapper">
                  <InvestorTrendCard />
                </div>
              </div>

              {/* 우측 3 구역 (실물자산 및 환율 미니 대시보드) */}
              <div className="home-right-side-panel">
                <div className="home-side-grid">

                  {/* 1. USD/KRW 환율 */}
                  {usd && (
                    <div className="side-asset-card">
                      <div className="asset-card-title">USD / KRW 환율</div>
                      <div className="asset-card-value">{usd.close}</div>
                      <div className={`asset-card-trend ${usd.isUp ? "trend-up" : usd.isDown ? "trend-down" : "trend-flat"}`}>
                        {usd.isUp ? "▲" : usd.isDown ? "▼" : "-"} {Math.abs(usd.rate).toFixed(2)}%
                      </div>
                      <div className="asset-card-date">{usd.date} 기준</div>
                    </div>
                  )}

                  {/* 2. JPY/KRW 환율 */}
                  {jpy && (
                    <div className="side-asset-card">
                      <div className="asset-card-title">JPY / KRW 환율</div>
                      <div className="asset-card-value">{jpy.close}</div>
                      <div className={`asset-card-trend ${jpy.isUp ? "trend-up" : jpy.isDown ? "trend-down" : "trend-flat"}`}>
                        {jpy.isUp ? "▲" : jpy.isDown ? "▼" : "-"} {Math.abs(jpy.rate).toFixed(2)}%
                      </div>
                      <div className="asset-card-date">{jpy.date} 기준</div>
                    </div>
                  )}

                  {/* 3. WTI 원유 */}
                  {wti && (
                    <div className="side-asset-card">
                      <div className="asset-card-title">WTI 원유</div>
                      <div className="asset-card-value">{wti.close}</div>
                      <div className={`asset-card-trend ${wti.isUp ? "trend-up" : wti.isDown ? "trend-down" : "trend-flat"}`}>
                        {wti.isUp ? "▲" : wti.isDown ? "▼" : "-"} {Math.abs(wti.rate).toFixed(2)}%
                      </div>
                      <div className="asset-card-date">{wti.date} 기준</div>
                    </div>
                  )}

                  {/* 4. 두바이유 */}
                  {dubai && (
                    <div className="side-asset-card">
                      <div className="asset-card-title">두바이유</div>
                      <div className="asset-card-value">{dubai.close}</div>
                      <div className={`asset-card-trend ${dubai.isUp ? "trend-up" : dubai.isDown ? "trend-down" : "trend-flat"}`}>
                        {dubai.isUp ? "▲" : dubai.isDown ? "▼" : "-"} {Math.abs(dubai.rate).toFixed(2)}%
                      </div>
                      <div className="asset-card-date">{dubai.date} 기준</div>
                    </div>
                  )}

                  {/* 5. 국내 금 */}
                  {goldKr && (
                    <div className="side-asset-card">
                      <div className="asset-card-title">국내 금 (KRW/g)</div>
                      <div className="asset-card-value">{goldKr.close}</div>
                      <div className={`asset-card-trend ${goldKr.isUp ? "trend-up" : goldKr.isDown ? "trend-down" : "trend-flat"}`}>
                        {goldKr.isUp ? "▲" : goldKr.isDown ? "▼" : "-"} {Math.abs(goldKr.rate).toFixed(2)}%
                      </div>
                      <div className="asset-card-date">{goldKr.date} 기준</div>
                    </div>
                  )}

                  {/* 6. 국제 금 */}
                  {goldGlobal && (
                    <div className="side-asset-card">
                      <div className="asset-card-title">국제 금 (USD/T.oz)</div>
                      <div className="asset-card-value">{goldGlobal.close}</div>
                      <div className={`asset-card-trend ${goldGlobal.isUp ? "trend-up" : goldGlobal.isDown ? "trend-down" : "trend-flat"}`}>
                        {goldGlobal.isUp ? "▲" : goldGlobal.isDown ? "▼" : "-"} {Math.abs(goldGlobal.rate).toFixed(2)}%
                      </div>
                      <div className="asset-card-date">{goldGlobal.date} 기준</div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* 하단 통합 조건식 포착 종목 영역 */}
            <div className="home-strategy-section">
              <div className="home-strategy-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div className="home-strategy-section-title" style={{ marginBottom: 0 }}>
                  🔥 조건식 포착 종목 (Top 5)
                </div>

                {/* 한국/미국 선택 스위처 탭 */}
                <div style={{ display: "flex", gap: "4px", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  {(["KR", "US"] as const).map((m) => (
                    <span
                      key={m}
                      style={getMarketTabStyle(m)}
                      onMouseEnter={() => setHoveredMarket(m)}
                      onMouseLeave={() => setHoveredMarket(null)}
                      onClick={() => setSelectedMarket(m)}
                    >
                      {m === "KR" ? "한국 주식" : "미국 주식"}
                    </span>
                  ))}
                </div>
              </div>

              {selectedMarket === "KR" ? (
                cardsLoadingKr ? (
                  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
                    <span>국내 포착 종목 데이터를 실시간 연동 중입니다...</span>
                  </div>
                ) : (
                  <div className="home-strategy-grid">
                    {strategyCardsKr.map((card) => (
                      <div key={card.code} className="strategy-list-card">
                        <div
                          className="strategy-card-header"
                          onClick={() => navigate(`/result/detailKR?strategy=${card.code}&date=${card.date}`)}
                          style={{ cursor: "pointer" }}
                          title="클릭 시 조건식 날짜별 상세 페이지로 이동"
                        >
                          <span className="strategy-card-title">{card.label}</span>
                          <span className="strategy-card-date-badge">{card.date}</span>
                        </div>
                        <div className="strategy-card-body">
                          {card.items.length === 0 ? (
                            <div className="empty-strategy-placeholder">
                              <span>오늘 포착된 종목이 없습니다.</span>
                            </div>
                          ) : (
                            <table className="strategy-mini-table">
                              <thead>
                                <tr>
                                  <th>종목명</th>
                                  <th style={{ textAlign: "right" }}>현재가</th>
                                  <th style={{ textAlign: "right" }}>
                                    {card.code === "DAILY_TOP20_VOLUME_KR" ? "거래량" : "등락률"}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {card.items.map((item) => {
                                  const priceDiff = item.price - item.prevClose;
                                  const rate = item.prevClose ? (priceDiff / item.prevClose) * 100 : 0;
                                  const isUp = priceDiff > 0;
                                  const isDown = priceDiff < 0;

                                  return (
                                    <tr key={item.code}>
                                      <td
                                        className="strat-td-name"
                                        onClick={() =>
                                          navigate(
                                            `/stock/searchStock?code=${encodeURIComponent(item.code)}&name=${encodeURIComponent(item.name)}`
                                          )
                                        }
                                        style={{ cursor: "pointer" }}
                                        title="클릭 시 종목 상세 검색으로 이동"
                                      >
                                        {item.name}
                                      </td>
                                      <td className="strat-td-price" style={{ textAlign: "right" }}>
                                        {item.price.toLocaleString()}원
                                      </td>
                                      {card.code === "DAILY_TOP20_VOLUME_KR" ? (
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
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                cardsLoadingUs ? (
                  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
                    <span>미국 포착 종목 데이터를 실시간 연동 중입니다...</span>
                  </div>
                ) : (
                  <div className="home-strategy-grid">
                    {strategyCardsUs.map((card) => (
                      <div key={card.code} className="strategy-list-card">
                        <div
                          className="strategy-card-header"
                          onClick={() => navigate(`/result/detailUS?strategy=${card.code}&date=${card.date}`)}
                          style={{ cursor: "pointer" }}
                          title="클릭 시 조건식 날짜별 상세 페이지로 이동"
                        >
                          <span className="strategy-card-title">{card.label}</span>
                          <span className="strategy-card-date-badge">{card.date}</span>
                        </div>
                        <div className="strategy-card-body">
                          {card.items.length === 0 ? (
                            <div className="empty-strategy-placeholder">
                              <span>오늘 포착된 종목이 없습니다.</span>
                            </div>
                          ) : (
                            <table className="strategy-mini-table">
                              <thead>
                                <tr>
                                  <th>종목명</th>
                                  <th style={{ textAlign: "right" }}>현재가</th>
                                  <th style={{ textAlign: "right" }}>
                                    {card.code === "DAILY_TOP20_VOLUME_US" ? "거래량" : "등락률"}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {card.items.map((item) => {
                                  const priceDiff = item.price - item.prevClose;
                                  const rate = item.prevClose ? (priceDiff / item.prevClose) * 100 : 0;
                                  const isUp = priceDiff > 0;
                                  const isDown = priceDiff < 0;

                                  return (
                                    <tr key={item.code}>
                                      <td
                                        className="strat-td-name"
                                        onClick={() =>
                                          navigate(
                                            `/stock/searchStock?code=${encodeURIComponent(item.code)}&name=${encodeURIComponent(item.name)}`
                                          )
                                        }
                                        style={{ cursor: "pointer" }}
                                        title="클릭 시 종목 상세 검색으로 이동"
                                      >
                                        {item.name}
                                      </td>
                                      <td className="strat-td-price" style={{ textAlign: "right" }}>
                                        {item.price.toLocaleString()} $
                                      </td>
                                      {card.code === "DAILY_TOP20_VOLUME_US" ? (
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
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* 최하단 나만의 조건식 섹션 */}
            <div className="home-strategy-section" style={{ marginTop: "12px" }}>
              <div className="home-strategy-section-title" style={{ marginBottom: "16px" }}>
                🔥 나만의 조건식 관제
              </div>

              {!authenticated ? (
                // 1. 미로그인 상태 (카드 상자 프레임은 보여주되 본문에 안내 문구 렌더링)
                <div className="strategy-list-card" style={{ width: "100%" }}>
                  <div className="strategy-card-header">
                    <span className="strategy-card-title">🎯 나만의 조건식 (미로그인)</span>
                    <span className="strategy-card-date-badge">로그인 필요</span>
                  </div>
                  <div className="strategy-card-body" style={{ padding: "16px 20px" }}>
                    <div
                      className="empty-strategy-placeholder"
                      style={{
                        minHeight: "160px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                        fontSize: "0.85rem",
                        color: "#64748b",
                        fontWeight: "600"
                      }}
                    >
                      <span>💡 회원가입 또는 로그인 이후 나만의 조건식을 만들면 보여집니다.</span>
                      <button 
                        className="btn-outline-pill" 
                        onClick={() => navigate("/login")}
                        style={{ padding: "6px 20px", fontSize: "0.8rem", height: "auto", cursor: "pointer" }}
                      >
                        로그인 하기
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // 2. 로그인 상태
                <>
                  {myCondsListLoading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "160px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
                      <span>나만의 조건식 리스트를 조회하고 있습니다...</span>
                    </div>
                  ) : myConditions.length === 0 ? (
                    // 저장한 조건식이 전혀 없는 경우
                    <div
                      className="my-condition-empty-card"
                      style={{
                        display: "flex", 
                        flexDirection: "column",
                        alignItems: "center", 
                        justifyContent: "center", 
                        padding: "40px 24px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        gap: "12px",
                        textAlign: "center"
                      }}
                    >
                      <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>
                        아직 저장된 나만의 조건식이 없습니다. 나만의 필터를 구성하고 조건식을 저장해 보세요!
                      </span>
                      <button 
                        className="btn-outline-pill" 
                        onClick={() => navigate("/stock/myCondition")}
                        style={{ padding: "6px 16px", fontSize: "0.8rem", height: "auto" }}
                      >
                        나만의 조건식 만들기
                      </button>
                    </div>
                  ) : (
                    // 저장한 조건식이 있고 결과 로드된 경우 (7:3 수평 분할 레이아웃 적용)
                    <div className="home-main-layout-grid">
                      
                      {/* 좌측 7 구역 (선택된 조건식의 종목 포착 결과 테이블 카드) */}
                      <div className="home-left-charts-panel">
                        <div 
                          className="strategy-list-card" 
                          style={{ 
                            width: "100%", 
                            height: "480px", 
                            display: "flex", 
                            flexDirection: "column",
                            boxSizing: "border-box" 
                          }}
                        >
                          <div 
                            className="strategy-card-header"
                            onClick={() => {
                              const cond = myConditions[selectedMyCondIndex];
                              if (cond && cond.id) {
                                navigate(`/stock/myCondition?id=${cond.id}`);
                              } else {
                                navigate("/stock/myCondition");
                              }
                            }}
                            style={{ cursor: "pointer", flexShrink: 0 }}
                            title="클릭 시 나만의 조건식 편집 페이지로 이동"
                          >
                            <span className="strategy-card-title">
                              🎯 {myConditions[selectedMyCondIndex]?.name.replace(/_(KR|US)$/i, "")} ({myConditions[selectedMyCondIndex]?.market === "us" ? "미국 시장" : "한국 시장"})
                            </span>
                            <span className="strategy-card-date-badge">스크리닝 결과</span>
                          </div>
                          
                          <div 
                            className="strategy-card-body" 
                            style={{ 
                              padding: "16px 20px", 
                              flex: 1, 
                              display: "flex", 
                              flexDirection: "column", 
                              minHeight: 0,
                              boxSizing: "border-box"
                            }}
                          >
                            {myCondLoading ? (
                              <div className="d-flex justify-content-center align-items-center" style={{ flex: 1 }}>
                                <span>포착 종목 리스트를 분석하고 있습니다...</span>
                              </div>
                            ) : myCondItems.length === 0 ? (
                              <div className="empty-strategy-placeholder" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span>조건식 검색 기준을 만족하는 종목이 없습니다.</span>
                              </div>
                            ) : (
                              <div style={{ flex: 1, overflowY: "auto", width: "100%" }}>
                                <table className="strategy-mini-table">
                                  <colgroup>
                                    <col style={{ width: "14%" }} />
                                    <col style={{ width: "22%" }} />
                                    <col style={{ width: "16%" }} />
                                    <col style={{ width: "16%" }} />
                                    <col style={{ width: "16%" }} />
                                    <col style={{ width: "16%" }} />
                                  </colgroup>
                                  <thead>
                                    <tr>
                                      <th style={{ textAlign: "left" }}>종목코드</th>
                                      <th style={{ textAlign: "left" }}>종목명</th>
                                      <th style={{ textAlign: "right" }}>현재가(종가)</th>
                                      <th style={{ textAlign: "right" }}>고가</th>
                                      <th style={{ textAlign: "right" }}>저가</th>
                                      <th style={{ textAlign: "right" }}>거래량</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {myCondItems.map((item: any) => {
                                      const isUs = myConditions[selectedMyCondIndex]?.market === "us";
                                      const currencySymbol = isUs ? " $" : "원";

                                      return (
                                        <tr key={item.code}>
                                          <td style={{ color: "#64748b", fontWeight: "600", textAlign: "left" }}>{item.code}</td>
                                          <td
                                            className="strat-td-name"
                                            onClick={() =>
                                              navigate(
                                                `/stock/searchStock?code=${encodeURIComponent(item.code)}&name=${encodeURIComponent(item.name)}`
                                              )
                                            }
                                            style={{ cursor: "pointer", textAlign: "left" }}
                                            title="클릭 시 종목 상세 검색으로 이동"
                                          >
                                            {item.name}
                                          </td>
                                          <td className="strat-td-price" style={{ textAlign: "right" }}>
                                            {item.currentPrice ? `${item.currentPrice.toLocaleString()}${currencySymbol}` : "-"}
                                          </td>
                                          <td style={{ textAlign: "right", color: "#475569" }}>
                                            {item.high ? `${item.high.toLocaleString()}${currencySymbol}` : "-"}
                                          </td>
                                          <td style={{ textAlign: "right", color: "#475569" }}>
                                            {item.low ? `${item.low.toLocaleString()}${currencySymbol}` : "-"}
                                          </td>
                                          <td style={{ textAlign: "right", color: "#475569" }}>
                                            {item.volume ? `${item.volume.toLocaleString()} 주` : "-"}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 우측 3 구역 (내가 저장한 조건식 리스트 - 세로 정렬 탭 버튼들) */}
                      <div className="home-right-side-panel">
                        <div 
                          className="strategy-list-card" 
                          style={{ 
                            width: "100%", 
                            height: "480px", 
                            border: "1px solid #e2e8f0", 
                            backgroundColor: "#ffffff",
                            padding: "20px 16px",
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column"
                          }}
                        >
                          <div 
                            style={{ 
                              fontSize: "0.85rem", 
                              fontWeight: "800", 
                              color: "#334155", 
                              marginBottom: "16px",
                              borderBottom: "1px solid #e2e8f0",
                              paddingBottom: "12px",
                              flexShrink: 0
                            }}
                          >
                            📁 내 조건식 목록
                          </div>
                          
                          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
                            {myConditions.map((cond, idx) => (
                              <button
                                key={cond.id}
                                style={getMyCondTabStyle(idx)}
                                onMouseEnter={() => setHoveredMyCondIdx(idx)}
                                onMouseLeave={() => setHoveredMyCondIdx(null)}
                                onClick={() => setSelectedMyCondIndex(idx)}
                              >
                                <div style={{ fontWeight: "700", marginBottom: "4px" }}>
                                  📝 {cond.name.replace(/_(KR|US)$/i, "")} ({cond.market === "us" ? "US" : "KR"})
                                </div>
                                <div 
                                  style={{ 
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "4px",
                                    marginTop: "6px"
                                  }}
                                  title={getConditionSummaryList(cond).join(", ")}
                                >
                                  {getConditionSummaryList(cond).length === 0 ? (
                                    <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>조건 없음</span>
                                  ) : (
                                    getConditionSummaryList(cond).map((tag, tIdx) => {
                                      const isSelected = selectedMyCondIndex === idx;
                                      return (
                                        <span
                                          key={tIdx}
                                          style={{
                                            fontSize: "0.6rem",
                                            fontWeight: "700",
                                            padding: "2px 6px",
                                            borderRadius: "4px",
                                            backgroundColor: isSelected ? "#3b82f6" : "#f1f5f9",
                                            color: isSelected ? "#ffffff" : "#475569",
                                            border: isSelected ? "1px solid #2563eb" : "1px solid #e2e8f0",
                                            display: "inline-block",
                                            lineHeight: "1.2"
                                          }}
                                        >
                                          {tag}
                                        </span>
                                      );
                                    })
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </>
              )}
            </div>

            {/* 최최하단 전체 서비스 바로가기 */}
            <div className="home-strategy-section" style={{ marginTop: "24px" }}>
              <div className="home-strategy-section-title" style={{ marginBottom: "16px" }}>
                🗺️ 전체 메뉴 바로가기
              </div>

              <div 
                className="strategy-list-card" 
                style={{ 
                  width: "100%", 
                  padding: "24px 32px",
                  boxSizing: "border-box"
                }}
              >
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "24px"
                }}>
                  {/* 1. 지수 구역 */}
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "#334155", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>📉 지수</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <span onClick={() => navigate("/stockIndex")} className="sitemap-link">증권 지수</span>
                      <span onClick={() => navigate("/exchange")} className="sitemap-link">환율 지수</span>
                      <span onClick={() => navigate("/physical")} className="sitemap-link">원자재 지수</span>
                      <span onClick={() => navigate("/crypto")} className="sitemap-link">코인 지수</span>
                    </div>
                  </div>

                  {/* 2. 주식 & 성과 구역 */}
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "#334155", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>📊 주식 & 성과</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <span onClick={() => navigate("/issue")} className="sitemap-link">이슈 종목</span>
                      <span onClick={() => navigate("/dualMomentumList")} className="sitemap-link">수익률 상위</span>
                      <span onClick={() => navigate("/stock/searchStock")} className="sitemap-link">종목 검색</span>
                      <span onClick={() => navigate("/result/listKR")} className="sitemap-link">시장 성과</span>
                    </div>
                  </div>

                  {/* 3. 데이터 탐색 구역 */}
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "#334155", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>🔍 데이터 탐색</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <span onClick={() => navigate("/kodex/summary")} className="sitemap-link">KODEX ETF</span>
                      <span onClick={() => navigate("/tiger/summary")} className="sitemap-link">TIGER ETF</span>
                      <span onClick={() => navigate("/marketCap")} className="sitemap-link">시가총액</span>
                      <span onClick={() => navigate("/nps/summary")} className="sitemap-link">연기금 현황</span>
                      <span onClick={() => navigate("/marketTrend")} className="sitemap-link">시장 매매 동향</span>
                    </div>
                  </div>

                  {/* 4. 마이페이지 구역 */}
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "#334155", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>👤 마이페이지</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <span onClick={() => handleMyPageLinkClick("/myetf/list")} className="sitemap-link">
                        내 ETF {!authenticated && <span onClick={(e) => { e.stopPropagation(); navigate("/login"); }} className="sitemap-lock-badge">로그인 필요</span>}
                      </span>
                      <span onClick={() => handleMyPageLinkClick("/stock/myStock")} className="sitemap-link">
                        내 관심 종목 {!authenticated && <span onClick={(e) => { e.stopPropagation(); navigate("/login"); }} className="sitemap-lock-badge">로그인 필요</span>}
                      </span>
                      <span onClick={() => handleMyPageLinkClick("/stock/myCondition")} className="sitemap-link">
                        나만의 조건식 {!authenticated && <span onClick={(e) => { e.stopPropagation(); navigate("/login"); }} className="sitemap-lock-badge">로그인 필요</span>}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* 커스텀 토스트 알림 메시지 팝업 */}
      {toast && (
        <div 
          className={`custom-toast toast-${toast.type}`} 
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: toast.type === "error" ? "#ef4444" : toast.type === "info" ? "#3b82f6" : "#22c55e",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
            fontSize: "0.85rem",
            fontWeight: "700",
            zIndex: 9999,
            transition: "all 0.3s ease"
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
