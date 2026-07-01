import React, { useEffect, useState } from "react";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import "./EtfSearchModal.css";

interface EtfSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (etfs: { etfId: string; etfName: string }[]) => void;
  /* ETF 운용사 브랜드 상태 */
  etfBrand: "KODEX" | "TIGER";
  setEtfBrand: (brand: "KODEX" | "TIGER") => void;
  /* 검색 입력값 및 실제 검색 쿼리 */
  etfSearchInput: string;
  setEtfSearchInput: (input: string) => void;
  etfQuery: string;
  setEtfQuery: (query: string) => void;
  /* 백엔드 API로부터 조회된 ETF 목록 및 로딩 상태 */
  etfList: { etfId: string; etfName: string }[];
  etfLoading: boolean;
  /* 부모 컴포넌트에서 선택 완료된 ETF 목록 */
  selectedEtfs: { etfId: string; etfName: string }[];
}

const EtfSearchModal: React.FC<EtfSearchModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  etfBrand,
  setEtfBrand,
  etfSearchInput,
  setEtfSearchInput,
  etfQuery,
  setEtfQuery,
  etfList,
  etfLoading,
  selectedEtfs,
}) => {
  /* 모달이 활성화되었을 때 배경 영역 스크롤 방지 */
  useLockBodyScroll(isOpen);

  /* 모달 최초 오픈 시에만 애니메이션을 한 번만 작동시키기 위한 내부 렌더링 상태 */
  const [isFirstOpen, setIsFirstOpen] = useState<boolean>(true);

  /* 사용자가 선택 완료를 누르기 전까지 임시로 들고 있을 로컬 선택 상태 (부모 리렌더링 및 깜빡임 차단) */
  const [tempSelectedEtfs, setTempSelectedEtfs] = useState<{ etfId: string; etfName: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      setIsFirstOpen(true);
      setTempSelectedEtfs(selectedEtfs); // 열릴 때 부모의 선택값 복사
      // 애니메이션이 완전히 끝난 350ms 후에 애니메이션 클래스를 해제합니다.
      const timer = setTimeout(() => {
        setIsFirstOpen(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedEtfs]);

  /* 지연된 스피너 표시 여부 상태 (찰나의 로딩으로 인한 깜빡임 방지) */
  const [showSpinner, setShowSpinner] = useState<boolean>(false);

  useEffect(() => {
    if (etfLoading) {
      // 로딩이 시작되면 600ms 후에 스피너를 표시하도록 스케줄링 (찰나의 로딩 시 스피너 노출 차단)
      const timer = setTimeout(() => {
        setShowSpinner(true);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      // 로딩이 끝나면 스피너 상태를 즉시 비활성화
      setShowSpinner(false);
    }
  }, [etfLoading]);

  if (!isOpen) return null;

  /* 특정 ETF가 이미 선택되었는지 여부를 확인하는 헬퍼 함수 */
  const isSelected = (etfId: string) => {
    return tempSelectedEtfs.some((item) => item.etfId === etfId);
  };

  /* 체크박스 클릭 혹은 행 클릭 시 선택 상태 토글 핸들러 */
  const handleToggle = (etfId: string, etfName: string) => {
    if (isSelected(etfId)) {
      setTempSelectedEtfs(tempSelectedEtfs.filter((item) => item.etfId !== etfId));
    } else {
      if (tempSelectedEtfs.length >= 5) {
        alert("ETF는 최대 5개까지만 선택 가능합니다.");
        return;
      }
      setTempSelectedEtfs([...tempSelectedEtfs, { etfId, etfName }]);
    }
  };

  /* 검색 입력창 키 다운 이벤트 핸들러 (Enter 입력 시 검색 실행) */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setEtfQuery(etfSearchInput);
    }
  };

  /* 검색 실행 핸들러 */
  const handleSearch = () => {
    setEtfQuery(etfSearchInput);
  };

  return (
    <div className={`etf-modal-overlay ${isFirstOpen ? "animate" : ""}`}>
      <div className={`etf-modal-body ${isFirstOpen ? "animate" : ""}`}>
        {/* 모달 헤더 영역 */}
        <header className="etf-modal-header">
          <div className="header-left">
            <h3 className="etf-modal-title">ETF 검색 및 다중 선택</h3>
            <span className="selected-badge">
              선택됨: {tempSelectedEtfs.length} / 5
            </span>
          </div>
          <button className="etf-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        {/* 모달 검색 필터 영역 */}
        <div className="etf-modal-filter-section">
          {etfQuery && (
            <div className="etf-modal-current-query">
              현재 필터: <span className="query-brand">{etfBrand}</span> &gt; <span className="query-text">"{etfQuery}"</span>
            </div>
          )}

          {/* 운용사 선택 탭 */}
          <div className="etf-modal-brand-tabs">
            <button
              type="button"
              className={`brand-tab-btn ${etfBrand === "KODEX" ? "active" : ""}`}
              onClick={() => {
                setEtfBrand("KODEX");
              }}
            >
              KODEX (삼성자산운용)
            </button>
            <button
              type="button"
              className={`brand-tab-btn ${etfBrand === "TIGER" ? "active" : ""}`}
              onClick={() => {
                setEtfBrand("TIGER");
              }}
            >
              TIGER (미래에셋자산운용)
            </button>
          </div>

          {/* 검색어 입력창 */}
          <div className="etf-modal-search-bar">
            <input
              type="text"
              className="etf-modal-search-input"
              placeholder="검색할 ETF 명이나 코드를 입력해 주세요 (예: 200, 반도체)"
              value={etfSearchInput}
              onChange={(e) => setEtfSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className="etf-modal-search-submit"
              onClick={handleSearch}
            >
              검색
            </button>
          </div>
        </div>

        {/* 모달 콘텐츠 리스트 영역 */}
        <div className="etf-modal-content">
          {showSpinner ? (
            <div className="etf-modal-status-msg">
              <div className="spinner"></div>
              <span>ETF 목록을 조회하는 중입니다...</span>
            </div>
          ) : etfList.length === 0 ? (
            <div className="etf-modal-status-msg empty-state">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>검색된 ETF 목록이 없습니다.</span>
              <p>운용사 브랜드 및 검색어를 확인한 후 다시 검색해 주세요.</p>
            </div>
          ) : (
            <div className="etf-grid-list">
              {etfList.map((item) => {
                const checked = isSelected(item.etfId);
                return (
                  <div
                    key={item.etfId}
                    className={`etf-list-item ${checked ? "checked" : ""}`}
                    onClick={() => handleToggle(item.etfId, item.etfName)}
                  >
                    {/* 커스텀 체크박스 스타일링 */}
                    <div className="custom-checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => { }} /* onClick에서 전체 행을 처리함 */
                        className="etf-item-checkbox"
                      />
                      <span className="checkbox-visual"></span>
                    </div>

                    <div className="etf-item-info">
                      <span className="etf-item-code">{item.etfId}</span>
                      <span className="etf-item-name">{item.etfName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 모달 푸터 영역 */}
        <footer className="etf-modal-footer">
          <div className="footer-selected-summary">
            {tempSelectedEtfs.length > 0 ? (
              <div className="selected-chips-row">
                {tempSelectedEtfs.map((etf) => (
                  <span key={etf.etfId} className="selected-modal-chip">
                    {etf.etfName}
                    <button
                      type="button"
                      className="chip-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempSelectedEtfs(tempSelectedEtfs.filter((item) => item.etfId !== etf.etfId));
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className="no-selection-desc">
                선택된 ETF 필터가 없습니다. 최대 5개까지 선택 가능합니다.
              </span>
            )}
          </div>
          <button className="etf-modal-apply-btn" onClick={() => onConfirm(tempSelectedEtfs)}>
            선택 완료
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EtfSearchModal;
