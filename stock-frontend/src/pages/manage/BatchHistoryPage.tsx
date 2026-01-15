// src/pages/manage/BatchHistoryPage.tsx

import { useEffect, useState } from "react";
import BasicLayout from "../../layouts/BasicLayout";
import { getBatchHistory } from "../../api/manageBatchApi";
import type { PageResponseDTO, BatchDateGroupDTO } from "../../api/manageBatchApi";
import BatchHistoryList from "./BatchHistoryList";

import "./batch-history.css";

export default function BatchHistoryPage() {
  const [result, setResult] =
    useState<PageResponseDTO<BatchDateGroupDTO> | null>(null);

  const page = result?.page ?? 1;
  const size = result?.size ?? 10;

  const load = (p: number) => {
    getBatchHistory(p, size)
      .then(setResult)
      .catch(console.error);
  };

  useEffect(() => {
    load(1);
  }, []);

  if (!result) {
    return (
      <BasicLayout>
        <div className="loading">Loading...</div>
      </BasicLayout>
    );
  }

  return (
    <BasicLayout>
      <div className="batch-container">
        <h3 className="batch-title">배치 실행 이력</h3>

        <div className="batch-card">
          <div className="batch-card-header">전체 배치 내역</div>

          <BatchHistoryList list={result.dtoList} />

          {/* 페이지 번호만 (이전/다음 제거) */}
          <div className="batch-pagination">
            {Array.from(
              { length: result.end - result.start + 1 },
              (_, i) => result.start + i
            ).map(p => (
              <button
                key={p}
                className={`page-btn ${p === page ? "active" : ""}`}
                onClick={() => load(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </BasicLayout>
  );
}
