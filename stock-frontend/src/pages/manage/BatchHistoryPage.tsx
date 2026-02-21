// src/pages/manage/BatchHistoryPage.tsx

import { useEffect, useState } from "react";
import { getBatchHistoryDates } from "../../api/manageBatchApi";
import type { BatchDateGroupDTO, PageResponseDTO } from "../../api/manageBatchApi";
import BatchHistoryList from "./BatchHistoryList";
import "./batch-history.css";

export default function BatchHistoryPage() {
  const [result, setResult] = useState<PageResponseDTO<BatchDateGroupDTO> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData(page);
  }, [page]);

  const loadData = async (targetPage: number) => {
    setLoading(true);
    try {
      const data = await getBatchHistoryDates(targetPage, 15);
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("데이터를 로드하는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (p: number) => {
    setPage(p);
  };

  return (
    <div className="batch-container">
      <div className="batch-header">
        <h3>배치 기록 관리</h3>
      </div>

      {loading && !result ? (
        <div className="no-data-msg">데이터를 불러오는 중입니다...</div>
      ) : (
        <>
          <BatchHistoryList list={result?.dtoList || []} />

          {/* MyEtf 스타일의 Pagination */}
          {result && result.total > 0 && (
            <div className="pagination">
              {result.prev && (
                <button onClick={() => handlePageChange(result.start - 1)}>
                  이전
                </button>
              )}

              {Array.from(
                { length: result.end - result.start + 1 },
                (_, i) => result.start + i
              ).map(p => (
                <button
                  key={p}
                  className={p === page ? "active" : ""}
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </button>
              ))}

              {result.next && (
                <button onClick={() => handlePageChange(result.end + 1)}>
                  다음
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
