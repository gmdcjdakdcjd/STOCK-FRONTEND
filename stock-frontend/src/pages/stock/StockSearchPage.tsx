import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "./StockSearchPage.css";
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

export type StrategyCode = {
  code: string;
  label: string;
};

export type SignalInfo = {
  resultId: string;
  signalDate: string;
  code: string;
  name: string;
  action: string;
  strategy?: StrategyCode;
};

type AutoItem = {
  code: string;
  name: string;
};

function StockSearchPage() {
  const [searchParams] = useSearchParams();

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
  const [loading, setLoading] = useState(false);

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
  const [activeNameIndex, setActiveNameIndex] = useState(-1);
  const [activeCodeIndex, setActiveCodeIndex] = useState(-1);

  const isKR =
    stock?.marketType === "KOSPI" || stock?.marketType === "KOSDAQ";

  // =====================
  // Reset
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
    setStock(null);
    setPriceList([]);
    setSignalList([]);
    setError(null);
  };

  // =====================
  // Core Search
  // =====================
  const searchWithParams = async (name?: string, code?: string) => {
    if (loading) return;

    const safeName = name?.trim();
    const safeCode = code?.trim();
    if (!safeName && !safeCode) return;

    setLoading(true);
    setError(null);
    setStock(null);
    setPriceList([]);
    setSignalList([]);

    try {
      const params = new URLSearchParams();

      if (code?.trim()) {
        params.append("stockCode", code.trim());
      } else if (name?.trim()) {
        params.append("stockName", name.trim());
      }

      const res = await fetch(
        `/api/stock/searchStock?${params.toString()}`
      );

      if (!res.ok) throw new Error();

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setStock(data.stock);
      setPriceList(data.priceList || []);
      setSignalList(data.signalList || []);
    } catch {
      setError("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setNameAutoOpen(false);
      setCodeAutoOpen(false);
      setActiveNameIndex(-1);
      setActiveCodeIndex(-1);
    }
  };

  // =====================
  // Button / Enter Search
  // =====================
  const search = () => {
    searchWithParams(stockName, stockCode);
  };

  // =====================
  // URL 파라미터 자동 검색
  // =====================
  useEffect(() => {
    const code = searchParams.get("code")?.trim() || "";
    const name = searchParams.get("name")?.trim() || "";

    if (code || name) {
      setStockCode(code);
      setStockName(name);
      searchWithParams(name || undefined, code || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================
  // Autocomplete
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
    setNameAutoList(await res.json());
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
    setCodeAutoList(await res.json());
    setCodeAutoOpen(true);
    setNameAutoOpen(false);
    setActiveCodeIndex(-1);
  };

  // =====================
  // Keyboard Control
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
      const item = nameAutoList[activeNameIndex];
      setStockName(item.name);
      setStockCode(item.code);
      setNameAutoOpen(false);
      setActiveNameIndex(-1);
    }
  };

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
      const item = codeAutoList[activeCodeIndex];
      setStockCode(item.code);
      setStockName(item.name);
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
    <section className="stock-search">
      <h2>종목검색</h2>

      <div className="stock-search-box">
        <div className="stock-search-row">
          <div className="stock-search-input-wrap">
            <input
              value={stockName}
              onChange={e => {
                setStockName(e.target.value);
                fetchNameAutocomplete(e.target.value);
              }}
              onKeyDown={onNameKeyDown}
              placeholder="종목명"
            />
            {nameAutoOpen && (
              <ul className="autocomplete-list">
                {nameAutoList.map((item, idx) => (
                  <li
                    key={item.code}
                    className={idx === activeNameIndex ? "active" : ""}
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

          <div className="stock-search-input-wrap">
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
            {codeAutoOpen && (
              <ul className="autocomplete-list">
                {codeAutoList.map((item, idx) => (
                  <li
                    key={item.code}
                    className={idx === activeCodeIndex ? "active" : ""}
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

          <button
            className="stock-search-btn"
            onClick={search}
            disabled={loading}
          >
            검색
          </button>
          <button className="stock-reset-btn" onClick={resetAll}>
            초기화
          </button>
        </div>
      </div>

      {loading && <div className="stock-loading">검색 중...</div>}
      {error && <div className="stock-error">{error}</div>}

      {stock && (
        <div className="stock-grid">
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
                    {signalList.map(s => (
                      <tr
                        key={s.resultId}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          (window.location.href = buildDetailUrl(s))
                        }
                      >
                        <td>{s.strategy?.label ?? s.action}</td>
                        <td>{s.signalDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default StockSearchPage;
