export type BondPoint = {
  date: string;   // yyyy-MM-dd
  close: number;  // 금리
};

export type BondResponse = {
  us2y: BondPoint[];
  us5y: BondPoint[];
  us10y: BondPoint[];
  us30y: BondPoint[];

  kr3y: BondPoint[];
  kr5y: BondPoint[];
  kr10y: BondPoint[];
  kr20y: BondPoint[];

  jp2y: BondPoint[];
  jp5y: BondPoint[];
  jp10y: BondPoint[];
  jp30y: BondPoint[];

  cn1y: BondPoint[];
  cn3y: BondPoint[];
  cn5y: BondPoint[];
  cn10y: BondPoint[];
};
