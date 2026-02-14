import type { ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
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

type MenuKey = "indicator" | "market" | "search" | "mypage";

function BasicLayout({ children }: { children?: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);

  const navigate = useNavigate();

  const isAdmin =
    user?.authorities?.some(
      auth => auth.authority === "ROLE_ADMIN"
    ) ?? false;

  /* =========================
     로그인 상태 확인
     ========================= */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  /* =========================
     로그아웃
     ========================= */
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
    } finally {
      setUser(null);
      navigate("/");
    }
  };

  const toggleMenu = (key: MenuKey) => {
    setOpenMenu(prev => (prev === key ? null : key));
  };

  const closeMenu = () => setOpenMenu(null);

  return (
    <>
      {/* ================= TOP AUTH BAR ================= */}
      <div className="top-bar">
        {!loading &&
          (user ? (
            <>
              <span className="top-user">{user.mid}</span>
              <button
                type="button"
                className="top-link"
                onClick={logout}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <NavLink to="/join" className="top-link">
                회원가입
              </NavLink>
              <NavLink to="/login" className="top-link">
                로그인
              </NavLink>
            </>
          ))}
      </div>

      {/* ================= MAIN HEADER ================= */}
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="logo" onClick={closeMenu}>
            STOCK PROJECT
          </NavLink>

          <nav className="nav">
            {/* ===== 지수 ===== */}
            <div className="nav-dropdown">
              <button
                type="button"
                className={`nav-ani ${openMenu === "indicator" ? "active" : ""}`}
                onClick={() => toggleMenu("indicator")}
              >
                📉 지수
                <span className="nav-caret">▾</span>
              </button>

              {openMenu === "indicator" && (
                <div className="nav-dropdown-menu">
                  <NavLink to="/stockIndex" onClick={closeMenu}>
                    <span className="nav-dd-mark">–</span>
                    증권 지수
                  </NavLink>
                  <NavLink to="/exchange" onClick={closeMenu}>
                    <span className="nav-dd-mark">–</span>
                    환율 지수
                  </NavLink>
                  <NavLink to="/physical" onClick={closeMenu}>
                    <span className="nav-dd-mark">–</span>
                    원자재 지수
                  </NavLink>
                  <NavLink to="/crypto" onClick={closeMenu}>
                    <span className="nav-dd-mark">–</span>
                    코인 지수
                  </NavLink>
                </div>
              )}
            </div>

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

            <NavLink
              to="/stock/searchStock"
              className="nav-ani"
              onClick={closeMenu}
            >
              🔍 종목 검색
            </NavLink>

            {/* ===== 시장 성과 ===== */}
            <div className="nav-dropdown">
              <button
                type="button"
                className={`nav-ani ${openMenu === "market" ? "active" : ""}`}
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

            {/* ===== 데이터 탐색 ===== */}
            <div className="nav-dropdown">
              <button
                type="button"
                className={`nav-ani ${openMenu === "search" ? "active" : ""}`}
                onClick={() => toggleMenu("search")}
              >
                🔍 데이터 탐색
                <span className="nav-caret">▾</span>
              </button>

              {openMenu === "search" && (
                <div className="nav-dropdown-menu">
                  {/* <NavLink to="/stock/searchStock" onClick={closeMenu}>
                    <span className="nav-dd-mark">–</span>
                    종목 검색
                  </NavLink> */}
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

            {/* ===== 마이페이지 (로그인 시만) ===== */}
            <div className="nav-dropdown">
              <button
                type="button"
                className={`nav-ani mypage-btn
                    ${!user ? "login-required" : ""}
                    ${openMenu === "mypage" ? "active" : ""}
                  `}
                onClick={user ? () => toggleMenu("mypage") : undefined}
                disabled={!user}
                data-tooltip={!user ? "로그인 후 이용 가능" : undefined}
              >
                {user ? "👤 마이페이지" : "👥 게스트"}
                {user && <span className="nav-caret">▾</span>}
              </button>


              {user && openMenu === "mypage" && (
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




          </nav>
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <main className="content">
        <div className="content-inner">
          {children ?? <Outlet />}
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="footer">© STOCK PROJECT</footer>
    </>
  );
}

export default BasicLayout;
