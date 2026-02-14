export type IndicatorKey =
  | "bitcoin"
  | "ethereum"
  | "solana"
  | "stablecoin"
  | "binance"


export const INDICATOR_COLORS: Record<
  IndicatorKey,
  { border: string; background: string }
> = {
  bitcoin: {
    border: "#F7931A", // Bitcoin Orange
    background: "rgba(247,147,26,0.15)"
  },
  ethereum: {
    border: "#627EEA", // Ethereum Blue
    background: "rgba(98,126,234,0.15)"
  },
  solana: {
    border: "#14F195", // Solana Green/Teal
    background: "rgba(20,241,149,0.15)"
  },
  stablecoin: {
    border: "#26A17B", // Tether Green
    background: "rgba(38,161,123,0.15)"
  },
  binance: {
    border: "#F3BA2F", // BNB Yellow
    background: "rgba(243,186,47,0.15)"
  }
};
