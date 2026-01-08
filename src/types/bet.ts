export type BetResult = 'GREEN' | 'RED' | 'CASHOUT' | 'DEVOLVIDA' | 'PENDING' | 'GREEN_HALF' | 'RED_HALF';
export type BetTiming = 'PRÉ' | 'LIVE';
export type BetModality = 'FUTEBOL' | 'MMA' | 'BASQUETE' | 'TÊNIS' | 'ESPORTS' | 'OUTRO';

export interface Bet {
  id: string;
  createdAt: Date;
  eventDate: Date;
  modality: BetModality;
  match: string;
  market: string;
  entry: string;
  odd: number;
  stake: number;
  result: BetResult;
  profitLoss: number;
  timing: BetTiming;
  bookmaker: string;
}

export interface MonthlyStats {
  month: string;
  entries: number;
  wins: number;
  losses: number;
  cashouts: number;
  returned: number;
  avgOdd: number;
  avgStake: number;
  totalStaked: number;
  pnl: number;
  roi: number;
  bankroll: number;
}

export interface DashboardStats {
  initialBankroll: number;
  currentBankroll: number;
  growth: number;
  roi: number;
  totalEntries: number;
  wins: number;
  losses: number;
  winRate: number;
  avgOdd: number;
  avgStake: number;
}
