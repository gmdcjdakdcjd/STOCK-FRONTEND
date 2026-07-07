import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchTigerSummary,
  fetchTigerHoldings
} from "../../api/tigerApi";

import type {
  TigerEtfSummary,
  TigerEtfHolding
} from "../../api/tigerApi";

import TigerHoldingsModal from "./TigerHoldingsModal";
import "./tiger-summary.css";

function TigerSummaryPage() {
  const navigate = useNavigate();
  // ===== State =====
  const [list, setList] = useState<TigerEtfSummary[]>([]);
  const [q, setQ] = useState("");
  const [searchQ, setSearchQ] = useState("");

  const [selectedEtf, setSelectedEtf] = useState<TigerEtfSummary | null>(null);
  const [holdings, setHoldings] = useState<TigerEtfHolding[]>([]);

  const [listLoading, setListLoading] = useState(false);
  const [holdingsLoading, setHoldingsLoading] = useState(false);

  // ===== 요약 조회 =====
  useEffect(() => {
    setListLoading(true);

    fetchTigerSummary(searchQ || undefined)
      .then(setList)
      .finally(() => setListLoading(false));
  }, [searchQ]);

  // ===== 구성 종목 조회 =====
  useEffect(() => {
    if (!selectedEtf) return;

    setHoldingsLoading(true);
    setHoldings([]);

    fetchTigerHoldings(selectedEtf.etfId)
      .then(setHoldings)
      .finally(() => setHoldingsLoading(false));
  }, [selectedEtf]);

  return (
    <section className="tiger-summary">

      {/* ===== 제목 + 탭(붙어있게) + 검색(오른쪽 끝) 한 줄 배치 ===== */}
      <div style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "20px"
      }}>

        {/* 왼쪽 그룹: 제목(고정 너비) + 탭 스위처 */}
        <h2 style={{ margin: 0, marginRight: "16px", width: "200px", flexShrink: 0 }}>TIGER ETF 목록</h2>

        <div style={{
          display: "inline-flex",
          background: "#f1f5f9",
          borderRadius: "50px",
          padding: "5px",
          gap: "4px",
          boxShadow: "inset 0 1px 4px rgba(0,0,0,0.08)"
        }}>
          {/* KODEX - 비활성 */}
          <button
            type="button"
            onClick={() => navigate("/kodex/summary")}
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
              e.currentTarget.style.background = "rgba(245,158,11,0.1)";
              e.currentTarget.style.color = "#d97706";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            KODEX
          </button>
          {/* TIGER - 활성 (주황 그라디언트) */}
          <button
            type="button"
            style={{
              padding: "9px 28px",
              fontWeight: "700",
              fontSize: "0.88rem",
              borderRadius: "50px",
              border: "none",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#ffffff",
              cursor: "default",
              boxShadow: "0 2px 10px rgba(245,158,11,0.45)",
              letterSpacing: "0.03em",
              transition: "all 0.2s ease"
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
              {/* 주황 테마 검색 버튼 */}
              <button
                className="nps-search-btn"
                onClick={() => setSearchQ(q)}
                style={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  boxShadow: "0 2px 8px rgba(245,158,11,0.4)"
                }}
              >
                검색
              </button>
            </div>
          </div>
        </div>

      </div>



      {/* ===== 요약 리스트 (테이블형 바) ===== */}
      <div className="tiger-table">

        {/* 헤더 */}
        <div className="tiger-table-header">
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
            className="tiger-table-row"
          >
            <div className="etf-name">
              {etf.etfName}
            </div>

            <div className="count-col">
              {etf.totalCnt?.toLocaleString()}
            </div>

            {/* 주황 테마 구성 종목 보기 버튼 */}
            <button
              className="view-link"
              onClick={() => setSelectedEtf(etf)}
              style={{ color: "#d97706" }}
            >
              구성 종목 보기 →
            </button>
          </div>
        ))}

      </div>

      {/* ===== 모달 ===== */}
      {selectedEtf && (
        <TigerHoldingsModal
          etfId={selectedEtf.etfId}
          etfName={selectedEtf.etfName}
          holdings={holdings}
          loading={holdingsLoading}
          onClose={() => setSelectedEtf(null)}
        />
      )}

    </section>
  );
}

export default TigerSummaryPage;
