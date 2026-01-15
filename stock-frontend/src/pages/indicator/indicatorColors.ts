export type IndicatorKey =
  | "kospi"
  | "spx"
  | "usd"
  | "jpy"
  | "goldKr"
  | "goldGl"
  | "wti"
  | "dubai";

export const INDICATOR_COLORS: Record<
  IndicatorKey,
  { border: string; background: string }
> = {
  kospi:  { border: "#2E86DE", background: "rgba(46,134,222,0.25)" },
  spx:    { border: "#E74C3C", background: "rgba(231,76,60,0.25)" },
  usd:    { border: "#27AE60", background: "rgba(39,174,96,0.25)" },
  jpy:    { border: "#8E44AD", background: "rgba(142,68,173,0.25)" },
  goldKr: { border: "#F39C12", background: "rgba(243,156,18,0.25)" },
  goldGl: { border: "#D35400", background: "rgba(211,84,0,0.25)" },
  wti:    { border: "#16A085", background: "rgba(22,160,133,0.25)" },
  dubai:  { border: "#7F8C8D", background: "rgba(127,140,141,0.25)" }
};
