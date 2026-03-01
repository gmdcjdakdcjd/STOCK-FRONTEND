import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchKrResultList } from "../../api/resultApi";
import type {
  StrategyCode,
  StrategyResult,
  PageResponse
} from "../../api/resultApi";
import "./result.css";

export default function BoardListKRPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [strategyList, setStrategyList] = useState<StrategyCode[]>([]);
  const [strategyLabelMap, setStrategyLabelMap] =
    useState<Record<string, string>>({});
  const [rows, setRows] = useState<StrategyResult[]>([]);
  const [pageInfo, setPageInfo] =
    useState<PageResponse<StrategyResult> | null>(null);

  /* =========================
     URL 파라미터
     ========================= */
  const page = params.get("page") ?? "1";
  const size = params.get("size") ?? "10";
  const strategy = params.get("strategy") ?? "";
  const regDate = params.get("regDate") ?? "";

  /* =========================
      검색 조건 state
     ========================= */
  const [searchStrategy, setSearchStrategy] = useState("");
  const [searchDate, setSearchDate] = useState("");

  /* =========================
     URL → 검색 조건 동기화
     ========================= */
  useEffect(() => {
    setSearchStrategy(strategy);
    setSearchDate(regDate);
  }, [strategy, regDate]);

  /* =========================
     데이터 조회
     ========================= */
  useEffect(() => {
    const q = new URLSearchParams({
      page,
      size,
      ...(strategy && { strategy }),
      ...(regDate && { regDate })
    });

    fetchKrResultList(q)
      .then(data => {
        setStrategyList(data.strategyList);

        const map: Record<string, string> = {};
        data.strategyList.forEach(s => {
          map[s.code] = s.label;
        });
        setStrategyLabelMap(map);

        //  핵심 수정: null 방어
        setRows(data.response.dtoList ?? []);
        setPageInfo(data.response);
      })
      .catch(() => {
        alert("한국 전략 목록을 불러오지 못했습니다.");
        setRows([]);          //  안전 장치
        setPageInfo(null);
      });
  }, [page, size, strategy, regDate]);

  /* =========================
     검색
     ========================= */
  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const next = new URLSearchParams();
    next.set("page", "1");
    next.set("size", size);

    if (searchStrategy) next.set("strategy", searchStrategy);
    if (searchDate) next.set("regDate", searchDate);

    setParams(next);
  };

  /* =========================
     페이지 이동
     ========================= */
  const movePage = (p: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    setParams(next);
  };

  /* =========================
     초기화
     ========================= */
  const resetFilter = () => {
    setSearchStrategy("");
    setSearchDate("");

    setParams(
      new URLSearchParams({
        page: "1",
        size
      })
    );
  };

  return (
    <div className="container mt-4" style={{ maxWidth: 1400 }}>
        <h3 className="fw-bold mb-4">📈 한국 전략 결과 목록</h3>

        {/* =========================
           Filter
           ========================= */}
        <form className="result-filter" onSubmit={onSearch}>
          <div className="result-filter-row">
            <div className="result-filter-group">
              <span className="result-filter-label">전략명</span>
              <select
                className="result-filter-select"
                value={searchStrategy}
                onChange={e => setSearchStrategy(e.target.value)}
              >
                <option value="">전체</option>
                {strategyList.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="result-filter-group">
              <span className="result-filter-label">날짜</span>
              <input
                type="date"
                className="result-filter-input"
                value={searchDate}
                onChange={e => setSearchDate(e.target.value)}
              />
            </div>

            <div className="result-filter-actions">
              <button type="submit" className="btn-search">
                검색
              </button>
              <button type="button" className="btn-reset" onClick={resetFilter}>
                초기화
              </button>
            </div>
          </div>
        </form>

        {/* =========================
           Result
           ========================= */}
        <div className="result-card">
          <div className="result-card-header">전략 결과</div>

          <div className="result-table-header">
            <div>전략명</div>
            <div>포착일</div>
            <div>포착 데이터 수</div>
          </div>

          {rows.length === 0 && (
            <div className="result-empty">
              조회된 결과가 없습니다.
            </div>
          )}

          {rows.map(r => (
            <div
              key={`${r.strategyName}-${r.signalDate}`}
              className="result-table-row"
              onClick={() =>
                navigate(
                  `/result/detailKR?strategy=${encodeURIComponent(
                    r.strategyName
                  )}&date=${r.signalDate}`
                )
              }
            >
              <div className="result-col-strategy">
                {strategyLabelMap[r.strategyName] ?? r.strategyName}
              </div>
              <div>{r.signalDate}</div>
              <div>{r.totalData}</div>
            </div>
          ))}

          {pageInfo && (
            <div className="result-pagination">
              {pageInfo.prev && (
                <button
                  className="page-link"
                  onClick={() => movePage(pageInfo.start - 1)}
                >
                  Previous
                </button>
              )}

              {Array.from(
                { length: pageInfo.end - pageInfo.start + 1 },
                (_, i) => pageInfo.start + i
              ).map(p => (
                <button
                  key={p}
                  className={`page-link ${pageInfo.page === p ? "active" : ""}`}
                  onClick={() => movePage(p)}
                >
                  {p}
                </button>
              ))}

              {pageInfo.next && (
                <button
                  className="page-link"
                  onClick={() => movePage(pageInfo.end + 1)}
                >
                  Next
                </button>
              )}
            </div>
          )}
        </div>
    </div>
  );
}
