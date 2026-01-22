export type IndicatorKey =
  | "cny"
  | "eur"
  | "gbp"
  | "hkd"
  | "jpy"
  | "twd"
  | "usd"

export const INDICATOR_COLORS: Record<
  IndicatorKey,
  { border: string; background: string }
> = {
  cny:  { border: "#2E86DE", background: "rgba(46,134,222,0.25)" },
  eur:    { border: "#E74C3C", background: "rgba(231,76,60,0.25)" },
  gbp:    { border: "#27AE60", background: "rgba(39,174,96,0.25)" },
  hkd:    { border: "#8E44AD", background: "rgba(142,68,173,0.25)" },
  jpy: { border: "#F39C12", background: "rgba(243,156,18,0.25)" },
  twd: { border: "#D35400", background: "rgba(211,84,0,0.25)" },
  usd:    { border: "#16A085", background: "rgba(22,160,133,0.25)" }
};
