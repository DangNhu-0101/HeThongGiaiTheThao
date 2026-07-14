export interface Match {
  _id?: string;
  id?: string;
  tournamentItemId?: string;
  stageId?: string;
  bracketId?: string;
  groupId?: string;
  name?: string;
  round?: number;
  previousMatches?: Array<{
    matchId?: string;
    position?: "WINNER" | "LOSER";
  }>;
  nextMatchId?: string;
  nextLoserMatchId?: string;
  matchResultId?: string;
  status?: "pending" | "live" | "completed" | "walkover" | string;
  scheduledTime?: Date | string;
  courtId?: string;
  winnerParticipantId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  // FE view-model/mock fields. BE Match hiện chưa lưu trực tiếp team1/team2/score.
  tournamentId?: string;
  stageRuleId?: string;
  matchNumber?: number;
  matchType?: "group" | "knockout";
  sportType?: string;
  ruleId?: string;
  team1?: string;
  team2?: string;
  winnerTeamId?: string;
  team1Score?: number;
  team2Score?: number;
  courtName?: string;
  scheduledStartTime?: Date | string;
  actualStartTime?: Date | string;
  endTime?: Date | string;
  durationMinutes?: number;
  refereeId?: string;
  lineReferees?: string[];
}
