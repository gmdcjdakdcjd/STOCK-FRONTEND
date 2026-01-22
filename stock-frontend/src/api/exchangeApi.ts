export type MarketIndicator = {
  date: string;
  code: string;
  close: number;
  changeAmount: number;
  changeRate: number;
  lastUpdate: string;
};

export type IndicatorResponse = {
  cny: MarketIndicator[];
  eur: MarketIndicator[];
  gbp: MarketIndicator[];
  hkd: MarketIndicator[];
  jpy: MarketIndicator[];
  twd: MarketIndicator[];
  usd: MarketIndicator[];
};

export async function fetchIndicators(): Promise<IndicatorResponse> {
  const res = await fetch("/api/exchange");
  if (!res.ok) throw new Error(`indicator api error: ${res.status}`);
  return res.json();
}
