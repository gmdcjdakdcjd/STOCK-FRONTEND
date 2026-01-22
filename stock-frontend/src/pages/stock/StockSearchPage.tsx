import { useState } from "react";
import "./StockSearchPage.css";
import BasicLayout from "../../layouts/BasicLayout";
import StockSearchChart from "./StockSearchChart";
import type { RangeType } from "./StockSearchChart";

// =====================
// Types
// =====================
export type Stock = {
  code: string;
  name: string;
  marketType: string;
};

export type PriceRow = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type SignalInfo = {
  resultId: string;
  signalDate: string;
  code: string;
  name: string;

  action: string;           // DB 코드 (유지)
  strategy?: StrategyCode;  // ⭐ 추가 (optional 권장)
};


export type StrategyCode = {
  code: string;
  label: string;
};

type AutoItem = {
  code: string;
  name: string;
};

function StockSearchPage() {
  // =====================
  // Search Inputs
  // =====================
  const [stockName, setStockName] = useState("");
  const [stockCode, setStockCode] = useState("");

  // =====================
  // Result States
  // =====================
  const [stock, setStock] = useState<Stock | null>(null);
  const [priceList, setPriceList] = useState<PriceRow[]>([]);
  const [signalList, setSignalList] = useState<SignalInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // =====================
  // Chart
  // =====================
  const [range, setRange] = useState<RangeType>("3m");

  // =====================
  // Autocomplete
  // =====================
  const [nameAutoList, setNameAutoList] = useState<AutoItem[]>([]);
  const [codeAutoList, setCodeAutoList] = useState<AutoItem[]>([]);
  const [nameAutoOpen, setNameAutoOpen] = useState(false);
  const [codeAutoOpen, setCodeAutoOpen] = useState(false);

  // ⭐ 키보드 포커스 인덱스 (추가된 부분)
  const [activeNameIndex, setActiveNameIndex] = useState(-1);
  const [activeCodeIndex, setActiveCodeIndex] = useState(-1);

  const isKR =
    stock?.marketType === "KOSPI" || stock?.marketType === "KOSDAQ";

  // =====================
  // 초기화 (입력만)
  // =====================
  const resetAll = () => {
    setStockName("");
    setStockCode("");
    setNameAutoList([]);
    setCodeAutoList([]);
    setNameAutoOpen(false);
    setCodeAutoOpen(false);
    setActiveNameIndex(-1);
    setActiveCodeIndex(-1);
    setError(null);
  };

  // =====================
  // Search
  // =====================
  const search = async () => {
    setError(null);
    setStock(null);
    setPriceList([]);
    setSignalList([]);

    const params = new URLSearchParams();
    if (stockName) params.append("stockName", stockName);
    if (stockCode) params.append("stockCode", stockCode);

    const res = await fetch(`/api/stock/searchStock?${params.toString()}`);
    const data = await res.json();

    if (data.error) {
      setError(data.error);
      return;
    }

    setStock(data.stock);
    setPriceList(data.priceList || []);
    setSignalList(data.signalList || []);

    setNameAutoOpen(false);
    setCodeAutoOpen(false);
    setActiveNameIndex(-1);
    setActiveCodeIndex(-1);
  };

  // =====================
  // Autocomplete fetch
  // =====================
  const fetchNameAutocomplete = async (q: string) => {
    if (!q.trim()) {
      setNameAutoList([]);
      setNameAutoOpen(false);
      return;
    }

    const res = await fetch(
      `/api/common/autocomplete/stock?q=${encodeURIComponent(q)}`
    );
    const list = await res.json();

    setNameAutoList(list);
    setNameAutoOpen(true);
    setCodeAutoOpen(false);
    setActiveNameIndex(-1);
  };

  const fetchCodeAutocomplete = async (q: string) => {
    if (!q.trim()) {
      setCodeAutoList([]);
      setCodeAutoOpen(false);
      return;
    }

    const res = await fetch(
      `/api/common/autocomplete/code?q=${encodeURIComponent(q)}`
    );
    const list = await res.json();

    setCodeAutoList(list);
    setCodeAutoOpen(true);
    setNameAutoOpen(false);
    setActiveCodeIndex(-1);
  };

  // =====================
  // 키보드 컨트롤 (종목명)
  // =====================
  const onNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!nameAutoOpen || nameAutoList.length === 0) {
      if (e.key === "Enter") search();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveNameIndex(i => Math.min(i + 1, nameAutoList.length - 1));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveNameIndex(i => Math.max(i - 1, 0));
    }

    if (e.key === "Enter" && activeNameIndex >= 0) {
      e.preventDefault();
      const item = nameAutoList[activeNameIndex];
      setStockName(item.name);
      setStockCode(item.code);
      setNameAutoOpen(false);
      setActiveNameIndex(-1);
    }

    if (e.key === "Escape") {
      setNameAutoOpen(false);
      setActiveNameIndex(-1);
    }
  };

  // =====================
  // 키보드 컨트롤 (종목코드)
  // =====================
  const onCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!codeAutoOpen || codeAutoList.length === 0) {
      if (e.key === "Enter") search();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveCodeIndex(i => Math.min(i + 1, codeAutoList.length - 1));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveCodeIndex(i => Math.max(i - 1, 0));
    }

    if (e.key === "Enter" && activeCodeIndex >= 0) {
      e.preventDefault();
      const item = codeAutoList[activeCodeIndex];
      setStockCode(item.code);
      setStockName(item.name);
      setCodeAutoOpen(false);
      setActiveCodeIndex(-1);
    }

    if (e.key === "Escape") {
      setCodeAutoOpen(false);
      setActiveCodeIndex(-1);
    }
  };

  const buildDetailUrl = (s: SignalInfo) => {
    const base = isKR ? "/result/detailKR" : "/result/detailUS";
    return `${base}?strategy=${s.action}&date=${s.signalDate}`;
  };

  // =====================
  // Render
  // =====================
  return (
    <BasicLayout>
      <section className="stock-search">
        <h2>종목검색</h2>
        <div className="stock-search-box">
          <div className="stock-search-row">

            {/* ===== 종목명 ===== */}
            <div className="stock-search-input-wrap" style={{ position: "relative" }}>
              <input
                value={stockName}
                onChange={e => {
                  const v = e.target.value;
                  setStockName(v);
                  fetchNameAutocomplete(v);
                }}
                onKeyDown={onNameKeyDown}
                placeholder="종목명"
              />

              {nameAutoOpen && nameAutoList.length > 0 && (
                <ul className="autocomplete-list">
                  {nameAutoList.map((item, idx) => (
                    <li
                      key={item.code}
                      className={idx === activeNameIndex ? "active" : ""}
                      onMouseEnter={() => setActiveNameIndex(idx)}
                      onClick={() => {
                        setStockName(item.name);
                        setStockCode(item.code);
                        setNameAutoOpen(false);
                      }}
                    >
                      <strong>{item.name}</strong>
                      <span className="autocomplete-code">{item.code}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ===== 종목코드 ===== */}
            <div className="stock-search-input-wrap" style={{ position: "relative" }}>
              <input
                value={stockCode}
                onChange={e => {
                  const v = e.target.value.toUpperCase();
                  setStockCode(v);
                  fetchCodeAutocomplete(v);
                }}
                onKeyDown={onCodeKeyDown}
                placeholder="종목코드"
              />

              {codeAutoOpen && codeAutoList.length > 0 && (
                <ul className="autocomplete-list">
                  {codeAutoList.map((item, idx) => (
                    <li
                      key={item.code}
                      className={idx === activeCodeIndex ? "active" : ""}
                      onMouseEnter={() => setActiveCodeIndex(idx)}
                      onClick={() => {
                        setStockCode(item.code);
                        setStockName(item.name);
                        setCodeAutoOpen(false);
                      }}
                    >
                      <strong>{item.code}</strong>
                      <span className="autocomplete-code">{item.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button className="stock-search-btn" onClick={search}>검색</button>
            <button className="stock-reset-btn" onClick={resetAll}>초기화</button>
          </div>
        </div>

        {error && <div className="stock-error">{error}</div>}

        {stock && (
          <div className="stock-grid">
            {/* ===== Left ===== */}
            <div className="stock-table">
              <div className="stock-table-title">
                {stock.name} ({stock.code}) · {stock.marketType}
              </div>

              <div className="stock-table-head">
                <span className="center">일자</span>
                <span className="center">종가</span>
                <span className="center">거래량</span>
                <span className="center">시가</span>
                <span className="center">고가</span>
                <span className="center">저가</span>
              </div>

              {priceList.map(row => (
                <div key={row.date} className="stock-table-row">
                  <span className="center">{row.date}</span>
                  <span className="center">
                    {isKR ? `${row.close.toLocaleString()}원` : `$${row.close}`}
                  </span>
                  <span className="center">{row.volume.toLocaleString()}</span>
                  <span className="center">
                    {isKR ? `${row.open.toLocaleString()}원` : `$${row.open}`}
                  </span>
                  <span className="center">
                    {isKR ? `${row.high.toLocaleString()}원` : `$${row.high}`}
                  </span>
                  <span className="center">
                    {isKR ? `${row.low.toLocaleString()}원` : `$${row.low}`}
                  </span>
                </div>
              ))}
            </div>

            {/* ===== Right ===== */}
            <div className="stock-right">
              <div className="stock-chart-card">
                <div className="stock-chart-header">
                  <span>차트</span>
                  <div className="chart-header-controls">
                    {(["1m", "3m", "6m", "1y"] as RangeType[]).map(r => (
                      <button
                        key={r}
                        className={range === r ? "active" : ""}
                        onClick={() => setRange(r)}
                      >
                        {r === "1m" && "1개월"}
                        {r === "3m" && "3개월"}
                        {r === "6m" && "6개월"}
                        {r === "1y" && "1년"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="stock-chart-container">
                  <StockSearchChart
                    priceList={priceList}
                    marketType={stock.marketType}
                    range={range}
                  />
                </div>
              </div>

              <div className="stock-signal">
                <div className="stock-signal-header">조건 포착 정보</div>
                <div className="stock-signal-body">
                  <table className="stock-signal-table">
                    <thead>
                      <tr>
                        <th>전략명</th>
                        <th>포착일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {signalList.map(s => {
                        const detailUrl = buildDetailUrl(s);

                        return (
                          <tr
                            key={s.resultId}
                            style={{ cursor: "pointer" }}
                            onClick={() => window.location.href = detailUrl}
                          >
                            <td>{s.strategy?.label ?? s.action}</td>
                            <td>{s.signalDate}</td>
                          </tr>
                        );
                      })}
                    </tbody>

                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </BasicLayout>
  );
}

export default StockSearchPage;
