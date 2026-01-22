export async function fetchNpsSummary() {
  const res = await fetch("/api/nps/summary");
  if (!res.ok) throw new Error("NPS summary fetch failed");
  return res.json();
}

export async function fetchNpsList(
  asset: string,
  market: string,
  q?: string
) {
  const params = new URLSearchParams({
    asset,
    market,
    ...(q ? { q } : {})
  });

  const res = await fetch(`/api/nps/list?${params.toString()}`);
  if (!res.ok) throw new Error("NPS list fetch failed");
  return res.json();
}
