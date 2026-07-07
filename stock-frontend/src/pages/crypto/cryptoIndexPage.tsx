import IndicatorCard from "./cryptoIndex";
import { useIndicatorData } from "./useCryptoData";
import { type IndicatorKey } from "./cryptoIndexColors";
import "./cryptoIndex.css";

// 가상자산 지표 평탄화 정의: 5대 암호화폐 지표를 가로 5열 한 줄 대시보드로 구성하기 위해 나열합니다. (IndicatorKey 타입 바인딩)
const FLAT_CRYPTOS: { key: IndicatorKey; title: string; id: string }[] = [
  { key: "bitcoin", title: "BITCOIN", id: "bitcoin" },
  { key: "ethereum", title: "ETHEREUM", id: "ethereum" },
  { key: "solana", title: "SOLANA", id: "solana" },
  { key: "stablecoin", title: "STABLECOIN", id: "stablecoin" },
  { key: "binance", title: "BINANCE", id: "binance" }
];

export default function IndicatorPage() {
  const { data, loading } = useIndicatorData();

  if (loading) {
    return <div className="indicator-loading">가상자산 데이터를 불러오는 중입니다...</div>;
  }

  if (!data) {
    return <div className="indicator-error">데이터를 불러오지 못했습니다.</div>;
  }

  // 상단 요약 카드를 클릭했을 때 해당 차트로 부드럽게 스크롤 이동하는 함수입니다.
  const handleScrollToChart = (id: string) => {
    const targetElement = document.getElementById(id);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // 날짜 문자열을 MM.DD 포맷으로 초콤팩트하게 파싱해 줍니다. (가로폭 깨짐 방지)
  const formatIndicatorDate = (dateStr: string) => {
    if (!dateStr) return "";
    
    // 예: "2026-07-06 16:30:00" -> "07.06"
    // 대시보드 5열 가로 찌러짐 방지를 위해 월.일(MM.DD)만 슬림하게 뱉습니다.
    const match = dateStr.match(/-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}.${match[2]}`;
    }
    
    return dateStr;
  };

  return (
    <div className="indicator-page crypto-page">
      {/* =========================
          상단 가상자산 요약 카드 섹션 (5*1 격자형 버튼 대시보드 룩)
      ========================= */}
      <div className="exchange-summary-section">
        <h2 className="summary-section-title">오늘의 주요 가상자산</h2>
        
        <div className="summary-cards-grid">
          {FLAT_CRYPTOS.map(item => {
            const list = data[item.key as keyof typeof data];
            if (!list || list.length === 0) return null;

            const last = list[list.length - 1];
            const prev = list[list.length - 2];

            // 전일 대비 등락폭 및 등락율 계산
            const diff = last && prev ? last.close - prev.close : 0;
            const rate = last && prev ? (diff / prev.close) * 100 : 0;
            const isUp = diff > 0;
            const isDown = diff < 0;

            return (
              <div
                key={item.key}
                className="summary-card"
                onClick={() => handleScrollToChart(item.id)}
              >
                <span className="summary-card-title">{item.title}</span>
                <span className="summary-card-price">
                  {last.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                
                {/* 카드 내 등락 및 수신날짜 1줄 수평 정돈 레이아웃 컨테이너 */}
                <div className="summary-card-change-container">
                  <div className="summary-card-change">
                    <span className={`change-indicator ${isUp ? "up" : isDown ? "down" : ""}`}>
                      {isUp ? "▲" : isDown ? "▼" : "-"} {Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`change-rate ${isUp ? "up" : isDown ? "down" : ""}`}>
                      ({isUp ? "+" : ""}{rate.toFixed(2)}%)
                    </span>
                  </div>
                  <span className="summary-card-date">
                    {formatIndicatorDate(last.date)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================
          카드 그리드 섹션
      ========================= */}
      <div className="grid-container">
        {FLAT_CRYPTOS.map(item => {
          const list = data[item.key as keyof typeof data];
          if (!list || list.length === 0) return null;

          return (
            <div id={item.id} key={item.key} className="indicator-card-wrapper">
              <IndicatorCard
                title={item.title}
                data={list}
                colorKey={item.key}
                description={
                  item.key === "bitcoin"
                    ? "가상자산 시장 기축 및\n전반적인 위험자산 선호도 지표"
                    : item.key === "ethereum"
                      ? "알트코인 대장주 및\n나스닥 기술주와의 높은 동조화 지표"
                      : item.key === "solana"
                        ? "차세대 고성능 메인넷 및\n최근 기관 자금 유입의 핵심 지표"
                        : item.key === "stablecoin"
                          ? "제도권 금융 시스템 연동 및\n국제 송금/결제 인프라 지표"
                          : "글로벌 최대 거래소 유동성 및\n가상자산 플랫폼 생태계 건전성 지표"
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
