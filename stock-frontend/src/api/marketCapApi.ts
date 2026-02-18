export type MarketCap = {
    ranking: number;
    code: string;
    name: string;
    listedStockCount: number;
    currentPrice: number;
    marketCap: number;
};
export type MarketCapResponse = MarketCap[];
export async function fetchMarketCap(): Promise<MarketCapResponse> {
    const res = await fetch("/api/marketCap");

    if (!res.ok) {
        throw new Error(`marketCap api error: ${res.status}`);
    }

    return res.json();
}
