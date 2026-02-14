export type MarketIndicator = {
  date: string;
  code: string;
  close: number;
  changeAmount: number;
  changeRate: number;
  lastUpdate: string;
};

export type IndicatorResponse = {
  bitcoin: MarketIndicator[];
  ethereum: MarketIndicator[];
  solana: MarketIndicator[];
  binance: MarketIndicator[];
  stablecoin: MarketIndicator[];
};

export async function fetchIndicators(): Promise<IndicatorResponse> {
  const res = await fetch("/api/crypto");
  if (!res.ok) throw new Error(`indicator api error: ${res.status}`);
  return res.json();
}
