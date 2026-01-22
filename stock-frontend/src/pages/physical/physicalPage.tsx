import BasicLayout from "../../layouts/BasicLayout";
import IndicatorCard from "./physical";
import { useIndicatorData } from "./usePhysicalData";
import "./physical.css";

/* =========================
   스크롤 이동 함수
========================= */
function scrollToPhysical(id: string) {
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

  const PHYSICAL_LIST = [
    "BEAN",
    "COFFEE",
    "CORN",
    "RICE",
    "SUGAR",
    "COTTON",
    "COPPER",
    "SILVER",
    "GOLD_GLOBAL",
    "GOLD_KR",
    "WTI",
    "DUBAI"
  ] as const;

  return (
    <BasicLayout>
      <div className="indicator-page">
        {/* =========================
            우측 원자재 네비
        ========================= */}
        <div className="index-side-nav">
          {PHYSICAL_LIST.map(code => (
            <button
              key={code}
              className="index-nav-item"
              onClick={() => scrollToPhysical(code)}
            >
              {code.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* =========================
            카드 그리드
        ========================= */}
        <div className="grid-container">
          <div id="BEAN" className="indicator-card-wrapper">
            <IndicatorCard title="BEAN" data={data.BEAN} colorKey="BEAN" />
          </div>

          <div id="COFFEE" className="indicator-card-wrapper">
            <IndicatorCard title="COFFEE" data={data.COFFEE} colorKey="COFFEE" />
          </div>

          <div id="CORN" className="indicator-card-wrapper">
            <IndicatorCard title="CORN" data={data.CORN} colorKey="CORN" />
          </div>

          <div id="RICE" className="indicator-card-wrapper">
            <IndicatorCard title="RICE" data={data.RICE} colorKey="RICE" />
          </div>

          <div id="SUGAR" className="indicator-card-wrapper">
            <IndicatorCard title="SUGAR" data={data.SUGAR} colorKey="SUGAR" />
          </div>

          <div id="COTTON" className="indicator-card-wrapper">
            <IndicatorCard title="COTTON" data={data.COTTON} colorKey="COTTON" />
          </div>

          <div id="COPPER" className="indicator-card-wrapper">
            <IndicatorCard title="COPPER" data={data.COPPER} colorKey="COPPER" />
          </div>

          <div id="SILVER" className="indicator-card-wrapper">
            <IndicatorCard title="SILVER" data={data.SILVER} colorKey="SILVER" />
          </div>

          <div id="GOLD_GLOBAL" className="indicator-card-wrapper">
            <IndicatorCard
              title="GOLD (GLOBAL)"
              data={data.GOLD_GLOBAL}
              colorKey="GOLD_GLOBAL"
            />
          </div>

          <div id="GOLD_KR" className="indicator-card-wrapper">
            <IndicatorCard
              title="GOLD (KR)"
              data={data.GOLD_KR}
              colorKey="GOLD_KR"
            />
          </div>

          <div id="WTI" className="indicator-card-wrapper">
            <IndicatorCard title="WTI" data={data.WTI} colorKey="WTI" />
          </div>

          <div id="DUBAI" className="indicator-card-wrapper">
            <IndicatorCard title="DUBAI" data={data.DUBAI} colorKey="DUBAI" />
          </div>
        </div>
      </div>
    </BasicLayout>
  );
}
