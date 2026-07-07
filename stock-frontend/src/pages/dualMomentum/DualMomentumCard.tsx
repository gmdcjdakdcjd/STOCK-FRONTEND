import DualMomentumTable from "./DualMomentumTable";
import { parseStrategyTitle } from "./dualMomentum.utils";
import type { StrategyDetail } from "./dualMomentum.types";

type Props = {
  strategyKey: string;
  list: StrategyDetail[];
};

export default function DualMomentumCard({ strategyKey, list }: Props) {
  const { title, isKr } = parseStrategyTitle(strategyKey);
  const latestDate = list[0]?.signalDate || "-";

  // 최신 신호 날짜(latestDate)를 기반으로 해당 주기의 시작일을 파싱 역산하여 기간 포맷 문자열을 반환합니다.
  const getPeriodStr = (): string => {
    if (!latestDate || latestDate === "-") return "";
    
    const date = new Date(latestDate);
    if (isNaN(date.getTime())) return latestDate;
    
    const startDate = new Date(date);
    if (strategyKey.includes("1M")) {
      startDate.setMonth(date.getMonth() - 1);
    } else if (strategyKey.includes("3M")) {
      startDate.setMonth(date.getMonth() - 3);
    } else if (strategyKey.includes("6M")) {
      startDate.setMonth(date.getMonth() - 6);
    } else if (strategyKey.includes("1Y")) {
      startDate.setFullYear(date.getFullYear() - 1);
    }
    
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return `${formatDate(startDate)} ~ ${latestDate}`;
  };

  return (
    <div className="dashboard-card">
      {/* 타이틀과 측정 기간 배지를 단정히 수평 정렬 배치하는 컨테이너 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
        <h5 className="fw-bold" style={{ marginBottom: 0 }}>{title}</h5>
        <span className="strategy-card-date-badge" style={{ fontSize: "0.74rem" }}>
          측정 기간: {getPeriodStr()}
        </span>
      </div>
      
      <DualMomentumTable list={list} isKr={isKr} />
    </div>
  );
}
