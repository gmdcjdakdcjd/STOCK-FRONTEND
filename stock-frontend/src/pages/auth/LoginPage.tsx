import { useEffect, useState } from "react";
import BasicLayout from "../../layouts/BasicLayout";
import "./login-page.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saveId, setSaveId] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     저장된 ID 복원
     ========================= */
  useEffect(() => {
    const savedId = localStorage.getItem("savedLoginId");
    if (savedId) {
      setUsername(savedId);
      setSaveId(true);
    }
  }, []);

  /* =========================
     로그인 처리
     ========================= */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: new URLSearchParams({
        username,
        password
      }),
      credentials: "include"
    });

    if (res.ok) {
      if (saveId) {
        localStorage.setItem("savedLoginId", username);
      } else {
        localStorage.removeItem("savedLoginId");
      }

      // 로그인 성공 → indicator
      window.location.href = "/";
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <BasicLayout>
      <div className="login-page">
        <div className="login-card">

          <h2 className="login-title">로그인</h2>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <form onSubmit={submit}>

            <div className="form-group">
              <label>아이디 또는 이메일</label>
              <input
                type="text"
                placeholder="아이디 또는 이메일 입력"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>

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

            <button type="submit" className="login-btn">
              로그인
            </button>

          </form>
        </div>
      </div>
    </BasicLayout>
  );
}
