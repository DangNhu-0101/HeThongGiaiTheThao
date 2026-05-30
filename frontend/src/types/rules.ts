// src/types/rules.ts

export interface IBranch {
  id: string;
  name: string;
  numberOfGroups: number;
  playersPerGroup: number;
  selectedRanks: number[];
}

export interface IStage {
  id: string;
  parentId: string | null;
  stageNumber: number;
  stageName: string;
  type: 'GROUP_STAGE' | 'KNOCKOUT' | string;
  branchName: string;
  hasBranches: boolean;
  branches: IBranch[];
  hasWildcards: boolean;
  wildcardsCount: number;
  wildcardCriteria: string[];
  wildcardPriorityOrder: string[];
  winPoints: number;
  lossPoints: number;
  rankingCriteria: string[];
  rankingPriorityOrder: string[];
  matchFormat: '1_SET' | 'BO3' | 'BO5' | string;
  touchPoint: number;
  winByGap: number;
  maxPoints: number | null;
  changeSideAt: number;
  substages: IStage[]; // Đệ quy lồng vô hạn
  knockoutRound: string;
  hasBronzeMatch: boolean;
  totalTeamsIn: number;
}