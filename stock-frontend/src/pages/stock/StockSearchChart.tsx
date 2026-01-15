import type { PriceRow } from "./StockSearchPage";
import { useStockChartData } from "./useStockChartData";
import StockLineChart from "./StockLineChart";

export type RangeType = "1m" | "3m" | "6m" | "1y";

interface Props {
  priceList: PriceRow[];
  marketType: string;
  range: RangeType;
}

function StockSearchChart({ priceList, marketType, range }: Props) {
  const isKR = marketType === "KOSPI" || marketType === "KOSDAQ";

  const { labels, values } = useStockChartData({
    priceList,
    range
  });

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <StockLineChart
        labels={labels}
        values={values}
        isKR={isKR}
      />
    </div>
  );
}

export default StockSearchChart;
