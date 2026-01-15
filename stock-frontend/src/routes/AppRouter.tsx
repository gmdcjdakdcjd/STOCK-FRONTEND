import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* =========================
   AUTH
   ========================= */
import LoginPage from "../pages/auth/LoginPage";
import JoinPage from "../pages/auth/JoinPage";

/* =========================
   BOARD (전략 결과)
   ========================= */
import BoardListKRPage from "../pages/result/ResultListKRPage";
import BoardListUSPage from "../pages/result/ResultListUSPage";
import BoardDetailKRPage from "../pages/result/ResultDetailKRPage";
import BoardDetailUSPage from "../pages/result/ResultDetailUSPage";

/* =========================
   MANAGE (ADMIN)
   ========================= */
import BatchHistoryPage from "../pages/manage/BatchHistoryPage";

/* =========================
   OTHER DOMAINS
   ========================= */
import NpsSummaryPage from "../pages/nps/NpsSummaryPage";
import NpsListPage from "../pages/nps/NpsListPage";
import KodexSummaryPage from "../pages/kodex/KodexSummaryPage";
import StockSearchPage from "../pages/stock/StockSearchPage";
import IndicatorPage from "../pages/indicator/IndicatorPage";
import BondPage from "../pages/bond/BondPage";
import IssuePage from "../pages/issue/IssuePage";
import DualMomentumPage from "../pages/dualMomentum/DualMomentumPage";

/* =========================
   MY STOCK
   ========================= */
import MyStockPage from "../pages/myStock/MyStockPage";

/* =========================
   MY ETF ✅
   ========================= */
import MyEtfListPage from "../pages/myEtf/MyEtfListPage";
import MyEtfDetailPage from "../pages/myEtf/MyEtfDetailPage";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
           ROOT
           ========================= */}
        <Route path="/" element={<Navigate to="/indicator" replace />} />

        {/* =========================
           AUTH
           ========================= */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/join" element={<JoinPage />} />

        {/* =========================
           BOARD (전략 결과)
           ========================= */}
        <Route path="/result/listKR" element={<BoardListKRPage />} />
        <Route path="/result/listUS" element={<BoardListUSPage />} />
        <Route path="/result/detailKR" element={<BoardDetailKRPage />} />
        <Route path="/result/detailUS" element={<BoardDetailUSPage />} />

        {/* =========================
           MANAGE (ADMIN)
           ========================= */}
        <Route path="/manage/batch/history" element={<BatchHistoryPage />} />

        {/* =========================
           INDICATOR / ETC
           ========================= */}
        <Route path="/indicator" element={<IndicatorPage />} />
        <Route path="/bond" element={<BondPage />} />
        <Route path="/issue" element={<IssuePage />} />
        <Route path="/dualMomentumList" element={<DualMomentumPage />} />

        {/* =========================
           STOCK / ETF / NPS
           ========================= */}
        <Route path="/stock/searchStock" element={<StockSearchPage />} />
        <Route path="/stock/myStock" element={<MyStockPage />} />

        {/* =========================
           MY ETF
           ========================= */}
        <Route path="/myetf/list" element={<MyEtfListPage />} />
        <Route path="/myetf/detail" element={<MyEtfDetailPage />} />

        <Route path="/kodex/summary" element={<KodexSummaryPage />} />
        <Route path="/nps/summary" element={<NpsSummaryPage />} />
        <Route path="/nps/list" element={<NpsListPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
