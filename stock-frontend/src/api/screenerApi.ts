// src/api/screenerApi.ts

/* =====================================================
   나만의 조건식 API 데이터 타입 정의 (임시 주석 처리)
   초안 테스트를 위해 복잡한 DTO 구조는 주석 처리합니다.
===================================================== */
/*
export type ConditionDTO = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  filters: string[];
};

export type ScreenerResultDTO = {
  code: string;
  name: string;
  currentPrice: number;
  changeRate: number;
  marketCap: number;
  per: number | null;
  roe: number | null;
};
*/

const BASE_URL = "/api/screener";

/* =====================================================
   API 함수 구현
===================================================== */

/**
 * 화면에서 체크한 조건 필터 목록을 백엔드(Spring Boot)로 전송합니다.
 * Spring Boot는 이 필터 배열을 받아서 FastAPI 서버로 연동하게 됩니다.
 */
export async function runScreenerWithFilters(filters: string[], codes: string[] = [], market: string = "kr"): Promise<any> {
  const res = await fetch(`${BASE_URL}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filters, codes, market }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`스크리닝 요청 실패: ${errorText || res.statusText}`);
  }
  
  return res.json();
}

/**
 * 사용자가 조합한 스크리너 조건식을 백엔드 데이터베이스에 영구 저장합니다.
 */
export async function saveScreenerCondition(
  name: string,
  market: string,
  filters: string[],
  selectedEtfs: { etfId: string; etfName: string }[],
  id?: number | null
): Promise<any> {
  const res = await fetch(`${BASE_URL}/conditions/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, name, market, filters, selectedEtfs }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "조건식 저장에 실패했습니다.");
  }

  return res.json();
}

/**
 * 로그인한 사용자가 저장한 모든 조건식 목록을 백엔드로부터 가져옵니다.
 */
export async function getScreenerConditions(): Promise<any> {
  const res = await fetch(`${BASE_URL}/conditions/list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "조건식 목록을 불러오는데 실패했습니다.");
  }

  return res.json();
}

/**
 * 저장된 조건식을 영구 삭제합니다.
 */
export async function deleteScreenerCondition(id: number): Promise<any> {
  const res = await fetch(`${BASE_URL}/conditions/delete/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "조건식 삭제에 실패했습니다.");
  }

  return res.json();
}
