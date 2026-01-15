import { useMemo } from "react";
import type { PriceRow } from "./StockSearchPage";
import type { RangeType } from "./StockSearchChart";

interface Params {
  priceList: PriceRow[];
  range: RangeType;
}

export function useStockChartData({ priceList, range }: Params) {
  return useMemo(() => {
    if (priceList.length === 0) {
      return { labels: [], values: [] };
    }

    const sorted = [...priceList].reverse();

    const rangeMap: Record<RangeType, number> = {
      "1m": 22,
      "3m": 66,
      "6m": 132,
      "1y": 260
    };

    const visible = rangeMap[range];
    const sliced = sorted.slice(-visible);

    return {
      labels: sliced.map(p => p.date),
      values: sliced.map(p => p.close)
    };
  }, [priceList, range]);
}
