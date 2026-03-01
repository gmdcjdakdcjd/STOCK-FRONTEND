import type { MyStockDTO, PageResponseDTO } from "../../api/myStockApi";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import "./MyStockPage.css";

interface Props {
    result: PageResponseDTO<MyStockDTO>;
    onClose: () => void;
    onRestore: (id: number) => void;
    onPage: (page: number) => void;
}

export default function DeletedMyStockModal({
    result,
    onClose,
    onRestore,
    onPage,
}: Props) {
    //  배경 스크롤 방지
    useLockBodyScroll();

    //  null 방어 (핵심)
    const list = result.dtoList ?? [];
    const hasData = list.length > 0;

    return (
        <div className="modal-overlay">
            <div className="modal-body">
                <div className="modal-header">
                    <h3>삭제된 관심 종목</h3>
                    <button
                        type="button"
                        className="close-btn"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-content">
                    <table className="mystock-table">
                        <thead>
                            <tr>
                                <th className="col-no">No</th>
                                <th className="col-code">종목코드</th>
                                <th className="col-name">종목명</th>
                                <th className="col-date">삭제일</th>
                                <th className="col-action">복구</th>
                            </tr>
                        </thead>


                        <tbody>
                            {!hasData && (
                                <tr>
                                    <td colSpan={5} className="mystock-empty">
                                        삭제된 종목이 없습니다
                                    </td>
                                </tr>
                            )}

                            {hasData &&
                                list.map((s, i) => (
                                    <tr key={s.id}>
                                        <td className="col-no">
                                            {(result.page - 1) * result.size + i + 1}
                                        </td>
                                        <td className="col-code">{s.code}</td>
                                        <td className="col-name">{s.name}</td>
                                        <td className="col-date">
                                            {s.deletedAt?.replace("T", " ")}
                                        </td>
                                        <td className="col-action">
                                            <button
                                                type="button"
                                                className="btn-delete"
                                                onClick={() => onRestore(s.id)}
                                            >
                                                복구
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>

                    {hasData && (
                        <div className="mystock-pagination">
                            {result.prev && (
                                <button
                                    type="button"
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
                                    type="button"
                                    className={`page-btn ${p === result.page ? "active" : ""}`}
                                    onClick={() => onPage(p)}
                                >
                                    {p}
                                </button>
                            ))}

                            {result.next && (
                                <button
                                    type="button"
                                    className="page-btn"
                                    onClick={() => onPage(result.end + 1)}
                                >
                                    다음
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
