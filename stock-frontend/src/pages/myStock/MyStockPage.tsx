import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getMyStockKR,
    getMyStockUS,
    getDeletedMyStock,
    deleteMyStock,
    restoreMyStock,
} from "../../api/myStockApi";

import type { MyStockDTO, PageResponseDTO } from "../../api/myStockApi";
import CreateEtfModal from "./CreateEtfModal";
import EditEtfModal from "./EditEtfModal";

import DeletedMyStockModal from "./DeletedMyStockModal";
import "./MyStockPage.css";

/* =========================
   Utils
========================= */
const fmt = (
    v: number | null | undefined,
    suffix = "",
    isUS = false
) => {
    if (v == null) return "-";
    if (isUS) {
        return `${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
    }
    return `${v.toLocaleString()}${suffix}`;
};

const cleanStrategyName = (name: string | null | undefined) => {
    if (!name) return "-";
    return name.replace(/_(KR|US)$/i, "");
};

const roundToTwo = (num: number) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

const PRESET_STRATEGIES = new Set([
    "DAILY_120D_NEW_HIGH_KR",
    "DAILY_120D_NEW_LOW_KR",
    "DAILY_BB_LOWER_TOUCH_KR",
    "DAILY_BB_UPPER_TOUCH_KR",
    "DAILY_TOUCH_MA60_KR",
    "RSI_30_UNHEATED_KR",
    "RSI_70_OVERHEATED_KR",
    "WEEKLY_52W_NEW_HIGH_KR",
    "WEEKLY_52W_NEW_LOW_KR",
    "WEEKLY_TOUCH_MA60_KR",
    "DUAL_MOMENTUM_1M_KR",
    "DUAL_MOMENTUM_3M_KR",
    "DUAL_MOMENTUM_6M_KR",
    "DUAL_MOMENTUM_1Y_KR",
    "DAILY_TOP20_VOLUME_KR",
    "DAILY_DROP_SPIKE_KR",
    "DAILY_RISE_SPIKE_KR",

    "DAILY_120D_NEW_HIGH_US",
    "DAILY_120D_NEW_LOW_US",
    "DAILY_BB_LOWER_TOUCH_US",
    "DAILY_BB_UPPER_TOUCH_US",
    "DAILY_TOUCH_MA60_US",
    "RSI_30_UNHEATED_US",
    "RSI_70_OVERHEATED_US",
    "WEEKLY_52W_NEW_HIGH_US",
    "WEEKLY_52W_NEW_LOW_US",
    "WEEKLY_TOUCH_MA60_US",
    "DUAL_MOMENTUM_1M_US",
    "DUAL_MOMENTUM_3M_US",
    "DUAL_MOMENTUM_6M_US",
    "DUAL_MOMENTUM_1Y_US",
    "DAILY_DROP_SPIKE_US",
    "DAILY_RISE_SPIKE_US",
    "DAILY_TOP20_VOLUME_US"
]);

const isPresetStrategy = (name: string | null | undefined): boolean => {
    if (!name) return false;
    return PRESET_STRATEGIES.has(name);
};

export default function MyStockPage() {
    const navigate = useNavigate();

    /* =========================
       State
    ========================= */
    const [krPage, setKrPage] = useState(1);
    const [usPage, setUsPage] = useState(1);

    const [krResult, setKrResult] =
        useState<PageResponseDTO<MyStockDTO> | null>(null);
    const [usResult, setUsResult] =
        useState<PageResponseDTO<MyStockDTO> | null>(null);

    const [deletedResult, setDeletedResult] =
        useState<PageResponseDTO<MyStockDTO> | null>(null);

    const [showDeleted, setShowDeleted] = useState(false);
    const [showCreateEtf, setShowCreateEtf] = useState(false);
    const [showAddToEtf, setShowAddToEtf] = useState(false);

    /* =========================
       Load
    ========================= */
    useEffect(() => {
        loadKR(krPage);
    }, [krPage]);

    useEffect(() => {
        loadUS(usPage);
    }, [usPage]);

    const loadKR = async (page: number) => {
        setKrResult(await getMyStockKR(page));
    };

    const loadUS = async (page: number) => {
        setUsResult(await getMyStockUS(page));
    };

    const loadDeleted = async (page: number) => {
        setDeletedResult(await getDeletedMyStock(page));
    };

    /* =========================
       Actions
    ========================= */
    const onDelete = async (id: number) => {
        if (!confirm("삭제하시겠습니까?")) return;
        await deleteMyStock(id);
        loadKR(1);
        loadUS(1);
    };

    const onRestore = async (id: number) => {
        if (!confirm("복구하시겠습니까?")) return;
        await restoreMyStock(id);
        setShowDeleted(false);
        loadKR(1);
        loadUS(1);
    };

    /* =========================
       Render Helpers
    ========================= */
    const renderRows = (
        result: PageResponseDTO<MyStockDTO> | null,
        isKR: boolean
    ) => {
        if (
            !result ||
            !Array.isArray(result.dtoList) ||
            result.dtoList.length === 0
        ) {
            return (
                <tr>
                    <td colSpan={10} className="mystock-empty">
                        데이터가 없습니다
                    </td>
                </tr>
            );
        }

        return result.dtoList.map((s, i) => {
            const cur = s.currentPrice != null ? roundToTwo(s.currentPrice) : null;
            const add = s.priceAtAdd != null ? roundToTwo(s.priceAtAdd) : null;

            const rowClass =
                cur != null && add != null
                    ? cur > add
                        ? "row-profit"
                        : cur < add
                            ? "row-loss"
                            : ""
                    : "";

            const priceClass =
                cur != null && add != null
                    ? cur > add
                        ? "price-up"
                        : cur < add
                            ? "price-down"
                            : "price-same"
                    : "price-same";

            const strategyUrl = isKR
                ? `/result/detailKR?strategy=${s.strategyName}&date=${s.memo}`
                : `/result/detailUS?strategy=${s.strategyName}&date=${s.memo}`;

            const stockSearchUrl =
                `/stock/searchStock?code=${encodeURIComponent(s.code)}&name=${encodeURIComponent(s.name)}`;


            return (
                <tr key={s.id} className={rowClass}>
                    <td className="col-no">
                        {(result.page - 1) * result.size + i + 1}
                    </td>
                    <td className="col-code">{s.code}</td>
                    <td className="col-name">{s.name}</td>

                    <td className="col-detail">
                        <button
                            className="detail-link-btn"
                            onClick={() => navigate(stockSearchUrl)}
                        >
                            종목 상세보기
                        </button>
                    </td>

                    <td className={`col-num ${priceClass}`}>
                        {isKR
                            ? fmt(s.currentPrice, " 원", false)
                            : fmt(s.currentPrice, " $", true)}
                    </td>

                    <td className="col-num">
                        {isKR
                            ? fmt(s.priceAtAdd, " 원", false)
                            : fmt(s.priceAtAdd, " $", true)}
                    </td>

                    <td className="col-num">
                        {isKR
                            ? fmt(s.targetPrice5, " 원", false)
                            : fmt(s.targetPrice5, " $", true)}
                    </td>

                    <td className="col-num">
                        {isKR
                            ? fmt(s.targetPrice10, " 원", false)
                            : fmt(s.targetPrice10, " $", true)}
                    </td>

                    <td className="col-strategy">
                        {isPresetStrategy(s.strategyName) ? (
                            <a href={strategyUrl}>{cleanStrategyName(s.strategyName)}</a>
                        ) : (
                            <span className="strategy-badge">{cleanStrategyName(s.strategyName)}</span>
                        )}
                    </td>

                    <td className="col-date">
                        {s.createdAt?.substring(0, 10) ?? "-"}
                    </td>

                    <td className="col-action">
                        <button
                            className="btn-delete"
                            onClick={() => onDelete(s.id)}
                        >
                            삭제
                        </button>
                    </td>
                </tr>
            );
        });
    };

    const renderPaging = (
        result: PageResponseDTO<any>,
        onPage: (p: number) => void
    ) => (
        <div className="mystock-pagination">
            {result.prev && (
                <button
                    className="page-btn"
                    onClick={() => onPage(result.start - 1)}
                >
                    이전
                </button>
            )}

            {Array.from(
                { length: result.end - result.start + 1 },
                (_, i) => result.start + i
            ).map((p) => (
                <button
                    key={p}
                    className={`page-btn ${p === result.page ? "active" : ""}`}
                    onClick={() => onPage(p)}
                >
                    {p}
                </button>
            ))}

            {result.next && (
                <button
                    className="page-btn"
                    onClick={() => onPage(result.end + 1)}
                >
                    다음
                </button>
            )}
        </div>
    );

    /* =========================
       Render
    ========================= */
    return (
        <div className="mystock-container">
            <div className="mystock-header">
                <h3>내 관심 종목</h3>

                <div className="mystock-header-actions">

                    <button
                        className="btn-etf btn-etf-outline"
                        onClick={() => navigate("/myetf/list")}
                    >
                        나의 ETF 가기
                    </button>

                    <button
                        className="btn-etf"
                        onClick={() => setShowAddToEtf(true)}
                    >
                        기존 ETF 추가
                    </button>

                    <button
                        className="btn-etf btn-etf-primary"
                        onClick={() => setShowCreateEtf(true)}
                    >
                        신규 ETF 생성
                    </button>

                    <button
                        className="btn-deleted"
                        onClick={() => {
                            loadDeleted(1);
                            setShowDeleted(true);
                        }}
                    >
                        삭제된 종목 보기
                    </button>



                </div>
            </div>

            {/* KR */}
            <div className="mystock-card">
                <div className="mystock-card-title">한국 관심 종목</div>
                <table className="mystock-table">
                    <colgroup>
                        <col style={{ width: "48px" }} />  {/* No */}
                        <col style={{ width: "100px" }} /> {/* 종목코드 */}
                        <col style={{ width: "180px" }} /> {/* 종목명 */}
                        <col style={{ width: "120px" }} /> {/* 상세보기 */}
                        <col style={{ width: "110px" }} /> {/* 현재가 */}
                        <col style={{ width: "110px" }} /> {/* 편입가 */}
                        <col style={{ width: "80px" }} />  {/* +5% */}
                        <col style={{ width: "80px" }} />  {/* +10% */}
                        <col style={{ width: "140px" }} /> {/* 전략 */}
                        <col style={{ width: "100px" }} /> {/* 등록일 */}
                        <col style={{ width: "80px" }} />  {/* 삭제 */}
                    </colgroup>

                    <thead>
                        <tr>
                            <th className="col-no">No</th>
                            <th className="col-code">종목코드</th>
                            <th className="col-name">종목명</th>
                            <th className="col-detail"></th>
                            <th className="col-num">현재가</th>
                            <th className="col-num">편입가</th>
                            <th className="col-num">+5%</th>
                            <th className="col-num">+10%</th>
                            <th className="col-strategy">전략</th>
                            <th className="col-date">등록일</th>
                            <th className="col-action">삭제</th>
                        </tr>
                    </thead>

                    <tbody>{renderRows(krResult, true)}</tbody>
                </table>
            </div>
            {krResult && renderPaging(krResult, setKrPage)}

            {/* US */}
            <div className="mystock-card">
                <div className="mystock-card-title">미국 관심 종목</div>
                <table className="mystock-table">
                    <colgroup>
                        <col style={{ width: "48px" }} />  {/* No */}
                        <col style={{ width: "100px" }} /> {/* 종목코드 */}
                        <col style={{ width: "180px" }} /> {/* 종목명 */}
                        <col style={{ width: "120px" }} /> {/* 상세보기 */}
                        <col style={{ width: "110px" }} /> {/* 현재가 */}
                        <col style={{ width: "110px" }} /> {/* 편입가 */}
                        <col style={{ width: "80px" }} />  {/* +5% */}
                        <col style={{ width: "80px" }} />  {/* +10% */}
                        <col style={{ width: "140px" }} /> {/* 전략 */}
                        <col style={{ width: "100px" }} /> {/* 등록일 */}
                        <col style={{ width: "80px" }} />  {/* 삭제 */}
                    </colgroup>

                    <thead>
                        <tr>
                            <th className="col-no">No</th>
                            <th className="col-code">종목코드</th>
                            <th className="col-name">종목명</th>
                            <th className="col-detail"></th>
                            <th className="col-num">현재가</th>
                            <th className="col-num">편입가</th>
                            <th className="col-num">+5%</th>
                            <th className="col-num">+10%</th>
                            <th className="col-strategy">전략</th>
                            <th className="col-date">등록일</th>
                            <th className="col-action">삭제</th>
                        </tr>
                    </thead>
                    <tbody>{renderRows(usResult, false)}</tbody>
                </table>
            </div>
            {usResult && renderPaging(usResult, setUsPage)}

            {showDeleted && deletedResult && (
                <DeletedMyStockModal
                    result={deletedResult}
                    onClose={() => setShowDeleted(false)}
                    onRestore={onRestore}
                    onPage={loadDeleted}
                />
            )}

            {showCreateEtf && (
                <CreateEtfModal
                    open={showCreateEtf}
                    myStocks={[
                        ...(krResult?.dtoList ?? []).map(s => ({
                            code: s.code,
                            name: s.name,
                            market: "KR" as const,
                            currentPrice: s.currentPrice,
                        })),
                        ...(usResult?.dtoList ?? []).map(s => ({
                            code: s.code,
                            name: s.name,
                            market: "US" as const,
                            currentPrice: s.currentPrice,
                        })),
                    ]}

                    onClose={() => setShowCreateEtf(false)}
                    onCreated={() => setShowCreateEtf(false)}
                />
            )}


            {showAddToEtf && (
                <EditEtfModal
                    open={showAddToEtf}
                    myStocks={[
                        ...(krResult?.dtoList ?? []).map(s => ({
                            code: s.code,
                            name: s.name,
                            market: "KR" as const,
                            currentPrice: s.currentPrice,
                        })),
                        ...(usResult?.dtoList ?? []).map(s => ({
                            code: s.code,
                            name: s.name,
                            market: "US" as const,
                            currentPrice: s.currentPrice,
                        })),
                    ]}
                    onClose={() => setShowAddToEtf(false)}
                    onSaved={() => setShowAddToEtf(false)}
                />
            )}

        </div>
    );
}
