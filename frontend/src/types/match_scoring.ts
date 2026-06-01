export interface Team {
  _id: string;
  name: string;
}

export interface Match {
  _id: string;
  matchNumber: number;
  round?: string;
  team1?: Team;
  team2?: Team;
  team1Score?: number;
  team2Score?: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  isGroupStage: boolean;
}

export interface ScorePayload {
  team1Score: number;
  team2Score: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
}