export async function fetchStockSearch(
  stockName?: string,
  stockCode?: string
) {
  const params = new URLSearchParams({
    ...(stockName ? { stockName } : {}),
    ...(stockCode ? { stockCode } : {})
  });

  const res = await fetch(`/stock/api/searchStock?${params.toString()}`);

  if (!res.ok) {
    throw new Error("Stock search fetch failed");
  }

  return res.json();
}
