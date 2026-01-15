import BasicLayout from "../../layouts/BasicLayout";
import IndicatorCard from "./IndicatorCard";
import { useIndicatorData } from "./useIndicatorData";
import "./indicator.css";

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

  return (
    <BasicLayout>
      {/* ✅ 페이지 전용 wrapper (레이아웃 기준 고정용) */}
      <div className="indicator-page">
        <div className="grid-container">
          <IndicatorCard
            title="KOSPI"
            data={data.kospi}
            isUSD={false}
            colorKey="kospi"
          />

          <IndicatorCard
            title="S&P500"
            data={data.spx}
            isUSD
            colorKey="spx"
          />

          <IndicatorCard
            title="USD"
            data={data.usd}
            isUSD
            colorKey="usd"
          />

          <IndicatorCard
            title="JPY"
            data={data.jpy}
            isUSD
            colorKey="jpy"
          />

          <IndicatorCard
            title="금(KR)"
            data={data.goldKr}
            isUSD={false}
            colorKey="goldKr"
          />

          <IndicatorCard
            title="Gold(Global)"
            data={data.goldGlobal}
            isUSD
            colorKey="goldGl"
          />

          <IndicatorCard
            title="WTI"
            data={data.wti}
            isUSD
            colorKey="wti"
          />

          <IndicatorCard
            title="Dubai Oil"
            data={data.dubai}
            isUSD
            colorKey="dubai"
          />
        </div>
      </div>
    </BasicLayout>
  );
}
