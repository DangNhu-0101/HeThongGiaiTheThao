export interface IBranch {
  id: string; name: string; numberOfGroups: number; playersPerGroup: number; selectedRanks: number[]; sourceType?: string; sourceRanks?: number[];
}
export interface IStage {
  id: string; parentId: string | null; stageNumber: number; stageName: string; type: 'GROUP_STAGE' | 'KNOCKOUT';
  branchName: string; hasBranches: boolean; branches: IBranch[];
  hasWildcards: boolean; wildcardsCount: number; wildcardCriteria: string[]; wildcardPriorityOrder: string[];
  winPoints: number; lossPoints: number; rankingCriteria: string[]; rankingPriorityOrder: string[];
  matchFormat: string; touchPoint: number; winByGap: number; maxPoints: number | null; changeSideAt: number; matchDuration: number;
  substages?: IStage[]; knockoutRound?: string; hasBronzeMatch: boolean; totalTeamsIn: number;
}