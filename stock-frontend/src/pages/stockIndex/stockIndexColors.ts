export type IndicatorKey =
  | "dow"
  | "hongkong"
  | "italy"
  | "kosdaq"
  | "kospi"
  | "england"
  | "nasdaq"
  | "japan"
  | "france"
  | "china"
  | "euro"
  | "taiwan"
  | "german"

export const INDICATOR_COLORS: Record<
  IndicatorKey,
  { border: string; background: string }
> = {
  dow: {
    border: "#1ABC9C",
    background: "rgba(26,188,156,0.25)"
  },
  nasdaq: {
    border: "#3498DB",
    background: "rgba(52,152,219,0.25)"
  },
  kospi: {
    border: "#2E86DE",
    background: "rgba(46,134,222,0.25)"
  },
  kosdaq: {
    border: "#5DADE2",
    background: "rgba(93,173,226,0.25)"
  },
  japan: {
    border: "#F39C12",
    background: "rgba(243,156,18,0.25)"
  },
  china: {
    border: "#E74C3C",
    background: "rgba(231,76,60,0.25)"
  },
  hongkong: {
    border: "#8E44AD",
    background: "rgba(142,68,173,0.25)"
  },
  taiwan: {
    border: "#D35400",
    background: "rgba(211,84,0,0.25)"
  },
  euro: {
    border: "#2980B9",
    background: "rgba(41,128,185,0.25)"
  },
  england: {
    border: "#27AE60",
    background: "rgba(39,174,96,0.25)"
  },
  france: {
    border: "#34495E",
    background: "rgba(52,73,94,0.25)"
  },
  german: {
    border: "#7F8C8D",
    background: "rgba(127,140,141,0.25)"
  },
  italy: {
    border: "#16A085",
    background: "rgba(22,160,133,0.25)"
  }
};
