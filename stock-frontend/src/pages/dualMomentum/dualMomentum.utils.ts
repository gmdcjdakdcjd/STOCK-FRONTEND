const PERIOD_MAP: Record<string, string> = {
  "1M": "20일",
  "3M": "60일",
  "6M": "180일",
  "1Y": "365일"
};

export function parseStrategyTitle(key: string) {
  const isKr = key.endsWith("_KR");
  const nation = isKr ? "한국" : "미국";

  const periodKey = Object.keys(PERIOD_MAP).find(p => key.includes(p));
  const period = periodKey ? PERIOD_MAP[periodKey] : "";

  return {
    title: `${nation} ${period} 수익률 TOP20`,
    isKr
  };
}
