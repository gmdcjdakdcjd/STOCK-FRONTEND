import { useState } from "react";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { createMyEtf } from "../../api/myEtfApi";
import type { MyEtfCreateRequestDTO } from "../myEtf/myEtf.types";

import "./CreateEtfModal.css";

/* =========================
   Types
========================= */
interface MyStockItem {
  code: string;
  name: string;
  market: "KR" | "US";
  currentPrice: number;
}

interface Props {
  open: boolean;
  myStocks: MyStockItem[];
  onClose: () => void;
  onCreated: () => void;
}

/**  화면 전용 상태 */
interface TempItem {
  code: string;
  name: string;
  market: "KR" | "US";
  priceAtAdd: number;
  quantity: number;
}

/* =========================
   Utils
========================= */
const formatPrice = (
  price: number | null | undefined,
  market: "KR" | "US"
) => {
  if (price == null) return "-";
  return market === "KR"
    ? `${price.toLocaleString()}원`
    : `$${price.toLocaleString()}`;
};

/* =========================
   Component
========================= */
export default function CreateEtfModal({
  open,
  myStocks,
  onClose,
  onCreated,
}: Props) {
  // 모달 오픈 시 배경(body) 스크롤 방지
  useLockBodyScroll(open);

  if (!open) return null;

  const [etfName, setEtfName] = useState("");
  const [etfDescription, setEtfDescription] = useState("");
  const [tempItems, setTempItems] = useState<TempItem[]>([]);

  /* =========================
     초기화
  ========================= */
  const resetForm = () => {
    setEtfName("");
    setEtfDescription("");
    setTempItems([]);
  };

  /* =========================
     종목 추가 (UI 전용)
  ========================= */
  const addItem = (s: MyStockItem) => {
    setTempItems(prev => {
      if (prev.some(i => i.code === s.code)) return prev;

      return [
        ...prev,
        {
          code: s.code,
          name: s.name,
          market: s.market,
          priceAtAdd: s.currentPrice, //  화면용 스냅샷
          quantity: 1,
        },
      ];
    });
  };

  const removeItem = (idx: number) => {
    setTempItems(prev => prev.filter((_, i) => i !== idx));
  };

  /* =========================
     저장 ( 기존 로직 그대로)
  ========================= */
  const save = async () => {
    if (!etfName.trim()) {
      alert("ETF 이름을 입력하세요.");
      return;
    }

    if (tempItems.length === 0) {
      alert("ETF에 최소 1개 이상의 종목을 추가하세요.");
      return;
    }

    /**  서버로 보내는 payload는 원본 구조 */
    const body: MyEtfCreateRequestDTO = {
      etfName,
      etfDescription,
      items: tempItems.map(i => ({
        code: i.code,
        name: i.name,
        quantity: i.quantity,
      })),
    };

    await createMyEtf(body);
    alert("ETF가 생성되었습니다.");

    resetForm();
    onCreated();
    onClose();
  };

  /* =========================
     Render
  ========================= */
  return (
    <div
      className="create-etf-modal modal-overlay"
      onClick={e => {
        if (e.target !== e.currentTarget) return;
        resetForm();
        onClose();
      }}
    >
      {/* 실제 스크롤이 동작하는 래퍼: position:fixed 요소에서는 overflow 스크롤이
          브라우저에 따라 제대로 동작하지 않으므로, 래퍼에서 스크롤을 처리한다 */}
      <div
        className="modal-scroll-wrapper"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-body" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <header className="modal-header">
            <h3>나만의 ETF 만들기</h3>
            <button className="close-btn" onClick={onClose}>✕</button>
          </header>

          {/* Content */}
          <div className="modal-content">
            {/* ETF 메타 정보 */}
            <div className="form-section">
              <label>ETF 이름</label>
              <input
                value={etfName}
                onChange={e => setEtfName(e.target.value)}
              />

              <label>ETF 설명</label>
              <textarea
                rows={2}
                value={etfDescription}
                onChange={e => setEtfDescription(e.target.value)}
              />
            </div>

            <div className="divider" />

            <div className="etf-builder">
              {/* 좌측: 내 관심 종목 */}
              <div className="search-panel">
                <h4>내 관심 종목</h4>

                {/* 검색 테이블 헤더 - scroll 영역 밖에 위치 */}
                <div className="search-header">
                  <span>종목명</span>
                  <span>코드</span>
                  <span>시장</span>
                  <span className="right">현재가</span>
                  <span></span>
                </div>

                <div className="search-table">
                  {myStocks.map(s => {
                    const isSelected = tempItems.some(i => i.code === s.code);

                    return (
                      <div
                        key={s.code}
                        className={`search-row ${isSelected ? "disabled" : ""}`}
                        onClick={() => !isSelected && addItem(s)}
                      >
                        <span>{s.name}</span>
                        <span>{s.code}</span>
                        <span>{s.market}</span>
                        <span className="right">
                          {formatPrice(s.currentPrice, s.market)}
                        </span>
                        <span className="action">
                          {isSelected ? "추가됨" : "추가"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 우측: 구성 종목 */}
              <div className="selected-panel">
                <h4>구성 종목</h4>

                <div className="selected-list">
                  <div className="selected-header">
                    <span>종목</span>
                    <span>시장</span>
                    <span className="right">현재가</span>
                    <span className="center">수량</span>
                    <span className="right">총액</span>
                    <span></span>
                  </div>

                  {tempItems.length === 0 && (
                    <div className="empty">
                      왼쪽에서 종목을 선택하세요
                    </div>
                  )}

                  {tempItems.map((i, idx) => (
                    <div key={idx} className="selected-row">
                      <span>{i.name} ({i.code})</span>
                      <span>{i.market}</span>

                      <span className="right">
                        {formatPrice(i.priceAtAdd, i.market)}
                      </span>

                      <div className="qty-control">
                        <button
                          className="qty-btn minus"
                          onClick={() =>
                            setTempItems(prev =>
                              prev.map((p, pIdx) =>
                                pIdx === idx && p.quantity > 1
                                  ? { ...p, quantity: p.quantity - 1 }
                                  : p
                              )
                            )
                          }
                        >
                          −
                        </button>

                        <span className="qty-value">{i.quantity}</span>

                        <button
                          className="qty-btn plus"
                          onClick={() =>
                            setTempItems(prev =>
                              prev.map((p, pIdx) =>
                                pIdx === idx
                                  ? { ...p, quantity: p.quantity + 1 }
                                  : p
                              )
                            )
                          }
                        >
                          +
                        </button>
                      </div>

                      <span className="right">
                        {formatPrice(i.priceAtAdd * i.quantity, i.market)}
                      </span>

                      <button
                        className="remove-btn icon"
                        onClick={() => removeItem(idx)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button className="secondary-btn" onClick={onClose}>취소</button>
            <button className="primary-btn" onClick={save}>ETF 생성</button>
          </div>
        </div>
      </div>
    </div>
  );
}
