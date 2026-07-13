import type { ReactNode } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
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
  // 드롭다운 닫힘 딜레이 타이머 (너무 예민하게 바로 닫히지 않도록 유예 시간 부여)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 스크롤 위치를 추적하여 Top 버튼 노출 여부를 결정
  const [showScrollTop, setShowScrollTop] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

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

  // 호버로 메뉴 열기: 진입 시 닫힘 타이머를 취소하고 해당 메뉴를 엽니다
  const handleMenuEnter = (key: MenuKey) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenMenu(key);
  };

  // 호버로 메뉴 닫기: 250ms 딜레이를 두어 살짝 벗어나도 바로 닫히지 않게 합니다
  const handleMenuLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setOpenMenu(null);
    }, 250);
  };

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

  /* =========================
     스크롤 감지: 300px 이상 내려가면 Top 버튼 노출
     ========================= */
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 페이지 최상단으로 부드럽게 스크롤 이동
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
              {isAdmin && location.pathname !== "/manage/admin" && (
                <NavLink to="/manage/admin" className="top-link">
                  관리자 페이지
                </NavLink>
              )}
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

          {location.pathname === "/manage/admin" ? (
            <nav className="nav" ref={navRef}>
              <span style={{ fontWeight: 800, color: "#1e3a8a", marginRight: "10px" }}>
                관리자 페이지
              </span>
              <span style={{ color: "#cbd5e1", marginRight: "10px" }}>|</span>
              <NavLink to="/" className="nav-ani" onClick={closeMenu}>
                사용자페이지로 이동
              </NavLink>
            </nav>
          ) : (
            <nav className="nav" ref={navRef}>
              {/* ===== 지수 ===== */}
              <div
                className="nav-dropdown"
                onMouseEnter={() => handleMenuEnter("indicator")}
                onMouseLeave={handleMenuLeave}
              >
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
              <div
                className="nav-dropdown"
                onMouseEnter={() => handleMenuEnter("search")}
                onMouseLeave={handleMenuLeave}
              >
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
                      ETF 탐색
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
              <div
                className="nav-dropdown"
                onMouseEnter={() => user && handleMenuEnter("mypage")}
                onMouseLeave={handleMenuLeave}
              >
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

                    <NavLink to="/mypage/profile" onClick={closeMenu}>
                      <span className="nav-dd-mark">–</span>
                      내 정보 관리
                    </NavLink>
                  </div>
                )}
              </div>
            </nav>
          )}
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

      {/* ================= SCROLL TO TOP BUTTON ================= */}
      <button
        className={`scroll-to-top-btn ${showScrollTop ? "visible" : ""}`}
        onClick={scrollToTop}
        aria-label="페이지 최상단으로 이동"
        title="최상단으로 이동"
      >
        {/* 얇고 세련된 chevron-up SVG 아이콘 */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </>
  );
}

export default BasicLayout;
