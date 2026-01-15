import type { StrategyDetail } from "./dualMomentum.types";

type Props = {
  list: StrategyDetail[];
  isKr: boolean;
};

/* =========================
   util
========================= */
function formatDiff(diff: number) {
  // + 제거, 소수점 제거
  return `${Math.trunc(diff)}%`;
}

export default function DualMomentumTable({ list, isKr }: Props) {
  return (
    <div className="content-box">
      <table>
        <thead>
          <tr>
            <th className="col-code">종목</th>
            <th className="col-price">가격</th>
            <th className="col-prev">시작일</th>
            <th className="col-diff">변동</th>
            <th className="col-date">날짜</th>
          </tr>
        </thead>

        <tbody>
          {list.map(row => (
            <tr key={`${row.resultId}_${row.code}_${row.signalDate}`}>
              <td className="col-code">
                {row.code} {row.name}
              </td>

              <td className="col-price">
                {isKr
                  ? `${row.price.toLocaleString()}원`
                  : `$${row.price.toLocaleString()}`}
              </td>

              <td className="col-prev">
                {isKr
                  ? `${row.prevClose.toLocaleString()}원`
                  : `$${row.prevClose.toLocaleString()}`}
              </td>

              <td
                className={`col-diff ${row.diff > 0 ? "up" : row.diff < 0 ? "down" : ""
                  }`}
              >
                {formatDiff(row.diff)}
              </td>

              <td className="col-date">{row.signalDate}</td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}
