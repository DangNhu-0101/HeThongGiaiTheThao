// d:\ANhu\Study\Additional\PTSC_chung\webpickleball\HeThongGiaiTheThao\frontend\src\types\automator.ts
export interface QualifiedTeam {
  _id: string;
  name: string;
  logo?: string;
  rank?: number;
  groupId?: string;
  branch?: string;
}

export interface Match {
  _id: string;
  matchNumber: number;
  round?: string | number;
  roundName?: string;
  matchName?: string;
  teamA?: QualifiedTeam;
  teamB?: QualifiedTeam;
  team1Name?: string;
  team2Name?: string;
  team1SlotCode?: string;
  team2SlotCode?: string;
  slotCode?: string;
  winnerTarget?: string;
  loserTarget?: string;
  nextMatchNumber?: number;
  nextMatchSide?: number;
  scheduledStartTime?: string;
  courtName?: string;
  status: string;
  scoreA?: number;
  scoreB?: number;
  matchType?: 'group' | 'knockout';
}

export interface Group {
  _id: string;
  name: string;
  teams: QualifiedTeam[];
  matches: Match[];
  standings?: Array<{
    teamId: string | QualifiedTeam;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  }>;
}

export interface StageRule {
  _id: string;
  stageRuleId?: string;
  ruleName: string;
  sport: string;
  stageName?: string;
  source?: 'baseRule' | 'stageRule';
  matchDuration?: number;
}
