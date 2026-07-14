export interface ScoreRule {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  sportType?: string;
  points?: {
    win?: number;
    draw?: number;
    loss?: number;
  };
  forfeitRule?: {
    pointsAwarded?: number;
    defaultScoreFor?: number;
    defaultScoreAgainst?: number;
  };
  tieBreak?: {
    isSupported?: boolean;
    method?: string;
    numberOfSets?: number;
    targetScore?: number;
    winByGap?: number;
    changeSideAtPoint?: number;
  };
  rallyScoring?: boolean;
  winByTwo?: boolean;
  customScoring?: string;
  status?: "actived" | "inactived";
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
