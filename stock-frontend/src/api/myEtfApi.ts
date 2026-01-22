import type {
  MyEtfSummaryDTO,
  MyEtfCreateRequestDTO,
  MyEtfDetailResponseDTO,
  PageResponseDTO,
} from "../pages/myEtf/myEtf.types";

/* =========================
   ETF 목록
========================= */
export async function fetchMyEtfList(
  page: number,
  size: number
): Promise<PageResponseDTO<MyEtfSummaryDTO>> {
  const res = await fetch(
    `/api/myetf/list?page=${page}&size=${size}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error("MYETF_LIST_ERROR");
  return res.json();
}

/* =========================
   ETF 생성
========================= */
export async function createMyEtf(
  body: MyEtfCreateRequestDTO
): Promise<void> {
  const res = await fetch("/api/myetf/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.status === 409) {
    throw new Error("DUPLICATED_ETF_NAME");
  }
  if (!res.ok) {
    throw new Error("MYETF_CREATE_ERROR");
  }
}

/* =========================
   ETF 삭제
========================= */
export async function deleteMyEtf(etfName: string): Promise<void> {
  const res = await fetch("/api/myetf/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ etfName }),
  });

  if (!res.ok) throw new Error("MYETF_DELETE_ERROR");
}

/* =========================
   ETF 상세  ⭐ 핵심 수정
========================= */
export async function fetchMyEtfDetail(
  etfName: string
): Promise<MyEtfDetailResponseDTO> {
  const res = await fetch(
    `/api/myetf/detail?etfName=${encodeURIComponent(etfName)}`,
    {
      credentials: "include", // ⭐ 이거 없어서 Loading 걸렸던 거
    }
  );

  if (!res.ok) throw new Error("MYETF_DETAIL_ERROR");
  return res.json();
}
