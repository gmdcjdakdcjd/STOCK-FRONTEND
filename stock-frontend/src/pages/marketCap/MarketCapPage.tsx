import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMarketCap, type MarketCap } from "../../api/marketCapApi";
import "./market-cap.css";

/**
 * 시가총액 순위 페이지
 */
function MarketCapPage() {
    const navigate = useNavigate();

    // ===== State =====
    const [fullList, setFullList] = useState<MarketCap[]>([]);
    const [filteredList, setFilteredList] = useState<MarketCap[]>([]);

    // q: 입력 필드 값, searchQ: 실제 검색에 적용된 값
    const [q, setQ] = useState("");
    const [searchQ, setSearchQ] = useState("");

    const [loading, setLoading] = useState(false);

    // ===== 데이터 초기 로드 =====
    useEffect(() => {
        setLoading(true);
        fetchMarketCap()
            .then((data) => {
                setFullList(data);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    // ===== 검색 필터링 (UX: 검색 버튼 클릭 시에만 필터링) =====
    useEffect(() => {
        if (!searchQ.trim()) {
            setFilteredList(fullList);
            return;
        }
        const lowerQ = searchQ.toLowerCase();
        const filtered = fullList.filter(
            (item) =>
                item.name.toLowerCase().includes(lowerQ) ||
                item.code.toLowerCase().includes(lowerQ)
        );
        setFilteredList(filtered);
    }, [searchQ, fullList]);

    // ===== Event Handlers =====
    const handleSearch = () => {
        setSearchQ(q);
    };

    const handleReset = () => {
        setQ("");
        setSearchQ("");
    };

    return (
        <section className="market-cap-page">
            <div className="page-header-area">
                <h2 className="fw-bold mb-4">국내 증시 시가총액 순위</h2>
            </div>

            {/* ===== 검색 영역 (UX: Kodex와 동일한 구조) ===== */}
            <div className="nps-search">
                <div className="nps-search-row">
                    <div className="nps-search-input-wrap">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSearch();
                            }}
                            placeholder="종목명 또는 코드 검색"
                        />
                        {q && (
                            <button type="button" className="nps-reset-inside" onClick={handleReset}>
                                ✕
                            </button>
                        )}
                    </div>
                    <button className="nps-search-btn" onClick={handleSearch}>
                        검색
                    </button>
                </div>
            </div>

            {/* ===== 리스트 테이블 ===== */}
            <div className="market-cap-table">
                {/* 헤더 */}
                <div className="market-cap-table-header">
                    <span className="rank-col">순위</span>
                    <span>종목명</span>
                    <span className="num-col">현재가</span>
                    <span className="num-col">시가총액</span>
                    <span className="detail-col">상세보기</span>
                </div>

                {loading && <div className="loading">데이터를 불러오는 중입니다...</div>}

                {!loading && filteredList.length === 0 && (
                    <div className="empty">검색 결과가 없습니다.</div>
                )}

                {!loading &&
                    filteredList.map((item) => (
                        <div key={item.code} className="market-cap-table-row">
                            <div className="rank-col">{item.ranking}</div>
                            <div className="stock-name-cell">
                                <span className="stock-name">{item.name}</span>
                                <span className="stock-code">{item.code}</span>
                            </div>
                            <div className="num-col">
                                {item.currentPrice.toLocaleString()}원
                            </div>
                            <div className="num-col mkt-cap-val">
                                {item.marketCap.toLocaleString()}원
                            </div>
                            <div className="detail-col">
                                <button
                                    className="detail-link-btn"
                                    onClick={() =>
                                        navigate(
                                            `/stock/searchStock?code=${encodeURIComponent(
                                                item.code
                                            )}&name=${encodeURIComponent(item.name)}`
                                        )
                                    }
                                >
                                    종목상세
                                </button>
                            </div>
                        </div>
                    ))}
            </div>
        </section>
    );
}

export default MarketCapPage;
