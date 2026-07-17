import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { GitBranch, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import RequireTournamentSelection from "@/components/org/RequireTournamentSelection";
import FlowCanvas from "@/components/org/competition-format/workflow/FlowCanvas";
import StageEditor from "@/components/org/competition-format/workflow/StageEditor";
import TeamSeedingBoard from "@/components/org/competition-format/TeamSeedingBoard";
import { competitionFormatService } from "@/services/competitionFormatService";
import { useCompetitionFormatStore } from "@/stores/useCompetitionFormatStore";
import { useOrgContextStore } from "@/stores/useOrgContextStore";
import type {
  CompetitionFormatRecord,
  CompetitionStageConfig,
  CompetitionTournamentOption,
  RankingCriterion,
  StageBracketConfig,
  StageTeamSelection,
} from "@/types/competitionFormat";

const defaultRankingCriteria: RankingCriterion[] = ["points", "pointDiff", "headToHead", "draw"];
const defaultLuckyCriteria: RankingCriterion[] = ["points", "pointDiff", "draw"];

const wildcardCriteria = (criteria: RankingCriterion[]) => criteria.map((criterion, index) => ({
  type: criterion,
  priority: index + 1,
}));

const createSelection = (
  slots: number,
  mode: StageTeamSelection["mode"] = "WINNER",
): StageTeamSelection => ({
  mode,
  slots,
  ranks: mode === "TOP_RANKS" ? [1, 2] : [],
  manualTeamIds: [],
});

const createGroups = (totalTeams: number, count: number) =>
  Array.from({ length: Math.max(1, count) }, (_, index) => ({
    name: `Bảng ${String.fromCharCode(65 + index)}`,
    numberOfTeams: Math.max(1, Math.ceil(totalTeams / Math.max(1, count))),
  }));

const makeEvenSlotCount = (value: number) => {
  const safe = Math.max(2, Number(value) || 2);
  return safe % 2 === 0 ? safe : safe + 1;
};

const normalizeBranchMatchSlots = (branch: StageBracketConfig): StageBracketConfig => {
  if (branch.type !== "knockout") return branch;
  const totalTeamsIn = makeEvenSlotCount(branch.totalTeamsIn);
  return {
    ...branch,
    totalTeamsIn,
    flowSlots: branch.flowSlots?.length
      ? Array.from({ length: totalTeamsIn }, (_, index) => branch.flowSlots?.[index] || {
        id: `${branch.id}-slot-${index + 1}`,
        label: `Slot ${index + 1}`,
      })
      : branch.flowSlots,
    flowStandaloneMatches: branch.flowStandaloneMatches?.map((match) => ({
      ...match,
      seedSlots: Array.from({ length: 2 }, (_, index) => match.seedSlots?.[index] || {
        id: `${match.id}:slot-${index + 1}`,
        label: `Slot ${index + 1}`,
      }),
    })),
    selection: {
      ...branch.selection,
      slots: Math.max(1, branch.selection?.slots || Math.ceil(totalTeamsIn / 2)),
    },
  };
};

const isLuckyLabel = (value?: string) => /^Lucky\d+$/i.test(String(value || "").trim());

const splitEvenSlotCounts = (totalSlots: number, partCount: number, preferredCounts: number[] = []) => {
  const count = Math.max(1, partCount);
  const safeTotal = Math.max(0, Math.trunc(Number(totalSlots) || 0));
  if (safeTotal <= 0) return Array.from({ length: count }, () => 0);
  const preferredTotal = preferredCounts.reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
  if (preferredTotal === totalSlots && preferredCounts.length >= count) {
    return preferredCounts.slice(0, count).map((value) => value > 0 ? makeEvenSlotCount(value) : 0);
  }
  const activeCount = Math.min(count, Math.max(1, Math.floor(makeEvenSlotCount(safeTotal) / 2)));
  let remaining = makeEvenSlotCount(safeTotal);
  return Array.from({ length: count }, (_, index) => {
    if (index >= activeCount) return 0;
    if (index === activeCount - 1) return Math.max(0, remaining);
    const remainingParts = activeCount - index;
    const minForRest = (remainingParts - 1) * 2;
    const balancedShare = Math.ceil((remaining / remainingParts) / 2) * 2;
    const share = Math.max(2, Math.min(balancedShare, remaining - minForRest));
    remaining = Math.max(0, remaining - share);
    return share;
  });
};

const reviveWildcardAddedMatches = (
  stageId: string,
  branch: StageBracketConfig,
  baseSlotCount: number,
  totalTeamsIn: number,
) => {
  const previousDefaultMatchCount = Math.max(1, Math.ceil(makeEvenSlotCount(baseSlotCount) / 2));
  const nextDefaultMatchCount = Math.max(1, Math.ceil(makeEvenSlotCount(totalTeamsIn) / 2));
  if (nextDefaultMatchCount <= previousDefaultMatchCount) return branch.flowDeletedMatchIds || [];

  const revivedIds = new Set(
    Array.from(
      { length: nextDefaultMatchCount - previousDefaultMatchCount },
      (_, index) => `${stageId}:${branch.id}:m-${previousDefaultMatchCount + index + 1}`,
    ),
  );
  return (branch.flowDeletedMatchIds || []).filter((id) => !revivedIds.has(id));
};

const syncWildcardSlotsToKnockoutStage = (stage: CompetitionStageConfig): CompetitionStageConfig => {
  const luckySlots = stage.wildcard.enabled ? Math.max(0, Number(stage.wildcard.selection.slots || stage.wildcard.slots || 0)) : 0;
  const knockoutBranches = stage.brackets.filter((branch) => branch.type === "knockout");
  if (!knockoutBranches.length) return stage;
  const luckyCounts = splitEvenSlotCounts(luckySlots, knockoutBranches.length);
  const luckyCountByBranch = new Map(knockoutBranches.map((branch, index) => [branch.id, luckyCounts[index] || 0]));

  let syncedTotalTeamsIn = 0;
  const brackets = stage.brackets.map((branch) => {
    if (branch.type !== "knockout") return branch;
    const branchLuckySlots = luckyCountByBranch.get(branch.id) || 0;
    const existingSlots = branch.flowSlots || [];
    const assignedWildcardCount = existingSlots.filter((slot) => isLuckyLabel(slot.sourceLabel)).length;
    const reservedEmptySlots = existingSlots.filter((slot) => slot.reservedForWildcard && !isLuckyLabel(slot.sourceLabel)).length;
    const wildcardCapacity = Math.max(branchLuckySlots, assignedWildcardCount + reservedEmptySlots);
    const baseSlotCount = makeEvenSlotCount(Math.max(
      2,
      Number(branch.totalTeamsIn || 0) - wildcardCapacity,
      existingSlots.length - assignedWildcardCount - reservedEmptySlots,
    ));
    const totalTeamsIn = makeEvenSlotCount(baseSlotCount + wildcardCapacity);
    syncedTotalTeamsIn += totalTeamsIn;
    let emptyWildcardSlotsToAppend = Math.max(0, branchLuckySlots - assignedWildcardCount - reservedEmptySlots);
    const flowSlots = Array.from({ length: totalTeamsIn }, (_, index) => {
      const existingSlot = existingSlots[index];
      if (existingSlot) {
        return {
          ...existingSlot,
          id: `${branch.id}-slot-${index + 1}`,
          label: `Slot ${index + 1}`,
          reservedForWildcard: isLuckyLabel(existingSlot.sourceLabel) ? true : existingSlot.reservedForWildcard,
        };
      }
      if (emptyWildcardSlotsToAppend > 0) {
        emptyWildcardSlotsToAppend -= 1;
        return {
          id: `${branch.id}-slot-${index + 1}`,
          label: `Slot ${index + 1}`,
          reservedForWildcard: true,
        };
      }
      return {
        id: `${branch.id}-slot-${index + 1}`,
        label: `Slot ${index + 1}`,
      };
    });
    return normalizeBranchMatchSlots({
      ...branch,
      totalTeamsIn,
      flowDeletedMatchIds: reviveWildcardAddedMatches(stage.id, branch, baseSlotCount, totalTeamsIn),
      flowSlots,
      selection: {
        ...branch.selection,
        slots: Math.max(1, Math.ceil(totalTeamsIn / 2)),
      },
    });
  });

  if (!syncedTotalTeamsIn) return { ...stage, brackets };
  return {
    ...stage,
    input: {
      ...stage.input,
      teams: syncedTotalTeamsIn,
      selection: {
        ...stage.input.selection,
        slots: syncedTotalTeamsIn,
      },
    },
    brackets,
  };
};

const defaultMatchCountOfBranch = (branch: StageBracketConfig) => {
  if (branch.type !== "knockout") return Math.max(1, branch.selection?.slots || 1);
  const deletedDefaultMatches = branch.flowDeletedMatchIds?.filter((id) => id.includes(":m-")).length || 0;
  return Math.max(1, Math.ceil(makeEvenSlotCount(branch.totalTeamsIn) / 2) - deletedDefaultMatches + (branch.flowStandaloneMatches?.length || 0));
};

const createBranch = (stageOrder: number, totalStages: number, inputTeams: number): StageBracketConfig => {
  const isFirst = stageOrder === 1;
  const isLast = stageOrder === totalStages;
  const groups = isFirst ? 6 : 0;
  return {
    id: `stage-${stageOrder}-main`,
    name: isFirst ? "Vòng bảng" : isLast ? "Chung kết" : `Nhánh ${stageOrder}`,
    type: isFirst ? "group" : "knockout",
    totalTeamsIn: isFirst ? inputTeams : makeEvenSlotCount(inputTeams),
    groups: isFirst ? createGroups(inputTeams, groups) : [],
    groupIds: [],
    selection: createSelection(isLast ? 1 : Math.max(2, Math.floor(inputTeams / 2)), isFirst ? "TOP_RANKS" : "WINNER"),
  };
};

const createStage = (order: number, totalStages: number): CompetitionStageConfig => {
  const inputTeams = order === 1 ? 24 : Math.max(2, Math.floor(24 / 2 ** (order - 1)));
  const previousId = order === 1 ? "" : `stage-${order - 1}`;
  return {
    id: `stage-${order}`,
    order,
    name: `Chặng ${order}`,
    sourceType: order === 1 ? "REGISTRATION" : "PREVIOUS_STAGE",
    sourceStageIds: previousId ? [previousId] : [],
    input: {
      teams: inputTeams,
      groups: order === 1 ? 6 : 0,
      teamsPerGroup: order === 1 ? 4 : 0,
      sourceStageId: previousId,
      selection: createSelection(inputTeams, order === 1 ? "MANUAL" : "WINNER"),
    },
    brackets: [createBranch(order, totalStages, inputTeams)],
    wildcard: { enabled: false, selection: createSelection(0, "LOSER") },
    scoring: {
      targetScore: order >= totalStages - 1 ? 15 : 11,
      changeSideAt: order >= totalStages - 1 ? 8 : 6,
      setsToWin: 1,
      winBy: 2,
      winPoints: 1,
      drawPoints: 0,
      lossPoints: 0,
    },
    rankingCriteria: defaultRankingCriteria,
    luckyCriteria: defaultLuckyCriteria,
    note: "",
  };
};

const capitalize = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "");

const createDraft = (option?: CompetitionTournamentOption): CompetitionFormatRecord => {
  const stageCount = Math.max(2, option?.stageCount || 2);
  return {
    id: option?.id || "new",
    tournamentItemId: option?.id,
    name: option ? `Thể thức · ${option.name}` : "Thể thức thi đấu",
    sportType: capitalize(option?.sportType || "Pickleball"),
    description: option?.parentTournamentName ? `Cấu hình riêng cho ${option.parentTournamentName}` : "Cấu hình luồng thi đấu",
    status: "actived",
    stageCount,
    stages: Array.from({ length: stageCount }, (_, index) => createStage(index + 1, stageCount)),
  };
};

const createEmptyCustomDraft = (option?: CompetitionTournamentOption, startTeams = 0): CompetitionFormatRecord => ({
  id: option?.id || "new",
  tournamentItemId: option?.id,
  selectedType: "custom",
  presetId: "",
  presetSource: "",
  name: "",
  sportType: option?.sportType ? capitalize(option.sportType) : "",
  description: "",
  status: "actived",
  stageCount: 1,
  stages: [{
    id: "stage-1",
    order: 1,
    name: "Stage 1",
    sourceType: "REGISTRATION",
    sourceStageIds: [],
    input: {
      teams: Math.max(0, startTeams),
      groups: 0,
      teamsPerGroup: 0,
      sourceStageId: "",
      selection: createSelection(Math.max(0, startTeams), "MANUAL"),
    },
    brackets: [],
    wildcard: { enabled: false, selection: createSelection(0, "LOSER") },
    scoring: {
      targetScore: 11,
      changeSideAt: 6,
      setsToWin: 1,
      winBy: 2,
      winPoints: 1,
      drawPoints: 0,
      lossPoints: 0,
    },
    rankingCriteria: defaultRankingCriteria,
    luckyCriteria: defaultLuckyCriteria,
    note: "",
  }],
});

const normalizeTemplateByEligibleTeams = (record: CompetitionFormatRecord, totalTeams: number): CompetitionFormatRecord => {
  if (!totalTeams || totalTeams < 1) return record;
  const stages = record.stages.map((stage, stageIndex) => {
    if (stageIndex !== 0) return stage;
    return {
      ...stage,
      input: { ...stage.input, teams: totalTeams },
      brackets: stage.brackets.map((branch) => {
        if (branch.type !== "group") return { ...branch, totalTeamsIn: totalTeams };
        const existingGroups = branch.groups || [];
        const currentGroupCount = Math.max(1, existingGroups.length || stage.input.groups || 1);
        const teamsPerGroup = Math.max(1, branch.groups?.[0]?.numberOfTeams || stage.input.teamsPerGroup || Math.ceil(totalTeams / currentGroupCount));
        const groupCount = Math.max(1, Math.ceil(totalTeams / teamsPerGroup));
        return {
          ...branch,
          totalTeamsIn: totalTeams,
          groups: createGroups(totalTeams, groupCount),
        };
      }),
    };
  });
  return { ...record, stageCount: stages.length, stages };
};

const groupKeyForIndex = (index: number) => String.fromCharCode(65 + index);

const groupAdvanceLabels = (groupCount: number, ranks: number[] = [1]) => {
  if (groupCount === 2 && ranks.includes(1) && ranks.includes(2)) return ["A1", "B2", "A2", "B1"];
  return ranks.flatMap((rank) => Array.from({ length: groupCount }, (_, index) => `${groupKeyForIndex(index)}${rank}`));
};

const matchIdsForBranch = (stage: CompetitionStageConfig, branch: StageBracketConfig) =>
  branch.type === "knockout" && Number(branch.totalTeamsIn || 0) >= 2
    ? Array.from({ length: Math.max(1, Math.ceil(makeEvenSlotCount(branch.totalTeamsIn) / 2)) }, (_, index) => `${stage.id}:${branch.id}:m-${index + 1}`)
      .filter((id) => !(branch.flowDeletedMatchIds || []).includes(id))
    : [];

const assignMatchCodes = (stages: CompetitionStageConfig[]) => {
  const codes = new Map<string, string>();
  let next = 1;
  stages.forEach((stage) => {
    stage.brackets.forEach((branch) => {
      matchIdsForBranch(stage, branch).forEach((id) => {
        codes.set(id, `M${next}`);
        next += 1;
      });
      (branch.flowStandaloneMatches || []).forEach((match) => {
        codes.set(match.id, match.matchCode || `M${next}`);
        next += 1;
      });
    });
  });
  return codes;
};

const createFlowSlots = (
  branch: StageBracketConfig,
  totalTeamsIn: number,
  labels: string[] = [],
  metadata: Partial<NonNullable<StageBracketConfig["flowSlots"]>[number]>[] = [],
) =>
  Array.from({ length: makeEvenSlotCount(totalTeamsIn) }, (_, index) => ({
    id: `${branch.id}-slot-${index + 1}`,
    label: `Slot ${index + 1}`,
    ...(labels[index] ? { sourceLabel: labels[index] } : {}),
    ...(metadata[index] || {}),
  }));

const groupOutputLabels = (stage: CompetitionStageConfig) => stage.brackets.flatMap((branch) => {
  if (branch.type !== "group") return [];
  const groups = branch.groups || [];
  const ranks = branch.selection.ranks?.length ? branch.selection.ranks : [1];
  return groupAdvanceLabels(groups.length || 1, ranks);
});

const knockoutOutputCount = (stage: CompetitionStageConfig) =>
  stage.brackets.filter((branch) => branch.type === "knockout").reduce((sum, branch) => sum + matchIdsForBranch(stage, branch).length, 0);

const createDerivedKnockoutStage = (previousStage: CompetitionStageConfig, inheritedTeams: number): CompetitionStageConfig => {
  const order = previousStage.order + 1;
  const stageId = `stage-${order}`;
  const previousKnockoutBranches = previousStage.brackets.filter((branch) => branch.type === "knockout");
  const branchCount = inheritedTeams <= 2 ? 1 : Math.max(1, Math.min(previousKnockoutBranches.length || 1, Math.floor(makeEvenSlotCount(inheritedTeams) / 2)));
  const branchInputCounts = splitEvenSlotCounts(inheritedTeams, branchCount).filter((count) => count >= 2);
  return {
    id: stageId,
    order,
    name: inheritedTeams === 2 ? "Chung kết" : `Vòng knockout ${order}`,
    sourceType: "PREVIOUS_STAGE",
    sourceStageIds: [previousStage.id],
    input: {
      teams: inheritedTeams,
      groups: 0,
      teamsPerGroup: 0,
      sourceStageId: previousStage.id,
      selection: createSelection(inheritedTeams, "WINNER"),
    },
    brackets: branchInputCounts.map((branchTeamsIn, index) => {
      const sourceBranch = previousKnockoutBranches[index];
      const branchId = branchCount === 1 ? `${stageId}-main` : `${stageId}-from-${sourceBranch?.id || index + 1}`;
      return {
      id: branchId,
      name: inheritedTeams === 2 ? "Chung kết" : `Nhánh ${order}`,
      type: "knockout",
      totalTeamsIn: branchTeamsIn,
      groups: [],
      groupIds: [],
      selection: createSelection(Math.max(1, Math.ceil(branchTeamsIn / 2)), "WINNER"),
      flowSlots: createFlowSlots({ id: branchId } as StageBracketConfig, branchTeamsIn),
      flowConnections: [],
      flowConnectionRoutes: {},
      };
    }),
    wildcard: { enabled: false, selection: createSelection(0, "LOSER") },
    scoring: previousStage.scoring,
    rankingCriteria: previousStage.rankingCriteria || defaultRankingCriteria,
    luckyCriteria: previousStage.luckyCriteria || defaultLuckyCriteria,
    note: "",
  };
};

void createDerivedKnockoutStage;

const normalizeTemplateByStartTeams = (record: CompetitionFormatRecord, totalTeams: number): CompetitionFormatRecord => {
  if (!totalTeams || totalTeams < 1) return record;
  let previousStage: CompetitionStageConfig | undefined;
  let stages = record.stages.map((stage, stageIndex) => {
    const previousGroupLabels = previousStage ? groupOutputLabels(previousStage) : [];
    const previousKnockoutTeams = previousStage ? knockoutOutputCount(previousStage) : 0;
    const inheritedTeams = stageIndex === 0 ? totalTeams : previousKnockoutTeams || previousGroupLabels.length || stage.input.teams;
    const nextStage: CompetitionStageConfig = {
      ...stage,
      sourceType: stageIndex === 0 ? "REGISTRATION" : "PREVIOUS_STAGE",
      sourceStageIds: stageIndex === 0 || !previousStage ? [] : [previousStage.id],
      input: {
        ...stage.input,
        teams: inheritedTeams,
        sourceStageId: stageIndex === 0 ? "" : previousStage?.id || "",
        selection: { ...stage.input.selection, slots: inheritedTeams },
      },
      brackets: (() => {
        const knockoutBranches = stage.brackets.filter((branch) => branch.type === "knockout");
        const branchInputCounts = splitEvenSlotCounts(
          inheritedTeams,
          Math.max(1, knockoutBranches.length),
          knockoutBranches.map((branch) => Number(branch.totalTeamsIn || 0)),
        );
        let knockoutIndex = 0;
        let groupLabelOffset = 0;
        return stage.brackets.map((branch) => {
        if (branch.type === "group") {
          const existingGroups = branch.groups || [];
          const teamsPerGroup = Math.max(1, existingGroups[0]?.numberOfTeams || stage.input.teamsPerGroup || Math.ceil(totalTeams / Math.max(1, existingGroups.length || stage.input.groups || 1)));
          const groupCount = Math.max(1, Math.ceil(inheritedTeams / teamsPerGroup));
          const groups = createGroups(inheritedTeams, groupCount);
          return {
            ...branch,
            totalTeamsIn: inheritedTeams,
            groups,
            groupIds: groups.map((group) => group.name),
            selection: { ...branch.selection, slots: groups.length * (branch.selection.ranks?.length || 1) },
          };
        }
        if (branch.type !== "knockout") return branch;
        const branchTeamsIn = branchInputCounts[knockoutIndex] || inheritedTeams;
        knockoutIndex += 1;
        const labels = previousGroupLabels.slice(groupLabelOffset, groupLabelOffset + branchTeamsIn);
        groupLabelOffset += branchTeamsIn;
        return {
          ...branch,
          totalTeamsIn: branchTeamsIn,
          selection: { ...branch.selection, slots: Math.max(1, Math.ceil(branchTeamsIn / 2)) },
          flowSlots: previousGroupLabels.length && !previousKnockoutTeams
            ? createFlowSlots(branch, branchTeamsIn, labels, labels.map((label) => ({
              sourceStageId: previousStage?.id,
              sourceGroupName: label.match(/^[A-Z]+/)?.[0],
              sourceRank: Number(label.match(/\d+$/)?.[0] || 0) || undefined,
            })))
            : createFlowSlots(branch, branchTeamsIn),
          flowConnections: previousGroupLabels.length && !previousKnockoutTeams ? [] : branch.flowConnections,
        };
        });
      })(),
    };
    previousStage = nextStage;
    return nextStage;
  });

  const matchCodes = assignMatchCodes(stages);
  stages = stages.map((stage, stageIndex) => {
    if (stageIndex === 0) return stage;
    const previous = stages[stageIndex - 1];
    if (!knockoutOutputCount(previous)) return stage;
    const sourceIds = previous.brackets.flatMap((previousBranch) => matchIdsForBranch(previous, previousBranch));
    let sourceOffset = 0;
    return {
      ...stage,
      brackets: stage.brackets.map((branch) => {
        if (branch.type !== "knockout") return branch;
        const branchSourceCount = Math.min(
          Math.max(0, Number(branch.totalTeamsIn || 0)),
          Math.max(0, sourceIds.length - sourceOffset),
        );
        const branchSourceIds = sourceIds.slice(sourceOffset, sourceOffset + branchSourceCount);
        sourceOffset += branchSourceCount;
        const targetIds = matchIdsForBranch(stage, branch);
        const labels = branchSourceIds.map((id) => matchCodes.get(id) || "");
        return {
          ...branch,
          flowSlots: createFlowSlots(branch, branchSourceIds.length || branch.totalTeamsIn, labels, branchSourceIds.map((id) => ({
            sourceStageId: previous.id,
            sourceMatchId: id,
            sourceResult: "WINNER" as const,
          }))),
          flowConnections: branchSourceIds.map((sourceId, index) => {
            const target = targetIds[Math.floor(index / 2)];
            const targetSlot = (index % 2 === 0 ? 1 : 2) as 1 | 2;
            return {
              id: `${sourceId}->${target}:slot-${targetSlot}`,
              source: sourceId,
              target,
              label: matchCodes.get(sourceId) || "",
              output: "WINNER" as const,
              targetSlot,
              targetSlotId: `${target}:slot-${targetSlot}`,
              sourceStageId: previous.id,
              targetStageId: stage.id,
            };
          }).filter((connection) => connection.target),
        };
      }),
    };
  });

  return { ...record, stageCount: stages.length, stages };
};

const normalizeStages = (stageCount: number, currentStages: CompetitionStageConfig[]) => {
  const count = Math.max(1, Math.min(20, Number(stageCount) || 1));
  return Array.from({ length: count }, (_, index) => {
    const order = index + 1;
    const previousId = order === 1 ? "" : `stage-${order - 1}`;
    const current = currentStages[index] || createStage(order, count);
    const inputTeams = order === 1 ? current.input.teams : current.input.selection.slots || current.input.teams;
    const sourceStageIds = currentStages
      .filter((stage) => Number(stage.order || 0) < order)
      .sort((a, b) => a.order - b.order)
      .map((stage) => stage.id);
    const luckyCriteria = current.luckyCriteria?.length ? current.luckyCriteria : defaultLuckyCriteria;
    return syncWildcardSlotsToKnockoutStage({
      ...current,
      id: current.id || `stage-${order}`,
      order,
      sourceType: order === 1 ? "REGISTRATION" as const : "PREVIOUS_STAGE" as const,
      sourceStageIds: previousId ? [previousId] : [],
      input: { ...current.input, teams: inputTeams, sourceStageId: previousId },
      brackets: (current.brackets.length ? current.brackets : [createBranch(order, count, inputTeams)]).map(normalizeBranchMatchSlots),
      scoring: { setsToWin: 1, winBy: 2, ...current.scoring },
      rankingCriteria: current.rankingCriteria?.length ? current.rankingCriteria : defaultRankingCriteria,
      wildcard: {
        ...current.wildcard,
        slots: current.wildcard.selection.slots,
        sourceStageIds,
        criteria: current.wildcard.criteria?.length ? current.wildcard.criteria : wildcardCriteria(luckyCriteria),
      },
      luckyCriteria,
    });
  });
};

const createFollowupBranch = (
  nextStage: CompetitionStageConfig,
  sourceBranch: StageBracketConfig,
  index: number,
  inheritedTeamsIn: number,
): StageBracketConfig => {
  const totalTeamsIn = makeEvenSlotCount(inheritedTeamsIn);
  return {
    id: `${nextStage.id}-from-${sourceBranch.id}`,
    name: `Nhánh ${sourceBranch.name || index + 1}`,
    type: "knockout",
    totalTeamsIn,
    groups: [],
    groupIds: [],
    selection: createSelection(Math.max(1, Math.ceil(totalTeamsIn / 2)), "WINNER"),
  };
};

const syncNextStageBranches = (stages: CompetitionStageConfig[], changedOrder: number) => {
  const currentIndex = stages.findIndex((stage) => stage.order === changedOrder);
  if (currentIndex < 0 || currentIndex >= stages.length - 1) return stages;
  const currentStage = stages[currentIndex];
  const nextStage = stages[currentIndex + 1];
  const previousMatchCount = currentStage.brackets.reduce((sum, branch) => sum + defaultMatchCountOfBranch(branch), 0);
  const inheritedTeamsIn = Math.max(2, previousMatchCount);
  const branchCount = Math.max(
    1,
    nextStage.brackets.filter((branch) => branch.type === "knockout").length,
    currentStage.brackets.filter((branch) => branch.type === "knockout").length,
  );
  const branchInputCounts = splitEvenSlotCounts(inheritedTeamsIn, branchCount);
  const nextBranches = nextStage.brackets.map((branch) => normalizeBranchMatchSlots(branch));

  currentStage.brackets.forEach((branch, index) => {
    if (nextBranches[index]) return;
    nextBranches.push(createFollowupBranch(nextStage, branch, index, branchInputCounts[index] || inheritedTeamsIn));
  });

  return stages.map((stage, index) => index === currentIndex + 1
    ? {
      ...stage,
      input: {
        ...stage.input,
        teams: nextBranches.reduce((sum, branch) => sum + makeEvenSlotCount(branch.totalTeamsIn), 0),
      },
      brackets: nextBranches,
    }
    : stage);
};

const collectFlowNodeIds = (stages: CompetitionStageConfig[]) => new Set(stages.flatMap((stage) =>
  stage.brackets.flatMap((branch) => {
    if (branch.type !== "knockout") return [`${stage.id}:${branch.id}`];
    return [
      ...matchIdsForBranch(stage, branch),
      ...(branch.flowStandaloneMatches || []).map((match) => match.id),
    ];
  }),
));

const cleanupFlowState = (stages: CompetitionStageConfig[]) => {
  const syncedStages = stages.map(syncWildcardSlotsToKnockoutStage);
  const nodeIds = collectFlowNodeIds(syncedStages);
  const seenEdges = new Set<string>();
  return syncedStages.map((stage) => ({
    ...stage,
    brackets: stage.brackets.map((rawBranch) => {
      const branch = normalizeBranchMatchSlots(rawBranch);
      const flowConnections = (branch.flowConnections || []).filter((connection) => {
        const valid = nodeIds.has(connection.source) && nodeIds.has(connection.target) && connection.source !== connection.target && !seenEdges.has(connection.id);
        if (valid) seenEdges.add(connection.id);
        return valid;
      });
      const routeIds = new Set(flowConnections.map((connection) => connection.id));
      return {
        ...branch,
        flowConnections,
        flowConnectionRoutes: Object.fromEntries(
          Object.entries(branch.flowConnectionRoutes || {}).filter(([edgeId]) => routeIds.has(edgeId)),
        ),
      };
    }),
  }));
};

const OrgCompetitionFormatPage = () => {
  const {
    formats,
    tournamentOptions,
    selectedTournamentItemId,
    loading,
    saving,
    fetchTournamentOptions,
    selectTournamentItem,
    saveTournamentFormat,
  } = useCompetitionFormatStore();
  const contextTournamentItemId = useOrgContextStore((state) => state.selectedTournamentItemId);
  const [draft, setDraft] = useState<CompetitionFormatRecord>(createDraft());
  const [focusedBranchId, setFocusedBranchId] = useState<string>();
  const [activeTab, setActiveTab] = useState<"config" | "seeding">("config");
  const [presetTemplates, setPresetTemplates] = useState<CompetitionFormatRecord[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const deferredStages = useDeferredValue(draft.stages);

  useEffect(() => {
    void fetchTournamentOptions();
  }, [fetchTournamentOptions]);

  useEffect(() => {
    if (contextTournamentItemId && contextTournamentItemId !== selectedTournamentItemId) {
      void selectTournamentItem(contextTournamentItemId);
    }
  }, [contextTournamentItemId, selectedTournamentItemId, selectTournamentItem]);

  const selectedTournament = useMemo(
    () => tournamentOptions.find((item) => item.id === selectedTournamentItemId),
    [selectedTournamentItemId, tournamentOptions],
  );
  const selectedFormat = useMemo(
    () => formats.find((format) => format.id === selectedTournamentItemId),
    [formats, selectedTournamentItemId],
  );
  useEffect(() => {
    queueMicrotask(() => {
      if (selectedFormat) {
        const stageCount = Math.max(1, selectedFormat.stageCount || selectedFormat.stages.length || 3);
        const stages = selectedFormat.stages.length
          ? normalizeStages(stageCount, selectedFormat.stages)
          : createDraft(selectedTournament).stages;
        setDraft({
          ...selectedFormat,
          stageCount: stages.length,
          sportType: capitalize(selectedFormat.sportType),
          stages,
        });
        setFocusedBranchId(stages[0]?.brackets[0]?.id);
      } else if (selectedTournament) {
        const nextDraft = createDraft(selectedTournament);
        setDraft(nextDraft);
        setFocusedBranchId(nextDraft.stages[0]?.brackets[0]?.id);
      }
    });
  }, [selectedFormat, selectedTournament]);

  useEffect(() => {
    if (!selectedTournament?.sportType) {
      queueMicrotask(() => setPresetTemplates([]));
      return;
    }
    let mounted = true;
    queueMicrotask(() => {
      if (mounted) setLoadingPresets(true);
    });
    competitionFormatService.getCompetitionTemplates(selectedTournament.sportType)
      .then((items) => {
        if (mounted) setPresetTemplates(items);
      })
      .catch((error) => {
        console.error(error);
        if (mounted) setPresetTemplates([]);
      })
      .finally(() => {
        if (mounted) setLoadingPresets(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedTournament?.sportType]);

  const updateDraft = (patch: Partial<CompetitionFormatRecord>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const updateTournamentTeams = (teams: number) =>
    setDraft((current) => {
      const safeTeams = Math.max(1, teams);
      const stages = current.stages.map((stage) => {
        if (stage.order !== 1) return stage;
        const groups = Math.max(1, stage.input.groups || stage.brackets[0]?.groups?.length || 1);
        return {
          ...stage,
          input: { ...stage.input, teams: safeTeams, teamsPerGroup: Math.max(1, Math.ceil(safeTeams / groups)) },
          brackets: stage.brackets.map((branch) => branch.type === "group"
            ? { ...branch, totalTeamsIn: safeTeams, groups: createGroups(safeTeams, groups) }
            : branch),
        };
      });
      return { ...current, stages };
    });

  const updateStage = (stage: CompetitionStageConfig) =>
    setDraft((current) => {
      const nextStages = current.stages.map((item) => item.order === stage.order ? stage : item);
      const stages = cleanupFlowState(syncNextStageBranches(nextStages, stage.order));
      return { ...current, stages };
    });

  const updateStageCount = (stageCount: number) => {
    setDraft((current) => {
      const safeStageCount = Math.max(1, Math.min(20, Number(stageCount) || 1));
      return { ...current, stageCount: safeStageCount, stages: cleanupFlowState(normalizeStages(safeStageCount, current.stages)) };
    });
  };

  const validateConnections = () => {
    const outgoing = new Map<string, number>();
    const incoming = new Map<string, number>();
    for (const stage of draft.stages) {
      for (const branch of stage.brackets) {
        (branch.flowConnections || []).forEach((connection) => {
          const sourceIsMatch = connection.source.includes(":m-") || connection.source.includes(":custom-");
          if (sourceIsMatch) outgoing.set(connection.source, (outgoing.get(connection.source) || 0) + 1);
          incoming.set(connection.target, (incoming.get(connection.target) || 0) + 1);
        });
      }
    }
    return ![...outgoing.values()].some((count) => count > 1)
      && ![...incoming.values()].some((count) => count > 2);
  };

  const deleteStage = (stageId: string) => {
    setDraft((current) => {
      const stages = cleanupFlowState(normalizeStages(current.stages.length - 1, current.stages.filter((stage) => stage.id !== stageId)));
      setFocusedBranchId(stages[0]?.brackets[0]?.id);
      return { ...current, stageCount: stages.length, stages };
    });
  };

  const applyPresetTemplate = async (template: CompetitionFormatRecord) => {
    try {
      const detail = await competitionFormatService.getCompetitionTemplateDetail(template.presetId || template.id);
      const eligible = selectedTournamentItemId
        ? await competitionFormatService.getEligibleTeams(selectedTournamentItemId).catch(() => ({ totalTeams: 0, teamIds: [] }))
        : { totalTeams: 0, teamIds: [] };
      const normalizedDetail = normalizeTemplateByStartTeams(normalizeTemplateByEligibleTeams(detail, eligible.totalTeams), eligible.totalTeams);
      const stages = normalizeStages(normalizedDetail.stages.length || 1, normalizedDetail.stages);
      setDraft({
        ...normalizedDetail,
        id: selectedTournamentItemId || normalizedDetail.id,
        tournamentItemId: selectedTournamentItemId || undefined,
        selectedType: "template",
        presetId: normalizedDetail.presetId || template.presetId || template.id,
        presetSource: "competition-template",
        sportType: selectedTournament?.sportType || normalizedDetail.sportType,
        stageCount: stages.length,
        stages,
      });
      setFocusedBranchId(stages[0]?.brackets[0]?.id);
      toast.success("Đã tải thể thức mẫu vào bản nháp. Bấm Lưu cấu hình để áp dụng cho giải.");
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải chi tiết thể thức mẫu.");
    }
  };

  const selectCustomFormat = async () => {
    const eligible = selectedTournamentItemId
      ? await competitionFormatService.getEligibleTeams(selectedTournamentItemId).catch(() => ({ totalTeams: draft.stages[0]?.input.teams || 0, teamIds: [] }))
      : { totalTeams: 0, teamIds: [] };
    const emptyDraft = createEmptyCustomDraft(selectedTournament, eligible.totalTeams);
    setDraft(emptyDraft);
    setFocusedBranchId(emptyDraft.stages[0]?.brackets[0]?.id);
    setActiveTab("config");
    toast.success("Đã chuyển sang Tự cấu hình và xóa sạch bản nháp trên màn hình. Chưa lưu vào giải cho đến khi bấm Lưu cấu hình.");
  };

  const submit = async () => {
    if (!selectedTournamentItemId) return toast.error("Hãy chọn giải cần cấu hình.");
    if (!draft.name.trim()) return toast.error("Vui lòng nhập tên cấu hình.");
    if (!draft.stages.length) return toast.error("Tự cấu hình đang trống. Hãy nhập số stage để tạo cấu trúc trước khi lưu.");
    if (draft.stages.some((stage) => stage.brackets.length === 0)) return toast.error("Mỗi stage cần ít nhất một branch.");
    if (draft.stages.some((stage) => stage.brackets.some((branch) => branch.type === "group" && (!branch.groups || branch.groups.length === 0)))) {
      return toast.error("Branch Round Robin cần có group config.");
    }
    if (!validateConnections()) return toast.error("Connection không hợp lệ: mỗi match tối đa 2 incoming và 1 outgoing.");

    const payload = {
        tournamentItemId: selectedTournamentItemId,
        selectedType: draft.selectedType === "template" ? "template" as const : draft.selectedType === "preset" ? "preset" as const : "custom" as const,
        presetId: draft.presetId,
        presetSource: draft.presetSource,
        name: draft.name.trim(),
        sportType: draft.sportType.trim() || selectedTournament?.sportType || "Pickleball",
        description: draft.description,
        stageCount: draft.stageCount || draft.stages.length,
        stages: cleanupFlowState(normalizeStages(draft.stages.length, draft.stages)),
    };

    try {
      await saveTournamentFormat(payload);
      toast.success("Đã lưu cấu hình workflow thể thức giải đấu.");
    } catch (error) {
      console.error(error);
      toast.error("Chưa thể lưu cấu hình lên BE. Bản nháp trên màn hình vẫn được giữ.");
    }
  };

  if (loading && tournamentOptions.length === 0) {
    return <div className="flex h-full items-center justify-center font-medium text-muted-foreground animate-pulse">Đang tải danh sách giải...</div>;
  }

  if (!contextTournamentItemId) {
    return <RequireTournamentSelection description="Hãy chọn giải ở Sidebar để cấu hình workflow thể thức thi đấu của giải đó." />;
  }

  return (
    <div className="flex h-[calc(100vh-96px)] min-h-[760px] flex-col gap-4">
      <header className="flex shrink-0 flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase text-primary">
            <GitBranch className="h-4 w-4" />
            Workflow Builder
          </div>
          <h1 className="truncate text-2xl font-black text-foreground">Cấu hình thể thức giải đấu</h1>
          <p className="text-sm text-muted-foreground">Form bên trái và canvas bên phải đồng bộ realtime từ cùng một state.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={submit} disabled={saving || !selectedTournamentItemId}>
            <Save className="h-4 w-4" /> {saving ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </div>
      </header>

      {!selectedTournamentItemId ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Chọn một giải ở sidebar để bắt đầu cấu hình workflow.
        </div>
      ) : (
        <>
          <TemplateChooser
            sportType={selectedTournament?.sportType || ""}
            templates={presetTemplates}
            loading={loadingPresets}
            selectedPresetId={draft.presetId}
            selectedType={draft.selectedType}
            onCustom={selectCustomFormat}
            onSelect={(template) => void applyPresetTemplate(template)}
          />
          <div className="flex shrink-0 rounded-lg border border-border bg-card p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("config")}
              className={`h-10 flex-1 rounded-md px-4 text-sm font-black ${activeTab === "config" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              Cấu hình sơ đồ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("seeding")}
              className={`h-10 flex-1 rounded-md px-4 text-sm font-black ${activeTab === "seeding" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              Gán đội / Seed
            </button>
          </div>
          {activeTab === "config" && <CustomGuide />}

        {activeTab === "seeding" ? (
          <TeamSeedingBoard
            tournamentItemId={selectedTournamentItemId}
            stages={draft.stages}
            onChangeStage={updateStage}
          />
        ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[35fr_65fr]">
          <aside className="min-h-[900px] overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 beautiful-scrollbar">
            <div className="mb-3 rounded-lg border border-border bg-card p-3">
              <LabelText label="Tên cấu hình" value={draft.name} onChange={(value) => updateDraft({ name: value })} />
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <LabelText label="Môn thi đấu" value={draft.sportType} onChange={(value) => updateDraft({ sportType: value })} />
                <NumberField label="Số đội bắt đầu giải" value={draft.stages[0]?.input.teams || 0} onChange={updateTournamentTeams} />
                <NumberField label="Số stage" value={draft.stageCount || draft.stages.length} onChange={updateStageCount} />
              </div>
              <div className="mt-3 space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wide text-muted-foreground">Mô tả thể thức</label>
                <RichTextEditor
                  value={draft.description || ""}
                  onChange={(description) => updateDraft({ description })}
                  placeholder="Mô tả cách chia bảng, phân nhánh, điều kiện đi tiếp..."
                  minHeight={130}
                />
              </div>
            </div>
            <div className="space-y-3">
              {draft.stages.map((stage) => (
                <StageEditor
                  key={`${stage.id}-${stage.order}`}
                  stage={stage}
                  allStages={draft.stages}
                  tournamentItemId={selectedTournamentItemId}
                  focusedBranchId={focusedBranchId}
                  onFocusBranch={setFocusedBranchId}
                  onChange={updateStage}
                  onDelete={() => deleteStage(stage.id)}
                  canDelete={draft.stages.length > 1}
                />
              ))}
            </div>
          </aside>

          <main className="min-h-0">
            <FlowCanvas
              stages={deferredStages}
              focusedBranchId={focusedBranchId}
              onChangeStage={updateStage}
              onFocusBranch={(_stageId, branchId) => {
                if (branchId) setFocusedBranchId(branchId);
              }}
            />
          </main>
        </div>
        )}
        </>
      )}
    </div>
  );
};

const TemplateChooser = ({
  sportType,
  templates,
  loading,
  selectedPresetId,
  selectedType,
  onCustom,
  onSelect,
}: {
  sportType: string;
  templates: CompetitionFormatRecord[];
  loading: boolean;
  selectedPresetId?: string;
  selectedType?: CompetitionFormatRecord["selectedType"];
  onCustom: () => void;
  onSelect: (template: CompetitionFormatRecord) => void;
}) => (
  <section className="shrink-0 rounded-lg border border-border bg-card p-3 shadow-sm">
    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-sm font-black text-foreground">Chọn thể thức mẫu</h2>
        <p className="text-xs text-muted-foreground">
          Dữ liệu lấy từ template đang hoạt động của môn {sportType || "đang chọn"}. Template chỉ nạp bản nháp, chưa lưu vào giải.
        </p>
      </div>
      {loading && <span className="text-xs font-bold text-muted-foreground">Đang tải template...</span>}
    </div>

    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
      <button
        type="button"
        onClick={onCustom}
        className={`min-h-[120px] rounded-lg border p-3 text-left shadow-sm transition-colors ${selectedType === "custom" || !selectedPresetId ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:border-primary/40 hover:bg-primary-light/10"}`}
      >
        <span className="block truncate text-sm font-black">Tự cấu hình</span>
        <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
          Xóa sạch bản nháp hiện tại để tự tạo Stage, nhánh, bảng đấu, trận, slot, key và match flow từ đầu.
        </span>
        <span className="mt-3 inline-flex rounded bg-muted px-2 py-1 text-[10px] font-bold">Custom schema</span>
      </button>
      {templates.map((template) => {
        const selected = selectedPresetId === (template.presetId || template.id);
        const hasGroups = template.stages.some((stage) => stage.brackets.some((branch) => branch.type === "group"));
        const hasKnockout = template.stages.some((stage) => stage.brackets.some((branch) => branch.type === "knockout"));
        const hasDouble = template.stages.some((stage) => stage.brackets.length > 1 && stage.brackets.some((branch) => branch.selection.mode === "LOSER"));
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={`min-h-[120px] rounded-lg border p-3 text-left shadow-sm transition-colors ${selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:border-primary/40 hover:bg-primary-light/10"}`}
          >
            <span className="block truncate text-sm font-black">{template.name}</span>
            <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{template.description}</span>
            <span className="mt-3 flex flex-wrap gap-1 text-[10px] font-bold">
              <span className="rounded bg-muted px-2 py-1">{template.stageCount} giai đoạn</span>
              {hasGroups && <span className="rounded bg-muted px-2 py-1">Có bảng</span>}
              {hasKnockout && <span className="rounded bg-muted px-2 py-1">Có cây đấu</span>}
              {hasDouble && <span className="rounded bg-muted px-2 py-1">Nhánh thắng/thua</span>}
            </span>
          </button>
        );
      })}
      {!loading && templates.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Chưa có thể thức mẫu đang hoạt động cho môn này. Hãy kiểm tra seed tại trang cấu hình môn thi.
        </div>
      )}
    </div>
  </section>
);

const ConfigChooser = () => (
  <section className="shrink-0 rounded-lg border border-border bg-card p-3 shadow-sm">
    <div className="mb-2">
      <h2 className="text-sm font-black text-foreground">Chọn cấu hình thể thức</h2>
  
    </div>

    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
      <div className="min-h-[84px] rounded-lg border border-primary bg-primary/10 p-3 text-left text-primary shadow-sm">
        <span className="block truncate text-sm font-black">Tự thiết kế</span>
        <span className="mt-1 line-clamp-2 block text-xs text-primary/80">
          Mở biểu mẫu và lưu đồ để tùy chỉnh thể thức thi đấu theo nhu cầu.
        </span>
      </div>
    </div>
  </section>
);
void ConfigChooser;

const CustomGuide = () => (
  <section className="shrink-0 rounded-lg border border-border bg-card p-3 shadow-sm">
    <h2 className="text-sm font-black text-foreground">Hướng dẫn cấu hình thể thức</h2>

    <div className="mt-3 grid grid-cols-1 gap-3 text-xs leading-5 text-muted-foreground lg:grid-cols-3">
      <div className="rounded-lg border border-border bg-muted/25 p-3">
        <p className="font-black text-foreground">1. Tạo vòng và nhánh</p>
        <p>
          Mỗi vòng (Stage) gồm một hoặc nhìều nhánh. Mỗi trận đấu trong nhánh loại trực tiếp luôn có
          2 vị trí (slot). Khi một vòng kế thừa từ vòng trước, hệ thống sẽ tự động tạo các trận theo
          từng cặp: cứ 2 trận của vòng trước sẽ tạo thành 1 trận ở vòng tiếp theo.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/25 p-3">
        <p className="font-black text-foreground">2. Gán đội vào trận đấu</p>
        <p>
          Kéo khóa (Key) hoặc vị trí vào ô (slot) của trận đấu. Nếu kéo khóa sang trận khác, khóa sẽ
          tự động được xóa khỏi trận cũ. Có thể kéo một slot đã gán ra ngoài khung trận để hủy gán.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/25 p-3">
        <p className="font-black text-foreground">3. Nối nhánh thi đấu</p>
        <p>
          Nhấn <strong>Connect</strong> trên trận nguồn, sau đó chọn trận đích để tạo liên kết. Mỗi
          liên kết xác định đội đi tiếp vào vòng sau. Mỗi trận luôn có 2 slot, tối đa 1 nhánh đi ra
          và 2 nhánh đi vào.
        </p>
      </div>
    </div>
  </section>
);

const LabelText = ({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) => (
  <div className="space-y-1.5">
    <label className="block truncate whitespace-nowrap text-[11px] font-black uppercase tracking-wide text-muted-foreground">{label}</label>
    <input
      className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-sm read-only:bg-muted"
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange?.(event.target.value)}
    />
  </div>
);

const NumberField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => {
  const [inputValue, setInputValue] = useState({ externalValue: value, value: String(value) });
  const draftValue = inputValue.externalValue === value ? inputValue.value : String(value);

  const applyDraftValue = (nextDraft: string, finalize = false) => {
    const parsed = Number(nextDraft);
    if (!Number.isFinite(parsed)) {
      setInputValue({ externalValue: value, value: nextDraft });
      return;
    }
    const nextValue = Math.max(1, Math.trunc(parsed));
    setInputValue({ externalValue: nextValue, value: finalize ? String(nextValue) : nextDraft });
    if (nextValue !== value) onChange(nextValue);
  };

  const commit = () => {
    const parsed = Number(draftValue);
    const nextValue = Number.isFinite(parsed) ? Math.max(1, Math.trunc(parsed)) : Math.max(1, value);
    setInputValue({ externalValue: nextValue, value: String(nextValue) });
    if (nextValue !== value) onChange(nextValue);
  };

  return (
    <div className="space-y-1.5">
      <label className="block truncate whitespace-nowrap text-[11px] font-black uppercase tracking-wide text-muted-foreground">{label}</label>
      <input
        type="number"
        min={1}
        step={1}
        inputMode="numeric"
        className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-sm"
        value={draftValue}
        onChange={(event) => applyDraftValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
      />
    </div>
  );
};

export default OrgCompetitionFormatPage;
