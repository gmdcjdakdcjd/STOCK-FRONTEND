// =========================
// 공통 페이징 응답 (백엔드 PageResponseDTO 일치)
// =========================
export interface PageResponse<T> {
    dtoList: T[];
    page: number;
    size: number;
    total: number;
    start: number;
    end: number;
    prev: boolean;
    next: boolean;
}

// =========================
// 투자자별 유입 (Investor)
// =========================
export interface InvestorFlowDTO {
    id: number;
    baseDate: string;
    individual: number;
    foreigner: number;
    institutional: number;
    finInvest: number;
    insurance: number;
    invTrust: number;
    bank: number;
    etcFin: number;
    pension: number;
    etcCorp: number;
    lastUpdate: string;
}

// =========================
// 증시자금동향 (Deposit) - 백엔드 DepositTrendDTO 일치
// =========================
export interface DepositTrendDTO {
    id: number;
    baseDate: string;

    // 고객 예탁금
    custDeposit: number;
    custDepositChange: number;
    custDepositUp: boolean;

    // 신용잔고
    creditBalance: number;
    creditBalanceChange: number;
    creditBalanceUp: boolean;

    // 주식형 펀드
    stockFund: number;
    stockFundChange: number;
    stockFundUp: boolean;

    // 혼합형 펀드
    mixedFund: number;
    mixedFundChange: number;
    mixedFundUp: boolean;

    // 채권형 펀드
    bondFund: number;
    bondFundChange: number;
    bondFundUp: boolean;

    lastUpdate: string;
}

// (다른 타입들은 유지)
export interface DepositTrendBoxDTO {
    baseDate: string;

    custDeposit: number;
    custDepositDiff: number;
    custDepositUp: boolean;

    creditBalance: number;
    creditBalanceDiff: number;
    creditBalanceUp: boolean;

    stockFund: number;
    stockFundDiff: number;
    stockFundUp: boolean;

    mixedFund: number;
    mixedFundDiff: number;
    mixedFundUp: boolean;

    bondFund: number;
    bondFundDiff: number;
    bondFundUp: boolean;

    totalFund: number;
    totalFundDiff: number;
    totalFundUp: boolean;
}
export interface ProgramTrendDTO {
    id: number;
    baseDate: string;

    // 차익거래
    arbBuy: number;
    arbSell: number;
    arbNet: number;

    // 비차익거래
    nonarbBuy: number;
    nonarbSell: number;
    nonarbNet: number;

    // 전체
    totalBuy: number;
    totalSell: number;
    totalNet: number;

    lastUpdate: string;
}
