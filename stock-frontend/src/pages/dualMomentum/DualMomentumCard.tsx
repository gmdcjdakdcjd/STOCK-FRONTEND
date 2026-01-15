import DualMomentumTable from "./DualMomentumTable";
import { parseStrategyTitle } from "./dualMomentum.utils";
import type { StrategyDetail } from "./dualMomentum.types";

type Props = {
  strategyKey: string;
  list: StrategyDetail[];
};

export default function DualMomentumCard({ strategyKey, list }: Props) {
  const { title, isKr } = parseStrategyTitle(strategyKey);

  return (
    <div className="dashboard-card">
      <h5 className="fw-bold">{title}</h5>
      <DualMomentumTable list={list} isKr={isKr} />
    </div>
  );
}
