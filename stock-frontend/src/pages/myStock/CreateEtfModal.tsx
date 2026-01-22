import { useState } from "react";
import { createMyEtf } from "../../api/myEtfApi";
import type { MyEtfCreateRequestDTO } from "../myEtf/myEtf.types";

import "./CreateEtfModal.css";

/* =========================
   Types
========================= */
interface MyStockItem {
  code: string;
  name: string;
}

interface Props {
  open: boolean;
  myStocks: MyStockItem[];
  onClose: () => void;
  onCreated: () => void;
}

interface TempItem {
  code: string;
  name: string;
  quantity: number;
}

/* =========================
   Component
========================= */
export default function CreateEtfModal({
  open,
  myStocks,
  onClose,
  onCreated,
}: Props) {
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
     종목 추가 / 제거
     ========================= */
  const addItem = (code: string, name: string) => {
    setTempItems(prev => {
      const exist = prev.find(i => i.code === code);
      if (exist) {
        return prev.map(i =>
          i.code === code
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { code, name, quantity: 1 }];
    });
  };

  const removeItem = (idx: number) => {
    setTempItems(prev => prev.filter((_, i) => i !== idx));
  };

  /* =========================
     저장
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

    const body: MyEtfCreateRequestDTO = {
      etfName,
      etfDescription,
      items: tempItems,
    };

    try {
      await createMyEtf(body);
      alert("ETF가 생성되었습니다.");

      resetForm();
      onCreated();
      onClose();
    } catch (e: any) {
      if (e?.message === "DUPLICATED_ETF_NAME") {
        alert("이미 존재하는 ETF 이름입니다.");
      } else {
        alert("ETF 생성 중 오류가 발생했습니다.");
      }
    }
  };

  /* =========================
     Render
     ========================= */
  return (
    <div
      className="modal-overlay"
      onClick={e => {
        if (e.target !== e.currentTarget) return;
        resetForm();
        onClose();
      }}
    >
      <div
        className="modal-body"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="modal-header">
          <h3>나만의 ETF 만들기</h3>
          <button
            className="close-btn"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            ✕
          </button>
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

          {/* ETF Builder */}
          <div className="etf-builder">
            {/* 좌측: 내 관심 종목 */}
            <div className="search-panel">
              <h4>내 관심 종목</h4>

              <div className="search-list">
                {myStocks.length === 0 && (
                  <div className="empty">
                    관심 종목이 없습니다
                  </div>
                )}

                {myStocks.map(s => {
                  const isSelected = tempItems.some(
                    i => i.code === s.code
                  );

                  return (
                    <div
                      key={s.code}
                      className={`search-item ${isSelected ? "disabled" : ""}`}
                      onClick={() =>
                        !isSelected && addItem(s.code, s.name)
                      }
                    >
                      <div className="search-info">
                        <strong>{s.name}</strong>
                        <span className="code">{s.code}</span>
                      </div>

                      {isSelected ? (
                        <span className="added">선택됨</span>
                      ) : (
                        <span className="add-hint">선택</span>
                      )}
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
                  <span>수량</span>
                  <span></span>
                </div>

                {tempItems.length === 0 && (
                  <div className="empty">
                    왼쪽에서 종목을 선택하세요
                  </div>
                )}

                {tempItems.map((i, idx) => (
                  <div key={idx} className="selected-row">
                    <span>
                      {i.name} ({i.code})
                    </span>

                    {/* 수량 컨트롤 */}
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

                      <span className="qty-value">
                        {i.quantity}
                      </span>

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

                    {/* 삭제 */}
                    <button
                      className="remove-btn icon"
                      onClick={() => removeItem(idx)}
                      title="종목 제거"
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
          <button
            className="secondary-btn"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            취소
          </button>
          <button
            className="primary-btn"
            onClick={save}
          >
            ETF 생성
          </button>
        </div>
      </div>
    </div>
  );
}
