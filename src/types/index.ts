export interface Market {
  id: number;
  question: string;
  endTime: number;
  totalYesBets: string;
  totalNoBets: string;
  resolved: boolean;
  outcome: boolean;
  creator: string;
}

export interface Bet {
  marketId: number;
  amount: string;
  prediction: boolean;
  claimed: boolean;
}

export interface ContractAddresses {
  predictionMarket: string;
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
}

export interface AppState {
  wallet: WalletState;
  markets: Market[];
  userBets: Bet[];
  loading: boolean;
  error: string | null;
}