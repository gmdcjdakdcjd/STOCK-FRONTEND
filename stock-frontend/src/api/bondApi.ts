import type { BondResponse } from "../pages/bond/bond.types";

export async function fetchBondData(): Promise<BondResponse> {
  const res = await fetch("/bond/api");
  if (!res.ok) throw new Error("bond api error");
  return res.json();
}
