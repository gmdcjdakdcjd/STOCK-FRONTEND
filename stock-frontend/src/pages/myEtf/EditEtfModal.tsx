import { useEffect, useState } from "react";
import "./EditEtfModal.css";

interface TempItem {
  id: number | null;
  code: string;
  name: string;
  market: "KR" | "US";

  priceAtAdd: number; // KR: KRW / US: USD (원본)
  quantity: number;

  originalQuantity?: number;
  deleted?: boolean;
}

interface SearchItem {
  code: string;
  name: string;
  market: "KR" | "US";
  price: string; // "$123.45" | "12,345"
}

interface Props {
  etfName: string;
  onSaved: () => void;
}

/* =========================
   Utils
========================= */
const parsePrice = (price: string): number => {
  const numeric = price.replace(/[^0-9.]/g, "");
  return Number(numeric) || 0;
};

const formatPrice = (price: number, market: "KR" | "US"): string =>
  market === "US"
    ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    : `${price.toLocaleString()}원`;

const calcTotal = (price: number, qty: number, market: "KR" | "US"): string => {
  const total = price * qty;
  return formatPrice(total, market);
};

export default function EditEtfModal({ etfName, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [keyword, setKeyword] = useState("");
  const [searchList, setSearchList] = useState<SearchItem[]>([]);
  const [items, setItems] = useState<TempItem[]>([]);

  /* =========================
     초기 데이터 로드 (기존 ETF 종목)
  ========================= */
  useEffect(() => {
    if (!open) return;

    fetch(`/api/myetf/detail?etfName=${encodeURIComponent(etfName)}`)
      .then(res => res.json())
      .then(data => {
        setDescription(data.etfDescription ?? "");
        setItems(
          data.itemList.map((i: any) => ({
            id: i.id,
            code: i.code,
            name: i.name,
            market: i.market,
            priceAtAdd: i.priceAtAdd, // 🔑 원본 가격
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

    fetch(`/api/common/autocomplete/code?q=${encodeURIComponent(keyword)}`)
      .then(res => res.json())
      .then(data =>
        setSearchList(
          data.map((i: any) => ({
            code: i.code,
            name: i.name,
            market: i.market,
            price: i.price ?? "-",
          }))
        )
      );
  }, [keyword]);

  /* =========================
     신규 종목 추가
  ========================= */
  const addItem = (r: SearchItem) => {
    setItems(prev => {
      const exist = prev.find(i => i.code === r.code && !i.deleted);
      if (exist) return prev;

      return [
        ...prev,
        {
          id: null,
          code: r.code,
          name: r.name,
          market: r.market,
          priceAtAdd: parsePrice(r.price),
          quantity: 1,
        },
      ];
    });
  };

  const removeItem = (code: string) => {
    setItems(prev =>
      prev.map(i =>
        i.code === code ? { ...i, deleted: true } : i
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
      alert("기존 종목의 수량은 변경할 수 없습니다.\n삭제 후 재등록하세요.");
      return;
    }

    fetch("/api/myetf/edit", {
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
      <button className="ghost-btn" onClick={() => setOpen(true)}>
        종목 편집
      </button>

      {open && (
        <div
          className="modal-overlay"
          onClick={e => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="modal-body" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <div className="header-text">
                <h3>ETF 종목 편집</h3>
                <div className="header-notice">
                  기존 종목의 수량은 변경할 수 없습니다. 삭제 후 재등록하세요.
                </div>
              </div>
              <button className="close-btn" onClick={() => setOpen(false)}>✕</button>
            </header>

            <div className="modal-content">
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
                    <button
                      className="reset-btn ghost"
                      onClick={() => {
                        setKeyword("");
                        setSearchList([]);
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

                    {searchList.map(r => {
                      const selected = items.some(
                        i => i.code === r.code && !i.deleted
                      );

                      return (
                        <div
                          key={r.code}
                          className={`search-row ${selected ? "disabled" : ""}`}
                          onClick={() => !selected && addItem(r)}
                        >
                          <span>{r.name}</span>
                          <span>{r.code}</span>
                          <span>{r.market}</span>
                          <span className="right">{r.price}</span>
                          <span className="action">
                            {selected ? "추가됨" : "추가"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 선택 패널 */}
                <div className="selected-panel">
                  <h4>구성 종목</h4>

                  <div className="selected-list">
                    <div className="selected-header table">
                      <span>종목</span>
                      <span>시장</span>
                      <span className="right">편입가</span>
                      <span className="center">수량</span>
                      <span className="right">총액</span>
                      <span></span>
                    </div>

                    {items.filter(i => !i.deleted).map(i => {
                      const isNew = i.id === null;

                      return (
                        <div key={i.code} className="selected-row table">
                          <span>{i.name} ({i.code})</span>
                          <span>{i.market}</span>

                          <span className="right">
                            {formatPrice(i.priceAtAdd, i.market)}
                          </span>

                          <div className="qty-control">
                            {isNew ? (
                              <>
                                <button
                                  className="qty-btn minus"
                                  onClick={() =>
                                    setItems(prev =>
                                      prev.map(p =>
                                        p.code === i.code && p.quantity > 1
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
                                    setItems(prev =>
                                      prev.map(p =>
                                        p.code === i.code
                                          ? { ...p, quantity: p.quantity + 1 }
                                          : p
                                      )
                                    )
                                  }
                                >
                                  +
                                </button>
                              </>
                            ) : (
                              <span className="fixed-qty">{i.quantity}</span>
                            )}
                          </div>

                          <span className="right">
                            {calcTotal(i.priceAtAdd, i.quantity, i.market)}
                          </span>

                          <button
                            className="remove-btn icon"
                            onClick={() => removeItem(i.code)}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setOpen(false)}>
                취소
              </button>
              <button className="primary-btn" onClick={save}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
