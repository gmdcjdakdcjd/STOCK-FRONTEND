export type StrategyDetail = {
  resultId: string;
  signalDate: string;   // LocalDate → string (yyyy-MM-dd)
  code: string;
  name: string;
  action: string;

  price: number;
  prevClose: number;
  diff: number;

  volume: number;
  specialValue: number | null;
  createdAt: string;    // Date → ISO string
};

export type IssueResponse = Record<string, StrategyDetail[]>;

export async function fetchIssue(): Promise<IssueResponse> {
  const res = await fetch("/api/issue");
  if (!res.ok) throw new Error("issue api error");
  return res.json();
}
