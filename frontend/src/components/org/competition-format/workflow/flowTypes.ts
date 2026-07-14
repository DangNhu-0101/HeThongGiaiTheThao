import type { BracketType, CompetitionStageConfig, StageBracketConfig, StageTeamSelection } from "@/types/competitionFormat";

export interface FlowEntrant {
  id: string;
  label: string;
  sourceNodeId: string;
  rank?: number;
  assignedSlot?: {
    stageId: string;
    branchId?: string;
    nodeId: string;
    globalIndex: number;
  };
}

export interface FlowNodeModel {
  id: string;
  stageId: string;
  branchId?: string;
  kind: "branch" | "match" | "champion";
  title: string;
  subtitle: string;
  type?: BracketType;
  inputTeams: number;
  outputTeams: number;
  rule: StageTeamSelection["mode"];
  x: number;
  y: number;
  width: number;
  height: number;
  stageOrder: number;
  stageName: string;
  laneIndex?: number;
  manualPosition?: { x: number; y: number };
  rows: string[];
  entrants: FlowEntrant[];
  seedSlots: Array<{
    id: string;
    label: string;
    globalIndex?: number;
    sourceLabel?: string;
    locked?: boolean;
  }>;
  matchCode?: string;
  accent: "blue" | "green" | "amber" | "red" | "slate";
}

export interface FlowEdgeModel {
  id: string;
  source: string;
  target: string;
  label?: string;
  targetSlot?: 1 | 2;
  route?: { bendX?: number; bendY?: number };
}

export interface FlowStageColumn {
  id: string;
  title: string;
  order: number;
  x: number;
  width: number;
  height: number;
}

export interface FlowGraph {
  nodes: FlowNodeModel[];
  edges: FlowEdgeModel[];
  columns: FlowStageColumn[];
  width: number;
  height: number;
}

export interface BranchEditorProps {
  branch: StageBracketConfig;
  index: number;
  focused: boolean;
  onFocus: () => void;
  onChange: (patch: Partial<StageBracketConfig>) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export interface StageEditorProps {
  stage: CompetitionStageConfig;
  allStages: CompetitionStageConfig[];
  focusedBranchId?: string;
  onFocusBranch: (branchId: string) => void;
  onChange: (stage: CompetitionStageConfig) => void;
  onDelete: () => void;
  canDelete: boolean;
}
