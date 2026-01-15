import { useEffect, useState } from "react";
import {
  fetchKodexSummary,
  fetchKodexHoldings
} from "../../api/kodexApi";

import type {
  KodexEtfSummary,
  KodexEtfHolding
} from "../../api/kodexApi";

import BasicLayout from "../../layouts/BasicLayout";
import KodexHoldingsModal from "./KodexHoldingsModal";
import "./kodex-summary.css";

function KodexSummaryPage() {
  // ===== State =====
  const [list, setList] = useState<KodexEtfSummary[]>([]);
  const [q, setQ] = useState("");
  const [searchQ, setSearchQ] = useState("");

  const [selectedEtf, setSelectedEtf] = useState<KodexEtfSummary | null>(null);
  const [holdings, setHoldings] = useState<KodexEtfHolding[]>([]);

  const [listLoading, setListLoading] = useState(false);
  const [holdingsLoading, setHoldingsLoading] = useState(false);

  // ===== 요약 조회 =====
  useEffect(() => {
    setListLoading(true);

    fetchKodexSummary(searchQ || undefined)
      .then(setList)
      .finally(() => setListLoading(false));
  }, [searchQ]);

  // ===== 구성 종목 조회 =====
  useEffect(() => {
    if (!selectedEtf) return;

    setHoldingsLoading(true);
    setHoldings([]);

    fetchKodexHoldings(selectedEtf.etfId)
      .then(setHoldings)
      .finally(() => setHoldingsLoading(false));
  }, [selectedEtf]);

  return (
    <BasicLayout>
      <section className="kodex-summary">
        <h2>KODEX ETF 목록</h2>

        {/* ===== Search ===== */}
        <div className="nps-search">
          <div className="nps-search-row">

            {/* input + 내부 ✕ */}
            <div className="nps-search-input-wrap">
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    setSearchQ(q);
                  }
                }}
                placeholder="ETF 이름 검색"
              />

              {q && (
                <button
                  type="button"
                  className="nps-reset-inside"
                  onClick={() => {
                    setQ("");
                    setSearchQ("");
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* 검색 버튼 */}
            <button
              className="nps-search-btn"
              onClick={() => setSearchQ(q)}
            >
              검색
            </button>

          </div>
        </div>



        {/* ===== 요약 리스트 (테이블형 바) ===== */}
        <div className="kodex-table">

          {/* 헤더 */}
          <div className="kodex-table-header">
            <span>ETF 명</span>
            <span className="count-col">구성 종목 수</span>
            <span></span>
          </div>


          {listLoading && (
            <div className="loading">로딩중...</div>
          )}

          {!listLoading && list.length === 0 && (
            <div className="empty">검색 결과가 없습니다.</div>
          )}

          {!listLoading && list.map(etf => (
            <div
              key={etf.etfId}
              className="kodex-table-row"
            >
              <div className="etf-name">
                {etf.etfName}
                {etf.irpYn && (
                  <span className="irp-badge">{etf.irpYn}</span>
                )}
              </div>

              <div className="count-col">
                {etf.totalCnt?.toLocaleString()}
              </div>

              <button
                className="view-link"
                onClick={() => setSelectedEtf(etf)}
              >
                구성 종목 보기 →
              </button>
            </div>
          ))}

        </div>

        {/* ===== 모달 유지 ===== */}
        {selectedEtf && (
          <KodexHoldingsModal
            etfName={selectedEtf.etfName}
            holdings={holdings}
            loading={holdingsLoading}
            onClose={() => setSelectedEtf(null)}
          />
        )}

      </section>
    </BasicLayout>
  );
}

export default KodexSummaryPage;
