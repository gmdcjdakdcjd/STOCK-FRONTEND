import { useState, useEffect } from "react";
import type { InvestorFlowDTO, ProgramTrendDTO, DepositTrendDTO, DepositTrendBoxDTO, PageResponse } from "./marketTrend.types";
import {
    fetchInvestorList, fetchProgramList, fetchDepositList,
    fetchInvestorLatest, fetchProgramLatest, fetchDepositSummary
} from "../../api/marketTrendApi";

// 1. 투자자별 리스트 훅
export function useInvestorTrendData(page: number, size: number = 10) {
    const [data, setData] = useState<PageResponse<InvestorFlowDTO> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const result = await fetchInvestorList(page, size);
                setData(result);
            } catch (e) {
                setError(e as Error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [page, size]);

    return { data, loading, error };
}

// 2. 프로그램 매매 리스트 훅
export function useProgramTrendData(page: number, size: number = 10) {
    const [data, setData] = useState<PageResponse<ProgramTrendDTO> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const result = await fetchProgramList(page, size);
                setData(result);
            } catch (e) {
                setError(e as Error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [page, size]);

    return { data, loading, error };
}

// 3. 증시자금동향 리스트 훅
export function useDepositTrendData(page: number, size: number = 10) {
    const [data, setData] = useState<PageResponse<DepositTrendDTO> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const result = await fetchDepositList(page, size);
                setData(result);
            } catch (e) {
                setError(e as Error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [page, size]);

    return { data, loading, error };
}

// 4. 상단 요약 전용 훅
export function useMarketSummaryData() {
    const [invLatest, setInvLatest] = useState<InvestorFlowDTO | null>(null);
    const [progLatest, setProgLatest] = useState<ProgramTrendDTO | null>(null);
    const [depSummary, setDepSummary] = useState<DepositTrendBoxDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const [inv, prog, dep] = await Promise.all([
                    fetchInvestorLatest(),
                    fetchProgramLatest(),
                    fetchDepositSummary()
                ]);
                setInvLatest(inv);
                setProgLatest(prog);
                setDepSummary(dep);
            } catch (e) {
                setError(e as Error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return { invLatest, progLatest, depSummary, loading, error };
}

export const useMarketTrendData = useInvestorTrendData;
