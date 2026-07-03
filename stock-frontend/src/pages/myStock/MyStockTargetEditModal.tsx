import React, { useState, useEffect } from "react";
import type { MyStockDTO } from "../../api/myStockApi";

interface MyStockTargetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: MyStockDTO | null;
  onSave: (id: number, targets: {
    buyTargetPrice1: number | null;
    buyTargetPrice2: number | null;
    buyTargetPrice3: number | null;
    sellTargetPrice1: number | null;
    sellTargetPrice2: number | null;
    sellTargetPrice3: number | null;
  }) => Promise<void>;
  market: "kr" | "us";
}

const MyStockTargetEditModal: React.FC<MyStockTargetEditModalProps> = ({
  isOpen,
  onClose,
  stock,
  onSave,
  market,
}) => {
  /* 저점매수 (buyTargetPrice1) 상태 */
  const [buyTarget1, setBuyTarget1] = useState<string>("");
  const [buyPercent1, setBuyPercent1] = useState<string>("");
  const [buyBaseMode1, setBuyBaseMode1] = useState<"priceAtAdd" | "currentPrice">("currentPrice");
  const [buyDirection1, setBuyDirection1] = useState<"down" | "up">("down");

  /* 고점매수 (buyTargetPrice2) 상태 */
  const [buyTarget2, setBuyTarget2] = useState<string>("");
  const [buyPercent2, setBuyPercent2] = useState<string>("");
  const [buyBaseMode2, setBuyBaseMode2] = useState<"priceAtAdd" | "currentPrice">("currentPrice");
  const [buyDirection2, setBuyDirection2] = useState<"down" | "up">("up");

  /* 익절가 (sellTargetPrice2) 상태 */
  const [sellTarget2, setSellTarget2] = useState<string>("");
  const [sellPercent2, setSellPercent2] = useState<string>("");
  const [sellBaseMode2, setSellBaseMode2] = useState<"priceAtAdd" | "currentPrice">("currentPrice");
  const [sellDirection2, setSellDirection2] = useState<"down" | "up">("up");

  /* 손절가 (sellTargetPrice3) 상태 */
  const [sellTarget3, setSellTarget3] = useState<string>("");
  const [sellPercent3, setSellPercent3] = useState<string>("");
  const [sellBaseMode3, setSellBaseMode3] = useState<"priceAtAdd" | "currentPrice">("currentPrice");
  const [sellDirection3, setSellDirection3] = useState<"down" | "up">("down");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  /* 모달 오픈 시 기존 목표가 데이터 로딩 */
  useEffect(() => {
    if (isOpen && stock) {
      setBuyTarget1(stock.buyTargetPrice1 != null ? stock.buyTargetPrice1.toString() : "");
      setBuyTarget2(stock.buyTargetPrice2 != null ? stock.buyTargetPrice2.toString() : "");
      setSellTarget2(stock.sellTargetPrice1 != null ? stock.sellTargetPrice1.toString() : "");
      setSellTarget3(stock.sellTargetPrice2 != null ? stock.sellTargetPrice2.toString() : "");

      setBuyPercent1("");
      setBuyPercent2("");
      setSellPercent2("");
      setSellPercent3("");
      setErrors([]);
    }
  }, [isOpen, stock]);

  if (!isOpen || !stock) return null;

  /* 계산 기준 가격 가져오기 */
  const getBasePrice = (mode: "priceAtAdd" | "currentPrice") => {
    return mode === "priceAtAdd"
      ? (stock.priceAtAdd || stock.currentPrice || 0)
      : (stock.currentPrice || stock.priceAtAdd || 0);
  };

  /* 시장 통화 단위 포맷팅 */
  const formatMoney = (val: number | null | undefined) => {
    if (val == null) return "-";
    if (market === "kr") {
      return `${Math.round(val).toLocaleString()}원`;
    } else {
      return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  /* 퍼센트 비율 계산 */
  const calculatePrice = (base: number, percentChange: number) => {
    const calculated = base * (1 + percentChange);
    if (market === "kr") {
      return Math.round(calculated).toString();
    } else {
      return Number(calculated.toFixed(2)).toString();
    }
  };

  /* 자동 계산 미리보기 텍스트 */
  const getPreviewText = (val: string) => {
    if (val === "") return "";
    const num = Number(val);
    if (isNaN(num)) return "";
    return `→ ${formatMoney(num)}`;
  };

  /* 퍼센트 계산 대입 처리 */
  const handleApplyPercent = (
    basePrice: number,
    percentStr: string,
    direction: "down" | "up",
    setTarget: (val: string) => void
  ) => {
    const pct = Number(percentStr);
    if (isNaN(pct) || pct <= 0) {
      alert("올바른 퍼센트 수치(0보다 큰 숫자)를 입력해 주세요.");
      return;
    }
    setTarget(calculatePrice(basePrice, direction === "down" ? -pct / 100 : pct / 100));
  };

  /* 저장 및 전송 처리 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const parseValue = (val: string) => {
        return val === "" ? null : Number(val);
      };

      const basePrice = stock.priceAtAdd || stock.currentPrice || 0;
      const parsedSell1 = parseValue(sellTarget2); /* 익절가 */
      const parsedSell2 = parseValue(sellTarget3); /* 손절가 */

      const validationErrors: string[] = [];

      if (basePrice > 0) {
        if (parsedSell1 != null && parsedSell1 <= basePrice) {
          validationErrors.push(`• 익절가는 편입가(${formatMoney(basePrice)})보다 커야 합니다.`);
        }
        if (parsedSell2 != null && parsedSell2 >= basePrice) {
          validationErrors.push(`• 손절가는 편입가(${formatMoney(basePrice)})보다 작아야 합니다.`);
        }
      }

      const baseCurrentPrice = stock.currentPrice || stock.priceAtAdd || 0;
      const parsedBuy1 = parseValue(buyTarget1); /* 저점매수 */
      const parsedBuy2 = parseValue(buyTarget2); /* 고점매수 */

      if (baseCurrentPrice > 0) {
        if (parsedBuy1 != null && parsedBuy1 >= baseCurrentPrice) {
          validationErrors.push(`• 저점매수가는 현재가(${formatMoney(baseCurrentPrice)})보다 작아야 합니다.`);
        }
        if (parsedBuy2 != null && parsedBuy2 <= baseCurrentPrice) {
          validationErrors.push(`• 고점매수가는 현재가(${formatMoney(baseCurrentPrice)})보다 커야 합니다.`);
        }
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setIsSubmitting(false);
        return;
      }

      await onSave(stock.id, {
        buyTargetPrice1: parseValue(buyTarget1),
        buyTargetPrice2: parseValue(buyTarget2),
        buyTargetPrice3: null,
        sellTargetPrice1: parsedSell1, /* 익절가 -> sellTargetPrice1 */
        sellTargetPrice2: parsedSell2, /* 손절가 -> sellTargetPrice2 */
        sellTargetPrice3: null, /* 3차 매도 미사용 */
      });
      onClose();
    } catch (error) {
      console.error("목표가 저장 오류:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="save-modal-overlay" style={{ zIndex: 1100 }}>
      <div className="save-modal-body" style={{ width: "95%", maxWidth: "1100px", padding: "26px" }}>
        {/* 모달 헤더 */}
        <header className="save-modal-header" style={{ marginBottom: "18px" }}>
          <h3 className="save-modal-title" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1f2937" }}>
            🎯 목표가 설정 - <span style={{ color: "#2563eb" }}>{stock.name}</span>
          </h3>
          <button className="save-modal-close-btn" type="button" onClick={onClose}>
            ✕
          </button>
        </header>

        {/* 종목 요약 정보 */}
        <div style={{ display: "flex", gap: "16px", background: "#f3f4f6", padding: "12px 16px", borderRadius: "8px", marginBottom: "14px", fontSize: "0.85rem", color: "#4b5563" }}>
          <div>코드: <strong style={{ fontFamily: "monospace" }}>{stock.code}</strong></div>
          <div>현재가: <strong style={{ color: "#111827" }}>{formatMoney(stock.currentPrice)}</strong></div>
          <div>편입가: <strong>{formatMoney(stock.priceAtAdd || 0)}</strong></div>
        </div>

        {/* 에러 안내 메시지 박스 */}
        {errors.length > 0 && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            borderRadius: "10px",
            padding: "16px 20px",
            marginBottom: "16px",
            color: "#991b1b",
            fontSize: "0.85rem",
            boxShadow: "0 2px 4px rgba(239, 68, 68, 0.05)"
          }}>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              ⚠️ 목표가 설정 조건 오류
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.6" }}>
              {errors.map((err, idx) => (
                <li key={idx} style={{ fontWeight: 500 }}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 모달 폼 본문 */}
        <form onSubmit={handleSubmit}>
          <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "12px", fontWeight: "500" }}>
            * 아래 각 목표가의 대입 입력 칸은 퍼센테이지(%) 수치로 자동 계산되어 대입됩니다.
          </div>
          {/* 4대 목표가 카드 배치 그리드 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>

            {/* 1. 저점매수 카드 (황색) */}
            <div style={{ background: "#fffbeb", padding: "16px", borderRadius: "10px", border: "1px solid #fde68a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #fcd34d", paddingBottom: "8px", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
                <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#92400e" }}>
                  📉 저점매수
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>기준:</span>
                  <button type="button" onClick={() => setBuyBaseMode1("currentPrice")} style={{ padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700, borderRadius: "5px", border: "none", cursor: "pointer", background: buyBaseMode1 === "currentPrice" ? "#d97706" : "#e5e7eb", color: buyBaseMode1 === "currentPrice" ? "#fff" : "#6b7280" }}>현재가</button>
                  <button type="button" onClick={() => setBuyBaseMode1("priceAtAdd")} style={{ padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700, borderRadius: "5px", border: "none", cursor: "pointer", background: buyBaseMode1 === "priceAtAdd" ? "#d97706" : "#e5e7eb", color: buyBaseMode1 === "priceAtAdd" ? "#fff" : "#6b7280" }}>편입가</button>
                  <span style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 600 }}>{formatMoney(getBasePrice(buyBaseMode1))}</span>
                </div>
                <span style={{ fontSize: "0.8rem", color: "#d97706", fontWeight: 600, width: "100%", textAlign: "right" }}>{getPreviewText(buyTarget1)}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>
                  저점매수 목표단가
                  <input type="number" style={{ width: "100%", padding: "8px 10px", fontSize: "0.85rem", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none", marginTop: "4px", textAlign: "right" }} value={buyTarget1} onChange={(e) => setBuyTarget1(e.target.value)} placeholder="저점매수 목표단가 직접 입력" />
                </label>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "6px" }}>
                  <button type="button" onClick={() => setBuyDirection1("down")} style={{ padding: "6px 10px", fontSize: "0.75rem", fontWeight: 700, borderRadius: "6px", border: "none", cursor: "pointer", background: buyDirection1 === "down" ? "#d97706" : "#e5e7eb", color: buyDirection1 === "down" ? "#fff" : "#6b7280" }}>하락 ▼</button>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "4px" }}>
                    <input type="number" placeholder="비율" value={buyPercent1} onChange={(e) => setBuyPercent1(e.target.value)} style={{ width: "100%", padding: "6px 8px", fontSize: "0.8rem", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none", textAlign: "center" }} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>%</span>
                  </div>
                  <button type="button" onClick={() => handleApplyPercent(getBasePrice(buyBaseMode1), buyPercent1, buyDirection1, setBuyTarget1)} style={{ padding: "6px 12px", fontSize: "0.75rem", fontWeight: 700, border: "none", borderRadius: "6px", background: "#f59e0b", color: "#ffffff", cursor: "pointer" }}>대입</button>
                  <button type="button" onClick={() => { setBuyTarget1(""); setBuyPercent1(""); }} style={{ padding: "6px 12px", fontSize: "0.75rem", fontWeight: 700, border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f1f5f9", color: "#475569", cursor: "pointer" }}>비우기</button>
                </div>
              </div>
            </div>

            {/* 2. 고점매수 카드 (보라) */}
            <div style={{ background: "#fdf4ff", padding: "16px", borderRadius: "10px", border: "1px solid #e9d5ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #d8b4fe", paddingBottom: "8px", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
                <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#6b21a8" }}>
                  📈 고점매수
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>기준:</span>
                  <button type="button" onClick={() => setBuyBaseMode2("currentPrice")} style={{ padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700, borderRadius: "5px", border: "none", cursor: "pointer", background: buyBaseMode2 === "currentPrice" ? "#7e22ce" : "#e5e7eb", color: buyBaseMode2 === "currentPrice" ? "#fff" : "#6b7280" }}>현재가</button>
                  <button type="button" onClick={() => setBuyBaseMode2("priceAtAdd")} style={{ padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700, borderRadius: "5px", border: "none", cursor: "pointer", background: buyBaseMode2 === "priceAtAdd" ? "#7e22ce" : "#e5e7eb", color: buyBaseMode2 === "priceAtAdd" ? "#fff" : "#6b7280" }}>편입가</button>
                  <span style={{ fontSize: "0.75rem", color: "#7e22ce", fontWeight: 600 }}>{formatMoney(getBasePrice(buyBaseMode2))}</span>
                </div>
                <span style={{ fontSize: "0.8rem", color: "#7e22ce", fontWeight: 600, width: "100%", textAlign: "right" }}>{getPreviewText(buyTarget2)}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>
                  고점매수 목표단가
                  <input type="number" style={{ width: "100%", padding: "8px 10px", fontSize: "0.85rem", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none", marginTop: "4px", textAlign: "right" }} value={buyTarget2} onChange={(e) => setBuyTarget2(e.target.value)} placeholder="고점매수 목표단가 직접 입력" />
                </label>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "6px" }}>
                  <button type="button" onClick={() => setBuyDirection2("up")} style={{ padding: "6px 10px", fontSize: "0.75rem", fontWeight: 700, borderRadius: "6px", border: "none", cursor: "pointer", background: buyDirection2 === "up" ? "#7e22ce" : "#e5e7eb", color: buyDirection2 === "up" ? "#fff" : "#6b7280" }}>상승 ▲</button>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "4px" }}>
                    <input type="number" placeholder="비율" value={buyPercent2} onChange={(e) => setBuyPercent2(e.target.value)} style={{ width: "100%", padding: "6px 8px", fontSize: "0.8rem", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none", textAlign: "center" }} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>%</span>
                  </div>
                  <button type="button" onClick={() => handleApplyPercent(getBasePrice(buyBaseMode2), buyPercent2, buyDirection2, setBuyTarget2)} style={{ padding: "6px 12px", fontSize: "0.75rem", fontWeight: 700, border: "none", borderRadius: "6px", background: "#9333ea", color: "#ffffff", cursor: "pointer" }}>대입</button>
                  <button type="button" onClick={() => { setBuyTarget2(""); setBuyPercent2(""); }} style={{ padding: "6px 12px", fontSize: "0.75rem", fontWeight: 700, border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f1f5f9", color: "#475569", cursor: "pointer" }}>비우기</button>
                </div>
              </div>
            </div>

            {/* 3. 익절가 카드 (빨강) */}
            <div style={{ background: "#fffafa", padding: "16px", borderRadius: "10px", border: "1px solid #fee2e2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #fecaca", paddingBottom: "8px", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
                <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#b91c1c" }}>
                  🔴 익절가
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>기준:</span>
                  <button type="button" onClick={() => setSellBaseMode2("currentPrice")} style={{ padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700, borderRadius: "5px", border: "none", cursor: "pointer", background: sellBaseMode2 === "currentPrice" ? "#b91c1c" : "#e5e7eb", color: sellBaseMode2 === "currentPrice" ? "#fff" : "#6b7280" }}>현재가</button>
                  <button type="button" onClick={() => setSellBaseMode2("priceAtAdd")} style={{ padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700, borderRadius: "5px", border: "none", cursor: "pointer", background: sellBaseMode2 === "priceAtAdd" ? "#b91c1c" : "#e5e7eb", color: sellBaseMode2 === "priceAtAdd" ? "#fff" : "#6b7280" }}>편입가</button>
                  <span style={{ fontSize: "0.75rem", color: "#b91c1c", fontWeight: 600 }}>{formatMoney(getBasePrice(sellBaseMode2))}</span>
                </div>
                <span style={{ fontSize: "0.8rem", color: "#b91c1c", fontWeight: 600, width: "100%", textAlign: "right" }}>{getPreviewText(sellTarget2)}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>
                  익절 목표단가
                  <input type="number" style={{ width: "100%", padding: "8px 10px", fontSize: "0.85rem", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none", marginTop: "4px", textAlign: "right" }} value={sellTarget2} onChange={(e) => setSellTarget2(e.target.value)} placeholder="익절 목표단가 직접 입력" />
                </label>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "6px" }}>
                  <button type="button" onClick={() => setSellDirection2("up")} style={{ padding: "6px 10px", fontSize: "0.75rem", fontWeight: 700, borderRadius: "6px", border: "none", cursor: "pointer", background: sellDirection2 === "up" ? "#b91c1c" : "#e5e7eb", color: sellDirection2 === "up" ? "#fff" : "#6b7280" }}>상승 ▲</button>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "4px" }}>
                    <input type="number" placeholder="비율" value={sellPercent2} onChange={(e) => setSellPercent2(e.target.value)} style={{ width: "100%", padding: "6px 8px", fontSize: "0.8rem", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none", textAlign: "center" }} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>%</span>
                  </div>
                  <button type="button" onClick={() => handleApplyPercent(getBasePrice(sellBaseMode2), sellPercent2, sellDirection2, setSellTarget2)} style={{ padding: "6px 12px", fontSize: "0.75rem", fontWeight: 700, border: "none", borderRadius: "6px", background: "#ef4444", color: "#ffffff", cursor: "pointer" }}>대입</button>
                  <button type="button" onClick={() => { setSellTarget2(""); setSellPercent2(""); }} style={{ padding: "6px 12px", fontSize: "0.75rem", fontWeight: 700, border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f1f5f9", color: "#475569", cursor: "pointer" }}>비우기</button>
                </div>
              </div>
            </div>

            {/* 4. 손절가 카드 (파랑) */}
            <div style={{ background: "#f0f9ff", padding: "16px", borderRadius: "10px", border: "1px solid #e0f2fe" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #bae6fd", paddingBottom: "8px", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
                <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#0369a1" }}>
                  🔵 손절가
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>기준:</span>
                  <button type="button" onClick={() => setSellBaseMode3("currentPrice")} style={{ padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700, borderRadius: "5px", border: "none", cursor: "pointer", background: sellBaseMode3 === "currentPrice" ? "#0284c7" : "#e5e7eb", color: sellBaseMode3 === "currentPrice" ? "#fff" : "#6b7280" }}>현재가</button>
                  <button type="button" onClick={() => setSellBaseMode3("priceAtAdd")} style={{ padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700, borderRadius: "5px", border: "none", cursor: "pointer", background: sellBaseMode3 === "priceAtAdd" ? "#0284c7" : "#e5e7eb", color: sellBaseMode3 === "priceAtAdd" ? "#fff" : "#6b7280" }}>편입가</button>
                  <span style={{ fontSize: "0.75rem", color: "#0284c7", fontWeight: 600 }}>{formatMoney(getBasePrice(sellBaseMode3))}</span>
                </div>
                <span style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 600, width: "100%", textAlign: "right" }}>{getPreviewText(sellTarget3)}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>
                  손절 기준단가
                  <input type="number" style={{ width: "100%", padding: "8px 10px", fontSize: "0.85rem", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none", marginTop: "4px", textAlign: "right" }} value={sellTarget3} onChange={(e) => setSellTarget3(e.target.value)} placeholder="손절 기준단가 직접 입력" />
                </label>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "6px" }}>
                  <button type="button" onClick={() => setSellDirection3("down")} style={{ padding: "6px 10px", fontSize: "0.75rem", fontWeight: 700, borderRadius: "6px", border: "none", cursor: "pointer", background: sellDirection3 === "down" ? "#0284c7" : "#e5e7eb", color: sellDirection3 === "down" ? "#fff" : "#6b7280" }}>하락 ▼</button>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "4px" }}>
                    <input type="number" placeholder="비율" value={sellPercent3} onChange={(e) => setSellPercent3(e.target.value)} style={{ width: "100%", padding: "6px 8px", fontSize: "0.8rem", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none", textAlign: "center" }} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>%</span>
                  </div>
                  <button type="button" onClick={() => handleApplyPercent(getBasePrice(sellBaseMode3), sellPercent3, sellDirection3, setSellTarget3)} style={{ padding: "6px 12px", fontSize: "0.75rem", fontWeight: 700, border: "none", borderRadius: "6px", background: "#0284c7", color: "#ffffff", cursor: "pointer" }}>대입</button>
                  <button type="button" onClick={() => { setSellTarget3(""); setSellPercent3(""); }} style={{ padding: "6px 12px", fontSize: "0.75rem", fontWeight: 700, border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f1f5f9", color: "#475569", cursor: "pointer" }}>비우기</button>
                </div>
              </div>
            </div>

          </div>

          {/* 모달 푸터 버튼 */}
          <footer className="save-modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button className="save-cancel-btn" type="button" onClick={onClose} disabled={isSubmitting}>
              취소
            </button>
            <button
              className="save-confirm-btn"
              type="submit"
              disabled={isSubmitting}
              style={{
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 22px",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 6px rgba(37, 99, 235, 0.15)",
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? "저장 중..." : "목표가 저장"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default MyStockTargetEditModal;
