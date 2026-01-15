// src/api/myStockApi.ts

// ============================
// Types (Backend DTO 기준)
// ============================

export type MyStockDTO = {
  id: number;
  userId?: string;

  code: string;
  name: string;
  strategyName: string;
  specialValue?: number;

  priceAtAdd: number;
  targetPrice5: number;
  targetPrice10: number;
  memo?: string;

  createdAt: string;
  updatedAt?: string;

  deletedYn?: string;
  deletedAt?: string;

  // 조회 전용
  currentPrice: number;
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

const BASE_URL = "/mystock/api";

// ============================
// API Functions
// ============================

/**
 * 관심종목 일괄 등록
 */
export async function addMyStock(list: MyStockDTO[]) {
  const res = await fetch(`${BASE_URL}/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(list),
  });

  if (!res.ok) {
    throw new Error("관심종목 등록 실패");
  }

  return res.json();
}

/**
 * KR 관심종목 목록
 */
export async function getMyStockKR(
  page: number = 1,
  size: number = 10
): Promise<PageResponseDTO<MyStockDTO>> {
  const res = await fetch(
    `${BASE_URL}/list/kr?page=${page}&size=${size}`
  );

  if (!res.ok) {
    throw new Error("KR 관심종목 조회 실패");
  }

  return res.json();
}

/**
 * US 관심종목 목록
 */
export async function getMyStockUS(
  page: number = 1,
  size: number = 10
): Promise<PageResponseDTO<MyStockDTO>> {
  const res = await fetch(
    `${BASE_URL}/list/us?page=${page}&size=${size}`
  );

  if (!res.ok) {
    throw new Error("US 관심종목 조회 실패");
  }

  return res.json();
}

/**
 * KR / US 동시 조회 (초기 로딩용)
 */
export async function getMyStockAll(
  krPage: number = 1,
  usPage: number = 1
): Promise<{
  kr: PageResponseDTO<MyStockDTO>;
  us: PageResponseDTO<MyStockDTO>;
}> {
  const res = await fetch(
    `${BASE_URL}/list?krPage=${krPage}&usPage=${usPage}`
  );

  if (!res.ok) {
    throw new Error("관심종목 전체 조회 실패");
  }

  return res.json();
}

/**
 * 관심종목 삭제 (soft delete)
 */
export async function deleteMyStock(id: number) {
  const res = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("관심종목 삭제 실패");
  }

  return res.json();
}

/**
 * 삭제된 관심종목 목록
 */
export async function getDeletedMyStock(
  page: number = 1,
  size: number = 10
): Promise<PageResponseDTO<MyStockDTO>> {
  const res = await fetch(
    `${BASE_URL}/deleted?page=${page}&size=${size}`
  );

  if (!res.ok) {
    throw new Error("삭제된 관심종목 조회 실패");
  }

  return res.json();
}

/**
 * 관심종목 복구
 */
export async function restoreMyStock(id: number) {
  const res = await fetch(`${BASE_URL}/restore/${id}`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("관심종목 복구 실패");
  }

  return res.json();
}
