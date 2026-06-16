export type ResultMatchStatus = 'Live' | 'Pending' | 'Completed';

export interface ResultStat {
  id: string;
  label: string;
  value: number;
  iconType: 'total' | 'live' | 'completed' | 'pending' | 'synced';
  color: string;
}

export interface ResultTeam {
  id: string;
  name: string;
  logo: string;
  score: number;
}

export interface ResultMatchRecord {
  id: string;
  tournamentName: string;
  round: string;
  matchCode: string;
  time: string;
  venue: string;
  referee: string;
  teamA: ResultTeam;
  teamB: ResultTeam;
  status: ResultMatchStatus;
  minute?: string; // Ví dụ: "88'" hoặc "Set 2"
}