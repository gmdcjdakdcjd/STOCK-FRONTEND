import BasicLayout from "../../layouts/BasicLayout";
import IndicatorCard from "./exchangeCard";
import { useIndicatorData } from "./useExchangeData";
import "./exchange.css";

/* =========================
   스크롤 이동 함수
========================= */
function scrollToExchange(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

export default function IndicatorPage() {
  const { data, loading } = useIndicatorData();

  if (loading) {
    return (
      <BasicLayout>
        <div>로딩중...</div>
      </BasicLayout>
    );
  }

  if (!data) {
    return (
      <BasicLayout>
        <div>데이터 없음</div>
      </BasicLayout>
    );
  }

  const EXCHANGE_LIST = [
    "USD",
    "JPY",
    "EUR",
    "GBP",
    "CNY",
    "HKD",
    "TWD"
  ] as const;

  return (
    <BasicLayout>
      <div className="indicator-page">
        {/* =========================
            우측 환율 네비
        ========================= */}
        <div className="index-side-nav">
          {EXCHANGE_LIST.map(code => (
            <button
              key={code}
              className="index-nav-item"
              onClick={() => scrollToExchange(code)}
            >
              {code}
            </button>
          ))}
        </div>

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
    </BasicLayout>
  );
}
