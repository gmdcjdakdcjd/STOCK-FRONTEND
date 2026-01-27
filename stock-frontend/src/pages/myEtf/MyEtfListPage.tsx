import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyEtfList, deleteMyEtf } from "../../api/myEtfApi";
import type { MyEtfSummaryDTO, PageResponseDTO } from "./myEtf.types";
import CreateEtfModal from "./CreateEtfModal";

import "./MyEtfListPage.css";

export default function MyEtfListPage() {
  const navigate = useNavigate();

  const [result, setResult] =
    useState<PageResponseDTO<MyEtfSummaryDTO> | null>(null);
  const [page, setPage] = useState(1);
  const size = 10;

  const list = result?.dtoList ?? [];

  /* =========================
     데이터 로딩
     ========================= */
  const load = async (p: number) => {
    const data = await fetchMyEtfList(p, size);
    setResult(data);
  };

  useEffect(() => {
    load(page);
  }, [page]);

  /* =========================
     이벤트
     ========================= */
  const handleDelete = async (etfName: string) => {
    if (!confirm(`ETF [${etfName}] 를 삭제하시겠습니까?`)) return;
    await deleteMyEtf(etfName);
    load(page);
  };

  const moveDetail = (etfName: string) => {
    navigate(`/myetf/detail?etfName=${etfName}`);
  };

  /* =========================
     렌더
     ========================= */
  return (
    <div className="myetf-page">
      {/* Header */}
      <div className="myetf-header">
        <h2>내가 만든 ETF</h2>

        <div className="myetf-header-actions">
          <button
            className="btn-etf-outline"
            onClick={() => navigate("/stock/myStock")}
          >
            나의 즐겨찾기 종목 보기
          </button>

          <CreateEtfModal onCreated={() => load(page)} />
        </div>
      </div>


      {/* List */}
      {!result ? (
        <div className="myetf-loading">Loading...</div>
      ) : list.length === 0 ? (
        <div className="myetf-empty">생성된 ETF가 없습니다.</div>
      ) : (
        <div className="myetf-list">
          {/* ===== Header ===== */}
          <div className="myetf-row header">
            <div className="col no">No</div>
            <div className="col name">ETF 이름</div>
            <div className="col count">종목 수</div>
            <div className="col action">삭제</div>
          </div>

          {/* ===== Rows ===== */}
          {list.map((etf, idx) => (
            <div
              key={etf.etfName}
              className="myetf-row"
              onClick={() => moveDetail(etf.etfName)}
            >
              <div className="col no">
                {(result.page - 1) * result.size + idx + 1}
              </div>
              <div className="col name">{etf.etfName}</div>
              <div className="col count">
                <span className="count-badge">{etf.itemCount}</span>
              </div>
              <div className="col action">
                <button
                  className="btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(etf.etfName);
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Pagination */}
      {result && result.total > 0 && (
        <div className="pagination">
          {Array.from(
            { length: result.end - result.start + 1 },
            (_, i) => result.start + i
          ).map((p) => (
            <button
              key={p}
              className={p === result.page ? "active" : ""}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
