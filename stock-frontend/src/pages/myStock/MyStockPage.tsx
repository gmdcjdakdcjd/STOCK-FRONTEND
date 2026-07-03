import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getMyStockKR,
    getMyStockUS,
    getDeletedMyStock,
    deleteMyStock,
    restoreMyStock,
    updateMyStockTargets, // 신규 목표가 수정 API 임포트
} from "../../api/myStockApi";

import type { MyStockDTO, PageResponseDTO } from "../../api/myStockApi";
import CreateEtfModal from "./CreateEtfModal";
import EditEtfModal from "./EditEtfModal";

import DeletedMyStockModal from "./DeletedMyStockModal";
import MyStockTargetEditModal from "./MyStockTargetEditModal"; // 목표가 수정 모달 임포트
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
    const [hasEtf, setHasEtf] = useState<boolean>(false);
    const [editingStock, setEditingStock] = useState<MyStockDTO | null>(null); // 목표가 수정 대상 종목 상태
    const [isTargetEditModalOpen, setIsTargetEditModalOpen] = useState<boolean>(false); // 목표가 수정 모달 노출 상태

    // 사용자가 소유한 ETF 목록이 존재하는지 초기 로드 확인
    useEffect(() => {
        fetch("/api/myetf/list?page=1&size=1")
            .then(res => res.json())
            .then(data => {
                const dtoList = data && data.dtoList ? data.dtoList : [];
                setHasEtf(dtoList.length > 0);
            })
            .catch(() => {
                setHasEtf(false);
            });
    }, []);

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

    // 목표가 최종 수정 저장 핸들러
    const handleSaveTargets = async (id: number, targets: {
        buyTargetPrice1: number | null;
        buyTargetPrice2: number | null;
        buyTargetPrice3: number | null;
        sellTargetPrice1: number | null;
        sellTargetPrice2: number | null;
        sellTargetPrice3: number | null;
    }) => {
        try {
            await updateMyStockTargets(id, targets);
            alert("목표가가 정상적으로 수정되었습니다.");
            loadKR(krPage);
            loadUS(usPage);
        } catch (error) {
            console.error("목표가 수정 에러:", error);
            alert("목표가 수정에 실패했습니다.");
        }
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
                    <td colSpan={12} className="mystock-empty">
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
                    <td className="col-name">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>{s.name}</span>
                            <button
                                onClick={() => navigate(stockSearchUrl)}
                                title="종목 상세보기"
                                style={{
                                    background: "none",
                                    border: "none",
                                    padding: "2px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    color: "#94a3b8",
                                    transition: "color 0.2s"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = "#4f46e5"}
                                onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </button>
                        </div>
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

                    {/* 저점매수 표출 */}
                    <td className="col-num" style={{ fontWeight: 700 }}>
                        {s.buyTargetPrice1 != null
                            ? isKR
                                ? fmt(s.buyTargetPrice1, " 원", false)
                                : fmt(s.buyTargetPrice1, " $", true)
                            : "-"}
                    </td>

                    {/* 고점매수 표출 */}
                    <td className="col-num" style={{ fontWeight: 700 }}>
                        {s.buyTargetPrice2 != null
                            ? isKR
                                ? fmt(s.buyTargetPrice2, " 원", false)
                                : fmt(s.buyTargetPrice2, " $", true)
                            : "-"}
                    </td>

                    {/* 익절가 표출 */}
                    <td className="col-num" style={{ fontWeight: 700 }}>
                        {s.sellTargetPrice1 != null
                            ? isKR
                                ? fmt(s.sellTargetPrice1, " 원", false)
                                : fmt(s.sellTargetPrice1, " $", true)
                            : "-"}
                    </td>

                    {/* 손절가 표출 */}
                    <td className="col-num" style={{ fontWeight: 700 }}>
                        {s.sellTargetPrice2 != null
                            ? isKR
                                ? fmt(s.sellTargetPrice2, " 원", false)
                                : fmt(s.sellTargetPrice2, " $", true)
                            : "-"}
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

                    <td className="col-action" style={{ display: "flex", gap: "4px", justifyContent: "center", alignItems: "center" }}>
                        <button
                            className="btn-edit-target"
                            style={{
                                padding: "5px 8px",
                                fontSize: "0.75rem",
                                borderRadius: "6px",
                                border: "1px solid #3b82f6",
                                color: "#2563eb",
                                background: "#eff6ff",
                                cursor: "pointer",
                                fontWeight: 700,
                                transition: "all 0.2s",
                                whiteSpace: "nowrap"
                            }}
                            onClick={() => {
                                setEditingStock(s);
                                setIsTargetEditModalOpen(true);
                            }}
                        >
                            목표가
                        </button>
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
                        className={`btn-etf ${!hasEtf ? "disabled" : ""}`}
                        onClick={() => hasEtf && setShowAddToEtf(true)}
                        disabled={!hasEtf}
                        title={!hasEtf ? "생성된 ETF가 없습니다" : undefined}
                        style={!hasEtf ? {
                            cursor: "not-allowed",
                            opacity: 0.6,
                            backgroundColor: "#e2e8f0",
                            color: "#94a3b8",
                            borderColor: "#cbd5e1"
                        } : undefined}
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
                        <col style={{ width: "48px" }} />
                        <col style={{ width: "85px" }} />
                        <col style={{ width: "170px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "125px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "130px" }} />
                    </colgroup>

                    <thead>
                        <tr>
                            <th className="col-no">No</th>
                            <th className="col-code">종목코드</th>
                            <th className="col-name">종목명</th>
                            <th className="col-num">현재가</th>
                            <th className="col-num">편입가</th>
                            <th className="col-num">저점매수</th>
                            <th className="col-num">고점매수</th>
                            <th className="col-num">익절가</th>
                            <th className="col-num">손절가</th>
                            <th className="col-strategy">전략</th>
                            <th className="col-date">등록일</th>
                            <th className="col-action">관리</th>
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
                        <col style={{ width: "48px" }} />
                        <col style={{ width: "85px" }} />
                        <col style={{ width: "170px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "125px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "130px" }} />
                    </colgroup>

                    <thead>
                        <tr>
                            <th className="col-no">No</th>
                            <th className="col-code">종목코드</th>
                            <th className="col-name">종목명</th>
                            <th className="col-num">현재가</th>
                            <th className="col-num">편입가</th>
                            <th className="col-num">저점매수</th>
                            <th className="col-num">고점매수</th>
                            <th className="col-num">익절가</th>
                            <th className="col-num">손절가</th>
                            <th className="col-strategy">전략</th>
                            <th className="col-date">등록일</th>
                            <th className="col-action">관리</th>
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
                    onCreated={() => {
                        setShowCreateEtf(false);
                        setHasEtf(true); // ETF가 생성되었으므로 활성화 처리
                    }}
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
            {isTargetEditModalOpen && editingStock && (
                <MyStockTargetEditModal
                    isOpen={isTargetEditModalOpen}
                    onClose={() => {
                        setIsTargetEditModalOpen(false);
                        setEditingStock(null);
                    }}
                    stock={editingStock}
                    onSave={handleSaveTargets}
                    market={editingStock.strategyName.endsWith("_US") ? "us" : "kr"}
                />
            )}

        </div>
    );
}
