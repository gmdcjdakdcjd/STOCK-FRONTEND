import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BasicLayout from "../../layouts/BasicLayout";
import "./result-detail.css";

type DetailRowUS = {
    code: string;
    name: string;
    price: number;
    prevClose: number;
    diff: number;
    volume: number;
    createdAt: string;
};

export default function ResultDetailUSPage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const strategy = params.get("strategy")!;
    const date = params.get("date")!;

    const [captureName, setCaptureName] = useState("");
    const [priceLabel, setPriceLabel] = useState("");
    const [rows, setRows] = useState<DetailRowUS[]>([]);
    const [checked, setChecked] = useState<string[]>([]);
    const [authenticated, setAuthenticated] = useState(false);

    /* =========================
       데이터 조회 (US)
       ========================= */
    useEffect(() => {
        fetch(`/api/result/us/detail?strategy=${strategy}&date=${date}`)
            .then(res => res.json())
            .then(data => {
                setCaptureName(data.captureName);
                setPriceLabel(data.priceLabel);
                setRows(data.detailList);
            });
    }, [strategy, date]);

    /* =========================
       로그인 상태 확인
       ========================= */
    useEffect(() => {
        fetch("/api/auth/me", { credentials: "include" })
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(() => setAuthenticated(true))
            .catch(() => setAuthenticated(false));
    }, []);

    /* =========================
       체크박스
       ========================= */
    const toggleAll = (on: boolean) => {
        setChecked(on ? rows.map(r => r.code) : []);
    };

    const toggleOne = (code: string) => {
        setChecked(prev =>
            prev.includes(code)
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };

    /* =========================
       내 종목 추가
       ========================= */
    const addMyStock = () => {
        if (!authenticated) {
            alert("로그인 후 이용 가능합니다.");
            return;
        }

        if (checked.length === 0) {
            alert("선택된 종목이 없습니다.");
            return;
        }

        const payload = rows
            .filter(r => checked.includes(r.code))
            .map(r => ({
                code: r.code,
                name: r.name,
                strategyName: strategy,
                priceAtAdd: r.price,
                memo: date,
            }));

        fetch("/api/mystock/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        })
            .then(res => {
                if (!res.ok) throw new Error();
                alert("내 종목에 추가되었습니다.");
            })
            .catch(() => alert("로그인 상태를 확인해주세요."));
    };

    return (
        <BasicLayout>
            {/* 🔑 content-inner 기준 안에서만 작업 */}
            <div className="result-detail-page">
                {/* =========================
           Header Card
           ========================= */}
                <div className="detail-header-card">
                    <div className="detail-header-left">
                        <h4>{captureName}</h4>
                        <div className="detail-header-sub">
                            포착일 · {date}
                        </div>
                    </div>

                    <div className="detail-header-actions">
                        {authenticated ? (
                            <>
                                <button
                                    className="btn-outline-pill"
                                    onClick={() => navigate("/stock/myStock")}
                                >
                                    ⭐ 내 종목 보러가기
                                </button>

                                <button
                                    className="btn-primary-pill"
                                    onClick={addMyStock}
                                >
                                    📌 선택 종목 추가
                                </button>
                            </>
                        ) : (
                            <button
                                className="btn-outline-pill"
                                onClick={() => navigate("/login")}
                            >
                                로그인 필요
                            </button>
                        )}
                    </div>
                </div>

                {/* =========================
           Table
           ========================= */}
                <div className="result-card">
                    <div className="result-card-header">
                        포착 종목 목록
                    </div>

                    <table className="detail-table align-table">
                        <colgroup>
                            <col style={{ width: "48px" }} />   {/* 체크 */}
                            <col style={{ width: "120px" }} />  {/* 종목코드 */}
                            <col />                             {/* 종목명 (flex) */}
                            <col style={{ width: "120px" }} />
                            <col style={{ width: "120px" }} />
                            <col style={{ width: "100px" }} />
                            <col style={{ width: "140px" }} />
                        </colgroup>


                        <thead>
                            <tr>
                                <th className="col-check">
                                    {authenticated && (
                                        <input
                                            type="checkbox"
                                            checked={
                                                checked.length === rows.length &&
                                                rows.length > 0
                                            }
                                            onChange={e =>
                                                toggleAll(e.target.checked)
                                            }
                                        />
                                    )}
                                </th>
                                <th className="col-code">종목코드</th>
                                <th className="col-name">종목명</th>
                                <th className="col-num">현재가</th>
                                <th className="col-num">{priceLabel}</th>
                                <th className="col-num">등락률</th>
                                <th className="col-num">거래량</th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map(r => (
                                <tr key={r.code}>
                                    <td className="col-check">
                                        {authenticated && (
                                            <input
                                                type="checkbox"
                                                checked={checked.includes(r.code)}
                                                onChange={() => toggleOne(r.code)}
                                            />
                                        )}
                                    </td>

                                    <td className="col-code">{r.code}</td>
                                    <td className="col-name">{r.name}</td>

                                    <td className="col-num">
                                        {r.price.toLocaleString()} $
                                    </td>

                                    <td className="col-num">
                                        {r.prevClose.toLocaleString()} $
                                    </td>

                                    <td
                                        className="col-num"
                                        style={{
                                            color:
                                                r.diff > 0
                                                    ? "#dc2626"
                                                    : r.diff < 0
                                                        ? "#2563eb"
                                                        : "#6b7280",
                                        }}
                                    >
                                        {r.diff}%
                                    </td>

                                    <td className="col-num">
                                        {r.volume.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </BasicLayout>
    );
}
