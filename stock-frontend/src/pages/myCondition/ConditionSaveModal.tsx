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
  volumeFilter: string;
  amountFilter: string;
  priceChangeFilter: string;
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
  volumeFilter,
  amountFilter,
  priceChangeFilter,
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
              maxLength={20}
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
                      { val: "RANK_MARKET_CAP_10", label: "상위 10위 이내" },
                      { val: "RANK_MARKET_CAP_30", label: "상위 30위 이내" },
                      { val: "RANK_MARKET_CAP_50", label: "상위 50위 이내" },
                      { val: "RANK_MARKET_CAP_100", label: "상위 100위 이내" },
                      { val: "RANK_MARKET_CAP_200", label: "상위 200위 이내" },
                    ].find((item) => item.val === marketCapFilter)?.label || "적용 안 함"}
                  </span>
                </div>
              )}

              {/* 거래량 조건 (KR, US 모두 해당될 수 있음) */}
              {volumeFilter && (
                <div className="save-summary-row">
                  <span className="summary-label">거래량 범위:</span>
                  <span className="summary-value cap-text summary-chip-style cap-chip" style={{ background: "#e0f2fe", border: "1px solid #bae6fd", color: "#0369a1" }}>
                    {[
                      { val: "RANK_VOLUME_10", label: "상위 10위 이내" },
                      { val: "RANK_VOLUME_20", label: "상위 20위 이내" },
                      { val: "RANK_VOLUME_30", label: "상위 30위 이내" },
                      { val: "RANK_VOLUME_40", label: "상위 40위 이내" },
                      { val: "RANK_VOLUME_50", label: "상위 50위 이내" },
                    ].find((item) => item.val === volumeFilter)?.label || "적용 안 함"}
                  </span>
                </div>
              )}

              {/* 거래대금 조건 (KR, US 모두 해당될 수 있음) */}
              {amountFilter && (
                <div className="save-summary-row">
                  <span className="summary-label">거래대금 범위:</span>
                  <span className="summary-value cap-text summary-chip-style cap-chip" style={{ background: "#faf5ff", border: "1px solid #e9d5ff", color: "#6b21a8" }}>
                    {(market === "kr"
                      ? [
                          { val: "AMOUNT_STAGE_1", label: "100억 원 미만" },
                          { val: "AMOUNT_STAGE_2", label: "100억 원 ~ 500억 원" },
                          { val: "AMOUNT_STAGE_3", label: "500억 원 ~ 1,000억 원" },
                          { val: "AMOUNT_STAGE_4", label: "1,000억 원 ~ 3,000억 원" },
                          { val: "AMOUNT_STAGE_5", label: "3,000억 원 이상" },
                        ]
                      : [
                          { val: "AMOUNT_STAGE_1", label: "1억$ 미만 (약 1,300억)" },
                          { val: "AMOUNT_STAGE_2", label: "1억$ ~ 5억$ (약 1,300억 ~ 6,500억)" },
                          { val: "AMOUNT_STAGE_3", label: "5억$ ~ 10억$ (약 6,500억 ~ 1.3조)" },
                          { val: "AMOUNT_STAGE_4", label: "10억$ ~ 30억$ (약 1.3조 ~ 3.9조)" },
                          { val: "AMOUNT_STAGE_5", label: "3억$ 이상 (약 3.9조)" },
                        ]
                    ).find((item) => item.val === amountFilter)?.label || "적용 안 함"}
                  </span>
                </div>
              )}

              {/* 가격 변동 조건 (KR, US 모두 해당될 수 있음) */}
              {priceChangeFilter && (
                <div className="save-summary-row">
                  <span className="summary-label">가격 변동:</span>
                  <span className="summary-value cap-text summary-chip-style cap-chip" style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b" }}>
                    {[
                      { val: "PRICE_CHANGE_UP", label: "상승 종목" },
                      { val: "PRICE_CHANGE_DOWN", label: "하락 종목" }
                    ].find((item) => item.val === priceChangeFilter)?.label || "적용 안 함"}
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
