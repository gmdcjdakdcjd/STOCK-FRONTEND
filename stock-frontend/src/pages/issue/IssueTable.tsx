import type { StrategyDetail } from "./issue.types";
import "./issue.css";

type Props = {
    title: string;
    list: StrategyDetail[];
    market: "KR" | "US";
};

export default function IssueTable({ title, list, market }: Props) {
    return (
        <div className="dashboard-card">
            <h5 className="text-primary">{title}</h5>

            <div className="content-box">
                <table>
                    <thead>
                        <tr>
                            <th className="col-code">종목</th>
                            <th className="col-price">가격</th>
                            <th className="col-prev">전일</th>
                            <th className="col-diff">변동</th>
                            <th className="col-volume">거래량</th>
                            <th className="col-date">날짜</th>
                        </tr>
                    </thead>

                    <tbody>
                        {list.map(row => (
                            <tr key={`${row.resultId}_${row.code}_${row.signalDate}`}>
                                <td className="col-code">
                                    {row.code} {row.name}
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
                                    className={`col-diff ${row.diff > 0 ? "up" : row.diff < 0 ? "down" : ""
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
        </div>
    );
}
