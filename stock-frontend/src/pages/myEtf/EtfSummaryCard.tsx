import type { MyEtfDetailSummaryDTO } from "./myEtf.types";
import "./EtfSummaryCard.css";

interface Props {
  summary: MyEtfDetailSummaryDTO;
}

export default function EtfSummaryCard({ summary }: Props) {
  const priceClass =
    summary.totalEvaluated > summary.totalInvested
      ? "price-up"
      : summary.totalEvaluated < summary.totalInvested
        ? "price-down"
        : "price-same";

  return (
    <div className="etf-summary-card">
      <div className="summary-item invested">
        <div className="label">총 편입금액</div>
        <div className="value">
          {summary.totalInvested.toLocaleString()}원
        </div>
      </div>

      <div className={`summary-item evaluated ${priceClass}`}>
        <div className="label">현재 평가액</div>
        <div className="value">
          {summary.totalEvaluated.toLocaleString()}원
        </div>
      </div>




      <div className={`summary-item ${priceClass}`}>
        <div className="label">수익금</div>
        <div className="value">
          {summary.profitAmount.toLocaleString()}원
        </div>
      </div>

      <div className={`summary-item ${priceClass}`}>
        <div className="label">수익률</div>
        <div className="value">
          {summary.profitRate.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
