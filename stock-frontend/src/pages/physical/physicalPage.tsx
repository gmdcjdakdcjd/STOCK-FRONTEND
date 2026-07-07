import IndicatorCard from "./physical";
import { useIndicatorData } from "./usePhysicalData";
import { type IndicatorKey } from "./physicalColors";
import "./physical.css";

// 실물자산 지표 평탄화 정의: 12대 원자재 지표를 가로 6열 2줄 대시보드로 구성하기 위해 나열합니다. (TypeScript 빌드 오류 방지를 위해 IndicatorKey 유니온 타입 바인딩)
const FLAT_PHYSICALS: { key: IndicatorKey; title: string; id: string }[] = [
  { key: "BEAN", title: "BEAN", id: "BEAN" },
  { key: "COFFEE", title: "COFFEE", id: "COFFEE" },
  { key: "CORN", title: "CORN", id: "CORN" },
  { key: "RICE", title: "RICE", id: "RICE" },
  { key: "SUGAR", title: "SUGAR", id: "SUGAR" },
  { key: "COTTON", title: "COTTON", id: "COTTON" },
  { key: "COPPER", title: "COPPER", id: "COPPER" },
  { key: "SILVER", title: "SILVER", id: "SILVER" },
  { key: "GOLD_GLOBAL", title: "GOLD (GLOBAL)", id: "GOLD_GLOBAL" },
  { key: "GOLD_KR", title: "GOLD (KR)", id: "GOLD_KR" },
  { key: "WTI", title: "WTI", id: "WTI" },
  { key: "DUBAI", title: "DUBAI", id: "DUBAI" }
];

export default function IndicatorPage() {
  const { data, loading } = useIndicatorData();

  if (loading) {
    return <div className="indicator-loading">실물 자산 데이터를 불러오는 중입니다...</div>;
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
    // 대시보드 6열 가로 찌러짐 방지를 위해 월.일(MM.DD)만 슬림하게 뱉습니다.
    const match = dateStr.match(/-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}.${match[2]}`;
    }
    
    return dateStr;
  };

  return (
    <div className="indicator-page physical-page">
      {/* =========================
          상단 실물자산 요약 카드 섹션 (6*2 격자형 버튼 대시보드 룩)
      ========================= */}
      <div className="exchange-summary-section">
        <h2 className="summary-section-title">오늘의 원자재 & 실물 자산</h2>
        
        <div className="summary-cards-grid">
          {FLAT_PHYSICALS.map(item => {
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
        {FLAT_PHYSICALS.map(item => {
          const list = data[item.key as keyof typeof data];
          if (!list || list.length === 0) return null;

          return (
            <div id={item.id} key={item.key} className="indicator-card-wrapper">
              <IndicatorCard title={item.title} data={list} colorKey={item.key} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
