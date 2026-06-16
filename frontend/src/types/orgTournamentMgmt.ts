export interface TournamentMgmtStat {
  id: string;
  label: string;
  value: number;
  iconType: 'total' | 'live' | 'open' | 'draft' | 'completed';
  color: string;
}

export interface TournamentRecord {
  id: string;
  name: string;
  season: string;
  format: string;
  sport: string;
  status: 'Live' | 'Registration Open' | 'Draft' | 'Completed';
  registration: {
    current: number;
    max: number;
    statusText: string;
    isOpen: boolean;
  };
  teamsCount: number;
  startDate: string;
  endDate: string;
  revenue: {
    amount: string;
    projectedText: string;
    isUp: boolean;
  };
}