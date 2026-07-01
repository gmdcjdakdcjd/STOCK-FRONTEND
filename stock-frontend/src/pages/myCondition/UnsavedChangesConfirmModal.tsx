import React from "react";
import "./UnsavedChangesConfirmModal.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  conditionName: string;
}

export default function UnsavedChangesConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  conditionName,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal-content">
        <div className="confirm-modal-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="warn-icon">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h3>변경사항 미저장 알림</h3>
        </div>
        <div className="confirm-modal-body">
          <p className="highlight-text">
            현재 조건식의 변경 사항이 저장되지 않았습니다.
          </p>
          <p className="desc-text">
            관심 종목의 조건식명은 기존 이름인 <span className="name-badge">'{conditionName}'</span>으로 저장됩니다.
          </p>
          <p className="action-guide">
            수정된 옵션 조건으로 관심종목을 등록하기를 원하시면, 먼저 '조건 수정'을 진행해 주세요.
          </p>
        </div>
        <div className="confirm-modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            취소
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            기존 이름으로 계속 진행
          </button>
        </div>
      </div>
    </div>
  );
}
