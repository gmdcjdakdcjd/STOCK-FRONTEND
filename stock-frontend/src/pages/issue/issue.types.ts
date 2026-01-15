export type StrategyDetail = {
  resultId: string;
  signalDate: string;      // LocalDate → string
  code: string;
  name: string;
  action: string;
  price: number;
  prevClose: number;
  diff: number;
  volume: number;
  specialValue: number;
  createdAt: string;       // Date → string
};

export type StrategyMap = Record<string, StrategyDetail[]>;
