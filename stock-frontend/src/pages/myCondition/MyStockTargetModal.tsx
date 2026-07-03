import React, { useState, useEffect } from "react";

interface SelectedStock {
  code: string;
  name: string;
  currentPrice: number;
}

interface TargetValues {
  buyTarget: number | "";
  sellTarget: number | "";
}

interface MyStockTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStocks: SelectedStock[];
  onConfirm: (targets: Record<string, TargetValues>) => void;
  market: "kr" | "us";
}

const MyStockTargetModal: React.FC<MyStockTargetModalProps> = ({
  isOpen,
  onClose,
  selectedStocks,
  onConfirm,
  market,
}) => {
  // 종목별 목표가 입력 상태 관리 (key: stock code)
  const [targetMap, setTargetMap] = useState<Record<string, TargetValues>>({});

  // 일괄 적용용 퍼센트 인풋 상태
  const [batchBuyPercent, setBatchBuyPercent] = useState<string>("");
  const [batchSellPercent, setBatchSellPercent] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 선택된 종목들을 기준으로 초기 빈 값 매핑 생성
      const initialMap: Record<string, TargetValues> = {};
      selectedStocks.forEach((stock) => {
        initialMap[stock.code] = {
          buyTarget: "",
          sellTarget: "",
        };
      });
      setTargetMap(initialMap);
      setBatchBuyPercent("");
      setBatchSellPercent("");
    }
  }, [isOpen, selectedStocks]);

  if (!isOpen) return null;

  // 특정 종목의 특정 입력 필드 값 업데이트 핸들러
  const handleInputChange = (
    code: string,
    field: keyof TargetValues,
    value: string
  ) => {
    const numValue = value === "" ? "" : Number(value);
    setTargetMap((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        [field]: numValue,
      },
    }));
  };

  // 특정 종목의 특정 입력 필드 비우기 핸들러
  const handleClearInput = (code: string, field: keyof TargetValues) => {
    setTargetMap((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        [field]: "",
      },
    }));
  };

  // 시장별 화폐 포맷팅 유틸리티
  const formatMoney = (val: number | null | undefined | string) => {
    if (val == null || val === "") return "";
    const num = Number(val);
    if (isNaN(num)) return "";
    if (market === "kr") {
      return `${Math.round(num).toLocaleString()}원`;
    } else {
      return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  // 백분율 변화에 따른 자동 가격 계산 유틸리티
  const calculatePrice = (base: number, percentChange: number) => {
    const calculated = base * (1 + percentChange);
    if (market === "kr") {
      return Math.round(calculated);
    } else {
      return Number(calculated.toFixed(2));
    }
  };

  // 매수 일괄 퍼센트 적용 핸들러 (현재가 대비 -% 일괄 대입)
  const handleApplyBatchBuy = () => {
    const pct = Number(batchBuyPercent);
    if (isNaN(pct) || pct <= 0) {
      alert("올바른 매수 하락률(0보다 큰 숫자)을 입력해 주세요.");
      return;
    }
    setTargetMap((prev) => {
      const nextMap = { ...prev };
      selectedStocks.forEach((stock) => {
        nextMap[stock.code] = {
          ...nextMap[stock.code],
          buyTarget: calculatePrice(stock.currentPrice, -pct / 100),
        };
      });
      return nextMap;
    });
  };

  // 매도 일괄 퍼센트 적용 핸들러 (현재가 대비 +% 일괄 대입)
  const handleApplyBatchSell = () => {
    const pct = Number(batchSellPercent);
    if (isNaN(pct) || pct <= 0) {
      alert("올바른 매도 상승률(0보다 큰 숫자)을 입력해 주세요.");
      return;
    }
    setTargetMap((prev) => {
      const nextMap = { ...prev };
      selectedStocks.forEach((stock) => {
        nextMap[stock.code] = {
          ...nextMap[stock.code],
          sellTarget: calculatePrice(stock.currentPrice, pct / 100),
        };
      });
      return nextMap;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(targetMap);
  };

  return (
    <div className="save-modal-overlay" style={{ zIndex: 1100 }}>
      <div className="save-modal-body" style={{ width: "95%", maxWidth: "800px", padding: "26px" }}>
        {/* 모달 헤더 */}
        <header className="save-modal-header" style={{ marginBottom: "18px" }}>
          <h3 className="save-modal-title" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1f2937", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📌 관심종목 추가 - 목표가 입력</span>
            <span style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: "normal" }}>(총 {selectedStocks.length}개 종목)</span>
          </h3>
          <button className="save-modal-close-btn" type="button" onClick={onClose}>
            ✕
          </button>
        </header>

        {/* 일괄 퍼센트 계산 툴바 */}
        <div
          className="batch-percent-toolbar"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            background: "#f3f4f6",
            padding: "14px 18px",
            borderRadius: "10px",
            marginBottom: "18px",
            border: "1px solid #e5e7eb"
          }}
        >
          {/* 일괄 매수 계산기 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "280px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#991b1b" }}>🔴 일괄 매수 하락률:</span>
              <input
                type="number"
                placeholder="비율"
                value={batchBuyPercent}
                onChange={(e) => setBatchBuyPercent(e.target.value)}
                style={{ width: "70px", padding: "6px 8px", fontSize: "0.8rem", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none", textAlign: "center" }}
              />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>%</span>
              <button
                type="button"
                onClick={handleApplyBatchBuy}
                style={{ padding: "6px 12px", fontSize: "0.75rem", fontWeight: 700, border: "none", borderRadius: "6px", background: "#ef4444", color: "#ffffff", cursor: "pointer" }}
              >
                대입
              </button>
            </div>
            <span style={{ fontSize: "0.72rem", color: "#6b7280", marginLeft: "22px" }}>* 현재가 대비 퍼센테이지로 계산됩니다.</span>
          </div>

          {/* 일괄 매도 계산기 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "280px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#166534" }}>🟢 일괄 매도 상승률:</span>
              <input
                type="number"
                placeholder="비율"
                value={batchSellPercent}
                onChange={(e) => setBatchSellPercent(e.target.value)}
                style={{ width: "70px", padding: "6px 8px", fontSize: "0.8rem", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none", textAlign: "center" }}
              />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>%</span>
              <button
                type="button"
                onClick={handleApplyBatchSell}
                style={{ padding: "6px 12px", fontSize: "0.75rem", fontWeight: 700, border: "none", borderRadius: "6px", background: "#22c55e", color: "#ffffff", cursor: "pointer" }}
              >
                대입
              </button>
            </div>
            <span style={{ fontSize: "0.72rem", color: "#6b7280", marginLeft: "22px" }}>* 현재가 대비 퍼센테이지로 계산됩니다.</span>
          </div>
        </div>

        {/* 모달 콘텐츠 테이블 */}
        <form onSubmit={handleSubmit}>
          <div
            className="target-inputs-wrapper"
            style={{
              maxHeight: "350px",
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              marginBottom: "20px",
              background: "#ffffff"
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead style={{ background: "#f9fafb", position: "sticky", top: 0, zIndex: 10, borderBottom: "2px solid #e5e7eb" }}>
                <tr>
                  <th style={{ padding: "12px 14px", textAlign: "left", color: "#374151", fontWeight: 700 }}>종목정보</th>
                  <th style={{ padding: "12px 14px", textAlign: "center", color: "#374151", fontWeight: 700, background: "#fef2f2" }}>구매목표가</th>
                  <th style={{ padding: "12px 14px", textAlign: "center", color: "#374151", fontWeight: 700, background: "#f0fdf4" }}>판매목표가</th>
                </tr>
              </thead>
              <tbody>
                {selectedStocks.map((stock, idx) => {
                  const values = targetMap[stock.code] || {
                    buyTarget: "",
                    sellTarget: "",
                  };

                  return (
                    <tr key={stock.code} style={{ borderBottom: "1px solid #e5e7eb", background: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                      {/* 종목 기본 정보 */}
                      <td style={{ padding: "14px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.875rem" }}>{stock.name}</div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                          <span style={{ fontFamily: "monospace", color: "#6b7280", fontSize: "0.75rem" }}>{stock.code}</span>
                          <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 600 }}>
                            현재 {formatMoney(stock.currentPrice)}
                          </span>
                        </div>
                      </td>

                      {/* 구매목표가 입력 및 비우기 */}
                      <td style={{ padding: "12px 14px", background: "#fffafa" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                          <div style={{ display: "flex", gap: "6px", width: "100%", maxWidth: "200px" }}>
                            <input
                              type="number"
                              placeholder="목표 매수가"
                              style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none", textAlign: "right" }}
                              value={values.buyTarget}
                              onChange={(e) => handleInputChange(stock.code, "buyTarget", e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => handleClearInput(stock.code, "buyTarget")}
                              style={{ padding: "8px 10px", fontSize: "0.75rem", fontWeight: 700, border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f1f5f9", color: "#475569", cursor: "pointer" }}
                            >
                              비우기
                            </button>
                          </div>
                          {/* 실시간 콤마/화폐 단위 미리보기 가이드 */}
                          {values.buyTarget !== "" && (
                            <span style={{ fontSize: "0.75rem", color: "#b91c1c", fontWeight: 700 }}>
                              → {formatMoney(values.buyTarget)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 판매목표가 입력 및 비우기 */}
                      <td style={{ padding: "12px 14px", background: "#f7fdf9" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                          <div style={{ display: "flex", gap: "6px", width: "100%", maxWidth: "200px" }}>
                            <input
                              type="number"
                              placeholder="목표 매도가"
                              style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none", textAlign: "right" }}
                              value={values.sellTarget}
                              onChange={(e) => handleInputChange(stock.code, "sellTarget", e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => handleClearInput(stock.code, "sellTarget")}
                              style={{ padding: "8px 10px", fontSize: "0.75rem", fontWeight: 700, border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f1f5f9", color: "#475569", cursor: "pointer" }}
                            >
                              비우기
                            </button>
                          </div>
                          {/* 실시간 콤마/화폐 단위 미리보기 가이드 */}
                          {values.sellTarget !== "" && (
                            <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 700 }}>
                              → {formatMoney(values.sellTarget)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 모달 하단 푸터 버튼들 */}
          <footer className="save-modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button className="save-cancel-btn" type="button" onClick={onClose}>
              취소
            </button>
            <button
              className="save-confirm-btn"
              type="submit"
              style={{
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 22px",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(37, 99, 235, 0.15)"
              }}
            >
              관심종목에 추가하기
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default MyStockTargetModal;
