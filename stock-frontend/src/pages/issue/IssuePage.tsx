import { useIssueData } from "./useIssueData";
import IssueTable from "./IssueTable";
import "./issue.css";
import { getIssueTitle } from "./issue.utils";

export default function IssuePage() {
  const { data, loading } = useIssueData();

  if (loading) {
    return (
      <div className="container mt-4">로딩중...</div>
    );
  }

  if (!data) {
    return (
      <div className="container mt-4">데이터 없음</div>
    );
  }

  return (
    <div className="container mt-4">
        {/* ================= KR ================= */}
        {/* <h4 className="fw-bold mt-5">🇰🇷 한국 전략</h4> */}

        {Object.entries(data)
          .filter(([key]) => key.endsWith("_KR"))
          .map(([key, list]) => (
            <IssueTable
              key={key}
              title={getIssueTitle(key)}   // ✅ 여기서 한글 매핑 적용
              list={list}
              market="KR"
            />
          ))}

        {/* ================= US ================= */}
        {/* <h4 className="fw-bold mt-5">🇺🇸 미국 전략</h4> */}

        {Object.entries(data)
          .filter(([key]) => key.endsWith("_US"))
          .map(([key, list]) => (
            <IssueTable
              key={key}
              title={getIssueTitle(key)}   // ✅ 동일 적용
              list={list}
              market="US"
            />
          ))}
    </div>
  );
}
