import type { KodexEtfHolding } from "../../api/kodexApi";
import "./kodex-holdings-modal.css";

interface Props {
  etfName: string;
  holdings: KodexEtfHolding[];
  loading: boolean;
  onClose: () => void;
}

function KodexHoldingsModal({
  etfName,
  holdings,
  loading,
  onClose
}: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-body"
        onClick={e => e.stopPropagation()}
      >
        {/* ===== Header ===== */}
        <header className="modal-header">
          <h3>구성 종목 - {etfName}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </header>

        {/* ===== Content ===== */}
        <div className="modal-content kodex-holdings-content">

  {/* 헤더 */}
  <div className="holdings-header-row">
    <span>종목코드</span>
    <span>종목명</span>
    <span className="num">보유수량</span>
    <span className="num">비중(%)</span>
    <span className="num">평가금액</span>
  </div>

  {loading && <div className="loading">로딩중...</div>}

  {!loading && holdings.map(h => (
    <div key={h.stockCode} className="holdings-row">
      <span className="code">{h.stockCode}</span>
      <span className="name">{h.stockName}</span>
      <span className="num">
        {h.holdingQty?.toLocaleString()}
      </span>
      <span className="num">
        {h.weightRatio ?? "-"}
      </span>
      <span className="num">
        {h.evalAmount?.toLocaleString()}
      </span>
    </div>
  ))}

</div>
      </div>
    </div>
  );
}

export default KodexHoldingsModal;
