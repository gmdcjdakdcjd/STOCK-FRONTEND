import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { StrategyDetail } from "./issue.types";
import { fetchKodexSummary, fetchKodexHoldings, type KodexEtfHolding } from "../../api/kodexApi";
import KodexHoldingsModal from "../kodex/KodexHoldingsModal";
import "./issue.css";

type Props = {
  title: string;
  list: StrategyDetail[];
  market: "KR" | "US";
};

export default function IssueTable({ title, list, market }: Props) {
  const navigate = useNavigate();
  const isEtf = title.includes("ETF");
  const isKrEtf = isEtf && market === "KR";

  // ===== Modal State =====
  const [showModal, setShowModal] = useState(false);
  const [modalEtfName, setModalEtfName] = useState("");
  const [holdings, setHoldings] = useState<KodexEtfHolding[]>([]);
  const [loading, setLoading] = useState(false);

  const handleOpenModal = async (row: StrategyDetail) => {
    setModalEtfName(row.name);
    setShowModal(true);
    setLoading(true);
    try {
      // 1. 이름으로 먼저 ETF 정보를 검색하여 정확한 etfId를 찾습니다.
      const summaries = await fetchKodexSummary(row.name);
      // 정확히 일치하는 이름을 먼저 찾고, 없으면 첫 번째 검색 결과 사용
      const targetEtf = summaries.find(e => e.etfName === row.name) || summaries[0];

      if (targetEtf) {
        // 2. 검색된 ETF의 고유 ID(etfId)를 사용하여 구성 종목을 가져옵니다.
        const data = await fetchKodexHoldings(targetEtf.etfId);
        setHoldings(data);
      } else {
        setHoldings([]);
      }
    } catch (err) {
      console.error(err);
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card">
      <h5 className="text-primary">{title}</h5>

      <div className="content-box">
        <table>
          <colgroup>
            <col style={{ width: "28%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
          </colgroup>

          <thead>
            <tr>
              <th className="col-code">종목</th>
              <th className="col-detail"></th>
              <th className="col-price">가격</th>
              <th className="col-prev">전일</th>
              <th className="col-diff">변동</th>
              <th className="col-volume">거래량</th>
              <th className="col-date">날짜</th>
            </tr>
          </thead>

          <tbody>
            {list.map(row => (
              <tr
                key={`${row.resultId}_${row.code}_${row.signalDate}`}
              >
                <td className="col-code">
                  {row.code} {row.name}
                </td>

                <td className="col-detail">
                  {!isEtf && (
                    <button
                      className="detail-link-btn"
                      onClick={() =>
                        navigate(
                          `/stock/searchStock?code=${encodeURIComponent(
                            row.code
                          )}&name=${encodeURIComponent(row.name)}`
                        )
                      }
                    >
                      종목상세
                    </button>
                  )}
                  {isKrEtf && (
                    <button
                      className="detail-link-btn"
                      onClick={() => handleOpenModal(row)}
                    >
                      ETF 종목보기
                    </button>
                  )}
                </td>


                <td className="col-price">
                  {row.price?.toLocaleString()}
                  {market === "KR" ? " 원" : " $"}
                </td>

                <td className="col-prev">
                  {row.prevClose?.toLocaleString()}
                  {market === "KR" ? " 원" : " $"}
                </td>

                <td
                  className={`col-diff ${row.diff > 0
                    ? "up"
                    : row.diff < 0
                      ? "down"
                      : ""
                    }`}
                >
                  {row.diff}%
                </td>

                <td className="col-volume">
                  {row.volume?.toLocaleString()}
                </td>

                <td className="col-date">
                  {row.signalDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <KodexHoldingsModal
          etfName={modalEtfName}
          holdings={holdings}
          loading={loading}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
