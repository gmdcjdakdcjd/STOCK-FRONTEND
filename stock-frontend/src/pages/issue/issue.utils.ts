// pages/issue/issue.utils.ts

export const ISSUE_TITLE_MAP: Record<string, string> = {
  DAILY_DROP_SPIKE_KR: "국내 일일 급락 종목 📉",
  DAILY_RISE_SPIKE_KR: "국내 일일 급등 종목 📈",
  DAILY_TOP20_VOLUME_KR: "국내 거래량 상위 20 🔥",
  KODEX_TOP20_VOLUME_KR: "KODEX ETF 거래량 상위 📊",
  TIGER_TOP20_VOLUME_KR: "TIGER ETF 거래량 상위 📊",

  DAILY_DROP_SPIKE_US: "미국 일일 급락 종목 📉",
  DAILY_RISE_SPIKE_US: "미국 일일 급등 종목 📈",
  DAILY_TOP20_VOLUME_US: "미국 거래량 상위 20 🔥",
  ETF_TOP20_VOLUME_US: "미국 ETF 거래량 상위 📊"
};


export function getIssueTitle(key: string) {
  return ISSUE_TITLE_MAP[key] ?? key;
}
