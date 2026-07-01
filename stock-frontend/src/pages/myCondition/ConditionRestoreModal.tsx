import React from "react";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import "./ConditionListModal.css"; // 기존 모달 스타일 디자인을 공유하여 일관성 유지

interface ConditionRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  /* 삭제된(비활성) 조건식 리스트 */
  conditions: any[];
  /* 조건 복구 핸들러 */
  onRestore: (id: number, name: string) => void;
  /* 필터 레이블 구성을 가져오기 위한 헬퍼용 데이터 */
  filterOptions: { baseKey: string; label: string }[];
}

const ConditionRestoreModal: React.FC<ConditionRestoreModalProps> = ({
  isOpen,
  onClose,
  conditions,
  onRestore,
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
            <h3 className="list-modal-title">삭제된 조건식 복구 (휴지통)</h3>
            <span className="list-modal-subtitle">
              삭제되었던 조건식 목록입니다. 복구 버튼을 누르면 조건식 불러오기 목록에 다시 복원됩니다.
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
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <p className="empty-text">휴지통이 비어 있습니다.</p>
              <p className="empty-subtext">최근 삭제한 조건식이 없습니다.</p>
            </div>
          ) : (
            <div className="conditions-grid-list">
              {conditions.map((cond) => {
                // 시가총액 조건과 일반 조건 필터 파싱 분리
                const capFilter = cond.filters?.find((f: string) => f.startsWith("RANK_MARKET_CAP"));
                const normalFilters = cond.filters?.filter((f: string) => !f.startsWith("RANK_MARKET_CAP")) || [];
                
                let capLabel = "";
                if (capFilter) {
                  const cleanCap = capFilter.replace(/_(KR|US)$/i, "");
                  const matched = [
                    { val: "RANK_MARKET_CAP_30", label: "시총 상위 30위" },
                    { val: "RANK_MARKET_CAP_100", label: "시총 상위 100위" },
                    { val: "RANK_MARKET_CAP_200", label: "시총 상위 200위" },
                  ].find((item) => item.val === cleanCap);
                  capLabel = matched ? matched.label : "";
                }

                return (
                  <div key={cond.id} className="condition-item-card">
                    {/* 카드 본문 정보 */}
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

                        {(!capLabel && normalFilters.length === 0 && (!cond.selectedEtfs || cond.selectedEtfs.length === 0)) && (
                          <span className="summary-badge empty-badge">설정된 지표 없음</span>
                        )}
                      </div>

                      <span className="card-item-date">저장 시간: {cond.createdAt}</span>
                    </div>

                    {/* 복구 액션 버튼 */}
                    <div className="card-actions">
                      <button
                        type="button"
                        className="apply-condition-btn"
                        onClick={() => onRestore(cond.id, cond.name)}
                        style={{
                          backgroundColor: "#10b981",
                          boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.15)"
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "#059669";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "#10b981";
                        }}
                      >
                        복구하기
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

export default ConditionRestoreModal;
