import type { StrategyMap } from "../pages/dualMomentum/dualMomentum.types";

export async function fetchDualMomentum(): Promise<StrategyMap> {
  const res = await fetch("/api/dual-momentum");

  if (!res.ok) {
    throw new Error(`DualMomentum API fetch failed (${res.status})`);
  }

  return res.json();
}
