import { useState } from "react";
import "./join-page.css";

export default function JoinPage() {
  const [mid, setMid] = useState("");
  const [email, setEmail] = useState("");
  const [mpw, setMpw] = useState("");

  const [midChecked, setMidChecked] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);

  const [midMsg, setMidMsg] = useState<string | null>(null);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     MID 중복 확인
     ========================= */
  const checkMid = async () => {
    if (!mid.trim()) {
      alert("아이디를 입력하세요.");
      return;
    }

    const res = await fetch(`/api/auth/check-mid?mid=${mid}`);
    const ok = await res.json();

    if (ok) {
      setMidChecked(true);
      setMidMsg("사용 가능한 아이디입니다.");
    } else {
      setMidChecked(false);
      setMidMsg("이미 사용 중인 아이디입니다.");
    }
  };

  /* =========================
     EMAIL 중복 확인
     ========================= */
  const checkEmail = async () => {
    if (!email.trim()) {
      alert("이메일을 입력하세요.");
      return;
    }

    const res = await fetch(`/api/auth/check-email?email=${email}`);
    const ok = await res.json();

    if (ok) {
      setEmailChecked(true);
      setEmailMsg("사용 가능한 이메일입니다.");
    } else {
      setEmailChecked(false);
      setEmailMsg("이미 사용 중인 이메일입니다.");
    }
  };

  /* =========================
     회원가입
     ========================= */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!midChecked) {
      alert("아이디 중복확인을 해주세요.");
      return;
    }

    if (!emailChecked) {
      alert("이메일 중복확인을 해주세요.");
      return;
    }

    const res = await fetch("/api/auth/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        mid,
        email,
        mpw
      })
    });

    if (res.ok) {
      alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
      window.location.href = "/login";
    } else {
      const data = await res.json();
      if (data.reason === "MID_DUPLICATE") {
        setError("이미 사용 중인 아이디입니다.");
      } else if (data.reason === "EMAIL_DUPLICATE") {
        setError("이미 사용 중인 이메일입니다.");
      } else {
        setError("회원가입 중 오류가 발생했습니다.");
      }
    }
  };

  return (
      <div className="join-page">
        <div className="join-card">

          <h2 className="join-title">회원가입</h2>

          {error && <div className="join-error">{error}</div>}

          <form onSubmit={submit}>

            {/* MID */}
            <div className="form-group">
              <label>아이디</label>
              <div className="input-inline">
                <input
                  type="text"
                  value={mid}
                  onChange={e => {
                    setMid(e.target.value);
                    setMidChecked(false);
                    setMidMsg(null);
                  }}
                  placeholder="아이디 입력"
                  required
                />
                <button type="button" onClick={checkMid}>
                  중복확인
                </button>
              </div>
              {midMsg && (
                <div className={midChecked ? "msg success" : "msg error"}>
                  {midMsg}
                </div>
              )}
            </div>

            {/* EMAIL */}
            <div className="form-group">
              <label>이메일</label>
              <div className="input-inline">
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setEmailChecked(false);
                    setEmailMsg(null);
                  }}
                  placeholder="example@email.com"
                  required
                />
                <button type="button" onClick={checkEmail}>
                  중복확인
                </button>
              </div>
              {emailMsg && (
                <div className={emailChecked ? "msg success" : "msg error"}>
                  {emailMsg}
                </div>
              )}
            </div>

            {/* PASSWORD */}
            <div className="form-group">
              <label>비밀번호</label>
              <input
                type="password"
                value={mpw}
                onChange={e => setMpw(e.target.value)}
                placeholder="비밀번호 입력"
                required
              />
            </div>

            <button type="submit" className="join-btn">
              회원가입
            </button>

          </form>
        </div>
      </div>
  );
}
