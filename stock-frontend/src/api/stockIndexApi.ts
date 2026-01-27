export type MarketIndicator = {
  date: string;
  code: string;
  close: number;
  changeAmount: number;
  changeRate: number;
  lastUpdate: string;
};

export type IndicatorResponse = {
  dow: MarketIndicator[];
  snp500: MarketIndicator[];
  hongkong: MarketIndicator[];
  italy: MarketIndicator[];
  kosdaq: MarketIndicator[];
  kospi: MarketIndicator[];
  england: MarketIndicator[];
  nasdaq: MarketIndicator[];
  japan: MarketIndicator[];
  france: MarketIndicator[];
  china: MarketIndicator[];
  euro: MarketIndicator[];
  taiwan: MarketIndicator[];
  german: MarketIndicator[];
};

export async function fetchIndicators(): Promise<IndicatorResponse> {
  const res = await fetch("/api/stockIndex");
  if (!res.ok) throw new Error(`indicator api error: ${res.status}`);
  return res.json();
}
