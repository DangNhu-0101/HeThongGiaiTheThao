export interface TeamStanding {
  id: string;
  rank: number;
  teamName: string;
  logo: string;
  played: number;
  won: number; // UI alias cho BE wins
  drawn: number; // UI alias cho BE draws
  lost: number; // UI alias cho BE losses
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  tournamentId?: string;
  tournamentItemId?: string;
  teamOrPlayerId?: string;
  participantType?: "team" | "player";
  bracketid?: string;
  stageId?: string;
  groupId?: string;
  customStats?: Record<string, unknown>;
  status: "advance" | "playoff" | "eliminated" | "neutral";
}

export interface GroupStanding {
  groupId: string;
  groupName: string;
  teams: TeamStanding[];
}

export interface TopPerformer {
  id: string;
  rank: number;
  playerName: string;
  avatar: string;
  teamName: string;
  teamLogo: string;
  score: number;
}
