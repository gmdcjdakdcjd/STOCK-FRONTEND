export type MarketIndicator = {
  date: string;
  code: string;
  close: number;
  changeAmount: number;
  changeRate: number;
  lastUpdate: string;
};

export type IndicatorResponse = {
  kospi: MarketIndicator[];
  spx: MarketIndicator[];
  usd: MarketIndicator[];
  jpy: MarketIndicator[];
  goldKr: MarketIndicator[];
  goldGlobal: MarketIndicator[];
  wti: MarketIndicator[];
  dubai: MarketIndicator[];
};

export async function fetchIndicators(): Promise<IndicatorResponse> {
  const res = await fetch("/indicator/api");
  if (!res.ok) throw new Error(`indicator api error: ${res.status}`);
  return res.json();
}
