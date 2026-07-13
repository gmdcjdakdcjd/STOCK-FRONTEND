// src/api/authApi.ts

/**
 * 비밀번호를 변경하기 위해 백엔드 API를 호출합니다.
 * @param currentPw 현재 사용 중인 비밀번호
 * @param newPw 변경하고자 하는 새로운 비밀번호
 */
export async function changePassword(currentPw: string, newPw: string): Promise<void> {
  const res = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currentPw, newPw }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "비밀번호 변경 처리에 실패했습니다.");
  }
}

/**
 * 현재 사용 중인 비밀번호가 올바른지 사전에 백엔드에 확인을 검증합니다.
 * @param password 본인 확인용 현재 비밀번호
 * @returns 비밀번호 일치 여부 (true/false)
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const res = await fetch("/api/auth/verify-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });
  return res.ok;
}

/**
 * 프리미엄 멤버십 가입 신청을 위해 백엔드 API를 호출합니다.
 */
export async function joinMembership(): Promise<void> {
  const res = await fetch("/api/auth/membership", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "멤버십 가입 처리에 실패했습니다.");
  }
}

/**
 * 프리미엄 멤버십을 해지하고 일반(BASIC) 등급으로 변경하기 위해 백엔드 API를 호출합니다.
 */
export async function cancelMembership(): Promise<void> {
  const res = await fetch("/api/auth/membership/cancel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "멤버십 해지 처리에 실패했습니다.");
  }
}

/**
 * 회원 탈퇴(계정 비활성화) 처리를 위해 백엔드 API를 호출합니다.
 * @param password 본인 확인용 현재 비밀번호
 */
export async function withdrawMember(password: string): Promise<void> {
  const res = await fetch("/api/auth/withdraw", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "회원 탈퇴 처리에 실패했습니다.");
  }
}

/**
 * 이메일 주소를 변경하기 위해 백엔드 API를 호출합니다.
 * @param email 변경할 새로운 이메일 주소
 */
export async function changeEmail(email: string): Promise<void> {
  const res = await fetch("/api/auth/change-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "이메일 변경 처리에 실패했습니다.");
  }
}
