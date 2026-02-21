import React, { useState } from "react";
import "./marketTrend.css";
import { useInvestorTrendData, useProgramTrendData, useDepositTrendData, useMarketSummaryData } from "./useMarketTrendData";
import type { InvestorFlowDTO, ProgramTrendDTO, DepositTrendDTO } from "./marketTrend.types";

const MarketTrendPage: React.FC = () => {
    // 0. 요약 데이터 훅
    const {
        invLatest, progLatest, depSummary,
        loading: summaryLoading, error: summaryError
    } = useMarketSummaryData();

    // 1. 투자자별 데이터 상태
    const [investorPage, setInvestorPage] = useState(1);
    const { data: invData, loading: invLoading, error: invError } = useInvestorTrendData(investorPage);

    // 2. 프로그램 매매 데이터 상태
    const [programPage, setProgramPage] = useState(1);
    const { data: progData, loading: progLoading, error: progError } = useProgramTrendData(programPage);

    // 3. 증시자금동향 데이터 상태
    const [depositPage, setDepositPage] = useState(1);
    const { data: depData, loading: depLoading, error: depError } = useDepositTrendData(depositPage);

    // 공통 로딩/에러 처리
    const isInitialLoading =
        (!invData && invLoading) ||
        (!progData && progLoading) ||
        (!depData && depLoading) ||
        summaryLoading;

    if (isInitialLoading) return <div className="market-trend-container">데이터를 불러오는 중입니다...</div>;
    if (invError || progError || depError || summaryError) {
        return <div className="market-trend-container">에러가 발생했습니다: {(invError || progError || depError || summaryError)?.message}</div>;
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        const yy = d.getFullYear().toString().slice(-2);
        const mm = (d.getMonth() + 1).toString().padStart(2, "0");
        const dd = d.getDate().toString().padStart(2, "0");
        return `${yy}.${mm}.${dd}`;
    };

    const formatNumber = (val: number) => {
        return val?.toLocaleString() || "0";
    };

    const getCellClass = (val: number) => {
        if (val > 0) return "up";
        if (val < 0) return "down";
        return "";
    };

    // 섹션 이동 로직
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    // 증시자금동향 전용 비교 로직 (현재일 vs 전일 잔액) - 제거됨 (DTO 플래그 사용)

    return (
        <div className="market-trend-container">
            {/* ================= SECTION 0: 오늘의 지표 요약 카드 ================= */}
            <div className="today-card-grid">
                {/* 카드 1: 투자자별 동향 */}
                <div className="market-summary-card" onClick={() => scrollToSection("investor-detail")}>
                    <div className="card-header">
                        <span className="card-title">오늘의 투자자 동향</span>
                        <span className="card-date">{invLatest ? formatDate(invLatest.baseDate) : "-"}</span>
                    </div>
                    {invLatest ? (
                        <div className="card-body">
                            <div className="card-unit-sm">(단위: 억 원)</div>
                            <div className="summary-row">
                                <span className="row-label">개인</span>
                                <div className="row-values">
                                    <span className={`row-balance ${getCellClass(invLatest.individual)}`}>
                                        {formatNumber(invLatest.individual)}
                                    </span>
                                </div>
                            </div>
                            <div className="summary-row">
                                <span className="row-label">외국인</span>
                                <div className="row-values">
                                    <span className={`row-balance ${getCellClass(invLatest.foreigner)}`}>
                                        {formatNumber(invLatest.foreigner)}
                                    </span>
                                </div>
                            </div>
                            <div className="summary-row">
                                <span className="row-label">기관</span>
                                <div className="row-values">
                                    <span className={`row-balance ${getCellClass(invLatest.institutional)}`}>
                                        {formatNumber(invLatest.institutional)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : <div className="card-loading">데이터가 없습니다.</div>}
                </div>

                {/* 카드 2: 프로그램 매매 동향 */}
                <div className="market-summary-card" onClick={() => scrollToSection("program-detail")}>
                    <div className="card-header">
                        <span className="card-title">오늘의 프로그램 동향</span>
                        <span className="card-date">{progLatest ? formatDate(progLatest.baseDate) : "-"}</span>
                    </div>
                    {progLatest ? (
                        <div className="card-body">
                            <div className="card-unit-sm">(단위: 억 원)</div>
                            <div className="summary-row">
                                <span className="row-label">매수</span>
                                <div className="row-values">
                                    <span className="row-balance">{formatNumber(progLatest.totalBuy)}</span>
                                </div>
                            </div>
                            <div className="summary-row">
                                <span className="row-label">매도</span>
                                <div className="row-values">
                                    <span className="row-balance">{formatNumber(progLatest.totalSell)}</span>
                                </div>
                            </div>
                            <div className="summary-row">
                                <span className="row-label">순매수</span>
                                <div className="row-values">
                                    <span className={`row-balance ${progLatest.totalNet < 0 ? "down" : "up"}`}>
                                        {formatNumber(progLatest.totalNet)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : <div className="card-loading">데이터가 없습니다.</div>}
                </div>

                {/* 카드 3: 증시자금 현황 */}
                <div className="market-summary-card" onClick={() => scrollToSection("deposit-detail")}>
                    <div className="card-header">
                        <span className="card-title">오늘의 증시자금</span>
                        <span className="card-date">{depSummary ? formatDate(depSummary.baseDate) : "-"}</span>
                    </div>
                    {depSummary ? (
                        <div className="card-body">
                            <div className="card-unit-sm">(단위: 억 원)</div>
                            <div className="summary-row">
                                <span className="row-label">고객예탁금</span>
                                <div className="row-values">
                                    <span className="row-balance">{formatNumber(depSummary.custDeposit)}</span>
                                    <span className={`row-change ${depSummary.custDepositUp ? "up" : "down"}`}>
                                        ({depSummary.custDepositUp ? "+" : ""}{formatNumber(depSummary.custDepositDiff)})
                                    </span>
                                </div>
                            </div>

                            <div className="summary-row">
                                <span className="row-label">신용잔고</span>
                                <div className="row-values">
                                    <span className="row-balance">{formatNumber(depSummary.creditBalance)}</span>
                                    <span className={`row-change ${depSummary.creditBalanceUp ? "up" : "down"}`}>
                                        ({depSummary.creditBalanceUp ? "+" : ""}{formatNumber(depSummary.creditBalanceDiff)})
                                    </span>
                                </div>
                            </div>

                            <div className="summary-row">
                                <span className="row-label">펀드총합</span>
                                <div className="row-values">
                                    <span className="row-balance">{formatNumber(depSummary.totalFund ?? 0)}</span>
                                    <span className={`row-change ${depSummary.totalFundUp ? "up" : "down"}`}>
                                        ({depSummary.totalFundUp ? "+" : ""}{formatNumber(depSummary.totalFundDiff ?? 0)})
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : <div className="card-loading">데이터가 없습니다.</div>}
                </div>
            </div>

            {/* ================= SECTION 1: 투자자별 순매수 ================= */}
            <div className="trend-table-section" id="investor-detail">
                <h2 className="trend-section-title">일자별 순매수</h2>
                <div className="unit-info">(단위:억 원)</div>

                <div className="table-wrapper">
                    <table className="investor-table">
                        <thead>
                            <tr>
                                <th rowSpan={2} className="date-col">날짜</th>
                                <th rowSpan={2}>개인</th>
                                <th rowSpan={2}>외국인</th>
                                <th rowSpan={2}>기관계</th>
                                <th colSpan={6}>기관</th>
                                <th rowSpan={2}>기타법인</th>
                            </tr>
                            <tr>
                                <th>금융투자</th>
                                <th>보험</th>
                                <th>투신(사모)</th>
                                <th>은행</th>
                                <th>기타금융기관</th>
                                <th>연기금등</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invData?.dtoList?.map((row: InvestorFlowDTO) => (
                                <tr key={row.id}>
                                    <td className="date-cell">{formatDate(row.baseDate)}</td>
                                    <td className={getCellClass(row.individual)}>{formatNumber(row.individual)}</td>
                                    <td className={getCellClass(row.foreigner)}>{formatNumber(row.foreigner)}</td>
                                    <td className={getCellClass(row.institutional)}>{formatNumber(row.institutional)}</td>
                                    <td className={getCellClass(row.finInvest)}>{formatNumber(row.finInvest)}</td>
                                    <td className={getCellClass(row.insurance)}>{formatNumber(row.insurance)}</td>
                                    <td className={getCellClass(row.invTrust)}>{formatNumber(row.invTrust)}</td>
                                    <td className={getCellClass(row.bank)}>{formatNumber(row.bank)}</td>
                                    <td className={getCellClass(row.etcFin)}>{formatNumber(row.etcFin)}</td>
                                    <td className={getCellClass(row.pension)}>{formatNumber(row.pension)}</td>
                                    <td className={getCellClass(row.etcCorp)}>{formatNumber(row.etcCorp)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    {invData?.prev && (
                        <button className="pagination-nav-btn" onClick={() => setInvestorPage(invData.start - 1)}>이전</button>
                    )}
                    {invData && Array.from({ length: invData.end - invData.start + 1 }, (_, i) => invData.start + i).map((p) => (
                        <button key={p} className={investorPage === p ? "active" : ""} onClick={() => setInvestorPage(p)}>{p}
                        </button>
                    ))}
                    {invData?.next && (
                        <button className="pagination-nav-btn" onClick={() => setInvestorPage(invData.end + 1)}>다음</button>
                    )}
                </div>
            </div>

            {/* ================= SECTION 2: 프로그램 매매 ================= */}
            <div className="trend-table-section" id="program-detail" style={{ marginTop: "4rem" }}>
                <h2 className="trend-section-title">프로그램 매매 동향</h2>
                <div className="unit-info">(단위:억 원)</div>

                <div className="table-wrapper">
                    <table className="investor-table">
                        <thead>
                            <tr>
                                <th rowSpan={2} className="date-col">날짜</th>
                                <th colSpan={3}>차익거래</th>
                                <th colSpan={3}>비차익거래</th>
                                <th colSpan={3}>전체</th>
                            </tr>
                            <tr>
                                <th>매수</th>
                                <th>매도</th>
                                <th>순매수</th>
                                <th>매수</th>
                                <th>매도</th>
                                <th>순매수</th>
                                <th>매수</th>
                                <th>매도</th>
                                <th>순매수</th>
                            </tr>
                        </thead>
                        <tbody>
                            {progData?.dtoList?.map((row: ProgramTrendDTO) => (
                                <tr key={row.id}>
                                    <td className="date-cell">{formatDate(row.baseDate)}</td>
                                    <td>{formatNumber(row.arbBuy)}</td>
                                    <td>{formatNumber(row.arbSell)}</td>
                                    <td className={getCellClass(row.arbNet)}>{formatNumber(row.arbNet)}</td>
                                    <td>{formatNumber(row.nonarbBuy)}</td>
                                    <td>{formatNumber(row.nonarbSell)}</td>
                                    <td className={getCellClass(row.nonarbNet)}>{formatNumber(row.nonarbNet)}</td>
                                    <td>{formatNumber(row.totalBuy)}</td>
                                    <td>{formatNumber(row.totalSell)}</td>
                                    <td className={getCellClass(row.totalNet)}>{formatNumber(row.totalNet)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    {progData?.prev && (
                        <button className="pagination-nav-btn" onClick={() => setProgramPage(progData.start - 1)}>이전</button>
                    )}
                    {progData && Array.from({ length: progData.end - progData.start + 1 }, (_, i) => progData.start + i).map((p) => (
                        <button key={p} className={programPage === p ? "active" : ""} onClick={() => setProgramPage(p)}>{p}
                        </button>
                    ))}
                    {progData?.next && (
                        <button className="pagination-nav-btn" onClick={() => setProgramPage(progData.end + 1)}>다음</button>
                    )}
                </div>
            </div>

            {/* ================= SECTION 3: 증시자금동향 ================= */}
            <div className="trend-table-section" id="deposit-detail" style={{ marginTop: "4rem", marginBottom: "4rem" }}>
                <h2 className="trend-section-title">증시자금동향</h2>
                <div className="unit-info">(단위:억 원)</div>

                <div className="table-wrapper">
                    <table className="investor-table">
                        <thead>
                            <tr>
                                <th rowSpan={2} className="date-col">날짜</th>
                                <th colSpan={2}>고객예탁금</th>
                                <th colSpan={2}>신용잔고</th>
                                <th colSpan={6}>펀드</th>
                            </tr>
                            <tr>
                                <th>잔액</th>
                                <th>증감</th>
                                <th>잔액</th>
                                <th>증감</th>
                                <th>주식형</th>
                                <th>증감</th>
                                <th>혼합형</th>
                                <th>증감</th>
                                <th>채권형</th>
                                <th>증감</th>
                            </tr>
                        </thead>
                        <tbody>
                            {depData?.dtoList?.map((row: DepositTrendDTO) => (
                                <tr key={row.id}>
                                    <td className="date-cell">{formatDate(row.baseDate)}</td>
                                    {/* 고객예탁금 */}
                                    <td>{formatNumber(row.custDeposit)}</td>
                                    <td className={row.custDepositUp === true ? "up" : row.custDepositUp === false ? "down" : ""}>
                                        {formatNumber(row.custDepositChange)}
                                    </td>
                                    {/* 신용잔고 */}
                                    <td>{formatNumber(row.creditBalance)}</td>
                                    <td className={row.creditBalanceUp === true ? "up" : row.creditBalanceUp === false ? "down" : ""}>
                                        {formatNumber(row.creditBalanceChange)}
                                    </td>
                                    {/* 주식형 */}
                                    <td>{formatNumber(row.stockFund)}</td>
                                    <td className={row.stockFundUp === true ? "up" : row.stockFundUp === false ? "down" : ""}>
                                        {formatNumber(row.stockFundChange)}
                                    </td>
                                    {/* 혼합형 */}
                                    <td>{formatNumber(row.mixedFund)}</td>
                                    <td className={row.mixedFundUp === true ? "up" : row.mixedFundUp === false ? "down" : ""}>
                                        {formatNumber(row.mixedFundChange)}
                                    </td>
                                    {/* 채권형 */}
                                    <td>{formatNumber(row.bondFund)}</td>
                                    <td className={row.bondFundUp === true ? "up" : row.bondFundUp === false ? "down" : ""}>
                                        {formatNumber(row.bondFundChange)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    {depData?.prev && (
                        <button className="pagination-nav-btn" onClick={() => setDepositPage(depData.start - 1)}>이전</button>
                    )}
                    {depData && Array.from({ length: depData.end - depData.start + 1 }, (_, i) => depData.start + i).map((p) => (
                        <button key={p} className={depositPage === p ? "active" : ""} onClick={() => setDepositPage(p)}>{p}
                        </button>
                    ))}
                    {depData?.next && (
                        <button className="pagination-nav-btn" onClick={() => setDepositPage(depData.end + 1)}>다음</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketTrendPage;
