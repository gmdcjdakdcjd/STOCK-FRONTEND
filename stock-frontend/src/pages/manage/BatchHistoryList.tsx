// src/pages/manage/BatchHistoryList.tsx

import { useState } from "react";
import type { BatchDateGroupDTO } from "../../api/manageBatchApi";
import { formatDateTime } from "./date";

interface Props {
  list: BatchDateGroupDTO[];
}

export default function BatchHistoryList({ list }: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="batch-list">
      {/* Header */}
      <div className="batch-list-header">
        <span>날짜</span>
        <span className="count-col">건수(IN+OUT)</span>
        <span />
      </div>

      {list.map(g => {
        const opened = openKey === g.dateKey;

        return (
          <div key={g.dateKey}>
            {/* Summary Row */}
            <div className="batch-list-row">
              <span className="batch-date">{g.date}</span>

              <span className="batch-count">
                {g.items.length}건
              </span>

              <button
                className="view-link"
                onClick={() =>
                  setOpenKey(opened ? null : g.dateKey)
                }
              >
                {opened ? "닫기 ▲" : "보기 ▼"}
              </button>
            </div>

            {/* Detail */}
            {opened && (
              <div className="batch-detail-panel">
                <div className="batch-detail-title">
                  상세 실행 내역
                </div>

                <div className="batch-detail-table">
                  <div className="batch-detail-header">
                    <span>유형</span>
                    <span>Job명</span>
                    <span>시작</span>
                    <span>종료</span>
                    <span>Status</span>
                    <span>Duration</span>
                  </div>

                  {g.items.map((item, idx) => (
                    <div key={idx} className="batch-detail-row">
                      <span>{item.type}</span>

                      <span>{item.jobName}</span>

                      <span>
                        {formatDateTime(item.execStartTime)}
                      </span>

                      <span>
                        {formatDateTime(item.execEndTime)}
                      </span>

                      <span
                        className={
                          item.execStatus === "SUCCESS"
                            ? "status-success"
                            : "status-fail"
                        }
                      >
                        {item.execStatus}
                      </span>

                      <span>
                        {item.durationMs} ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
