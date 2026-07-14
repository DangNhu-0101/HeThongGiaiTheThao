import type { StageBracketConfig } from "@/types/competitionFormat";
import type { FlowEntrant } from "./flowTypes";

export const generateKnockoutRows = (branch: StageBracketConfig, incoming: FlowEntrant[]) => {
  const teamCount = Math.max(2, branch.totalTeamsIn || incoming.length || 2);
  const firstRoundMatches = Math.ceil(teamCount / 2);
  const rows = Array.from({ length: firstRoundMatches }, (_, index) => {
    const first = incoming[index * 2]?.label || `Seed ${index * 2 + 1}`;
    const second = incoming[index * 2 + 1]?.label || `Seed ${index * 2 + 2}`;
    return `${first} vs ${second}`;
  });

  const roundNames = ["Winner", "Semifinal", "Final"].slice(0, Math.max(1, Math.ceil(Math.log2(teamCount)) - 1));
  return [...rows.slice(0, 6), ...roundNames];
};

export const generateKnockoutEntrants = (
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

  const labelPrefix = branch.selection.mode === "LOSER" ? "Loser" : "Winner";
  return Array.from({ length: Math.max(1, branch.selection.slots) }, (_, index) => ({
    id: `${sourceNodeId}:advance:${index + 1}`,
    label: `${labelPrefix} ${index + 1}`,
    sourceNodeId,
    rank: index + 1,
  }));
};
