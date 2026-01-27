import { useEffect, useState } from "react";
import { createMyEtf } from "../../api/myEtfApi";
import type { MyEtfCreateRequestDTO } from "./myEtf.types";

import "./CreateEtfModal.css";

interface Props {
  onCreated: () => void;
}

/* =========================
   검색 결과 타입
========================= */
interface SearchItem {
  code: string;
  name: string;
  market: "KR" | "US";
  price: string; // 백엔드 포맷 문자열
}

/* =========================
   ETF 구성 종목
========================= */
interface TempItem {
  code: string;
  name: string;
  market: "KR" | "US";   // 🔑 필수
  price: string;
  quantity: number;
}


/* =========================
   Utils
========================= */
const parsePrice = (price: string): number => {
  const numeric = price.replace(/[^0-9.]/g, "");
  return Number(numeric) || 0;
};

const calcTotal = (price: string, qty: number): string => {
  const total = parsePrice(price) * qty;
  return price.includes("$")
    ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    : `${total.toLocaleString()}원`;

};

function CreateEtfModal({ onCreated }: Props) {
  const [open, setOpen] = useState(false);

  const [etfName, setEtfName] = useState("");
  const [etfDescription, setEtfDescription] = useState("");

  const [keyword, setKeyword] = useState("");
  const [searchResult, setSearchResult] = useState<SearchItem[]>([]);

  const [tempItems, setTempItems] = useState<TempItem[]>([]);

  /* =========================
     초기화
  ========================= */
  const resetForm = () => {
    setEtfName("");
    setEtfDescription("");
    setKeyword("");
    setSearchResult([]);
    setTempItems([]);
  };

  /* =========================
     종목 검색
  ========================= */
  useEffect(() => {
    if (!keyword.trim()) {
      setSearchResult([]);
      return;
    }

    fetch(`/api/common/autocomplete/code?q=${encodeURIComponent(keyword)}`)
      .then(res => res.json())
      .then(setSearchResult);
  }, [keyword]);

  /* =========================
     종목 추가 / 제거
  ========================= */
  const addItem = (item: SearchItem) => {
    setTempItems(prev => {
      const exist = prev.find(i => i.code === item.code);
      if (exist) {
        return prev.map(i =>
          i.code === item.code
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          code: item.code,
          name: item.name,
          market: item.market,   // 🔑 추가
          price: item.price,
          quantity: 1
        }
      ];
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
      items: tempItems.map(i => ({
        code: i.code,
        name: i.name,
        quantity: i.quantity
      }))
    };

    try {
      await createMyEtf(body);
      alert("ETF가 생성되었습니다.");

      resetForm();
      setOpen(false);
      onCreated();
    } catch (e: any) {
      if (e.message === "DUPLICATED_ETF_NAME") {
        alert("이미 존재하는 ETF 이름입니다.");
      } else {
        alert("ETF 생성 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <>
      <button
        className="primary-btn"
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
      >
        ETF 만들기
      </button>

      {open && (
        <div
          className="create-etf-modal modal-overlay"
          onClick={() => {
            resetForm();
            setOpen(false);
          }}
        >
          <div
            className="modal-body"
            onClick={e => e.stopPropagation()}
          >
            <header className="modal-header">
              <h3>나만의 ETF 만들기</h3>
              <button
                className="close-btn"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
              >
                ✕
              </button>
            </header>

            <div className="modal-content">
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
                {/* 검색 */}
                <div className="search-panel">
                  <h4>종목 검색</h4>

                  <div className="search-bar">
                    <input
                      className="search-input"
                      placeholder="종목코드 또는 종목명"
                      value={keyword}
                      onChange={e => setKeyword(e.target.value)}
                    />
                    <button
                      className="reset-btn ghost"
                      onClick={() => {
                        setKeyword("");
                        setSearchResult([]);
                      }}
                    >
                      X
                    </button>
                  </div>


                  <div className="search-table">
                    <div className="search-row header">
                      <span>종목명</span>
                      <span>코드</span>
                      <span>시장</span>
                      <span className="right">현재가</span>
                      <span></span>
                    </div>


                    {searchResult.map(r => {
                      const isSelected = tempItems.some(
                        i => i.code === r.code
                      );

                      return (
                        <div
                          key={r.code}
                          className={`search-row ${isSelected ? "disabled" : ""}`}
                          onClick={() => !isSelected && addItem(r)}
                        >
                          <span>{r.name}</span>
                          <span>{r.code}</span>
                          <span>{r.market}</span>
                          <span className="right">{r.price}</span>
                          <span className="action">
                            {isSelected ? "추가됨" : "추가"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 구성 종목 */}
                <div className="selected-panel">
                  <h4>구성 종목</h4>

                  <div className="selected-list">
                    <div className="selected-header table">
                      <span>종목</span>
                      <span>시장</span>
                      <span className="right">현재가</span>
                      <span className="center">수량</span>
                      <span className="right">총액</span>
                      <span></span>
                    </div>


                    {tempItems.map((i, idx) => (
                      <div key={idx} className="selected-row table">
                        <span>{i.name} ({i.code})</span>
                        <span>{i.market}</span>
                        <span className="right">{i.price}</span>

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
                          {calcTotal(i.price, i.quantity)}
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

            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setOpen(false)}>
                취소
              </button>
              <button className="primary-btn" onClick={save}>
                ETF 생성
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CreateEtfModal;
