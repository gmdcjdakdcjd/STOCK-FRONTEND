import { useEffect, useState } from "react";
import { fetchNpsList } from "../../api/npsApi";
import "./nps-list.css";

interface NpsItem {
  rankNo: number;
  name: string;
  weightPct?: number;
  ownershipPct?: number;
  evalAmountDisplay?: string;
}

function NpsListPage() {
  // URL 파라미터 고정
  const [params] = useState(
    () => new URLSearchParams(window.location.search)
  );

  const asset = params.get("asset") ?? "";
  const market = params.get("market") ?? "";
  const initialQ = params.get("q") ?? "";

  const [q, setQ] = useState(initialQ);
  const [searchQ, setSearchQ] = useState(initialQ);
  const [list, setList] = useState<NpsItem[]>([]);

  // 리스트 조회 (엔터 / 버튼만)
  useEffect(() => {
    if (!asset || !market) return;

    fetchNpsList(asset, market, searchQ || undefined)
      .then(setList)
      .catch(console.error);
  }, [asset, market, searchQ]);

  return (
    <section className="nps-list">
        <div className="nps-summary">
          <div className="nps-summary-header">
            <div className="nps-summary-title">
              국민연금 보유 종목
            </div>
          </div>
        </div>
        {/* ===== Search ===== */}
        <div className="nps-search">
          <div className="nps-search-row">

            {/* input + 내부 ✕ */}
            <div className="nps-search-input-wrap">
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    setSearchQ(q);
                  }
                }}
                placeholder="보유 여부 확인할 종목명"
              />

              {q && (
                <button
                  type="button"
                  className="nps-reset-inside"
                  onClick={() => {
                    setQ("");
                    setSearchQ("");
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* 검색 버튼 */}
            <button
              className="nps-search-btn"
              onClick={() => setSearchQ(q)}
            >
              검색
            </button>
          </div>
        </div>

        {/* ===== Table ===== */}
        <div className="nps-table">
        <div className="nps-table-head">
          <span className="center">순위</span>
          <span>종목명</span>
          <span className="center">자산군 내 비중 (%)</span>
          <span className="center">지분율 (%)</span>
          <span className="center">평가액 (억)</span>
        </div>

        {list.map(row => (
          <div key={row.rankNo} className="nps-table-row">
            <span className="center">{row.rankNo}</span>
            <span className="name">{row.name}</span>
            <span className="center">
              {row.weightPct ?? "-"}
            </span>
            <span className="center">
              {asset === "STOCK" ? row.ownershipPct ?? "-" : "-"}
            </span>
            <span className="center">
              {row.evalAmountDisplay ?? "-"}
            </span>
          </div>
        ))}
        </div>

    </section>
  );
}

export default NpsListPage;
