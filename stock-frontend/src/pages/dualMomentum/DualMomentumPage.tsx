import { useDualMomentumData } from "./useDualMomentumData";
import DualMomentumCard from "./DualMomentumCard";
import "./dualMomentum.css";

/**
 * 전략 표시 순서 고정
 * (백엔드 LinkedHashMap에 의존하지 않기 위함)
 */
const STRATEGY_ORDER = [
  "DUAL_MOMENTUM_1M_KR",
  "DUAL_MOMENTUM_3M_KR",
  "DUAL_MOMENTUM_6M_KR",
  "DUAL_MOMENTUM_1Y_KR",
  "DUAL_MOMENTUM_1M_US",
  "DUAL_MOMENTUM_3M_US",
  "DUAL_MOMENTUM_6M_US",
  "DUAL_MOMENTUM_1Y_US"
] as const;

export default function DualMomentumPage() {
  const { data, loading } = useDualMomentumData();

  return (
    <div className="container mt-4">
        {loading && <div>로딩중...</div>}

        {!loading && !data && <div>데이터 없음</div>}

        {!loading && data && (
          <>
            {/* <h3 className="fw-bold mb-4">
               듀얼 모멘텀 전략별 결과 비교
            </h3> */}

            {STRATEGY_ORDER
              .filter(key => data[key] && data[key].length > 0)
              .map(key => (
                <DualMomentumCard
                  key={key}
                  strategyKey={key}
                  list={data[key]}
                />
              ))}
          </>
        )}
    </div>
  );
}
