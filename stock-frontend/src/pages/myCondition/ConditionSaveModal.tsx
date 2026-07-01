import React from "react";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import "./ConditionSaveModal.css";

interface ConditionSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  /* 현재 저장할 조건식 이름 상태 및 제어 함수 */
  conditionName: string;
  setConditionName: (name: string) => void;
  /* 저장 트리거 최종 완료 함수 */
  onSave: () => void;
  /* 현재 선택된 조건 정보들 요약 표출용 props */
  market: "kr" | "us";
  checkedFilterKeys: string[];
  marketCapFilter: string;
  selectedEtfs: { etfId: string; etfName: string }[];
  /* 필터 조건의 한글 라벨명을 획득하기 위한 맵용 헬퍼 데이터 */
  filterOptions: { baseKey: string; label: string }[];
  /* 수정 모드(수정 완료) 여부 */
  isEditMode?: boolean;
}

const ConditionSaveModal: React.FC<ConditionSaveModalProps> = ({
  isOpen,
  onClose,
  conditionName,
  setConditionName,
  onSave,
  market,
  checkedFilterKeys,
  marketCapFilter,
  selectedEtfs,
  filterOptions,
  isEditMode = false,
}) => {
  /* 모달 활성화 시 배경 화면 스크롤 제어 */
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  /* 키값에 매핑되는 한글 필터명 반환 헬퍼 */
  const getFilterLabel = (key: string) => {
    const option = filterOptions.find((f) => f.baseKey === key);
    if (!option) return key;
    return option.label;
  };

  return (
    <div className="save-modal-overlay">
      <div className="save-modal-body">
        {/* 모달 헤더 */}
        <header className="save-modal-header">
          <h3 className="save-modal-title">
            {isEditMode ? "조건식 수정하기" : "조건식 저장하기"}
          </h3>
          <button className="save-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        {/* 모달 콘텐츠 */}
        <div className="save-modal-content">
          {/* 1단계: 조건식 이름 입력 */}
          <div className="save-input-group">
            <label className="save-input-label">조건식 이름</label>
            <input
              type="text"
              className="save-name-input"
              value={conditionName}
              onChange={(e) => setConditionName(e.target.value)}
              placeholder="예: 반도체 120일 신고가 조건식"
              maxLength={40}
            />
          </div>

          {/* 2단계: 내가 선택한 조건 확인 영역 */}
          <div className="save-summary-group">
            <span className="save-summary-title">선택된 조건 요약 확인</span>
            <div className="save-summary-card">
              {/* 대상 시장 */}
              <div className="save-summary-row">
                <span className="summary-label">대상 시장:</span>
                <span className="summary-value market-text summary-chip-style market-chip">
                  {market === "kr" ? "국내 주식 시장 (KR)" : "미국 주식 시장 (US)"}
                </span>
              </div>

              {/* 시가총액 조건 (KR인 경우에만 해당될 수 있음) */}
              {market === "kr" && marketCapFilter && (
                <div className="save-summary-row">
                  <span className="summary-label">시가총액 범위:</span>
                  <span className="summary-value cap-text summary-chip-style cap-chip">
                    {[
                      { val: "RANK_MARKET_CAP_30", label: "상위 30위 이내" },
                      { val: "RANK_MARKET_CAP_100", label: "상위 100위 이내" },
                      { val: "RANK_MARKET_CAP_200", label: "상위 200위 이내" },
                    ].find((item) => item.val === marketCapFilter)?.label || "적용 안 함"}
                  </span>
                </div>
              )}

              {/* 일반 지표 조건 리스트 */}
              <div className="save-summary-row align-start">
                <span className="summary-label">스크리닝 지표:</span>
                <div className="summary-list-wrapper">
                  {checkedFilterKeys.length > 0 ? (
                    checkedFilterKeys.map((key) => (
                      <span key={key} className="summary-list-item filter-chip-style">
                        {getFilterLabel(key)}
                      </span>
                    ))
                  ) : (
                    <span className="summary-list-empty">선택된 지표 없음</span>
                  )}
                </div>
              </div>

              {/* 구성 종목 ETF 필터 리스트 (KR 전용) */}
              {market === "kr" && (
                <div className="save-summary-row align-start">
                  <span className="summary-label">ETF 종목 필터:</span>
                  <div className="summary-list-wrapper">
                    {selectedEtfs.length > 0 ? (
                      selectedEtfs.map((etf) => (
                        <span key={etf.etfId} className="summary-list-item etf-chip-style">
                          {etf.etfName} ({etf.etfId})
                        </span>
                      ))
                    ) : (
                      <span className="summary-list-empty">선택된 ETF 필터 없음</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 모달 푸터 액션 */}
        <footer className="save-modal-footer">
          <button className="save-cancel-btn" onClick={onClose}>
            취소
          </button>
          <button className="save-submit-btn" onClick={onSave}>
            {isEditMode ? "수정 완료" : "저장 완료"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConditionSaveModal;
