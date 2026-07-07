import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchKodexSummary,
  fetchKodexHoldings
} from "../../api/kodexApi";

import type {
  KodexEtfSummary,
  KodexEtfHolding
} from "../../api/kodexApi";

import KodexHoldingsModal from "./KodexHoldingsModal";
import "./kodex-summary.css";

function KodexSummaryPage() {
  const navigate = useNavigate();
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
    <section className="kodex-summary">

        {/* ===== 제목 + 탭(붙어있게) + 검색(오른쪽 끝) 한 줄 배치 ===== */}
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "20px"
        }}>

          {/* 왼쪽 그룹: 제목(고정 너비) + 탭 스위처 */}
          <h2 style={{ margin: 0, marginRight: "16px", width: "200px", flexShrink: 0 }}>KODEX ETF 목록</h2>

          <div style={{
            display: "inline-flex",
            background: "#f1f5f9",
            borderRadius: "50px",
            padding: "5px",
            gap: "4px",
            boxShadow: "inset 0 1px 4px rgba(0,0,0,0.08)"
          }}>
            {/* KODEX - 활성 (파랑 그라디언트) */}
            <button
              type="button"
              style={{
                padding: "9px 28px",
                fontWeight: "700",
                fontSize: "0.88rem",
                borderRadius: "50px",
                border: "none",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#ffffff",
                cursor: "default",
                boxShadow: "0 2px 10px rgba(37,99,235,0.45)",
                letterSpacing: "0.03em",
                transition: "all 0.2s ease"
              }}
            >
              KODEX
            </button>
            {/* TIGER - 비활성 */}
            <button
              type="button"
              onClick={() => navigate("/tiger/summary")}
              style={{
                padding: "9px 28px",
                fontWeight: "600",
                fontSize: "0.88rem",
                borderRadius: "50px",
                border: "none",
                background: "transparent",
                color: "#64748b",
                cursor: "pointer",
                letterSpacing: "0.03em",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(37,99,235,0.08)";
                e.currentTarget.style.color = "#2563eb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              TIGER
            </button>
          </div>

          {/* 오른쪽 끝: 검색 */}
          <div style={{ marginLeft: "auto" }}>
            <div className="nps-search" style={{ marginBottom: 0 }}>
              <div className="nps-search-row">
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
                <button
                  className="nps-search-btn"
                  onClick={() => setSearchQ(q)}
                >
                  검색
                </button>
              </div>
            </div>
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

        {/* ===== 모달 ===== */}
        {selectedEtf && (
          <KodexHoldingsModal
            etfName={selectedEtf.etfName}
            holdings={holdings}
            loading={holdingsLoading}
            onClose={() => setSelectedEtf(null)}
          />
        )}

    </section>
  );
}

export default KodexSummaryPage;
