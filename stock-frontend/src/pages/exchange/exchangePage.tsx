import IndicatorCard from "./exchangeCard";
import { useIndicatorData } from "./useExchangeData";
import "./exchange.css";

export default function IndicatorPage() {
  const { data, loading } = useIndicatorData();

  if (loading) {
    return <div>로딩중...</div>;
  }

  if (!data) {
    return <div>데이터 없음</div>;
  }

  return (
    <div className="indicator-page">
      {/* =========================
          카드 그리드
      ========================= */}
      <div className="grid-container">
        <div id="USD" className="indicator-card-wrapper">
          <IndicatorCard
            title="USD/KRW"
            data={data.usd}
            colorKey="usd"
          />
        </div>

        <div id="JPY" className="indicator-card-wrapper">
          <IndicatorCard
            title="JPY/KRW"
            data={data.jpy}
            colorKey="jpy"
          />
        </div>

        <div id="EUR" className="indicator-card-wrapper">
          <IndicatorCard
            title="EUR/KRW"
            data={data.eur}
            colorKey="eur"
          />
        </div>

        <div id="GBP" className="indicator-card-wrapper">
          <IndicatorCard
            title="GBP/KRW"
            data={data.gbp}
            colorKey="gbp"
          />
        </div>

        <div id="CNY" className="indicator-card-wrapper">
          <IndicatorCard
            title="CNY/KRW"
            data={data.cny}
            colorKey="cny"
          />
        </div>

        <div id="HKD" className="indicator-card-wrapper">
          <IndicatorCard
            title="HKD/KRW"
            data={data.hkd}
            colorKey="hkd"
          />
        </div>

        <div id="TWD" className="indicator-card-wrapper">
          <IndicatorCard
            title="TWD/KRW"
            data={data.twd}
            colorKey="twd"
          />
        </div>
      </div>
    </div>
  );
}
