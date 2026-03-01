// src/pages/manage/BatchHistoryList.tsx

import { useState } from "react";
import { getBatchHistoryByDate } from "../../api/manageBatchApi";
import type { BatchDateGroupDTO, BatchHistoryView } from "../../api/manageBatchApi";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";

interface Props {
  list: BatchDateGroupDTO[];
}

export default function BatchHistoryList({ list }: Props) {
  // 특정 날짜의 상세 내역 캐싱 (date -> items)
  const [detailsCache, setDetailsCache] = useState<Record<string, BatchHistoryView[]>>({});
  // 현재 로딩 중인 날짜 (중복 호출 방지 및 UI 피드백용)
  const [loadingDate, setLoadingDate] = useState<string | null>(null);
  // 현재 열려있는 팝업의 날짜
  const [modalDate, setModalDate] = useState<string | null>(null);

  //  배경 스크롤 방지
  useLockBodyScroll(!!modalDate);

  /**
   * 상세보기 클릭 핸들러 (팝업 열기)
   */
  const handleOpenModal = async (execDate: string) => {
    // 1. 이미 데이터가 있으면 캐시 사용
    if (detailsCache[execDate]) {
      setModalDate(execDate);
      return;
    }

    // 2. 현재 로딩 중이면 중복 호출 방지
    if (loadingDate) return;

    setLoadingDate(execDate);
    try {
      const res = await getBatchHistoryByDate(execDate, 1, 200);
      setDetailsCache(prev => ({ ...prev, [execDate]: res.dtoList }));
      setModalDate(execDate);
    } catch (err) {
      console.error("Failed to load details:", err);
      alert("상세 내역을 가져오는데 실패했습니다.");
    } finally {
      setLoadingDate(null);
    }
  };

  const handleCloseModal = () => {
    setModalDate(null);
  };

  const currentItems = modalDate ? (detailsCache[modalDate] || []) : [];

  return (
    <div className="batch-list-container">
      {/* MyEtf 스타일 - Grid 기반 리스트 */}
      <div className="batch-list">
        <div className="batch-row header">
          <div className="col date">실행 날짜</div>
          <div className="col count">총 배치 건수</div>
          <div className="col action">상세보기</div>
        </div>

        {list.length === 0 ? (
          <div className="no-data-msg">조회된 이력이 없습니다.</div>
        ) : (
          list.map(group => (
            <div className="batch-row" key={group.execDate}>
              <div className="col date">{group.execDate}</div>
              <div className="col count">
                <span className="count-badge">{group.totalCount.toLocaleString()} 건</span>
              </div>
              <div className="col action">
                <button
                  className="btn-primary"
                  disabled={!!loadingDate}
                  onClick={() => handleOpenModal(group.execDate)}
                >
                  {loadingDate === group.execDate ? "..." : "상세보기"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 모달 팝업 */}
      {modalDate && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-body" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>[{modalDate}] 상세 실행 내역</h3>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>

            <div className="batch-detail-scroll-container">
              <table className="batch-detail-table">
                <thead>
                  <tr>
                    <th>유형</th>
                    <th>Job명</th>
                    <th>시작</th>
                    <th>종료</th>
                    <th>상태</th>
                    <th>소요(ms)</th>
                    <th>결과 메시지</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((item) => (
                      <tr key={item.histId}>
                        <td>
                          <span className={`type-badge ${item.type.toLowerCase()}`}>
                            {item.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{item.jobName}</td>
                        <td style={{ color: '#6b7280' }}>{item.execStartTime?.substring(11, 19) || "-"}</td>
                        <td style={{ color: '#6b7280' }}>{item.execEndTime?.substring(11, 19) || "-"}</td>
                        <td>
                          <span className={`status-badge ${item.execStatus === "SUCCESS" ? "success" : "fail"}`}>
                            {item.execStatus}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {item.durationMs?.toLocaleString() ?? 0}
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280' }} title={item.execMessage}>
                          {item.execMessage || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="no-data-msg">상세 내역이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button className="btn-primary" onClick={handleCloseModal}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
