import type { MyEtfItemViewDTO } from "./myEtf.types";
import "./EtfItemTable.css";

interface Props {
  items: MyEtfItemViewDTO[];
}

export default function EtfItemTable({ items }: Props) {
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
              const isProfit = s.currentPrice > s.priceAtAdd;
              const isLoss = s.currentPrice < s.priceAtAdd;

              const priceClass = isProfit ? "profit" : isLoss ? "loss" : "";
              const profitClass =
                s.evaluatedAmount > s.priceAtAdd * s.quantity
                  ? "profit"
                  : s.evaluatedAmount < s.priceAtAdd * s.quantity
                    ? "loss"
                    : "";

              return (
                <tr key={s.id}>
                  <td>{idx + 1}</td>
                  <td>{s.code}</td>

                  {/* 종목명 */}
                  <td className="name">{s.name}</td>

                  {/* 숫자 컬럼 */}
                  <td className="num">{s.quantity}</td>
                  <td>{s.addedDate}</td>
                  <td className="num">{s.priceAtAddDisplay}</td>
                  <td className={`num ${priceClass}`}>
                    {s.currentPriceDisplay}
                  </td>
                  <td className="num">{s.evaluatedAmountDisplay}</td>
                  <td className={`num ${profitClass}`}>
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
