// src/api/manageBatchApi.ts

// ============================
// Types (Backend DTO 기준 동기화)
// ============================

export type BatchDateGroupDTO = {
  execDate: string;    // LocalDate → string (yyyy-MM-dd)
  totalCount: number;
  failCount: number;   // 실패한 배치 작업 건수
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

const BASE_URL = "/api/admin";

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
  size: number = 10,
  jobName?: string
): Promise<PageResponseDTO<BatchDateGroupDTO>> {

  let url = `${BASE_URL}/batch/history/dates?page=${page}&size=${size}`;
  if (jobName) {
    url += `&jobName=${encodeURIComponent(jobName)}`;
  }

  const res = await fetch(url);

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

// ============================
// 회원 관리 API (ADMIN 전용)
// ============================

export interface MemberDTO {
  mno?: number;
  mid: string;
  mpw?: string;
  email: string;
  del: boolean;
  social: boolean;
  grade: string;
  regDate?: string;
  delDate?: string;
  modDate?: string;
  createdAt?: string;
}

/**
 * 시스템의 전체 회원 목록을 관리자 권한으로 조회합니다.
 */
export async function getMemberList(): Promise<MemberDTO[]> {
  const res = await fetch("/api/admin/members", {
    credentials: "include",
    headers: {
      Accept: "application/json"
    }
  });

  if (!res.ok) {
    throw new Error("회원 목록 조회에 실패했습니다.");
  }

  return res.json();
}

/**
 * 특정 회원의 등급 정보를 변경합니다.
 * @param mid 회원 아이디
 * @param grade 변경할 등급 명칭 (BASIC, PREMIUM)
 */
export async function updateMemberGrade(
  mid: string,
  grade: string
): Promise<{ result: string }> {
  const res = await fetch(`/api/admin/members/${mid}/grade`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ grade }),
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error("회원 등급 변경에 실패했습니다.");
  }

  return res.json();
}

/**
 * 관리자가 특정 유형의 CSV 파일을 업로드합니다.
 * @param file 업로드할 파일 객체
 * @param fileType 파일 유형 구분자 (MONTHLY_ETF, MONTHLY_KRX, MONTHLY_NPS_KR, MONTHLY_NPS_US)
 */
export async function uploadCsvFile(
  file: File,
  fileType: string
): Promise<{ result: string; fileName: string; savedPath: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileType", fileType);

  const res = await fetch(`${BASE_URL}/upload-csv`, {
    method: "POST",
    body: formData,
    credentials: "include"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "파일 업로드 처리에 실패했습니다.");
  }

  return res.json();
}

export interface BatchJob {
  type: "IN" | "OUT";
  jobId: number;
  jobName: string;
  jobInfo: string;
  scheduleGb: string;
  jobMonth: string;
  jobDay: string;
  jobWeek: string;
  jobHour: string;
  jobMin: string;
  actGb: string;
  lastExecInfo: string;
  nextExecInfo: string;
  isActive: number;
}

/**
 * 전체 배치 설정 및 상태 목록 조회
 */
export async function getBatchJobs(): Promise<BatchJob[]> {
  const res = await fetch(`${BASE_URL}/batch/jobs`, {
    method: "GET",
    credentials: "include"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "배치 작업 조회에 실패했습니다.");
  }

  return res.json();
}

/**
 * 특정 배치 작업 즉시 재처리(트리거)
 */
export async function triggerBatchJob(type: string, jobId: number): Promise<{ result: string }> {
  const res = await fetch(`${BASE_URL}/batch/jobs/${type}/${jobId}/trigger`, {
    method: "POST",
    credentials: "include"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "배치 재처리 실행 요청에 실패했습니다.");
  }

  return res.json();
}

/**
 * 특정 배치 Job명 기준 최근 이력 조회
 */
export async function getBatchHistoryByJob(jobName: string, size: number = 50): Promise<BatchHistoryView[]> {
  const res = await fetch(`${BASE_URL}/batch/history/job/${encodeURIComponent(jobName)}?size=${size}`, {
    method: "GET",
    credentials: "include"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "단일 배치 이력 조회에 실패했습니다.");
  }

  return res.json();
}

/**
 * 특정 배치 작업의 실행 주기 스케줄 설정을 수정합니다.
 */
export async function updateBatchJobSchedule(
  type: string,
  jobId: number,
  data: {
    scheduleGb: string;
    jobHour: string;
    jobMin: string;
    jobWeek: string;
    jobDay: string;
    jobMonth: string;
  }
): Promise<{ result: string }> {
  const res = await fetch(`${BASE_URL}/batch/jobs/${type}/${jobId}/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data),
    credentials: "include"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "배치 스케줄 변경 설정에 실패했습니다.");
  }

  return res.json();
}
