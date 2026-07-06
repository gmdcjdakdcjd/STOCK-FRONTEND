import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import BasicLayout from "../layouts/BasicLayout";

/* =========================
   HOME
   ========================= */
import HomePage from "../pages/home/HomePage";

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
// TIGER ETF 요약 페이지 컴포넌트 임포트
import TigerSummaryPage from "../pages/tiger/TigerSummaryPage";
import StockSearchPage from "../pages/stock/StockSearchPage";
import MarketCapPage from "../pages/marketCap/MarketCapPage";
// import IndicatorPage from "../pages/indicator/IndicatorPage";
// import BondPage from "../pages/bond/BondPage";
import IssuePage from "../pages/issue/IssuePage";
import DualMomentumPage from "../pages/dualMomentum/DualMomentumPage";
import ExchangePage from "../pages/exchange/exchangePage";
import StockIndexPage from "../pages/stockIndex/stockIndexPage";
import PhysicalPage from "../pages/physical/physicalPage";
/* =========================
   MY STOCK
   ========================= */
import MyStockPage from "../pages/myStock/MyStockPage";
import MyConditionPage from "../pages/myCondition/MyConditionPage";

/* =========================
   MY ETF 
   ========================= */
import MyEtfListPage from "../pages/myEtf/MyEtfListPage";
import MyEtfDetailPage from "../pages/myEtf/MyEtfDetailPage";

/* =========================
   CRYPTO
   ========================= */
import CryptoPage from "../pages/crypto/cryptoIndexPage";
import MarketTrendPage from "../pages/marketTrend/MarketTrendPage";

function AppRouter() {
   return (
      <BrowserRouter>
         <Routes>

            {/* =========================
           AUTH
           ========================= */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/join" element={<JoinPage />} />

            <Route element={<BasicLayout />}>
               {/* =========================
              ROOT / HOME
              ========================= */}
               <Route path="/" element={<HomePage />} />

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
               {/* <Route path="/indicator" element={<IndicatorPage />} /> */}
               {/* <Route path="/bond" element={<BondPage />} /> */}
               <Route path="/issue" element={<IssuePage />} />
               <Route path="/dualMomentumList" element={<DualMomentumPage />} />
               <Route path="/exchange" element={<ExchangePage />} />
               <Route path="/stockIndex" element={<StockIndexPage />} />
               <Route path="/physical" element={<PhysicalPage />} />
               <Route path="/crypto" element={<CryptoPage />} />
               {/* =========================
              STOCK / ETF / NPS
              ========================= */}
               <Route path="/stock/searchStock" element={<StockSearchPage />} />
               <Route path="/stock/myStock" element={<MyStockPage />} />
               <Route path="/stock/myCondition" element={<MyConditionPage />} />

               {/* =========================
              MY ETF
              ========================= */}
               <Route path="/myetf/list" element={<MyEtfListPage />} />
               <Route path="/myetf/detail" element={<MyEtfDetailPage />} />

               <Route path="/kodex/summary" element={<KodexSummaryPage />} />
               {/* TIGER ETF 요약 페이지 라우트 등록 */}
               <Route path="/tiger/summary" element={<TigerSummaryPage />} />
               <Route path="/marketCap" element={<MarketCapPage />} />
               <Route path="/nps/summary" element={<NpsSummaryPage />} />
               <Route path="/nps/list" element={<NpsListPage />} />
               <Route path="/marketTrend" element={<MarketTrendPage />} />

            </Route>

         </Routes>
      </BrowserRouter>
   );
}

export default AppRouter;
