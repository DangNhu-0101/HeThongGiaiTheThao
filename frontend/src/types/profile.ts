export interface SportStats {
  category: string;
  level: string;
  position: string;
}

export interface MatchHistory {
  vs: string;
  score: string;
  result: 'Win' | 'Loss';
  date: Date;
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  role: 'player' | 'referee' | 'org';
  sports: SportStats[];
  stats: {
    matches: number;
    wins: number;
  };
  recentMatches: MatchHistory[];
}