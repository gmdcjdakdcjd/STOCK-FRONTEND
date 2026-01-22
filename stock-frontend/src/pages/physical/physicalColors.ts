export type IndicatorKey =
  | "BEAN"
  | "COFFEE"
  | "COPPER"
  | "CORN"
  | "COTTON"
  | "DUBAI"
  | "GOLD_GLOBAL"
  | "GOLD_KR"
  | "RICE"
  | "SILVER"
  | "SUGAR"
  | "WTI";

export const INDICATOR_COLORS: Record<
  IndicatorKey,
  { border: string; background: string }
> = {
  BEAN: {
    border: "#1F77B4", // 블루
    background: "rgba(31,119,180,0.25)",
  },
  COFFEE: {
    border: "#FF7F0E", // 오렌지
    background: "rgba(255,127,14,0.25)",
  },
  COPPER: {
    border: "#2CA02C", // 그린
    background: "rgba(44,160,44,0.25)",
  },
  CORN: {
    border: "#D62728", // 레드
    background: "rgba(214,39,40,0.25)",
  },
  COTTON: {
    border: "#9467BD", // 퍼플
    background: "rgba(148,103,189,0.25)",
  },
  DUBAI: {
    border: "#8C564B", // 브라운
    background: "rgba(140,86,75,0.25)",
  },
  GOLD_GLOBAL: {
    border: "#E377C2", // 핑크
    background: "rgba(227,119,194,0.25)",
  },
  GOLD_KR: {
    border: "#7F7F7F", // 다크 그레이
    background: "rgba(127,127,127,0.25)",
  },
  RICE: {
    border: "#BCBD22", // 올리브 옐로우
    background: "rgba(188,189,34,0.25)",
  },
  SILVER: {
    border: "#17BECF", // 시안
    background: "rgba(23,190,207,0.25)",
  },
  SUGAR: {
    border: "#AEC7E8", // 라이트 블루
    background: "rgba(174,199,232,0.25)",
  },
  WTI: {
    border: "#FF9896", // 연한 레드
    background: "rgba(255,152,150,0.25)",
  },
};
