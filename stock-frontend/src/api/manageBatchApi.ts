// src/api/manageBatchApi.ts

// ============================
// Types (Backend DTO 기준 동기화)
// ============================

export type BatchDateGroupDTO = {
  execDate: string;    // LocalDate → string (yyyy-MM-dd)
  totalCount: number;
};

export interface BatchHistoryView {
  execDate: string;
  type: string;
  histId: number;
  jobId: number;
  jobName: string;
  execStatus: string;
  execMessage: string;
  execStartTime: string;
  execEndTime: string;
  durationMs: number;
}

export type PageRequestDTO = {
  page?: number;
  size?: number;
  type?: string;
  keyword?: string;
  regDate?: string;
};

export type PageResponseDTO<T> = {
  page: number;
  size: number;
  total: number;
  start: number;
  end: number;
  prev: boolean;
  next: boolean;
  dtoList: T[];
};

// ============================
// API Base
// ============================

const BASE_URL = "/api/manage";

// ============================
// API Functions
// ============================

/**
 * 배치 이력 날짜 목록 조회
 * @param page 페이지 번호
 * @param size 페이지 크기
 */
export async function getBatchHistoryDates(
  page: number = 1,
  size: number = 10
): Promise<PageResponseDTO<BatchDateGroupDTO>> {

  const res = await fetch(
    `${BASE_URL}/batch/history/dates?page=${page}&size=${size}`
  );

  if (!res.ok) {
    throw new Error("배치 이력 날짜 목록 조회 실패");
  }

  return res.json();
}

/**
 * 특정 날짜의 배치 상세 이력 조회
 * @param date 실행 날짜 (yyyy-MM-dd)
 * @param page 페이지 번호
 * @param size 페이지 크기
 */
export async function getBatchHistoryByDate(
  date: string,
  page: number = 1,
  size: number = 100 // 상세 내역은 넉넉하게 가져오되 스크롤 처리
): Promise<PageResponseDTO<BatchHistoryView>> {

  const res = await fetch(
    `${BASE_URL}/batch/history/${date}?page=${page}&size=${size}`
  );

  if (!res.ok) {
    throw new Error("배치 상세 이력 조회 실패");
  }

  return res.json();
}
