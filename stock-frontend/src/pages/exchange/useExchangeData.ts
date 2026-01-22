import { useEffect, useState } from "react";
import {
  fetchIndicators,
  type IndicatorResponse
} from "../../api/exchangeApi";

export function useIndicatorData() {
  const [data, setData] = useState<IndicatorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIndicators()
      .then(res => {
        setData(res);
      })
      .catch(err => {
        console.error(err);
        setError("지표 데이터를 불러오지 못했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return {
    data,
    loading,
    error
  };
}
