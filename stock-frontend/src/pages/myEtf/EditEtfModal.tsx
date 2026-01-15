import { useEffect, useState } from "react";

import "./EditEtfModal.css";

interface TempItem {
  id: number | null;
  code: string;
  name: string;
  quantity: number;
  originalQuantity?: number;
  deleted?: boolean;
}

interface Props {
  etfName: string;
  onSaved: () => void;
}

export default function EditEtfModal({ etfName, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [keyword, setKeyword] = useState("");
  const [searchList, setSearchList] = useState<any[]>([]);
  const [items, setItems] = useState<TempItem[]>([]);

  /* =========================
     초기 데이터 로드
     ========================= */
  useEffect(() => {
    if (!open) return;

    fetch(`/myetf/api/detail?etfName=${encodeURIComponent(etfName)}`)
      .then(res => res.json())
      .then(data => {
        setDescription(data.etfDescription ?? "");
        setItems(
          data.itemList.map((i: any) => ({
            id: i.id,
            code: i.code,
            name: i.name,
            quantity: i.quantity,
            originalQuantity: i.quantity,
            deleted: false,
          }))
        );
      });
  }, [open, etfName]);

  /* =========================
     종목 검색
     ========================= */
  useEffect(() => {
    if (!keyword.trim()) {
      setSearchList([]);
      return;
    }

    fetch(`/board/autocomplete?q=${encodeURIComponent(keyword)}`)
      .then(res => res.json())
      .then(setSearchList);
  }, [keyword]);

  /* =========================
     종목 추가 / 삭제
     ========================= */
  const addItem = (code: string, name: string) => {
    setItems(prev => {
      const exist = prev.find(i => i.code === code && !i.deleted);
      if (exist) {
        return prev.map(i =>
          i.code === code
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { id: null, code, name, quantity: 1 }];
    });
  };

  const removeItem = (idx: number) => {
    setItems(prev =>
      prev.map((i, pIdx) =>
        pIdx === idx ? { ...i, deleted: true } : i
      )
    );
  };

  /* =========================
     저장
     ========================= */
  const save = () => {
    const invalid = items.filter(
      i =>
        i.id !== null &&
        !i.deleted &&
        i.quantity !== i.originalQuantity
    );

    if (invalid.length > 0) {
      setItems(prev =>
        prev.map(i =>
          invalid.some(v => v.code === i.code)
            ? { ...i, quantity: i.originalQuantity! }
            : i
        )
      );
      alert(
        "기존 종목의 수량은 변경할 수 없습니다.\n삭제 후 재등록하세요."
      );
      return;
    }

    fetch("/myetf/api/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        etfName,
        etfDescription: description,
        items,
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error();
        alert("저장되었습니다.");
        setOpen(false);
        onSaved();
      })
      .catch(() =>
        alert("ETF 수정 중 오류가 발생했습니다.")
      );
  };

  /* =========================
     Render
     ========================= */
  return (
    <>
      <button
        className="ghost-btn"
        onClick={() => setOpen(true)}
      >
        종목 편집
      </button>


      {open && (
        <div className="modal-overlay">
          <div className="modal-body">
            <header className="modal-header">
              <div className="header-text">
                <h3>ETF 종목 편집</h3>
                <div className="header-notice">
                  기존 종목의 수량은 변경할 수 없습니다. 삭제 후 재등록하세요.
                </div>
              </div>

              <button
                className="close-btn"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </header>

            <div className="modal-content">
              {/* ETF 메타 */}
              <div className="form-section">
                <label>ETF 이름</label>
                <input value={etfName} readOnly />

                <label>ETF 설명</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="divider" />

              {/* ===== ETF Builder ===== */}
              <div className="etf-builder">
                {/* 검색 패널 */}
                <div className="search-panel">
                  <h4>종목 검색</h4>

                  <div className="search-bar">
                    <input
                      className="search-input"
                      placeholder="종목명 또는 종목코드"
                      value={keyword}
                      onChange={e => setKeyword(e.target.value)}
                    />
                  </div>

                  <div className="search-list">
                    {searchList.map(i => {
                      const selected = items.some(
                        it => it.code === i.code && !it.deleted
                      );

                      return (
                        <div
                          key={i.code}
                          className={`search-item ${selected ? "disabled" : ""}`}
                          onClick={() =>
                            !selected && addItem(i.code, i.name)
                          }
                        >
                          <div className="search-info">
                            <strong>{i.name}</strong>
                            <span className="code">{i.code}</span>
                          </div>

                          {selected ? (
                            <span className="added">추가됨</span>
                          ) : (
                            <span className="add-hint">추가</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 선택 패널 */}
                <div className="selected-panel">
                  <h4>구성 종목</h4>

                  {/* 헤더 */}
                  <div className="selected-header">
                    <span className="col-name">종목</span>
                    <span className="col-qty">수량</span>
                    <span className="col-action"></span>
                  </div>


                  {items.filter(i => !i.deleted).length === 0 && (
                    <div className="empty">선택된 종목이 없습니다</div>
                  )}

                  {items
                    .filter(i => !i.deleted)
                    .map((i, idx) => {
                      const isNew = i.id === null;

                      return (
                        <div key={idx} className="selected-row">
                          {/* 종목 */}
                          <span className="col-name">
                            {i.name} ({i.code})
                          </span>

                          {/* 수량 */}
                          <div className="col-qty">
                            {isNew ? (
                              <div className="qty-control">
                                <button
                                  className="qty-btn minus"
                                  onClick={() =>
                                    setItems(prev =>
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
                                    setItems(prev =>
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
                            ) : (
                              <span className="fixed-qty">
                                {i.quantity}
                              </span>
                            )}
                          </div>

                          {/* 삭제 */}
                          <button
                            className="remove-btn icon"
                            onClick={() => removeItem(idx)}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={() => setOpen(false)}
              >
                취소
              </button>
              <button
                className="primary-btn"
                onClick={save}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
