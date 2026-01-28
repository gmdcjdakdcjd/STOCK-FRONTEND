import IndicatorCard from "./stockIndex";
import { useIndicatorData } from "./useStockIndexData";
import "./stockIndex.css";

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
        <div id="DOW" className="indicator-card-wrapper">
          <IndicatorCard title="DOW" data={data.dow} colorKey="dow" />
        </div>

        <div id="NASDAQ" className="indicator-card-wrapper">
          <IndicatorCard title="NASDAQ" data={data.nasdaq} colorKey="nasdaq" />
        </div>

        <div id="S&P500" className="indicator-card-wrapper">
          <IndicatorCard title="S&P500" data={data.snp500} colorKey="snp500" />
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
          <IndicatorCard
            title="HONGKONG"
            data={data.hongkong}
            colorKey="hongkong"
          />
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
  );
}
