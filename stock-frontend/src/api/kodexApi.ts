export interface KodexEtfSummary {
  etfId: string;
  etfName: string;
  irpYn: string;
  totalCnt: number;    
  baseDate: string;
}

export interface KodexEtfHolding {
  stockCode: string;
  stockName: string;
  holdingQty: number;
  currentPrice?: number;
  evalAmount: number;
  weightRatio: number;
}


export async function fetchKodexSummary(q?: string) {
  const params = new URLSearchParams();
  if (q) params.append("q", q);

  const res = await fetch(`/kodex/api/summary?${params.toString()}`);
  if (!res.ok) throw new Error("KODEX summary fetch failed");

  return res.json() as Promise<KodexEtfSummary[]>;
}

// kodexApi.ts
export async function fetchKodexHoldings(etfId: string) {
  const res = await fetch(`/kodex/api/holdings?etfId=${etfId}`);
  if (!res.ok) throw new Error("KODEX holdings fetch failed");
  return res.json() as Promise<KodexEtfHolding[]>;
}