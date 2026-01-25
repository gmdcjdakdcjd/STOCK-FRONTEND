import { useEffect, useState } from "react";
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
    suffix = ""
) => (v != null ? `${v.toLocaleString()}${suffix}` : "-");

export default function MyStockPage() {
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
            const rowClass =
                s.currentPrice != null && s.priceAtAdd != null
                    ? s.currentPrice > s.priceAtAdd
                        ? "row-profit"
                        : s.currentPrice < s.priceAtAdd
                            ? "row-loss"
                            : ""
                    : "";

            const priceClass =
                s.currentPrice != null && s.priceAtAdd != null
                    ? s.currentPrice > s.priceAtAdd
                        ? "price-up"
                        : s.currentPrice < s.priceAtAdd
                            ? "price-down"
                            : "price-same"
                    : "price-same";

            const detailUrl = isKR
                ? `/result/detailKR?strategy=${s.strategyName}&date=${s.memo}`
                : `/result/detailUS?strategy=${s.strategyName}&date=${s.memo}`;

            return (
                <tr key={s.id} className={rowClass}>
                    <td className="col-no">
                        {(result.page - 1) * result.size + i + 1}
                    </td>
                    <td className="col-code">{s.code}</td>
                    <td className="col-name">{s.name}</td>

                    <td className={`col-num ${priceClass}`}>
                        {isKR
                            ? fmt(s.currentPrice, " 원")
                            : fmt(s.currentPrice, " $")}
                    </td>

                    <td className="col-num">
                        {isKR
                            ? fmt(s.priceAtAdd, " 원")
                            : fmt(s.priceAtAdd, " $")}
                    </td>

                    <td className="col-num">
                        {isKR
                            ? fmt(s.targetPrice5, " 원")
                            : fmt(s.targetPrice5, " $")}
                    </td>

                    <td className="col-num">
                        {isKR
                            ? fmt(s.targetPrice10, " 원")
                            : fmt(s.targetPrice10, " $")}
                    </td>

                    <td className="col-strategy">
                        <a href={detailUrl}>{s.strategyName}</a>
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
                        <thead>
                            <tr>
                                <th className="col-no">No</th>
                                <th className="col-code">종목코드</th>
                                <th className="col-name">종목명</th>
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
                        <thead>
                            <tr>
                                <th className="col-no">No</th>
                                <th className="col-code">종목코드</th>
                                <th className="col-name">종목명</th>
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
                            ...(krResult?.dtoList ?? []),
                            ...(usResult?.dtoList ?? []),
                        ].map(s => ({
                            code: s.code,
                            name: s.name,
                        }))}
                        onClose={() => setShowCreateEtf(false)}
                        onCreated={() => setShowCreateEtf(false)}
                    />
                )}

                {showAddToEtf && (
                    <EditEtfModal
                        open={showAddToEtf}
                        myStocks={[
                            ...(krResult?.dtoList ?? []),
                            ...(usResult?.dtoList ?? []),
                        ].map(s => ({
                            code: s.code,
                            name: s.name,
                        }))}
                        onClose={() => setShowAddToEtf(false)}
                        onSaved={() => setShowAddToEtf(false)}
                    />
                )}
        </div>
    );
}
