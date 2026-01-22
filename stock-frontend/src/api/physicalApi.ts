export type MarketIndicator = {
  date: string;
  code: string;
  close: number;
  changeAmount: number;
  changeRate: number;
  lastUpdate: string;
};

export type IndicatorResponse = {
  BEAN: MarketIndicator[];
  COFFEE: MarketIndicator[];
  COPPER: MarketIndicator[];
  CORN: MarketIndicator[];
  COTTON: MarketIndicator[];
  DUBAI: MarketIndicator[];
  GOLD_GLOBAL: MarketIndicator[];
  GOLD_KR: MarketIndicator[];
  SILVER: MarketIndicator[];
  RICE:MarketIndicator[];
  SUGAR: MarketIndicator[];
  WTI: MarketIndicator[];
};

export async function fetchIndicators(): Promise<IndicatorResponse> {
  const res = await fetch("/api/physical");
  if (!res.ok) throw new Error(`indicator api error: ${res.status}`);
  return res.json();
}
