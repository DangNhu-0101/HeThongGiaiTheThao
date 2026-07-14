export type StageSourceType = "REGISTRATION" | "PREVIOUS_STAGE";
export type CompetitionMethodCode =
  | "ROUND_ROBIN"
  | "DOUBLE_ROUND_ROBIN"
  | "SINGLE_ELIMINATION"
  | "DOUBLE_ELIMINATION"
  | "SWISS"
  | "RANKING"
  | "MANUAL_MATCHUP";

export type TeamSelectionMode = "WINNER" | "LOSER" | "TOP_RANKS" | "MANUAL";
export type BracketType = "group" | "knockout" | "swiss" | "custom";
export type RankingCriterion = "points" | "pointDiff" | "headToHead" | "draw";

export interface StageTeamSelection {
  mode: TeamSelectionMode;
  slots: number;
  ranks: number[];
  manualTeamIds: string[];
}

export interface StageInputConfig {
  teams: number;
  groups?: number;
  teamsPerGroup?: number;
  sourceStageId?: string;
  selection: StageTeamSelection;
}

export interface StageBracketConfig {
  id: string;
  name: string;
  type: BracketType;
  totalTeamsIn: number;
  groups?: Array<{ name: string; numberOfTeams: number }>;
  groupIds: string[];
  selection: StageTeamSelection;
  flowSlots?: Array<{
    id: string;
    label: string;
    sourceLabel?: string;
    sourceStageId?: string;
    sourceGroupName?: string;
    sourceRank?: number;
  }>;
  flowNodePositions?: Record<string, { x: number; y: number }>;
  flowConnections?: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
  flowConnectionRoutes?: Record<string, { bendX?: number; bendY?: number }>;
  flowDeletedMatchIds?: string[];
  flowStandaloneMatches?: Array<{
    id: string;
    matchCode: string;
    x?: number;
    y?: number;
    seedSlots?: Array<{
      id: string;
      label: string;
      sourceLabel?: string;
    }>;
  }>;
}

export interface StageSeedAssignment {
  slotId: string;
  participantId: string;
  participantName: string;
  participantLogo?: string;
  sourceType: "PARTICIPANT";
  stageId: string;
  branchId?: string;
  nodeId?: string;
  groupName?: string;
  slotLabel?: string;
}

export interface StageWildcardConfig {
  enabled: boolean;
  selection: StageTeamSelection;
}

export interface StageScoringConfig {
  targetScore: number;
  changeSideAt: number;
  setsToWin?: number;
  winBy?: number;
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
}

export interface CompetitionStageConfig {
  id: string;
  order: number;
  name: string;
  sourceType: StageSourceType;
  sourceStageIds: string[];
  input: StageInputConfig;
  brackets: StageBracketConfig[];
  wildcard: StageWildcardConfig;
  scoring: StageScoringConfig;
  rankingCriteria?: RankingCriterion[];
  luckyCriteria?: RankingCriterion[];
  seedAssignments?: StageSeedAssignment[];
  note?: string;
}

export interface CompetitionFormatRecord {
  id: string;
  sourceKind?: "categoryRule" | "categoryTemplate" | "local";
  selectedType?: "preset" | "custom";
  presetId?: string;
  presetSource?: string;
  categoryTemplateId?: string;
  tournamentItemId?: string;
  name: string;
  displayName?: string;
  sportType: string;
  description: string;
  playerSlotsPerTeam?: {
    min?: number;
    max?: number;
  };
  status: "actived" | "inactived";
  stageCount: number;
  stages: CompetitionStageConfig[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CompetitionFormatUpsertPayload {
  tournamentItemId?: string;
  selectedType?: "preset" | "custom";
  presetId?: string;
  presetSource?: string;
  name: string;
  sportType: string;
  description: string;
  stageCount: number;
  stages: CompetitionStageConfig[];
}

export interface CompetitionTournamentOption {
  id: string;
  name: string;
  sportType: string;
  parentTournamentName?: string;
  status?: string;
  stageCount?: number;
}
