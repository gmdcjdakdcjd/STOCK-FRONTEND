import { useEffect, useState } from "react";
import type { StrategyMap } from "./issue.types";

export function useIssueData() {
  const [data, setData] = useState<StrategyMap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/issue/api")
      .then(res => {
        if (!res.ok) throw new Error("issue api error");
        return res.json();
      })
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
