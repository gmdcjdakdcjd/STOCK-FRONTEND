import IndicatorCard from "./stockIndex";
import { useIndicatorData } from "./useStockIndexData";
import { type IndicatorKey } from "./stockIndexColors";
import "./stockIndex.css";

// 시장 지표 평탄화 정의: 14대 세계 주요 지수를 정렬하여 대시보드 7*2 2줄 격자 및 차트 리스트에 순서대로 매핑합니다.
const FLAT_INDICATORS: { key: string; title: string; colorKey: IndicatorKey }[] = [
  { key: "kospi", title: "KOSPI", colorKey: "kospi" },
  { key: "kosdaq", title: "KOSDAQ", colorKey: "kosdaq" },
  { key: "snp500", title: "S&P500", colorKey: "snp500" },
  { key: "nasdaq", title: "NASDAQ", colorKey: "nasdaq" },
  { key: "dow", title: "DOW", colorKey: "dow" },
  { key: "japan", title: "JAPAN", colorKey: "japan" },
  { key: "china", title: "CHINA", colorKey: "china" },
  { key: "hongkong", title: "HONGKONG", colorKey: "hongkong" },
  { key: "taiwan", title: "TAIWAN", colorKey: "taiwan" },
  { key: "euro", title: "EURO", colorKey: "euro" },
  { key: "england", title: "ENGLAND", colorKey: "england" },
  { key: "france", title: "FRANCE", colorKey: "france" },
  { key: "german", title: "GERMANY", colorKey: "german" },
  { key: "italy", title: "ITALY", colorKey: "italy" }
];

export default function IndicatorPage() {
  const { data, loading } = useIndicatorData();

  if (loading) {
    return <div className="indicator-loading">지수 데이터를 불러오는 중입니다...</div>;
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
    // 대시보드 7*2의 가로 찌그러짐을 없애기 위해 월.일(MM.DD)만 슬림하게 추출합니다.
    const match = dateStr.match(/-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}.${match[2]}`;
    }
    
    return dateStr;
  };

  return (
    <div className="indicator-page stock-index-page">
      {/* =========================
          상단 지수 요약 카드 섹션 (7*2 격자형 버튼 대시보드 룩)
      ========================= */}
      <div className="indicator-summary-section">
        <h2 className="summary-section-title">오늘의 주요 지수</h2>
        
        {/* 기존의 대분류 세그먼트 루프 구조를 걷어내고 하나의 그리드 아래 14개 카드를 일괄 노출합니다 */}
        <div className="summary-cards-grid">
          {FLAT_INDICATORS.map(item => {
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
                onClick={() => handleScrollToChart(item.title)}
              >
                <span className="summary-card-title">{item.title}</span>
                <span className="summary-card-price">{last.close.toLocaleString()}</span>
                
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
          차트 그리드 섹션 (FLAT_INDICATORS 정렬 연동)
      ========================= */}
      <div className="grid-container">
        {FLAT_INDICATORS.map(item => {
          const list = data[item.key as keyof typeof data];
          if (!list || list.length === 0) return null;

          return (
            <div id={item.title} key={item.key} className="indicator-card-wrapper">
              <IndicatorCard title={item.title} data={list} colorKey={item.colorKey} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
