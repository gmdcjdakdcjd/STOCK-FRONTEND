import IndicatorCard from "./cryptoIndex";

// 데이터를 가져오기 위한 useIndicatorData 커스텀 훅을 임포트합니다.
import { useIndicatorData } from "./useCryptoData";

import "./cryptoIndex.css";

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
        <div id="bitcoin" className="indicator-card-wrapper">
          <IndicatorCard
            title="BITCOIN"
            data={data.bitcoin}
            colorKey="bitcoin"
            description={"가상자산 시장 기축 및\n전반적인 위험자산 선호도 지표"}
          />
        </div>

        <div id="ethereum" className="indicator-card-wrapper">
          <IndicatorCard
            title="ETHEREUM"
            data={data.ethereum}
            colorKey="ethereum"
            description={"알트코인 대장주 및\n나스닥 기술주와의 높은 동조화 지표"}
          />
        </div>

        <div id="solana" className="indicator-card-wrapper">
          <IndicatorCard
            title="SOLANA"
            data={data.solana}
            colorKey="solana"
            description={"차세대 고성능 메인넷 및\n최근 기관 자금 유입의 핵심 지표"}
          />
        </div>

        <div id="stablecoin" className="indicator-card-wrapper">
          <IndicatorCard
            title="STABLECOIN"
            data={data.stablecoin}
            colorKey="stablecoin"
            description={"제도권 금융 시스템 연동 및\n국제 송금/결제 인프라 지표"}
          />
        </div>

        <div id="binance" className="indicator-card-wrapper">
          <IndicatorCard
            title="BINANCE"
            data={data.binance}
            colorKey="binance"
            description={"글로벌 최대 거래소 유동성 및\n가상자산 플랫폼 생태계 건전성 지표"}
          />
        </div>

      </div>
    </div>
  );
}
