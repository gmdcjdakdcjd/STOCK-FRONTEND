export interface MyEtfSummaryDTO {
  etfName: string;
  etfDescription: string;
  itemCount: number;
  investedAmount: number;
  evaluatedAmount: number;
  profitRate: number;
}

export interface MyEtfCreateRequestDTO {
  etfName: string;
  etfDescription: string;
  items: {
    code: string;
    name: string;
    quantity: number;
    memo?: string;
  }[];
}

export interface MyEtfDetailSummaryDTO {
  totalInvested: number;
  totalEvaluated: number;
  profitAmount: number;
  profitRate: number;
}

export interface MyEtfItemViewDTO {
  id: number;
  code: string;
  name: string;
  quantity: number;
  priceAtAdd: number;
  currentPrice: number;
  evaluatedAmount: number;
  profitRate: number;
  priceAtAddDisplay: string;
  currentPriceDisplay: string;
  evaluatedAmountDisplay: string;
  profitRateDisplay: string;
  addedDate: string;
  memo?: string;
}

export interface MyEtfDetailResponseDTO {
  etfName: string;
  etfDescription: string;
  summary: MyEtfDetailSummaryDTO;
  itemList: MyEtfItemViewDTO[];
}

export interface PageResponseDTO<T> {
  dtoList: T[];
  page: number;
  size: number;
  total: number;
  start: number;
  end: number;
  prev: boolean;
  next: boolean;
}
