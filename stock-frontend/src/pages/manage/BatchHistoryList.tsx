// src/pages/manage/BatchHistoryList.tsx

import type { BatchDateGroupDTO } from "../../api/manageBatchApi";

interface Props {
  list: BatchDateGroupDTO[];
  viewYear: number;
  viewMonth: number;
  onMonthChange: (year: number, month: number) => void;
  onOpenSingleView: (execDate: string) => void;
  loadingDate: string | null;
}

/**
 * 배치 실행 이력 목록을 리스트 테이블 대신, 직관적이고 인터랙티브한 캘린더(달력) UI로 렌더링하는 컴포넌트입니다.
 * 달력 자체 내의 불필요한 년/월/일 드롭다운 조작계를 제거하여 화면 구성을 단순화하고 가독성을 높였습니다.
 */
export default function BatchHistoryList({
  list,
  viewYear,
  viewMonth,
  onMonthChange,
  onOpenSingleView,
  loadingDate
}: Props) {
  // 이전 달로 이동 시 부모의 연월 상태 업데이트
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      onMonthChange(viewYear - 1, 11);
    } else {
      onMonthChange(viewYear, viewMonth - 1);
    }
  };

  // Next month
  const handleNextMonth = () => {
    if (viewMonth === 11) {
      onMonthChange(viewYear + 1, 0);
    } else {
      onMonthChange(viewYear, viewMonth + 1);
    }
  };

  // 배치 기록 데이터 매핑 (execDate -> { totalCount, failCount })
  const batchMap = new Map<string, { totalCount: number; failCount: number }>();
  list.forEach(item => {
    batchMap.set(item.execDate, {
      totalCount: item.totalCount,
      failCount: item.failCount || 0
    });
  });

  // 달력 렌더링에 필요한 날짜 정보 계산
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 해당 월 1일의 요일
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate(); // 해당 월의 총 일수
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate(); // 이전 달의 총 일수

  const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // 1. 이전 달의 빈 공간 채우기
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  // 2. 이번 달 날짜 채우기
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ dateStr, dayNum: d, isCurrentMonth: true });
  }

  // 3. 다음 달 빈 공간 채우기 (6줄 42칸 포맷 유지)
  const totalCells = 42;
  const remainingCells = totalCells - days.length;
  for (let d = 1; d <= remainingCells; d++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="calendar-container">
      {/* 달력 헤더 (이전달, 연/월 표기, 다음달 버튼만으로 심플하게 구성) */}
      <div className="calendar-header">
        <button type="button" className="cal-btn" onClick={handlePrevMonth}>
          &lt; 이전 달
        </button>
        <span className="calendar-title">
          {viewYear}년 {viewMonth + 1}월
        </span>
        <button type="button" className="cal-btn" onClick={handleNextMonth}>
          다음 달 &gt;
        </button>
      </div>

      {/* 요일 가이드 행 */}
      <div className="calendar-weekdays">
        {weekDays.map(wd => (
          <div key={wd} className={`weekday ${wd === "일" ? "sun" : wd === "토" ? "sat" : ""}`}>
            {wd}
          </div>
        ))}
      </div>

      {/* 달력 날짜 격자(Grid) */}
      <div className="calendar-grid">
        {days.map((cell, idx) => {
          const data = batchMap.get(cell.dateStr);
          const totalCount = data?.totalCount || 0;
          const failCount = data?.failCount || 0;
          const hasBatch = totalCount > 0;
          const hasFail = failCount > 0;

          const isSunday = idx % 7 === 0;
          const isSaturday = idx % 7 === 6;

          return (
            <div
              key={cell.dateStr + idx}
              className={`calendar-cell 
                ${cell.isCurrentMonth ? "current-month" : "other-month"}
                ${hasBatch ? "has-batch" : ""}
                ${hasFail ? "has-fail" : ""}
              `}
              onClick={() => hasBatch && onOpenSingleView(cell.dateStr)}
              style={{ cursor: hasBatch ? "pointer" : "default" }}
            >
              <div className="cell-top">
                <span className={`day-number ${isSunday ? "sun" : isSaturday ? "sat" : ""}`}>
                  {cell.dayNum}
                </span>
              </div>
              <div className="cell-body">
                {hasBatch && (
                  <span className={`batch-count-badge 
                    ${hasFail ? "fail" : ""}
                    ${loadingDate === cell.dateStr ? "loading" : ""}
                  `}>
                    {loadingDate === cell.dateStr ? "..." : hasFail ? `${failCount}건 실패` : `${totalCount}건 완료`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
