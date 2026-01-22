import BasicLayout from "../../layouts/BasicLayout";
import IndicatorCard from "./stockIndex";
import { useIndicatorData } from "./useStockIndexData";
import "./stockIndex.css";

/* =========================
   스크롤 이동 함수
========================= */
function scrollToIndex(id: string) {
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

  const INDEX_LIST = [
    "DOW",
    "NASDAQ",
    "KOSPI",
    "KOSDAQ",
    "JAPAN",
    "CHINA",
    "HONGKONG",
    "TAIWAN",
    "EURO",
    "ENGLAND",
    "FRANCE",
    "GERMANY",
    "ITALY"
  ] as const;

  return (
    <BasicLayout>
      <div className="indicator-page">
        {/* =========================
            우측 인덱스 네비
        ========================= */}
        <div className="index-side-nav">
          {INDEX_LIST.map(code => (
            <button
              key={code}
              className="index-nav-item"
              onClick={() => scrollToIndex(code)}
            >
              {code}
            </button>
          ))}
        </div>

        {/* =========================
            카드 그리드
        ========================= */}
        <div className="grid-container">
          <div id="DOW" className="indicator-card-wrapper">
            <IndicatorCard title="DOW" data={data.dow} colorKey="dow" />
          </div>

          <div id="NASDAQ" className="indicator-card-wrapper">
            <IndicatorCard title="NASDAQ" data={data.nasdaq} colorKey="nasdaq" />
          </div>

          <div id="KOSPI" className="indicator-card-wrapper">
            <IndicatorCard title="KOSPI" data={data.kospi} colorKey="kospi" />
          </div>

          <div id="KOSDAQ" className="indicator-card-wrapper">
            <IndicatorCard title="KOSDAQ" data={data.kosdaq} colorKey="kosdaq" />
          </div>

          <div id="JAPAN" className="indicator-card-wrapper">
            <IndicatorCard title="JAPAN" data={data.japan} colorKey="japan" />
          </div>

          <div id="CHINA" className="indicator-card-wrapper">
            <IndicatorCard title="CHINA" data={data.china} colorKey="china" />
          </div>

          <div id="HONGKONG" className="indicator-card-wrapper">
            <IndicatorCard title="HONGKONG" data={data.hongkong} colorKey="hongkong" />
          </div>

          <div id="TAIWAN" className="indicator-card-wrapper">
            <IndicatorCard title="TAIWAN" data={data.taiwan} colorKey="taiwan" />
          </div>

          <div id="EURO" className="indicator-card-wrapper">
            <IndicatorCard title="EURO" data={data.euro} colorKey="euro" />
          </div>

          <div id="ENGLAND" className="indicator-card-wrapper">
            <IndicatorCard title="ENGLAND" data={data.england} colorKey="england" />
          </div>

          <div id="FRANCE" className="indicator-card-wrapper">
            <IndicatorCard title="FRANCE" data={data.france} colorKey="france" />
          </div>

          <div id="GERMANY" className="indicator-card-wrapper">
            <IndicatorCard title="GERMANY" data={data.german} colorKey="german" />
          </div>

          <div id="ITALY" className="indicator-card-wrapper">
            <IndicatorCard title="ITALY" data={data.italy} colorKey="italy" />
          </div>
        </div>
      </div>
    </BasicLayout>
  );
}
