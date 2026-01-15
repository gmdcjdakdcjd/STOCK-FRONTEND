import { useEffect, useState } from "react";
import { fetchBondData } from "../../api/bondApi";
import type { BondResponse } from "./bond.types";

export function useBondData() {
  const [data, setData] = useState<BondResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBondData()
      .then((res) => {
        setData(res);
      })
      .catch(() => {
        setError("채권 데이터를 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
