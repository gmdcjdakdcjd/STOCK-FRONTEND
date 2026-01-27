import { useEffect, useState } from "react";
import "./EditEtfModal.css";

/* =========================
   Types
========================= */
interface MyStockItem {
  code: string;
  name: string;
  market: "KR" | "US";
  currentPrice: number | null;
}

interface TempItem {
  id: number | null;
  code: string;
  name: string;
  market: "KR" | "US";
  priceAtAdd: number | null;   // 🔑 편입가 (기존 or 현재가 스냅샷)
  quantity: number;
  originalQuantity?: number;
  deleted?: boolean;
}

interface Props {
  open: boolean;
  myStocks: MyStockItem[];
  onClose: () => void;
  onSaved: () => void;
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
export default function EditEtfModal({
  open,
  myStocks,
  onClose,
  onSaved,
}: Props) {
  const [etfList, setEtfList] = useState<string[]>([]);
  const [selectedEtf, setSelectedEtf] = useState("");

  const [description, setDescription] = useState("");
  const [items, setItems] = useState<TempItem[]>([]);

  /* =========================
     ETF 목록 로드
========================= */
  useEffect(() => {
    if (!open) return;

    fetch("/api/myetf/list?page=1&size=100")
      .then(res => res.json())
      .then(data => {
        const names = data.dtoList.map((e: any) => e.etfName);
        setEtfList(names);
        if (names.length > 0) {
          setSelectedEtf(names[0]);
        }
      });
  }, [open]);

  /* =========================
     선택 ETF 상세 로드
========================= */
  useEffect(() => {
    if (!open || !selectedEtf) return;

    fetch(`/api/myetf/detail?etfName=${encodeURIComponent(selectedEtf)}`)
      .then(res => res.json())
      .then(data => {
        setDescription(data.etfDescription ?? "");
        setItems(
          data.itemList.map((i: any) => ({
            id: i.id,
            code: i.code,
            name: i.name,
            market: i.market,
            priceAtAdd: i.priceAtAdd, // ✅ 서버에 저장된 편입가
            quantity: i.quantity,
            originalQuantity: i.quantity,
            deleted: false,
          }))
        );
      });
  }, [open, selectedEtf]);

  /* =========================
     신규 종목 추가 (현재가 스냅샷)
========================= */
  const addItem = (s: MyStockItem) => {
    setItems(prev => {
      const exist = prev.find(i => i.code === s.code && !i.deleted);
      if (exist) return prev;

      return [
        ...prev,
        {
          id: null,
          code: s.code,
          name: s.name,
          market: s.market,
          priceAtAdd: s.currentPrice, // 🔑 현재가 스냅샷
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
      alert("기존 종목의 수량은 변경할 수 없습니다.\n삭제 후 재등록하세요.");
      return;
    }

    fetch("/api/myetf/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        etfName: selectedEtf,
        etfDescription: description,
        items,
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error();
        alert("저장되었습니다.");
        onSaved();
        onClose();
      })
      .catch(() =>
        alert("ETF 수정 중 오류가 발생했습니다.")
      );
  };

  /* =========================
     Render
========================= */
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-body" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <header className="modal-header">
          <div className="header-text">
            <h3>ETF 종목 추가</h3>
            <div className="header-notice">
              기존 ETF 종목은 삭제할 수 없습니다.
              신규로 추가한 종목만 삭제 가능합니다.
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </header>

        <div className="modal-content">
          {/* ETF Meta */}
          <div className="form-section">
            <label>ETF 선택</label>
            <select
              value={selectedEtf}
              onChange={e => setSelectedEtf(e.target.value)}
            >
              {etfList.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            <label>ETF 설명</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="divider" />

          <div className="etf-builder">
            {/* ===== 좌측: 내 관심 종목 ===== */}
            <div className="search-panel">
              <h4>내 관심 종목</h4>

              <div className="search-table">
                <div className="search-row header">
                  <span>종목명</span>
                  <span>코드</span>
                  <span>시장</span>
                  <span className="right">현재가</span>
                  <span></span>
                </div>

                {myStocks.map(s => {
                  const selected = items.some(
                    it => it.code === s.code && !it.deleted
                  );

                  return (
                    <div
                      key={s.code}
                      className={`search-row ${selected ? "disabled" : ""}`}
                      onClick={() => !selected && addItem(s)}
                    >
                      <span>{s.name}</span>
                      <span>{s.code}</span>
                      <span>{s.market}</span>
                      <span className="right">
                        {formatPrice(s.currentPrice, s.market)}
                      </span>
                      <span className="action">
                        {selected ? "추가됨" : "추가"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ===== 우측: 구성 종목 ===== */}
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
                        {formatPrice(
                          (i.priceAtAdd ?? 0) * i.quantity,
                          i.market
                        )}
                      </span>

                      <button
                        className={`remove-btn icon ${!isNew ? "disabled" : ""}`}
                        disabled={!isNew}
                        onClick={() => isNew && removeItem(i.code)}
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

        {/* Footer */}
        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>취소</button>
          <button className="primary-btn" onClick={save}>저장</button>
        </div>
      </div>
    </div>
  );
}
