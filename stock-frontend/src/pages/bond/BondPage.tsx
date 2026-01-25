import { useBondData } from "./useBondData";
import BondChartCard from "./BondChartCard";

export default function BondPage() {
  const { data, loading } = useBondData();

  if (loading) return <div>로딩중...</div>;
  if (!data) return <div>데이터 없음</div>;

  return (
      <div className="container mt-4 bond-grid">

        {/* ================= 미국 ================= */}
        <BondChartCard
          title="미국 국채 금리"
          primaryColor="rgb(30,58,138)"   // ✅ 대표 색상 (2Y)
          series={{
            us2y: {
              label: "미국 2년물",
              color: "rgb(30,58,138)",
              data: data.us2y
            },
            us5y: {
              label: "미국 5년물",
              color: "rgb(59,130,246)",
              data: data.us5y
            },
            us10y: {
              label: "미국 10년물",
              color: "rgb(96,165,250)",
              data: data.us10y
            },
            us30y: {
              label: "미국 30년물",
              color: "rgb(147,197,253)",
              data: data.us30y
            }
          }}
        />

        {/* ================= 한국 ================= */}
        <BondChartCard
          title="한국 국채 금리"
          primaryColor="rgb(13,148,136)"  // ✅ 대표 색상 (3Y)
          series={{
            kr3y: {
              label: "한국 3년물",
              color: "rgb(13,148,136)",
              data: data.kr3y
            },
            kr5y: {
              label: "한국 5년물",
              color: "rgb(20,184,166)",
              data: data.kr5y
            },
            kr10y: {
              label: "한국 10년물",
              color: "rgb(45,212,191)",
              data: data.kr10y
            },
            kr20y: {
              label: "한국 20년물",
              color: "rgb(153,246,228)",
              data: data.kr20y
            }
          }}
        />

        {/* ================= 일본 ================= */}
        <BondChartCard
          title="일본 국채 금리"
          primaryColor="rgb(153,27,27)"   // ✅ 대표 색상 (2Y)
          series={{
            jp2y: {
              label: "일본 2년물",
              color: "rgb(153,27,27)",
              data: data.jp2y
            },
            jp5y: {
              label: "일본 5년물",
              color: "rgb(220,38,38)",
              data: data.jp5y
            },
            jp10y: {
              label: "일본 10년물",
              color: "rgb(248,113,113)",
              data: data.jp10y
            },
            jp30y: {
              label: "일본 30년물",
              color: "rgb(254,202,202)",
              data: data.jp30y
            }
          }}
        />

        {/* ================= 중국 ================= */}
        <BondChartCard
          title="중국 국채 금리"
          primaryColor="rgb(146,64,14)"   // ✅ 대표 색상 (1Y)
          series={{
            cn1y: {
              label: "중국 1년물",
              color: "rgb(146,64,14)",
              data: data.cn1y
            },
            cn3y: {
              label: "중국 3년물",
              color: "rgb(180,83,9)",
              data: data.cn3y
            },
            cn5y: {
              label: "중국 5년물",
              color: "rgb(217,119,6)",
              data: data.cn5y
            },
            cn10y: {
              label: "중국 10년물",
              color: "rgb(251,191,36)",
              data: data.cn10y
            }
          }}
        />

      </div>
  );
}
