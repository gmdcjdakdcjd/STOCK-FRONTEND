import { useEffect, useState } from "react";
import { useSearchParams, NavLink } from "react-router-dom";
import "./login-page.css";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const isGuestMode = searchParams.get("type") === "guest";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saveId, setSaveId] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     저장된 ID 복원 및 게스트 설정
     ========================= */
  useEffect(() => {
    if (isGuestMode) {
      setUsername("guest");
    } else {
      const savedId = localStorage.getItem("savedLoginId");
      if (savedId) {
        setUsername(savedId);
        setSaveId(true);
      } else {
        setUsername("");
      }
    }
  }, [isGuestMode]);

  /* =========================
     로그인 처리
     ========================= */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let res;
    if (isGuestMode) {
      res = await fetch("/api/auth/guest", {
        method: "POST",
        credentials: "include",
      });
    } else {
      res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        body: new URLSearchParams({
          username,
          password,
        }),
        credentials: "include",
      });
    }

    if (res.ok) {
      if (!isGuestMode) {
        if (saveId) {
          localStorage.setItem("savedLoginId", username);
        } else {
          localStorage.removeItem("savedLoginId");
        }
      }

      try {
        // 로그인 성공한 유저의 정보 및 권한을 조회하여 분기합니다.
        const userRes = await fetch("/api/auth/me", {
          credentials: "include",
          headers: { Accept: "application/json" }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          const isAdmin = userData.authorities?.some(
            (auth: any) => auth.authority === "ROLE_ADMIN"
          );
          if (isAdmin) {
            window.location.href = "/manage/admin";
            return;
          }
        }
      } catch (err) {
        console.error("권한 판별 처리 에러:", err);
      }

      // 관리자가 아니거나 조회가 안 되는 경우 홈 화면으로 이동
      window.location.href = "/";
    } else {
      if (isGuestMode) {
        setError("게스트 로그인에 실패했습니다.");
      } else {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">
          {isGuestMode ? "게스트 로그인" : "로그인"}
        </h2>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label>아이디 또는 이메일</label>
            <input
              type="text"
              placeholder="아이디 또는 이메일 입력"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              readOnly={isGuestMode}
              required
            />
          </div>

          {!isGuestMode && (
            <>
              <div className="form-group">
                <label>비밀번호</label>
                <input
                  type="password"
                  placeholder="비밀번호 입력"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-check">
                <input
                  type="checkbox"
                  id="saveId"
                  checked={saveId}
                  onChange={e => setSaveId(e.target.checked)}
                />
                <label htmlFor="saveId">아이디 저장</label>
              </div>
            </>
          )}

          <button type="submit" className="login-btn">
            {isGuestMode ? "게스트 로그인" : "로그인"}
          </button>
        </form>

        <div className="login-switch">
          {isGuestMode ? (
            <NavLink to="/login" className="switch-link">
              일반 계정으로 로그인
            </NavLink>
          ) : (
            <NavLink to="/login?type=guest" className="switch-link">
              게스트 계정으로 로그인
            </NavLink>
          )}
        </div>
      </div>
    </div>
  );
}
