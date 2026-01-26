import type { MyEtfItemViewDTO } from "./myEtf.types";
import "./EtfItemTable.css";
import { useNavigate } from "react-router-dom";

interface Props {
  items: MyEtfItemViewDTO[];
}

export default function EtfItemTable({ items }: Props) {
  const navigate = useNavigate();

  return (
    <div className="etf-item-box">
      <div className="etf-item-header">구성 종목</div>

      <div className="etf-item-table-wrapper">
        <table className="etf-item-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>No</th>
              <th>종목코드</th>
              <th className="name">종목명</th>
              <th className="detail"></th>
              <th className="num">수량</th>
              <th>편입일</th>
              <th className="num">편입가</th>
              <th className="num">현재가</th>
              <th className="num">평가금액</th>
              <th className="num">수익률</th>
            </tr>
          </thead>

          <tbody>
            {items.map((s, idx) => {
              console.log(s.code, s.market);
              // =========================
              // 수익 기준 (통화 섞임 방지)
              // =========================
              const rowClass =
                s.profitRate > 0
                  ? "row-profit"
                  : s.profitRate < 0
                  ? "row-loss"
                  : "";

              const priceClass =
                s.profitRate > 0
                  ? "price-up"
                  : s.profitRate < 0
                  ? "price-down"
                  : "price-same";

              const stockSearchUrl =
                `/stock/searchStock?code=${encodeURIComponent(
                  s.code
                )}&name=${encodeURIComponent(s.name)}`;

              return (
                <tr key={s.id} className={rowClass}>
                  <td>{idx + 1}</td>
                  <td>{s.code}</td>

                  <td className="name">{s.name}</td>

                  <td className="detail">
                    <button
                      className="detail-link-btn"
                      onClick={() => navigate(stockSearchUrl)}
                    >
                      종목상세
                    </button>
                  </td>

                  <td className="num">{s.quantity}</td>
                  <td>{s.addedDate}</td>

                  {/* =========================
                      편입가
                     ========================= */}
                  <td className="num">
                    {s.priceAtAddDisplay}
                    {s.market === "US" && (
                      <div className="sub-price">
                        (${s.priceAtAdd.toFixed(2)})
                      </div>
                    )}
                  </td>

                  {/* =========================
                      현재가
                     ========================= */}
                  <td className={`num ${priceClass}`}>
                    {s.currentPriceDisplay}
                    {s.market === "US" && (
                      <div className="sub-price">
                        (${s.currentPrice.toFixed(2)})
                      </div>
                    )}
                  </td>

                  {/* =========================
                      평가금액
                     ========================= */}
                  <td className="num">
                    {s.evaluatedAmountDisplay}
                    {s.market === "US" && (
                      <div className="sub-price">
                        (${(s.currentPrice * s.quantity).toFixed(2)})
                      </div>
                    )}
                  </td>

                  {/* =========================
                      수익률
                     ========================= */}
                  <td className={`num ${priceClass}`}>
                    {s.profitRateDisplay}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
