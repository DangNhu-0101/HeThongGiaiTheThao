export interface TeamForm {
  result: 'W' | 'D' | 'L';
  color: string;
}

export interface MatchTeam {
  id: string;
  name: string;
  logo: string;
  country: string;
  group: string;
  form: TeamForm[];
  score: number;
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: 'goal' | 'card-yellow' | 'card-red' | 'substitution' | 'timeout';
  teamId: string;
  title: string;
  description: string;
  isLive?: boolean;
}

export interface MatchInfo {
  venue: string;
  date: string;
  time: string;
  round: string;
  sport: string;
}

export interface KeyPlayer {
  id: string;
  name: string;
  teamId: string;
  minute: number | string;
}

export interface MatchDetailData {
  id: string;
  tournamentName: string;
  status: 'scheduled' | 'live' | 'completed';
  liveMinute: string;
  teamA: MatchTeam;
  teamB: MatchTeam;
  info: MatchInfo;
  events: MatchEvent[];
  keyPlayers: KeyPlayer[]; // Thay cho Goal Scorers
}