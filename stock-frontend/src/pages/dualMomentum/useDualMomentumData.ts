import { useEffect, useState } from "react";
import type { StrategyMap } from "./dualMomentum.types";

export function useDualMomentumData() {
  const [data, setData] = useState<StrategyMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dual-momentum");

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const json: StrategyMap = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}
