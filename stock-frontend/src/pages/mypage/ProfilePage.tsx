// src/pages/mypage/ProfilePage.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  changePassword,
  verifyPassword,
  changeEmail,
  joinMembership,
  cancelMembership,
  withdrawMember
} from "../../api/authApi";
import "./profile-page.css";

interface UserProfile {
  mid: string;
  email: string | null;
  social: boolean;
  grade: "BASIC" | "PREMIUM" | string;
}

/**
 * 일반 사용자가 본인의 개인정보(ID, 이메일, 멤버십 등급)를 모니터링하고,
 * 비밀번호 수정, 이메일 주소 수정, 프리미엄 멤버십 등급 가입 및 해지, 회원 탈퇴를 직접 진행할 수 있는 페이지입니다.
 */
export default function ProfilePage() {
  const navigate = useNavigate();

  // 사용자 정보 상태 관리
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 이메일 변경 전용 카드 섹션 관련 상태 관리
  const [newEmail, setNewEmail] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [submittingEmail, setSubmittingEmail] = useState(false);

  // 비밀번호 수정 폼 관련 상태 관리
  const [currentPw, setCurrentPw] = useState("");
  const [isCurrentPwVerified, setIsCurrentPwVerified] = useState(false);
  const [verifyingPw, setVerifyingPw] = useState(false);

  // 새 비밀번호 및 실시간 유효성 검사 경고 상태 관리
  const [newPw, setNewPw] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [submittingPw, setSubmittingPw] = useState(false);

  // 멤버십 가입 및 해지 진행 상태 관리
  const [submittingMembership, setSubmittingMembership] = useState(false);
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // 회원 탈퇴 확인 양식 노출 및 탈퇴 패스워드 상태 관리
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawPw, setWithdrawPw] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // 마운트 시 사용자 프로필 데이터 호출
  useEffect(() => {
    fetchProfile();
  }, []);

  /**
   * 백엔드 API로부터 로그인된 사용자의 최신 개인정보 데이터를 조회합니다.
   */
  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        throw new Error("인증 세션이 유효하지 않습니다.");
      }
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error("프로필 로드 실패:", err);
      alert("로그인이 만료되었거나 사용자 정보를 가져오는데 실패했습니다. 로그인 페이지로 이동합니다.");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 새 이메일 주소 입력 시 실시간 정규식 포맷 검증기입니다.
   */
  const handleEmailInputChange = (val: string) => {
    setNewEmail(val);
    setIsEmailVerified(false); // 입력값 변경 시 중복 검증 상태 해제

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (val && !emailRegex.test(val)) {
      setEmailError("올바른 이메일 형식이 아닙니다. (예: user@example.com)");
    } else {
      setEmailError("");
    }
  };

  /**
   * 새 이메일 주소의 가용성(중복 여부)을 검증하는 확인 버튼 핸들러입니다.
   */
  const handleVerifyEmail = async () => {
    if (!newEmail) {
      alert("변경할 이메일 주소를 입력해 주십시오.");
      return;
    }
    if (emailError) {
      alert("이메일 주소의 형식을 확인해 주십시오.");
      return;
    }
    if (profile && newEmail === profile.email) {
      alert("현재 사용 중인 이메일 주소와 동일합니다.");
      return;
    }

    setCheckingEmail(true);
    try {
      const res = await fetch(`/api/auth/check-email?email=${newEmail}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("중복 확인 API 호출에 실패했습니다.");
      }
      const isAvailable = await res.json(); // true: 사용가능, false: 중복됨
      if (isAvailable) {
        setIsEmailVerified(true);
        alert("사용 가능한 이메일 주소입니다. 변경 사항을 저장할 수 있습니다.");
      } else {
        alert("이미 등록되어 사용 중인 이메일 주소입니다. 다른 주소를 기입해 주십시오.");
      }
    } catch (err) {
      console.error("이메일 중복 체크 에러:", err);
      alert("이메일 주소 중복 체크 중 예외가 발생했습니다.");
    } finally {
      setCheckingEmail(false);
    }
  };

  /**
   * 이메일 주소 변경 최종 제출 핸들러입니다.
   */
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEmailVerified) {
      alert("이메일 중복 확인을 먼저 수행해 주십시오.");
      return;
    }

    if (window.confirm("이메일 주소를 변경하시겠습니까?")) {
      setSubmittingEmail(true);
      try {
        await changeEmail(newEmail);
        alert("이메일 주소가 성공적으로 변경되었습니다.");
        setNewEmail("");
        setIsEmailVerified(false);
        await fetchProfile(); // 사용자 세션 데이터 최신 리로드
      } catch (err: any) {
        console.error("이메일 변경 실패:", err);
        alert(err.message || "이메일 변경 도중 에러가 발생했습니다.");
      } finally {
        setSubmittingEmail(false);
      }
    }
  };

  /**
   * 비밀번호 변경을 위해 현재 비밀번호의 일치 여부를 미리 검증하는 핸들러입니다.
   */
  const handleVerifyCurrentPassword = async () => {
    if (!currentPw) {
      alert("현재 비밀번호를 입력해 주시기 바랍니다.");
      return;
    }

    setVerifyingPw(true);
    try {
      const match = await verifyPassword(currentPw);
      if (match) {
        setIsCurrentPwVerified(true);
        alert("현재 비밀번호가 확인되었습니다. 새 비밀번호를 변경해 주십시오.");
      } else {
        alert("현재 비밀번호가 올바르지 않습니다. 다시 입력해 주십시오.");
      }
    } catch (err) {
      console.error("비밀번호 검증 중 오류:", err);
      alert("비밀번호 확인 중 예외가 발생했습니다.");
    } finally {
      setVerifyingPw(false);
    }
  };

  /**
   * 새 비밀번호 입력 시 실시간 유효성 검사 수행 핸들러입니다.
   */
  const handleNewPwChange = (value: string) => {
    setNewPw(value);

    // 1. 이전 비밀번호와의 동일성 검증
    if (value && value === currentPw) {
      setPasswordError("이전 비밀번호와 동일합니다. 다른 비밀번호를 사용해 주십시오.");
    } else {
      setPasswordError("");
    }

    // 2. 새 비밀번호 확인 필드와의 일치성 실시간 재검증
    if (confirmNewPw && value !== confirmNewPw) {
      setConfirmPasswordError("입력한 새 비밀번호와 맞지 않습니다.");
    } else {
      setConfirmPasswordError("");
    }
  };

  /**
   * 새 비밀번호 확인 입력 시 실시간 일치 검사 수행 핸들러입니다.
   */
  const handleConfirmNewPwChange = (value: string) => {
    setConfirmNewPw(value);

    if (newPw && value !== newPw) {
      setConfirmPasswordError("입력한 새 비밀번호와 맞지 않습니다.");
    } else {
      setConfirmPasswordError("");
    }
  };

  /**
   * 비밀번호 변경 폼 제출 이벤트 핸들러입니다.
   */
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isCurrentPwVerified) {
      alert("현재 비밀번호 확인(검증) 버튼을 먼저 완료해 주십시오.");
      return;
    }

    if (!newPw || !confirmNewPw) {
      alert("변경할 새 비밀번호 정보를 모두 입력해 주시기 바랍니다.");
      return;
    }

    if (passwordError || confirmPasswordError) {
      alert("유효성 검사를 통과하지 못한 항목이 있습니다. 경고 문구를 확인하십시오.");
      return;
    }

    if (window.confirm("비밀번호를 정말로 변경하시겠습니까? 변경 완료 즉시 로그아웃되며 새 비밀번호로 다시 로그인하셔야 합니다.")) {
      setSubmittingPw(true);
      try {
        await changePassword(currentPw, newPw);
        alert("비밀번호가 성공적으로 변경되었습니다. 다시 로그인해 주십시오.");
        navigate("/");
        window.location.reload();
      } catch (err: any) {
        console.error("비밀번호 변경 실패:", err);
        alert(err.message || "비밀번호 변경 처리 중 에러가 발생했습니다.");
      } finally {
        setSubmittingPw(false);
      }
    }
  };

  /**
   * 프리미엄 멤버십 가입 신청 핸들러입니다.
   */
  const handleJoinMembership = async () => {
    if (!profile) return;

    if (window.confirm("프리미엄 멤버십(PREMIUM 등급)에 가입하시겠습니까? 가입 즉시 특별 혜택이 적용됩니다.")) {
      setSubmittingMembership(true);
      try {
        await joinMembership();
        alert("축하합니다! 프리미엄 멤버십 가입이 성공적으로 완료되었습니다.");
        await fetchProfile(); // 데이터 갱신
      } catch (err: any) {
        console.error("멤버십 가입 실패:", err);
        alert(err.message || "멤버십 가입 처리 도중 오류가 발생했습니다.");
      } finally {
        setSubmittingMembership(false);
      }
    }
  };

  /**
   * 프리미엄 멤버십 해지 신청 핸들러입니다.
   */
  const handleCancelMembership = async () => {
    if (!profile) return;

    if (window.confirm("정말로 프리미엄 멤버십을 해지하시겠습니까? 해지 즉시 모든 프리미엄 권한이 상실되고 일반(BASIC) 회원으로 변경됩니다.")) {
      setSubmittingCancel(true);
      try {
        await cancelMembership();
        alert("프리미엄 멤버십 해지 처리가 완료되었습니다.");
        await fetchProfile(); // 데이터 갱신
      } catch (err: any) {
        console.error("멤버십 해지 실패:", err);
        alert(err.message || "멤버십 해지 처리 도중 오류가 발생했습니다.");
      } finally {
        setSubmittingCancel(false);
      }
    }
  };

  /**
   * 최종 회원 탈퇴 폼 제출 핸들러입니다.
   */
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!withdrawPw) {
      alert("탈퇴 처리를 위해 본인 확인용 현재 비밀번호를 입력해 주십시오.");
      return;
    }

    const firstConfirm = window.confirm("회원 탈퇴 시 작성하신 데이터 일부 및 개인정보 보관 규정에 저촉되지 않는 모든 데이터가 비활성화됩니다. 정말로 탈퇴하시겠습니까?");
    if (!firstConfirm) return;

    const secondConfirm = window.confirm("탈퇴 후에는 해당 계정의 로그인이 불가능합니다. 탈퇴 처리를 진행할까요?");
    if (!secondConfirm) return;

    setSubmittingWithdraw(true);
    try {
      await withdrawMember(withdrawPw);
      alert("회원 탈퇴 처리가 정상적으로 완료되었습니다. 그동안 서비스를 이용해 주셔서 감사합니다.");
      navigate("/");
      window.location.reload();
    } catch (err: any) {
      console.error("회원 탈퇴 처리 실패:", err);
      alert(err.message || "비밀번호가 일치하지 않거나 회원 탈퇴 처리에 실패했습니다.");
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="no-data-msg">회원 프로필 정보를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="no-data-msg">사용자 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* 프로필 최상단 타이틀 */}
      <div className="profile-header">
        <h3>내 정보 관리</h3>
        <span className="profile-header-subtitle">
          로그인된 본인 계정의 상세 정보를 확인하고 보안 및 권한 설정을 제어합니다.
        </span>
      </div>

      {/* 1. 기본 회원 정보 카드 (읽기 전용) */}
      <div className="profile-card">
        <h4>기본 회원 정보</h4>
        <div className="info-grid">
          <div className="info-row">
            <span className="info-label">아이디 (ID)</span>
            <span className="info-value" style={{ color: "#1e3a8a" }}>
              {profile.mid}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">이메일 주소</span>
            <span className="info-value">{profile.email || "등록된 이메일 없음"}</span>
          </div>

          {/* 가입 유형 정보 임시 주석 처리
          <div className="info-row">
            <span className="info-label">가입 유형</span>
            <span className="info-value">
              {profile.social ? "소셜 간편 로그인 계정" : "일반 회원가입 계정"}
            </span>
          </div>
          */}
        </div>
      </div>

      {/* 2. 멤버십 상태 및 프리미엄 가입/해지 카드 */}
      {profile.grade === "PREMIUM" ? (
        <div className="profile-card">
          <h4>나의 멤버십 혜택</h4>
          <div className="membership-banner premium">
            <div style={{ fontSize: "28px" }}>👑</div>
            <span className="membership-status-text">프리미엄 멤버십 회원</span>
            <p className="membership-desc">
              귀하는 프리미엄 혜택을 이용 중인 특별 회원입니다. 모든 시장 분석 데이터와 조건식 포뮬러를 제한 없이 이용하실 수 있습니다.
            </p>
            <button
              type="button"
              className="membership-join-btn"
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626) !important",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
                marginTop: "8px"
              }}
              disabled={submittingCancel}
              onClick={handleCancelMembership}
            >
              {submittingCancel ? "해지 처리 중..." : "멤버십 해지하기"}
            </button>
          </div>
        </div>
      ) : (
        /* 일반 회원일 때는 미사용 변수(TypeScript 에러) 방지를 위해 보이지 않는 바인딩 노드만 렌더링 */
        <div style={{ display: "none" }}>
          <button
            type="button"
            disabled={submittingMembership}
            onClick={handleJoinMembership}
          />
        </div>
      )}

      {/* 3. 이메일 주소 변경 카드 (신설 및 중복 확인 버튼 탑재) */}
      <div className="profile-card">
        <h4>이메일 주소 변경</h4>
        {profile.social ? (
          <div className="social-warning-banner">
            소셜 연동 계정은 소셜 플랫폼에서 이메일 정보를 공급받으므로 개별 변경을 지원하지 않습니다.
          </div>
        ) : (
          <form className="profile-form" onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label htmlFor="newEmailInput">변경할 새로운 이메일 주소</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  id="newEmailInput"
                  type="text"
                  className="form-input"
                  placeholder="새롭게 설정할 이메일 주소를 입력해 주십시오."
                  disabled={isEmailVerified}
                  value={newEmail}
                  onChange={e => handleEmailInputChange(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    whiteSpace: "nowrap",
                    background: isEmailVerified ? "#ecfdf5" : "#ffffff",
                    color: isEmailVerified ? "#065f46" : "#4b5563",
                    borderColor: isEmailVerified ? "#a7f3d0" : "#d1d5db"
                  }}
                  disabled={isEmailVerified || checkingEmail || !newEmail || !!emailError}
                  onClick={handleVerifyEmail}
                >
                  {checkingEmail ? "확인 중..." : isEmailVerified ? "검증 완료" : "중복 확인"}
                </button>
              </div>
              {emailError && <span className="validation-error">{emailError}</span>}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                type="submit"
                className="membership-join-btn"
                style={{
                  background: "linear-gradient(135deg, #1e293b, #0f172a) !important",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)"
                }}
                disabled={!isEmailVerified || submittingEmail}
              >
                {submittingEmail ? "저장 중..." : "이메일 저장"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4. 비밀번호 변경 카드 (일반 회원가입 유저만 노출) */}
      <div className="profile-card">
        <h4>비밀번호 변경</h4>
        {profile.social ? (
          <div className="social-warning-banner">
            소셜 연동을 통해 간편 가입한 소셜 계정은 비밀번호 변경 기능을 지원하지 않습니다.
            <br />
            해당 소셜 서비스 제공사에서 암호 설정을 진행해 주시기 바랍니다.
          </div>
        ) : (
          <form className="profile-form" onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="currentPwInput">현재 비밀번호</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  id="currentPwInput"
                  type="password"
                  className="form-input"
                  placeholder="현재 사용 중인 비밀번호를 입력하십시오."
                  disabled={isCurrentPwVerified}
                  value={currentPw}
                  onChange={e => {
                    setCurrentPw(e.target.value);
                    setIsCurrentPwVerified(false); // 값 변경 시 검증 해제
                  }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    whiteSpace: "nowrap",
                    background: isCurrentPwVerified ? "#ecfdf5" : "#ffffff",
                    color: isCurrentPwVerified ? "#065f46" : "#4b5563",
                    borderColor: isCurrentPwVerified ? "#a7f3d0" : "#d1d5db"
                  }}
                  disabled={isCurrentPwVerified || verifyingPw}
                  onClick={handleVerifyCurrentPassword}
                >
                  {verifyingPw ? "확인 중..." : isCurrentPwVerified ? "확인 완료" : "비밀번호 확인"}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="newPwInput">새 비밀번호</label>
              <input
                id="newPwInput"
                type="password"
                className="form-input"
                placeholder="새롭게 변경할 비밀번호를 입력하십시오."
                disabled={!isCurrentPwVerified}
                value={newPw}
                onChange={e => handleNewPwChange(e.target.value)}
              />
              {passwordError && <span className="validation-error">{passwordError}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="confirmNewPwInput">새 비밀번호 확인</label>
              <input
                id="confirmNewPwInput"
                type="password"
                className="form-input"
                placeholder="변경할 비밀번호를 동일하게 한 번 더 입력하십시오."
                disabled={!isCurrentPwVerified}
                value={confirmNewPw}
                onChange={e => handleConfirmNewPwChange(e.target.value)}
              />
              {confirmPasswordError && <span className="validation-error">{confirmPasswordError}</span>}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                type="submit"
                className="membership-join-btn"
                style={{
                  background: "linear-gradient(135deg, #1e293b, #0f172a) !important",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)"
                }}
                disabled={!isCurrentPwVerified || !!passwordError || !!confirmPasswordError || !newPw || submittingPw}
              >
                {submittingPw ? "비밀번호 변경 중..." : "비밀번호 변경"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 5. 회원 탈퇴 위험 섹션 카드 */}
      <div className="profile-card withdraw-card">
        <h4>회원 탈퇴</h4>
        <p className="withdraw-warning-text">
          회원 탈퇴를 진행하면 해당 계정의 모든 권한이 상실되며 복구가 불가능합니다.
          <br />
          본인 식별을 위해 현재 비밀번호 검증이 필요하며 관심 등록 종목 및 조건 매핑 규칙 등의 보관 데이터가 모두 비활성화 및 정리되므로 신중히 결정해 주시기 바랍니다.
        </p>

        {!showWithdrawConfirm ? (
          <button
            type="button"
            className="withdraw-btn"
            onClick={() => setShowWithdrawConfirm(true)}
          >
            서비스 탈퇴 신청
          </button>
        ) : (
          <form className="withdraw-confirm-box" onSubmit={handleWithdrawSubmit}>
            <div className="form-group">
              <label htmlFor="withdrawPwInput" style={{ color: "#991b1b" }}>
                탈퇴 승인을 위한 현재 비밀번호 입력
              </label>
              <input
                id="withdrawPwInput"
                type="password"
                className="form-input"
                style={{ borderColor: "#fca5a5" }}
                placeholder={
                  profile.social
                    ? "소셜 계정 탈퇴 확인을 위해 가입한 아이디(ID)를 똑같이 기입해 주십시오."
                    : "본인 인증을 위해 현재 비밀번호를 입력해 주십시오."
                }
                value={withdrawPw}
                onChange={e => setWithdrawPw(e.target.value)}
              />
            </div>
            <div className="withdraw-actions">
              <button
                type="submit"
                className="withdraw-btn"
                disabled={submittingWithdraw}
              >
                {submittingWithdraw ? "탈퇴 처리 중..." : "최종 탈퇴 완료"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowWithdrawConfirm(false);
                  setWithdrawPw("");
                }}
              >
                탈퇴 취소
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
