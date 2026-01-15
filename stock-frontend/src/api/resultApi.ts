/* =========================
   공통 Page 응답 타입
   ========================= */
export type PageResponse<T> = {
  dtoList: T[];
  page: number;
  size: number;
  start: number;
  end: number;
  prev: boolean;
  next: boolean;
};

/* =========================
   전략 코드
   ========================= */
export type StrategyCode = {
  code: string;
  label: string;
  market: "KR" | "US";
};

/* =========================
   전략 결과 Row
   ========================= */
export type StrategyResult = {
  strategyName: string;
  signalDate: string;
  totalData: number;
};

/* =========================
   목록 공통 응답
   ========================= */
export type StrategyListResponse = {
  market: "KR" | "US";
  strategyList: StrategyCode[];
  response: PageResponse<StrategyResult>;
  strategy?: string;
  regDate?: string;
};

/* =========================
   KR 목록
   ========================= */
export async function fetchKrResultList(
  params: URLSearchParams
): Promise<StrategyListResponse> {

  const res = await fetch(
    `/result/api/kr?${params.toString()}`,
    { credentials: "include" }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KR 전략 목록 조회 실패: ${text}`);
  }

  return res.json();
}

/* =========================
   US 목록
   ========================= */
export async function fetchUsResultList(
  params: URLSearchParams
): Promise<StrategyListResponse> {

  const res = await fetch(
    `/result/api/us?${params.toString()}`,
    { credentials: "include" }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`US 전략 목록 조회 실패: ${text}`);
  }

  return res.json();
}

/* =========================
   KR 상세
   ========================= */
export async function fetchKrResultDetail(
  strategy: string,
  date: string
) {
  const res = await fetch(
    `/result/api/kr/detail?strategy=${encodeURIComponent(strategy)}&date=${date}`,
    { credentials: "include" }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KR 전략 상세 조회 실패: ${text}`);
  }

  return res.json();
}

/* =========================
   US 상세
   ========================= */
export async function fetchUsResultDetail(
  strategy: string,
  date: string
) {
  const res = await fetch(
    `/result/api/us/detail?strategy=${encodeURIComponent(strategy)}&date=${date}`,
    { credentials: "include" }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`US 전략 상세 조회 실패: ${text}`);
  }

  return res.json();
}
