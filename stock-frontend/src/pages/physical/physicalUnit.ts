// physicalUnit.ts
import type { IndicatorKey } from "./physicalColors";

export function formatPhysicalValue(
  key: IndicatorKey,
  value: number
): string {
  switch (key) {
    // USD
    case "DUBAI":
    case "WTI":
    case "GOLD_GLOBAL":
    case "SILVER":
    case "COPPER":
    case "RICE":
      return `$${value.toLocaleString()}`;

    // CENT
    case "CORN":
    case "SUGAR":
    case "BEAN":
    case "COTTON":
    case "COFFEE":
      return `${value.toLocaleString()}¢`;

    // KRW
    case "GOLD_KR":
      return `${value.toLocaleString()}원`;

    default:
      return value.toLocaleString();
  }
}

export function getCurrencyLabel(key: IndicatorKey): string {
  switch (key) {
    case "DUBAI":
    case "WTI":
    case "GOLD_GLOBAL":
    case "SILVER":
    case "COPPER":
    case "RICE":
      return "USD";

    case "CORN":
    case "SUGAR":
    case "BEAN":
    case "COTTON":
    case "COFFEE":
      return "CENT";

    case "GOLD_KR":
      return "KRW";

    default:
      return "";
  }
}
