import type { StageBracketConfig } from "@/types/competitionFormat";
import type { FlowEntrant } from "./flowTypes";

const rankShortLabel = (rank: number) => `${rank}`;

export const selectionRanks = (branch: StageBracketConfig) => {
  if (branch.selection.mode !== "TOP_RANKS") {
    return Array.from({ length: Math.max(1, branch.selection.slots) }, (_, index) => index + 1);
  }
  return branch.selection.ranks.length ? branch.selection.ranks : [1, 2];
};

export const generateRoundRobinRows = (branch: StageBracketConfig) => {
  const groups = branch.groups?.length
    ? branch.groups
    : [{ name: "Bảng A", numberOfTeams: branch.totalTeamsIn }];

  return groups.map((group) => group.name);
};

export const generateRoundRobinEntrants = (
  branch: StageBracketConfig,
  sourceNodeId: string,
): FlowEntrant[] => {
  if (branch.selection.mode === "MANUAL") {
    return Array.from({ length: Math.max(1, branch.selection.slots) }, (_, index) => ({
      id: `${sourceNodeId}:manual:${index + 1}`,
      label: "BTC chọn đội",
      sourceNodeId,
    }));
  }

  const groups = branch.groups?.length
    ? branch.groups
    : [{ name: "Bảng A", numberOfTeams: branch.totalTeamsIn }];
  return groups.flatMap((group) =>
    Array.from({ length: Math.max(1, group.numberOfTeams) }, (_, index) => index + 1).map((rank) => {
      const groupCode = group.name.replace("Bảng ", "").trim() || group.name;
      return {
        id: `${sourceNodeId}:${groupCode}:${rank}`,
        label: `${groupCode}${rankShortLabel(rank)}`,
        sourceNodeId,
        rank,
      };
    }),
  );
};
