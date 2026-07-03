import React from "react";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import "./ConditionListModal.css";

interface ConditionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  /* 불러온 조건식 리스트 */
  conditions: any[];
  /* 조건 적용 핸들러 */
  onApply: (condition: any) => void;
  /* 조건 삭제 핸들러 */
  onDelete: (id: number) => void;
  /* 필터 레이블 구성을 가져오기 위한 헬퍼용 데이터 */
  filterOptions: { baseKey: string; label: string }[];
}

const ConditionListModal: React.FC<ConditionListModalProps> = ({
  isOpen,
  onClose,
  conditions,
  onApply,
  onDelete,
  filterOptions,
}) => {
  /* 활성화 시 뒷 배경 스크롤 차단 */
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  /* 지표 키 한글 레이블 반환 */
  const getFilterLabel = (fullKey: string) => {
    const baseKey = fullKey.replace(/_(KR|US)$/i, "");
    const option = filterOptions.find((f) => f.baseKey === baseKey);
    return option ? option.label : baseKey;
  };

  return (
    <div className="list-modal-overlay">
      <div className="list-modal-body">
        {/* 모달 헤더 영역 */}
        <header className="list-modal-header">
          <div className="header-title-area">
            <h3 className="list-modal-title">저장된 조건식 불러오기</h3>
            <span className="list-modal-subtitle">
              내가 저장한 조건식 목록입니다. 적용 버튼을 누르면 해당 분석 조건이 복원됩니다.
            </span>
          </div>
          <button className="list-modal-close-btn" onClick={onClose} title="닫기">
            ✕
          </button>
        </header>

        {/* 모달 콘텐츠 영역 */}
        <div className="list-modal-content">
          {conditions.length === 0 ? (
            <div className="list-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="empty-text">아직 저장된 조건식이 없습니다.</p>
              <p className="empty-subtext">나만의 필터를 구성하고 조건 저장 버튼을 눌러보세요.</p>
            </div>
          ) : (
            <div className="conditions-grid-list">
              {conditions.map((cond) => {
                // 시가총액 조건과 일반 조건 필터 파싱 분리
                const capFilter = cond.filters?.find((f: string) => f.startsWith("RANK_MARKET_CAP"));
                const volFilter = cond.filters?.find((f: string) => f.startsWith("RANK_VOLUME"));
                const amtFilter = cond.filters?.find((f: string) => f.startsWith("RANK_AMOUNT"));
                const priceChangeFilter = cond.filters?.find((f: string) => f.startsWith("PRICE_CHANGE"));
                const normalFilters = cond.filters?.filter((f: string) => !f.startsWith("RANK_MARKET_CAP") && !f.startsWith("RANK_VOLUME") && !f.startsWith("RANK_AMOUNT") && !f.startsWith("PRICE_CHANGE")) || [];
                
                let capLabel = "";
                if (capFilter) {
                  const cleanCap = capFilter.replace(/_(KR|US)$/i, "");
                  const matched = [
                    { val: "RANK_MARKET_CAP_10", label: "시총 상위 10위" },
                    { val: "RANK_MARKET_CAP_30", label: "시총 상위 30위" },
                    { val: "RANK_MARKET_CAP_50", label: "시총 상위 50위" },
                    { val: "RANK_MARKET_CAP_100", label: "시총 상위 100위" },
                    { val: "RANK_MARKET_CAP_200", label: "시총 상위 200위" },
                  ].find((item) => item.val === cleanCap);
                  capLabel = matched ? matched.label : "";
                }

                let volLabel = "";
                if (volFilter) {
                  const cleanVol = volFilter.replace(/_(KR|US)$/i, "");
                  const matched = [
                    { val: "RANK_VOLUME_10", label: "거래량 상위 10위" },
                    { val: "RANK_VOLUME_20", label: "거래량 상위 20위" },
                    { val: "RANK_VOLUME_30", label: "거래량 상위 30위" },
                    { val: "RANK_VOLUME_40", label: "거래량 상위 40위" },
                    { val: "RANK_VOLUME_50", label: "거래량 상위 50위" },
                  ].find((item) => item.val === cleanVol);
                  volLabel = matched ? matched.label : "";
                }

                let amtLabel = "";
                if (amtFilter) {
                  const cleanAmt = amtFilter.replace(/_(KR|US)$/i, "");
                  const matched = (cond.market === "kr"
                    ? [
                        { val: "AMOUNT_STAGE_1", label: "거래대금 100억 미만" },
                        { val: "AMOUNT_STAGE_2", label: "거래대금 100억~500억" },
                        { val: "AMOUNT_STAGE_3", label: "거래대금 500억~1,000억" },
                        { val: "AMOUNT_STAGE_4", label: "거래대금 1,000억~3,000억" },
                        { val: "AMOUNT_STAGE_5", label: "거래대금 3,000억 이상" },
                      ]
                    : [
                        { val: "AMOUNT_STAGE_1", label: "거래대금 1억$ 미만 (약 1,300억)" },
                        { val: "AMOUNT_STAGE_2", label: "거래대금 1억$ ~ 5억$ (약 1,300억 ~ 6,500억)" },
                        { val: "AMOUNT_STAGE_3", label: "거래대금 5억$ ~ 10억$ (약 6,500억 ~ 1.3조)" },
                        { val: "AMOUNT_STAGE_4", label: "거래대금 10억$ ~ 30억$ (약 1.3조 ~ 3.9조)" },
                        { val: "AMOUNT_STAGE_5", label: "거래대금 30억$ 이상 (약 3.9조)" },
                      ]
                  ).find((item) => item.val === cleanAmt);
                  amtLabel = matched ? matched.label : "";
                }

                let priceChangeLabel = "";
                if (priceChangeFilter) {
                  const cleanPriceChange = priceChangeFilter.replace(/_(KR|US)$/i, "");
                  const matched = [
                    { val: "PRICE_CHANGE_UP", label: "상승 종목" },
                    { val: "PRICE_CHANGE_DOWN", label: "하락 종목" }
                  ].find((item) => item.val === cleanPriceChange);
                  priceChangeLabel = matched ? matched.label : "";
                }

                return (
                  <div key={cond.id} className="condition-item-card">
                    {/* 카드 본문 왼쪽 정보 정보 */}
                    <div className="card-main-info">
                      <div className="card-title-row">
                        <span className="card-item-name">{cond.name ? cond.name.replace(/_(KR|US)$/i, "") : ""}</span>
                        <span className={`card-market-badge ${cond.market === "kr" ? "kr-badge" : "us-badge"}`}>
                          {cond.market === "kr" ? "국내 (KR)" : "미국 (US)"}
                        </span>
                      </div>

                      {/* 칩 형태로 담긴 세부 조건 요약 */}
                      <div className="card-chips-summary">
                        {capLabel && (
                          <span className="summary-badge cap-badge">
                            {capLabel}
                          </span>
                        )}
                        
                        {volLabel && (
                          <span className="summary-badge cap-badge" style={{ background: "#e0f2fe", border: "1px solid #bae6fd", color: "#0369a1" }}>
                            {volLabel}
                          </span>
                        )}
                        
                        {amtLabel && (
                          <span className="summary-badge cap-badge" style={{ background: "#faf5ff", border: "1px solid #e9d5ff", color: "#6b21a8" }}>
                            {amtLabel}
                          </span>
                        )}
                        
                        {priceChangeLabel && (
                          <span className="summary-badge cap-badge" style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b" }}>
                            {priceChangeLabel}
                          </span>
                        )}
                        
                        {normalFilters.map((fKey: string, idx: number) => (
                          <span key={idx} className="summary-badge filter-badge">
                            {getFilterLabel(fKey)}
                          </span>
                        ))}

                        {cond.selectedEtfs && cond.selectedEtfs.map((etf: any, idx: number) => (
                          <span key={idx} className="summary-badge etf-badge">
                            ETF: {etf.etfName}
                          </span>
                        ))}

                        {(!capLabel && !volLabel && !amtLabel && !priceChangeLabel && normalFilters.length === 0 && (!cond.selectedEtfs || cond.selectedEtfs.length === 0)) && (
                          <span className="summary-badge empty-badge">설정된 지표 없음</span>
                        )}
                      </div>

                      <span className="card-item-date">저장 시간: {cond.createdAt}</span>
                    </div>

                    {/* 카드 본문 오른쪽 버튼 액션 */}
                    <div className="card-actions">
                      <button
                        type="button"
                        className="apply-condition-btn"
                        onClick={() => onApply(cond)}
                      >
                        적용하기
                      </button>
                      <button
                        type="button"
                        className="delete-condition-btn"
                        onClick={() => onDelete(cond.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConditionListModal;
