export interface TigerEtfSummary {
  etfId: string;
  etfName: string; // 백엔드 DTO에 추가된 필드
  baseDate: string;
  totalCnt: number;
  lastUpdate?: string; // 백엔드의 LocalDateTime 대응 필드
}

export interface TigerEtfHolding {
  etfId: string;
  baseDate: string;
  stockCode: string;
  stockName: string;
  holdingQty: number;  // BigDecimal 대응 필드
  weightRatio: number; // BigDecimal 대응 필드
  lastUpdate?: string; // 백엔드의 LocalDateTime 대응 필드
}


export async function fetchTigerSummary(q?: string) {
  const params = new URLSearchParams();
  if (q) params.append("q", q);

  const res = await fetch(`/api/tiger/summary?${params.toString()}`);
  if (!res.ok) throw new Error("Tiger summary fetch failed");

  return res.json() as Promise<TigerEtfSummary[]>;
}

// TigerApi.ts
export async function fetchTigerHoldings(etfId: string) {
  const res = await fetch(`/api/tiger/holdings?etfId=${etfId}`);
  if (!res.ok) throw new Error("Tiger holdings fetch failed");
  return res.json() as Promise<TigerEtfHolding[]>;
}