import { useEffect, useState } from "react";
import { createMyEtf } from "../../api/myEtfApi";
import type { MyEtfCreateRequestDTO } from "./myEtf.types";

import "./CreateEtfModal.css";

interface Props {
  onCreated: () => void;
}

interface TempItem {
  code: string;
  name: string;
  quantity: number;
}

function CreateEtfModal({ onCreated }: Props) {
  const [open, setOpen] = useState(false);

  const [etfName, setEtfName] = useState("");
  const [etfDescription, setEtfDescription] = useState("");

  const [keyword, setKeyword] = useState("");
  const [searchResult, setSearchResult] = useState<any[]>([]);

  const [tempItems, setTempItems] = useState<TempItem[]>([]);

  /* =========================
     공통 초기화
     ========================= */
  const resetForm = () => {
    setEtfName("");
    setEtfDescription("");
    setKeyword("");
    setSearchResult([]);
    setTempItems([]);
  };

  /* =========================
     종목 검색 (자동완성)
     ========================= */
  useEffect(() => {
    if (keyword.trim().length < 1) {
      setSearchResult([]);
      return;
    }

    fetch(
      `/common/api/autocomplete/code?q=${encodeURIComponent(keyword)}`
    )
      .then(res => res.json())
      .then(setSearchResult);
  }, [keyword]);

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
      items: tempItems
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
          className="modal-overlay"
          onClick={() => {
            resetForm();
            setOpen(false);
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
                  setOpen(false);
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
                {/* 좌측: 검색 */}
                <div className="search-panel">
                  <h4>종목 검색</h4>

                  <div className="search-bar">
                    <input
                      className="search-input"
                      placeholder="종목코드 또는 종목명"
                      value={keyword}
                      onChange={e => setKeyword(e.target.value)}
                    />

                    {/* <button className="search-btn">
                      검색
                    </button>

                    <button
                      className="reset-btn ghost"
                      onClick={() => {
                        setKeyword("");
                        setSearchResult([]);
                      }}
                    >
                      초기화
                    </button> */}
                  </div>

                  <div className="search-list">
                    {searchResult.length === 0 && keyword && (
                      <div className="empty">
                        검색 결과 없음
                      </div>
                    )}

                    {searchResult.map(r => {
                      const isSelected = tempItems.some(
                        i => i.code === r.code
                      );

                      return (
                        <div
                          key={r.code}
                          className={`search-item ${
                            isSelected ? "disabled" : ""
                          }`}
                          onClick={() =>
                            !isSelected && addItem(r.code, r.name)
                          }
                        >
                          <div className="search-info">
                            <strong>{r.name}</strong>
                            <span className="code">{r.code}</span>
                          </div>

                          {isSelected ? (
                            <span className="added">추가됨</span>
                          ) : (
                            <span className="add-hint">추가</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 우측: 구성 종목 */}
                <div className="selected-panel">
                  <h4>구성 종목</h4>

                  <div className="selected-header">
                    <span>종목</span>
                    <span>수량</span>
                    <span></span>
                  </div>

                  {tempItems.length === 0 && (
                    <div className="empty">
                      왼쪽에서 종목을 검색해 추가하세요
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

            {/* Footer */}
            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={() => {
                  resetForm();
                  setOpen(false);
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
      )}
    </>
  );
}

export default CreateEtfModal;
