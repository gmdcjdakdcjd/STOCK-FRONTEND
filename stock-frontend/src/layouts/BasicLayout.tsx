import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./basic-layout.css";
import "./page-header.css";

type User = {
  mid: string;
  email: string;
  del: boolean;
  social: boolean;
  authorities: {
    authority: string;
  }[];
};

function BasicLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<
    "market" | "search" | "mypage" | null
  >(null);

  const navigate = useNavigate();

  const isAdmin =
    user?.authorities?.some(
      auth => auth.authority === "ROLE_ADMIN"
    ) ?? false;

  /* =========================
     로그인 상태 확인
     ========================= */
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => (res.ok ? res.json() : null))
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  /* =========================
     로그아웃
     ========================= */
  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    navigate("/");
  };

  const toggleMenu = (key: "market" | "search" | "mypage") => {
    setOpenMenu(prev => (prev === key ? null : key));
  };

  const closeMenu = () => setOpenMenu(null);

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="logo" onClick={closeMenu}>
            STOCK PROJECT
          </NavLink>

          {/* ================= MAIN NAV ================= */}
          <nav className="nav">
            <NavLink to="/indicator" className="nav-ani" onClick={closeMenu}>
              📉 주요 지수
            </NavLink>

            <NavLink to="/bond" className="nav-ani" onClick={closeMenu}>
              🏦 채권
            </NavLink>

            <NavLink to="/issue" className="nav-ani" onClick={closeMenu}>
              🔥 이슈 종목
            </NavLink>

            <NavLink
              to="/dualMomentumList"
              className="nav-ani"
              onClick={closeMenu}
            >
              📈 수익률 상위
            </NavLink>

            {/* ================= 📊 시장 성과 ================= */}
            <div className="nav-dropdown">
              <button
                type="button"
                className={`nav-ani ${openMenu === "market" ? "active" : ""
                  }`}
                onClick={() => toggleMenu("market")}
              >
                📊 시장 성과
                <span className="nav-caret">▾</span>
              </button>

              {openMenu === "market" && (
                <div className="nav-dropdown-menu">
                  <NavLink to="/result/listKR" onClick={closeMenu}>
                    <span className="nav-dd-mark">–</span>
                    국장
                  </NavLink>
                  <NavLink to="/result/listUS" onClick={closeMenu}>
                    <span className="nav-dd-mark">–</span>
                    미국장
                  </NavLink>
                </div>
              )}
            </div>

            {/* ================= 🔍 데이터 탐색 ================= */}
            <div className="nav-dropdown">
              <button
                type="button"
                className={`nav-ani ${openMenu === "search" ? "active" : ""
                  }`}
                onClick={() => toggleMenu("search")}
              >
                🔍 데이터 탐색
                <span className="nav-caret">▾</span>
              </button>

              {openMenu === "search" && (
                <div className="nav-dropdown-menu">
                  <NavLink to="/stock/searchStock" onClick={closeMenu}>
                    <span className="nav-dd-mark">–</span>
                    종목 검색
                  </NavLink>
                  <NavLink to="/kodex/summary" onClick={closeMenu}>
                    <span className="nav-dd-mark">–</span>
                    ETF 검색
                  </NavLink>
                  <NavLink to="/nps/summary" onClick={closeMenu}>
                    <span className="nav-dd-mark">–</span>
                    연기금 현황
                  </NavLink>
                </div>
              )}
            </div>

            {/* ================= 👤 마이페이지 ================= */}
            {user && (
              <div className="nav-dropdown">
                <button
                  type="button"
                  className={`nav-ani ${openMenu === "mypage" ? "active" : ""
                    }`}
                  onClick={() => toggleMenu("mypage")}
                >
                  👤 마이페이지
                  <span className="nav-caret">▾</span>
                </button>

                {openMenu === "mypage" && (
                  <div className="nav-dropdown-menu">

                    <NavLink to="/myetf/list" onClick={closeMenu}>
                      <span className="nav-dd-mark">–</span>
                      내 ETF
                    </NavLink>
                    
                    <NavLink to="/stock/myStock" onClick={closeMenu}>
                      <span className="nav-dd-mark">–</span>
                      내 관심 종목
                    </NavLink>


                    {isAdmin && (
                      <NavLink to="/manage/batch/history" onClick={closeMenu}>
                        <span className="nav-dd-mark">–</span>
                        배치 실행 이력
                      </NavLink>
                    )}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* ================= AUTH ================= */}
          <div className="auth">
            {!loading &&
              (user ? (
                <>
                  <span className="nav-ani">👤 {user.mid}</span>
                  <button
                    type="button"
                    className="nav-ani btn-link"
                    onClick={logout}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/join" className="nav-ani">
                    회원가입
                  </NavLink>
                  <NavLink to="/login" className="nav-ani">
                    로그인
                  </NavLink>
                </>
              ))}
          </div>
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <main className="content">
        <div className="content-inner">{children}</div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="footer">© STOCK PROJECT</footer>
    </>
  );
}

export default BasicLayout;
