import type { TigerEtfHolding } from "../../api/tigerApi";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import "./tiger-holdings-modal.css";

interface Props {
  etfId: string;
  etfName?: string; // 백엔드 DTO에 추가된 etfName 연동
  holdings: TigerEtfHolding[];
  loading: boolean;
  onClose: () => void;
}

function TigerHoldingsModal({
  etfId,
  etfName,
  holdings,
  loading,
  onClose
}: Props) {
  //  배경 스크롤 방지
  useLockBodyScroll();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-body"
        onClick={e => e.stopPropagation()}
      >
        {/* ===== Header ===== */}
        <header className="modal-header">
          <h3>구성 종목 - {etfName || etfId}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </header>

        {/* ===== Content ===== */}
        <div className="modal-content tiger-holdings-content">

          {/* 헤더 */}
          <div className="holdings-header-row">
            <span>종목코드</span>
            <span>종목명</span>
            <span className="num">보유수량</span>
            <span className="num">비중(%)</span>
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
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}

export default TigerHoldingsModal;
