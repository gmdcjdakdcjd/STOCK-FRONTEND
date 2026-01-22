import type { BondResponse } from "../pages/bond/bond.types";

export async function fetchBondData(): Promise<BondResponse> {
  const res = await fetch("/api/bond");
  if (!res.ok) throw new Error("bond api error");
  return res.json();
}
