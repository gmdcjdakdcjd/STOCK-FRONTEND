import { useEffect, useState } from "react";
import { fetchNpsSummary } from "../../api/npsApi";
import "./nps-summary.css";

interface NpsSummary {
  assetType: string;
  market: string;
  totalCount: number;
}

function assetLabel(asset: string) {
  switch (asset) {
    case "STOCK": return "주식";
    case "BOND": return "채권";
    default: return asset;
  }
}

function marketLabel(market: string) {
  switch (market) {
    case "KR": return "한국";
    case "US": return "미국";
    case "GLOBAL": return "국제";
    default: return market;
  }
}

function NpsSummaryPage() {
  const [list, setList] = useState<NpsSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNpsSummary()
      .then(setList)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="nps-summary">
        <h2>국민연금 투자 현황</h2>
        <header className="nps-summary-header">

          {/* <p className="nps-summary-desc">
            ※ 기준일 기준 국민연금(NPS) 보유 자산 요약입니다.
          </p> */}
        </header>

        {loading ? (
          <div className="nps-loading">로딩중...</div>
        ) : (
          <div className="nps-card-grid">
            {list.map(row => (
              <article
                key={`${row.assetType}-${row.market}`}
                className="nps-card"
              >
                <div className="nps-card-center">
                  <div className="nps-title">
                    {assetLabel(row.assetType)} | {marketLabel(row.market)}
                  </div>

                  <div className="nps-count">
                    {row.totalCount.toLocaleString()}
                  </div>

                  <div className="nps-sub">보유 종목</div>
                </div>

                <a
                  className="nps-card-button"
                  href={`/nps/list?asset=${row.assetType}&market=${row.market}`}
                >
                  목록 보기
                </a>
              </article>
            ))}
          </div>
        )}

    </section>
  );
}

export default NpsSummaryPage;
