import type { ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
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
  const navRef = useRef<HTMLElement | null>(null);

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

  /* =========================
     게스트 로그인 처리
     백엔드의 게스트 전용 로그인 API를 호출하여 세션을 발급받습니다.
     로그인 실패 시에는 로그인 페이지로 이동시킵니다.
     ========================= */
  const handleGuestLogin = () => {
    navigate("/login?type=guest");
  };

  const toggleMenu = (key: MenuKey) => {
    setOpenMenu(prev => (prev === key ? null : key));
  };

  const closeMenu = () => setOpenMenu(null);

  /* =========================
     외부 클릭 시 메뉴 닫기
     ========================= */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    if (openMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenu]);

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

          <nav className="nav" ref={navRef}>
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

            <NavLink
              to="/result/listKR"
              className="nav-ani"
              onClick={closeMenu}
            >
              📊 시장 성과
            </NavLink>

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
                    KODEX ETF
                  </NavLink>
                  <NavLink to="/tiger/summary" onClick={closeMenu}>
                    <span className="nav-dd-mark">–</span>
                    TIGER ETF
                  </NavLink>
                  <NavLink to="/marketCap" onClick={closeMenu}>
                    <span className="nav-dd-mark">–</span>
                    시가총액
                  </NavLink>
                  <NavLink to="/nps/summary" onClick={closeMenu}>
                    <span className="nav-dd-mark">–</span>
                    연기금 현황
                  </NavLink>
                  <NavLink to="/marketTrend" onClick={closeMenu}>
                    <span className="nav-dd-mark">–</span>
                    시장 매매 동향
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
                onClick={user ? () => toggleMenu("mypage") : handleGuestLogin}
                data-tooltip={!user ? "클릭 시 guest 계정으로 로그인" : undefined}
              >
                {user ? "👤 마이페이지" : "🚀 가입 없이 시작하기"}
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

                  <NavLink to="/stock/myCondition" onClick={closeMenu}>
                    <span className="nav-dd-mark">–</span>
                    나만의 조건식
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
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-info">
            <span className="footer-copy">© STOCK PROJECT</span>
            <span className="footer-sep">|</span>
            <span className="footer-contact">
              Contact: rlfhrdyd21@gmail.com
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}

export default BasicLayout;
