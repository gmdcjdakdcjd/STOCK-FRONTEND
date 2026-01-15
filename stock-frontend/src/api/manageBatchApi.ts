// src/api/manageBatchApi.ts

// ============================
// Types (Backend DTO 기준)
// ============================

export type BatchDateGroupDTO = {
  date: string;      // LocalDate → string (yyyy-MM-dd)
  dateKey: string;   // 20251130
  items: any[];      // 상세 이력 (추후 타입 분리 가능)
};

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
 * 배치 이력 목록 (날짜 그룹)
 * 관리자 전용
 */
export async function getBatchHistory(
  page: number = 1,
  size: number = 10
): Promise<PageResponseDTO<BatchDateGroupDTO>> {

  const res = await fetch(
    `${BASE_URL}/batch/history?page=${page}&size=${size}`
  );

  if (!res.ok) {
    throw new Error("배치 이력 조회 실패");
  }

  return res.json();
}
