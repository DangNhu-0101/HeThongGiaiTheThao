import api from "@/libs/axios";
import { teamPlacementService, type TeamPlacementStrategy } from "@/services/teamPlacementService";
import type {
  BracketType,
  CompetitionFormatRecord,
  CompetitionFormatUpsertPayload,
  CompetitionStageConfig,
  CompetitionTournamentOption,
  StageBracketConfig,
  StageTeamSelection,
  TeamSelectionMode,
  RankingCriterion,
} from "@/types/competitionFormat";

type ApiList<T = unknown> = T[] | { data?: T[] };

const asArray = <T>(payload: ApiList<T>): T[] =>
  Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const selectionModes: TeamSelectionMode[] = ["WINNER", "LOSER", "TOP_RANKS", "MANUAL"];
const bracketTypes: BracketType[] = ["group", "knockout", "swiss", "custom"];
const defaultRankingCriteria: RankingCriterion[] = ["points", "pointDiff", "headToHead", "draw"];
const defaultLuckyCriteria: RankingCriterion[] = ["points", "pointDiff", "draw"];
const criteriaCodes: RankingCriterion[] = ["points", "pointDiff", "headToHead", "draw"];

const createSelection = (slots: number, mode: TeamSelectionMode = "WINNER"): StageTeamSelection => ({
  mode,
  slots,
  ranks: mode === "TOP_RANKS" ? [1, 2] : [],
  manualTeamIds: [],
});

const createTemplateGroups = (teams: number, count: number) =>
  Array.from({ length: Math.max(1, count) }, (_, index) => ({
    name: `Bảng ${String.fromCharCode(65 + index)}`,
    numberOfTeams: Math.max(1, Math.ceil(teams / Math.max(1, count))),
  }));

const createTemplateKnockoutSlots = (branchId: string, teams: number) => {
  const slotCount = Math.max(2, teams % 2 === 0 ? teams : teams + 1);
  return Array.from({ length: slotCount }, (_, index) => ({
    id: `${branchId}-slot-${index + 1}`,
    label: index >= teams ? `Bye ${index - teams + 1}` : `Seed ${index + 1}`,
  }));
};

const nextPowerOfTwo = (value: number) => {
  let size = 2;
  while (size < Math.max(2, value)) size *= 2;
  return size;
};

const groupRankKeys = (groups: Array<{ name: string; numberOfTeams: number }>, qualifiedPerGroup: number) =>
  groups.flatMap((group, groupIndex) => {
    const groupLetter = String.fromCharCode(65 + groupIndex);
    return Array.from({ length: Math.max(1, qualifiedPerGroup) }, (_, rankIndex) => ({
      label: `${groupLetter}${rankIndex + 1}`,
      sourceGroupName: group.name,
      sourceRank: rankIndex + 1,
    }));
  });

const buildKnockoutBranch = ({
  stageId,
  branchId,
  name,
  teams,
  inputKeys,
  hasThirdPlace,
}: {
  stageId: string;
  branchId: string;
  name: string;
  teams: number;
  inputKeys?: Array<{ label: string; sourceStageId?: string; sourceGroupName?: string; sourceRank?: number }>;
  hasThirdPlace?: boolean;
}): StageBracketConfig => {
  const slotCount = nextPowerOfTwo(teams);
  const flowSlots = Array.from({ length: slotCount }, (_, index) => {
    const key = inputKeys?.[index];
    return {
      id: `${branchId}-slot-${index + 1}`,
      label: key?.label || (index >= teams ? `Bye ${index - teams + 1}` : `Seed ${index + 1}`),
      sourceLabel: key?.label,
      sourceStageId: key?.sourceStageId,
      sourceGroupName: key?.sourceGroupName,
      sourceRank: key?.sourceRank,
    };
  });

  const standalone: NonNullable<StageBracketConfig["flowStandaloneMatches"]> = [];
  const connections: NonNullable<StageBracketConfig["flowConnections"]> = [];
  let previousRound = Array.from({ length: slotCount / 2 }, (_, index) => `${stageId}:${branchId}:m-${index + 1}`);
  let matchCounter = previousRound.length + 1;
  let round = 2;
  const matchCodeByNode = new Map(previousRound.map((nodeId, index) => [nodeId, `M${index + 1}`]));

  while (previousRound.length > 1) {
    const nextRound: string[] = [];
    for (let index = 0; index < previousRound.length; index += 2) {
      const isFinal = previousRound.length === 2;
      const nodeId = `${branchId}:custom-r${round}-m${index / 2 + 1}`;
      const matchCode = `M${matchCounter++}`;
      const firstSourceKey = matchCodeByNode.get(previousRound[index]) || `M${index + 1}`;
      const secondSourceKey = matchCodeByNode.get(previousRound[index + 1]) || `M${index + 2}`;
      matchCodeByNode.set(nodeId, matchCode);
      standalone.push({
        id: nodeId,
        matchCode,
        title: isFinal ? "Chung kết" : `Vòng ${round}`,
        roundName: isFinal ? "Chung kết" : `Vòng ${round}`,
        isFinal,
        inputKeys: [firstSourceKey, secondSourceKey],
        winnerKey: matchCode,
        loserKey: `L${matchCode.replace("M", "")}`,
        seedSlots: [
          { id: `${nodeId}:slot-1`, label: firstSourceKey, sourceLabel: firstSourceKey, sourceMatchId: previousRound[index], sourceResult: "WINNER" },
          { id: `${nodeId}:slot-2`, label: secondSourceKey, sourceLabel: secondSourceKey, sourceMatchId: previousRound[index + 1], sourceResult: "WINNER" },
        ],
      });
      connections.push({
        id: `${previousRound[index]}->${nodeId}:1`,
        source: previousRound[index],
        target: nodeId,
        label: firstSourceKey,
        output: "WINNER",
        targetSlot: 1,
        targetSlotId: `${nodeId}:slot-1`,
        sourceStageId: stageId,
        targetStageId: stageId,
      });
      if (previousRound[index + 1]) {
        connections.push({
          id: `${previousRound[index + 1]}->${nodeId}:2`,
          source: previousRound[index + 1],
          target: nodeId,
          label: secondSourceKey,
          output: "WINNER",
          targetSlot: 2,
          targetSlotId: `${nodeId}:slot-2`,
          sourceStageId: stageId,
          targetStageId: stageId,
        });
      }
      nextRound.push(nodeId);
    }
    previousRound = nextRound;
    round += 1;
  }

  if (hasThirdPlace && standalone.length >= 1) {
    const semiFinals = standalone.length >= 3
      ? standalone.filter((match) => match.roundName === `Vòng ${round - 2}`).slice(-2)
      : [];
    const sourceA = semiFinals[0]?.id || `${stageId}:${branchId}:m-1`;
    const sourceB = semiFinals[1]?.id || `${stageId}:${branchId}:m-2`;
    const loserA = `L${(matchCodeByNode.get(sourceA) || "M1").replace("M", "")}`;
    const loserB = `L${(matchCodeByNode.get(sourceB) || "M2").replace("M", "")}`;
    const nodeId = `${branchId}:third-place`;
    const thirdPlaceCode = `M${matchCounter}`;
    standalone.push({
      id: nodeId,
      matchCode: thirdPlaceCode,
      title: "Tranh hạng ba",
      roundName: "Tranh hạng",
      isThirdPlace: true,
      inputKeys: [loserA, loserB],
      seedSlots: [
        { id: `${nodeId}:slot-1`, label: loserA, sourceLabel: loserA, sourceMatchId: sourceA, sourceResult: "LOSER" },
        { id: `${nodeId}:slot-2`, label: loserB, sourceLabel: loserB, sourceMatchId: sourceB, sourceResult: "LOSER" },
      ],
    });
    connections.push(
      { id: `${sourceA}->${nodeId}:1`, source: sourceA, target: nodeId, label: loserA, output: "LOSER", targetSlot: 1, targetSlotId: `${nodeId}:slot-1`, sourceStageId: stageId, targetStageId: stageId },
      { id: `${sourceB}->${nodeId}:2`, source: sourceB, target: nodeId, label: loserB, output: "LOSER", targetSlot: 2, targetSlotId: `${nodeId}:slot-2`, sourceStageId: stageId, targetStageId: stageId },
    );
  }

  return {
    id: branchId,
    name,
    type: "knockout",
    totalTeamsIn: slotCount,
    groups: [],
    groupIds: [],
    selection: createSelection(1, "WINNER"),
    flowSlots,
    flowStandaloneMatches: standalone,
    flowConnections: connections,
  };
};

const migrateSelection = (
  value: unknown,
  fallbackSlots: number,
  fallbackMode: TeamSelectionMode,
): StageTeamSelection => {
  const raw = asRecord(value);
  const mode = selectionModes.includes(raw.mode as TeamSelectionMode)
    ? raw.mode as TeamSelectionMode
    : fallbackMode;
  return {
    mode,
    slots: Number(raw.slots ?? fallbackSlots),
    ranks: Array.isArray(raw.ranks) ? raw.ranks.map(Number) : mode === "TOP_RANKS" ? [1, 2] : [],
    manualTeamIds: Array.isArray(raw.manualTeamIds) ? raw.manualTeamIds.map(String) : [],
  };
};

const inferMode = (text: unknown): TeamSelectionMode => {
  const normalized = String(text || "").toLowerCase();
  if (normalized.includes("top") || normalized.includes("hạng")) return "TOP_RANKS";
  if (normalized.includes("thua") || normalized.includes("loser")) return "LOSER";
  if (normalized.includes("manual") || normalized.includes("tự chọn")) return "MANUAL";
  return "WINNER";
};

const migrateCriteria = (value: unknown, fallback: RankingCriterion[]) => {
  const raw = Array.isArray(value) ? value : [];
  const mapped = raw
    .map((item) => String(item))
    .map((item) => item === "goalDifference" ? "pointDiff" : item)
    .filter((item): item is RankingCriterion => criteriaCodes.includes(item as RankingCriterion));
  return mapped.length ? mapped : fallback;
};

const defaultGroups = (totalTeamsIn: number, groupsCount = 2) => {
  const count = Math.max(1, groupsCount);
  const teamsPerGroup = Math.max(2, Math.ceil(totalTeamsIn / count));
  return Array.from({ length: count }, (_, index) => ({
    name: `Bảng ${String.fromCharCode(65 + index)}`,
    numberOfTeams: teamsPerGroup,
  }));
};
void defaultGroups;

const mapBracket = (value: unknown, stageIndex: number, branchIndex: number, inputTeams: number): StageBracketConfig => {
  const raw = asRecord(value);
  const totalTeamsIn = Number(raw.totalTeamsIn || raw.slots || inputTeams || 2);
  const type = bracketTypes.includes(raw.type as BracketType) ? raw.type as BracketType : stageIndex === 0 ? "group" : "knockout";
  const rawGroups = Array.isArray(raw.groups) ? raw.groups : Array.isArray(raw.group) ? raw.group : [];
  const branchId = String(raw.id || raw._id || `stage-${stageIndex + 1}-bracket-${branchIndex + 1}`);
  const flowSlots = Array.isArray(raw.flowSlots)
    ? raw.flowSlots.map((slot, index) => {
      const record = asRecord(slot);
      return {
        id: String(record.id || `${branchId}-slot-${index + 1}`),
        label: String(record.label || `Slot ${index + 1}`),
        sourceLabel: record.sourceLabel ? String(record.sourceLabel) : undefined,
        sourceStageId: record.sourceStageId ? String(record.sourceStageId) : undefined,
        sourceMatchId: record.sourceMatchId ? String(record.sourceMatchId) : undefined,
        sourceResult: record.sourceResult === "LOSER" ? "LOSER" as const : record.sourceResult === "WINNER" ? "WINNER" as const : undefined,
        sourceGroupName: record.sourceGroupName ? String(record.sourceGroupName) : undefined,
        sourceRank: record.sourceRank ? Number(record.sourceRank) : undefined,
        resolvedTeamId: record.resolvedTeamId ? String(record.resolvedTeamId) : undefined,
        resolutionStatus: record.resolutionStatus === "RESOLVED" || record.resolutionStatus === "STALE" || record.resolutionStatus === "PENDING"
          ? record.resolutionStatus as "RESOLVED" | "STALE" | "PENDING"
          : undefined,
      };
    })
    : undefined;
  const flowConnections = Array.isArray(raw.flowConnections)
    ? raw.flowConnections.map((connection) => {
      const record = asRecord(connection);
      return {
        id: String(record.id || `${record.source || ""}->${record.target || ""}`),
        source: String(record.source || ""),
        target: String(record.target || ""),
        label: record.label ? String(record.label) : undefined,
        output: record.output === "LOSER" ? "LOSER" as const : record.output === "WINNER" ? "WINNER" as const : undefined,
        targetSlot: Number(record.targetSlot) === 1 ? 1 as const : Number(record.targetSlot) === 2 ? 2 as const : undefined,
        targetSlotId: record.targetSlotId ? String(record.targetSlotId) : undefined,
        sourceStageId: record.sourceStageId ? String(record.sourceStageId) : undefined,
        targetStageId: record.targetStageId ? String(record.targetStageId) : undefined,
      };
    }).filter((connection) => connection.source && connection.target)
    : undefined;
  const flowStandaloneMatches = Array.isArray(raw.flowStandaloneMatches)
    ? raw.flowStandaloneMatches.map((match, index) => {
      const record = asRecord(match);
      const matchId = String(record.id || `${branchId}:custom-${index + 1}`);
      const seedSlots = Array.isArray(record.seedSlots)
        ? record.seedSlots.map((slot, slotIndex) => {
          const seed = asRecord(slot);
          return {
            id: String(seed.id || `${matchId}:slot-${slotIndex + 1}`),
            label: String(seed.label || `Slot ${slotIndex + 1}`),
            sourceLabel: seed.sourceLabel ? String(seed.sourceLabel) : undefined,
            sourceStageId: seed.sourceStageId ? String(seed.sourceStageId) : undefined,
            sourceMatchId: seed.sourceMatchId ? String(seed.sourceMatchId) : undefined,
            sourceResult: seed.sourceResult === "LOSER" ? "LOSER" as const : seed.sourceResult === "WINNER" ? "WINNER" as const : undefined,
          };
        })
        : undefined;
      return {
        id: matchId,
        matchCode: String(record.matchCode || `M${index + 1}`),
        x: record.x === undefined ? undefined : Number(record.x),
        y: record.y === undefined ? undefined : Number(record.y),
        seedSlots,
      };
    })
    : undefined;
  return {
    id: branchId,
    name: String(raw.name || `Nhánh ${branchIndex + 1}`),
    type,
    totalTeamsIn: Math.max(2, totalTeamsIn),
    groups: rawGroups
      .map((group, index) => {
        const record = asRecord(group);
        return {
          name: String(record.name || `Bảng ${String.fromCharCode(65 + index)}`),
          numberOfTeams: Number(record.numberOfTeams || Math.ceil(totalTeamsIn / Math.max(rawGroups.length, 1))),
        };
      })
      .filter((group) => group.numberOfTeams > 0),
    groupIds: Array.isArray(raw.groupIds) ? raw.groupIds.map(String) : Array.isArray(raw.group) ? raw.group.map((group) => String(asRecord(group)._id || group)) : [],
    selection: migrateSelection(raw.selection, Number(raw.slots || Math.max(1, Math.floor(totalTeamsIn / 2))), inferMode(raw.selectionRule)),
    flowSlots,
    flowNodePositions: raw.flowNodePositions && typeof raw.flowNodePositions === "object"
      ? raw.flowNodePositions as StageBracketConfig["flowNodePositions"]
      : undefined,
    flowConnections,
    flowConnectionRoutes: raw.flowConnectionRoutes && typeof raw.flowConnectionRoutes === "object"
      ? raw.flowConnectionRoutes as StageBracketConfig["flowConnectionRoutes"]
      : undefined,
    flowConnectionsConfigured: raw.flowConnectionsConfigured === true,
    flowDeletedMatchIds: Array.isArray(raw.flowDeletedMatchIds) ? raw.flowDeletedMatchIds.map(String) : undefined,
    flowStandaloneMatches,
  };
};

const migrateStage = (value: unknown, index: number): CompetitionStageConfig => {
  const stage = asRecord(value);
  const stageRule = asRecord(stage.stageRule || stage);
  const input = asRecord(stage.input || asRecord(stage.flowConfig).input);
  const scoring = asRecord(stage.scoring || asRecord(stage.flowConfig).scoring);
  const wildcard = asRecord(stage.wildcard || asRecord(stage.flowConfig).wildcard);
  const inputTeams = Number(input.teams || stageRule.totalTeamsIn || 2);
  const rawBrackets = Array.isArray(stage.brackets)
    ? stage.brackets
    : Array.isArray(stage.bracket) ? stage.bracket
      : Array.isArray(stage.outputBranches) ? stage.outputBranches : [];
  const brackets = rawBrackets.map((item, branchIndex) => mapBracket(item, index, branchIndex, inputTeams));

  return {
    id: String(stage.id || stage._id || `stage-${index + 1}`),
    order: Number(stage.order || stageRule.number || index + 1),
    name: String(stageRule.name || stage.name || `Chặng ${index + 1}`),
    sourceType: index ? "PREVIOUS_STAGE" : "REGISTRATION",
    sourceStageIds: index ? [`stage-${index}`] : [],
    input: {
      teams: inputTeams,
      groups: Number(input.groups || 0),
      teamsPerGroup: Number(input.teamsPerGroup || 0),
      sourceStageId: index ? `stage-${index}` : "",
      selection: migrateSelection(input.selection, inputTeams, index ? "WINNER" : "MANUAL"),
    },
    brackets: brackets.length ? brackets : [mapBracket(undefined, index, 0, inputTeams)],
    wildcard: {
      enabled: Boolean(wildcard.enabled || stageRule.hasWildcards),
      selection: migrateSelection(wildcard.selection, Number(stageRule.wildcardsCount || 0), "LOSER"),
    },
    scoring: {
      targetScore: Number(scoring.targetScore || 11),
      changeSideAt: Number(scoring.changeSideAt || 6),
      setsToWin: Number(scoring.setsToWin || 1),
      winBy: Number(scoring.winBy || 2),
      winPoints: Number(scoring.winPoints ?? asRecord(stageRule.pointsConfig).win ?? 1),
      drawPoints: Number(scoring.drawPoints ?? asRecord(stageRule.pointsConfig).draw ?? 0),
      lossPoints: Number(scoring.lossPoints ?? asRecord(stageRule.pointsConfig).loss ?? 0),
    },
    rankingCriteria: migrateCriteria(stage.rankingCriteria || stageRule.rankingCriteria, defaultRankingCriteria),
    luckyCriteria: migrateCriteria(stage.luckyCriteria || asRecord(stage.flowConfig).luckyCriteria, defaultLuckyCriteria),
    seedAssignments: Array.isArray(stage.seedAssignments)
      ? stage.seedAssignments.map((assignment) => {
        const record = asRecord(assignment);
        return {
          slotId: String(record.slotId || ""),
          participantId: String(record.participantId || ""),
          participantName: String(record.participantName || ""),
          participantLogo: record.participantLogo ? String(record.participantLogo) : undefined,
          sourceType: "PARTICIPANT" as const,
          stageId: String(record.stageId || stage.id || stage._id || `stage-${index + 1}`),
          branchId: record.branchId ? String(record.branchId) : undefined,
          nodeId: record.nodeId ? String(record.nodeId) : undefined,
          groupName: record.groupName ? String(record.groupName) : undefined,
          slotLabel: record.slotLabel ? String(record.slotLabel) : undefined,
        };
      }).filter((assignment) => assignment.slotId && assignment.participantId)
      : [],
    note: String(stage.note || asRecord(stage.flowConfig).note || ""),
  };
};

const mapRuleToFormat = (value: unknown, index: number): CompetitionFormatRecord => {
  const rule = asRecord(value);
  const formatConfig = asRecord(rule.formatConfig || asRecord(rule.customFields).formatConfig);
  const rawStages = Array.isArray(formatConfig.stages)
    ? formatConfig.stages
    : Array.isArray(formatConfig.rounds) ? formatConfig.rounds
      : Array.isArray(rule.stages) ? rule.stages : [];
  const stages = rawStages.map(migrateStage);
  const slots = asRecord(rule.playerSlotsPerTeam);
  return {
    id: String(rule._id || rule.id || `format-${index}`),
    name: String(rule.name || formatConfig.name || "Thể thức thi đấu"),
    displayName: String(rule.displayName || rule.name || formatConfig.name || ""),
    sportType: String(rule.sportType || formatConfig.sportType || "Pickleball"),
    description: String(rule.description || formatConfig.description || ""),
    playerSlotsPerTeam: {
      min: Number(slots.min || 0),
      max: Number(slots.max || 0),
    },
    status: rule.status === "inactived" ? "inactived" : "actived",
    stageCount: Number(formatConfig.stageCount || formatConfig.roundCount || rule.stageCount || stages.length || 1),
    stages,
    createdAt: String(rule.createdAt || ""),
    updatedAt: String(rule.updatedAt || ""),
  };
};

const mapTournamentOption = (value: unknown, parentTournamentName?: string): CompetitionTournamentOption => {
  const item = asRecord(value);
  const categoryRule = asRecord(item.categoryRule);
  const structure = asRecord(item.structure);
  const stageIds = Array.isArray(structure.stage) ? structure.stage : [];
  return {
    id: String(item._id || item.id || ""),
    name: String(item.name || categoryRule.name || "Giải đấu"),
    sportType: String(item.sportType || categoryRule.sportType || "Chưa cấu hình"),
    parentTournamentName,
    status: String(item.status || ""),
    stageCount: stageIds.length,
  };
};

const buildRecordFromStages = (
  option: CompetitionTournamentOption,
  stages: CompetitionStageConfig[],
): CompetitionFormatRecord => ({
  id: option.id,
  tournamentItemId: option.id,
  name: `Thể thức · ${option.name}`,
  sportType: option.sportType,
  description: option.parentTournamentName ? `Cấu hình riêng cho ${option.parentTournamentName}` : "Cấu hình riêng cho giải đấu",
  status: "actived",
  stageCount: stages.length || 1,
  stages,
});

const mapCategoryTemplateToFormat = (value: unknown, index: number): CompetitionFormatRecord => {
  const template = asRecord(value);
  const slots = asRecord(template.playerSlotsPerTeam);
  return {
    id: `template:${String(template._id || template.id || index)}`,
    sourceKind: "categoryTemplate",
    categoryTemplateId: String(template._id || template.id || ""),
    name: String(template.name || "Nội dung đấu"),
    displayName: String(template.name || ""),
    sportType: String(template.sportType || "Pickleball"),
    description: "",
    playerSlotsPerTeam: {
      min: Number(slots.min || 0),
      max: Number(slots.max || 0),
    },
    status: template.status === "inactived" ? "inactived" : "actived",
    stageCount: 0,
    stages: [],
    createdAt: String(template.createdAt || ""),
    updatedAt: String(template.updatedAt || ""),
  };
};

const buildPresetStages = (template: Record<string, unknown>): CompetitionStageConfig[] => {
  const stageType = String(template.stageType || "");
  const rawStages = asArray(template.stages as ApiList<Record<string, unknown>>);
  const groupConfig = asRecord(template.groupConfig);
  const roundRobinConfig = asRecord(template.roundRobinConfig);
  const knockoutConfig = asRecord(template.knockoutConfig);
  const doubleEliminationConfig = asRecord(template.doubleEliminationConfig);
  const defaultSettings = asRecord(template.defaultSettings);
  const totalTeams = Math.max(2, Number(defaultSettings.totalTeams || defaultSettings.maxTeams || 2));
  const configuredTeamsPerGroup = Number(groupConfig.teamsPerGroup || groupConfig.defaultTeamsPerGroup || roundRobinConfig.teamsPerGroup || 0);
  const groupCount = Math.max(1, Number(groupConfig.defaultGroupCount || roundRobinConfig.groups || (configuredTeamsPerGroup ? Math.ceil(totalTeams / configuredTeamsPerGroup) : 1)));
  const qualifiedPerGroup = Number(groupConfig.qualifiedPerGroup || groupConfig.advancePerGroup || 2);
  const rankingCriteria = migrateCriteria(template.rankingCriteria, defaultRankingCriteria);
  const stageModels = rawStages.length ? rawStages : [{ name: template.name, type: "KNOCKOUT", format: "SINGLE_ELIMINATION" }];
  const hasThirdPlace = Boolean(
    knockoutConfig.hasThirdPlaceMatch
    || knockoutConfig.hasBronzeMatch
    || defaultSettings.hasThirdPlaceMatch
    || defaultSettings.hasBronzeMatch
    || String(template.description || "").toLowerCase().includes("hạng ba")
  );
  let previousGroupKeys: ReturnType<typeof groupRankKeys> = [];

  return stageModels.map((stageValue, index) => {
    const stage = asRecord(stageValue);
    const isGroup = String(stage.type || "").includes("GROUP") || String(stage.format || "").includes("ROUND") || (index === 0 && (stageType.includes("group") || stageType.includes("round_robin")));
    const isDouble = stageType.includes("double") || Object.keys(doubleEliminationConfig).length > 0;
    const id = `template-stage-${index + 1}`;
    const inputTeams = index === 0 ? totalTeams : Math.max(2, Math.ceil(totalTeams / 2));
    const groups = isGroup ? createTemplateGroups(inputTeams, groupCount) : [];
    const branchId = `${id}-main`;
    const brackets: StageBracketConfig[] = isGroup
      ? [{
        id: branchId,
        name: String(stage.name || "Vòng bảng"),
        type: "group",
        totalTeamsIn: inputTeams,
        groups,
        groupIds: [],
        selection: createSelection(qualifiedPerGroup, "TOP_RANKS"),
      }]
      : [{
        id: branchId,
        name: isDouble ? "Nhánh thắng" : String(stage.name || "Vòng loại trực tiếp"),
        type: "knockout",
        totalTeamsIn: inputTeams,
        groups: [],
        groupIds: [],
        selection: createSelection(Math.max(1, Math.ceil(inputTeams / 2)), "WINNER"),
        flowSlots: createTemplateKnockoutSlots(branchId, inputTeams),
      }];

    if (!isGroup) {
      brackets[0] = buildKnockoutBranch({
        stageId: id,
        branchId,
        name: isDouble ? "Nhánh thắng" : String(stage.name || "Vòng loại trực tiếp"),
        teams: previousGroupKeys.length || inputTeams,
        inputKeys: previousGroupKeys.length ? previousGroupKeys : undefined,
        hasThirdPlace,
      });
    } else {
      previousGroupKeys = groupRankKeys(groups, qualifiedPerGroup);
    }

    if (isDouble) {
      brackets.push({
        id: `${id}-loser`,
        name: "Nhánh thua",
        type: "knockout",
        totalTeamsIn: Math.max(2, Math.ceil(inputTeams / 2)),
        groups: [],
        groupIds: [],
        selection: createSelection(Math.max(1, Math.ceil(inputTeams / 4)), "LOSER"),
        flowSlots: createTemplateKnockoutSlots(`${id}-loser`, Math.max(2, Math.ceil(inputTeams / 2))),
      });
    }

    return {
      id,
      order: index + 1,
      name: String(stage.name || (isGroup ? "Vòng bảng" : "Vòng loại trực tiếp")),
      sourceType: index === 0 ? "REGISTRATION" : "PREVIOUS_STAGE",
      sourceStageIds: index === 0 ? [] : [`template-stage-${index}`],
      input: {
        teams: inputTeams,
        groups: groups.length,
        teamsPerGroup: groups[0]?.numberOfTeams || 0,
        sourceStageId: index === 0 ? "" : `template-stage-${index}`,
        selection: createSelection(inputTeams, index === 0 ? "MANUAL" : "WINNER"),
      },
      brackets,
      wildcard: { enabled: false, selection: createSelection(0, "LOSER") },
      scoring: {
        targetScore: Number(asRecord(stage.config).targetScore || asRecord(knockoutConfig).targetScore || 11),
        changeSideAt: Number(asRecord(stage.config).changeSideAt || 6),
        setsToWin: Number(asRecord(stage.config).setsToWin || 1),
        winBy: Number(asRecord(stage.config).winBy || 2),
        winPoints: 3,
        drawPoints: stageType.includes("round") ? 1 : 0,
        lossPoints: 0,
      },
      rankingCriteria,
      luckyCriteria: defaultLuckyCriteria,
      note: String(template.description || ""),
    };
  });
};

const mapTournamentTemplateToFormat = (value: unknown, index: number): CompetitionFormatRecord => {
  const template = asRecord(value);
  const stages = buildPresetStages(template);
  return {
    id: String(template.id || template._id || `preset-${index}`),
    sourceKind: "categoryRule",
    selectedType: "template",
    presetId: String(template.id || template._id || ""),
    presetSource: "competition-template",
    name: String(template.name || template.templateName || "Thể thức mẫu"),
    displayName: String(template.name || ""),
    sportType: String(template.sportType || "Chưa cấu hình"),
    description: String(template.description || ""),
    status: template.status === "inactived" ? "inactived" : "actived",
    stageCount: stages.length,
    stages,
    createdAt: String(template.createdAt || ""),
    updatedAt: String(template.updatedAt || ""),
  };
};

export const competitionFormatService = {
  // Legacy: trang tạo giải vẫn cần danh sách mẫu từ CategoryRule thật.
  async getFormats(): Promise<CompetitionFormatRecord[]> {
    try {
      const response = await api.get<ApiList<Record<string, unknown>>>("/rules/category-rules", { params: { availableOnly: true } });
      return asArray(response.data).map((item, index) => ({
        ...mapRuleToFormat(item, index),
        sourceKind: "categoryRule" as const,
      }));
    } catch (error) {
      console.error("Không thể tải danh sách thể thức từ BE.", error);
      return [];
    }
  },

  async getTemplateSports(): Promise<string[]> {
    const response = await api.get<ApiList<Record<string, unknown>>>("/rules/sports");
    return Array.from(new Set(asArray(response.data).map((item) => String(asRecord(item).displayName || asRecord(item).name || "")).filter(Boolean)));
  },

  async getCategoryTemplates(sportTypes: string[] = []): Promise<CompetitionFormatRecord[]> {
    const realSports = sportTypes.length ? sportTypes : await this.getTemplateSports();
    const uniqueSports = Array.from(new Set(realSports.flatMap((sport) => [sport, sport.toLowerCase()]).filter(Boolean)));
    const responses = await Promise.allSettled(
      uniqueSports.map((sportType) => api.get<ApiList<Record<string, unknown>>>("/rules/categories", { params: { sportType } })),
    );
    const seen = new Set<string>();
    const records = responses
      .flatMap((result) => result.status === "fulfilled" ? asArray(result.value.data) : [])
      .map(mapCategoryTemplateToFormat)
      .filter((item) => {
        const key = item.categoryTemplateId || item.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    return records;
  },

  async getCompetitionTemplates(sportType: string): Promise<CompetitionFormatRecord[]> {
    if (!sportType) return [];
    const response = await api.get<ApiList<Record<string, unknown>>>("/rules/competition-templates", { params: { sportType } });
    return asArray(response.data).map(mapTournamentTemplateToFormat);
  },

  async getCompetitionTemplateDetail(templateId: string): Promise<CompetitionFormatRecord> {
    const response = await api.get<{ success: boolean; data?: Record<string, unknown> }>(`/rules/competition-templates/${templateId}`);
    return mapTournamentTemplateToFormat(response.data.data || {}, 0);
  },

  async getTournamentOptions(): Promise<CompetitionTournamentOption[]> {
    const [singleResponse, multiResponse] = await Promise.all([
      api.get<ApiList>("/tournaments/my/single"),
      api.get<ApiList>("/tournaments/my/multi"),
    ]);

    const singles = asArray(singleResponse.data).map((item) => mapTournamentOption(item));
    const multiItems = asArray(multiResponse.data).flatMap((value) => {
      const tournament = asRecord(value);
      const items = tournament.tournamnetItem || tournament.tournamentItems || tournament.tournamentItem;
      return Array.isArray(items)
        ? items.map((item) => mapTournamentOption(item, String(tournament.name || "Hội thao")))
        : [];
    });
    return [...singles, ...multiItems].filter((item) => item.id);
  },

  async getTournamentFormat(tournamentItemId: string, option?: CompetitionTournamentOption): Promise<CompetitionFormatRecord> {
    try {
      const formatResponse = await api.get<{ success: boolean; data?: Record<string, unknown> }>(`/stages/format/${tournamentItemId}`);
      const savedFormat = asRecord(formatResponse.data.data);
      const savedConfig = asRecord(savedFormat.config);
      if (savedConfig && Array.isArray(savedConfig.stages)) {
        const selectedType = savedFormat.selectedType === "template" ? "template" : savedFormat.selectedType === "preset" ? "preset" : "custom";
        return {
          ...buildRecordFromStages(option || { id: tournamentItemId, name: "Giải đấu", sportType: "Chưa cấu hình" }, []),
          ...savedConfig,
          id: String(savedConfig.id || tournamentItemId),
          sourceKind: "local",
          selectedType,
          presetId: String(savedFormat.presetId || savedConfig.presetId || ""),
          presetSource: String(savedFormat.presetSource || savedConfig.presetSource || ""),
          tournamentItemId,
          stageCount: Number(savedConfig.stageCount || savedConfig.stages.length || 1),
          stages: savedConfig.stages.map(migrateStage),
        };
      }
    } catch (error) {
      console.info("Chưa có cấu hình thể thức đã lưu, fallback sang stage cũ.", error);
    }

    try {
      const stagesResponse = await api.get<ApiList<Record<string, unknown>>>(`/stages/tournament-item/${tournamentItemId}`);
      const stages = await Promise.all(asArray(stagesResponse.data).map(async (stage, index) => {
        const stageId = String(stage._id || stage.id || "");
        if (!stageId) return migrateStage(stage, index);
        try {
          const detail = await api.get<{ success: boolean; data: Record<string, unknown> }>(`/stages/${stageId}`);
          return migrateStage(detail.data.data, index);
        } catch {
          return migrateStage(stage, index);
        }
      }));
      return buildRecordFromStages(option || { id: tournamentItemId, name: "Giải đấu", sportType: "Chưa cấu hình" }, stages);
    } catch (error) {
      console.error("Không thể tải cấu hình thể thức của giải từ BE.", error);
      return buildRecordFromStages(option || { id: tournamentItemId, name: "Giải đấu", sportType: "Chưa cấu hình" }, []);
    }
  },

  async getEligibleTeams(tournamentItemId: string): Promise<{ totalTeams: number; teamIds: string[] }> {
    const response = await api.get<{ success: boolean; data?: { totalTeams?: number; teamIds?: string[] } }>(`/tournaments/${tournamentItemId}/eligible-teams`);
    return {
      totalTeams: Number(response.data.data?.totalTeams || 0),
      teamIds: Array.isArray(response.data.data?.teamIds) ? response.data.data.teamIds.map(String) : [],
    };
  },

  async applyTemplateFormat(tournamentItemId: string, templateId: string, config?: CompetitionFormatRecord) {
    const response = await api.post(`/tournaments/${tournamentItemId}/format/apply-template`, {
      templateId,
      config: config ? {
        id: config.id,
        tournamentItemId,
        name: config.name,
        sportType: config.sportType,
        description: config.description,
        selectedType: "template",
        presetId: config.presetId,
        presetSource: config.presetSource,
        status: config.status,
        stageCount: config.stageCount,
        stages: config.stages,
      } : undefined,
    });
    return response;
  },

  async saveTournamentFormat(tournamentItemId: string, payload: CompetitionFormatUpsertPayload) {
    const selectedType = payload.selectedType || "custom";
    const response = await api.put(`/stages/format/${tournamentItemId}`, {
      selectedType,
      presetId: payload.presetId,
      presetSource: payload.presetSource,
      name: payload.name,
      sportType: payload.sportType,
      description: payload.description,
      stageCount: payload.stageCount,
      allowLockedSync: payload.allowLockedSync,
      confirmSyncPlayed: payload.confirmSyncPlayed,
      config: {
        id: tournamentItemId,
        tournamentItemId,
        name: payload.name,
        sportType: payload.sportType,
        description: payload.description,
        selectedType,
        presetId: payload.presetId,
        presetSource: payload.presetSource,
        status: "actived",
        stageCount: payload.stageCount,
        stages: payload.stages,
      },
    });
    return [response];
  },

  async previewTeamPlacement(tournamentItemId: string, stageId: string, strategy: TeamPlacementStrategy = "SNAKE_BALANCE") {
    return teamPlacementService.preview(tournamentItemId, stageId, strategy);
  },

  async confirmTeamPlacement(tournamentItemId: string, stageId: string, strategy: TeamPlacementStrategy = "SNAKE_BALANCE") {
    return teamPlacementService.confirm(tournamentItemId, stageId, strategy);
  },

  async previewWildcard(tournamentItemId: string, stageId: string) {
    const response = await api.post(`/tournaments/${tournamentItemId}/wildcard/preview`, { stageId });
    return response.data.data;
  },

  async confirmWildcard(tournamentItemId: string, stageId: string) {
    const response = await api.post(`/tournaments/${tournamentItemId}/wildcard/confirm`, { stageId });
    return response.data.data;
  },

  async createFormat(payload: CompetitionFormatUpsertPayload) {
    return this.saveTournamentFormat(payload.tournamentItemId || "", payload);
  },

  async updateFormat(id: string, payload: CompetitionFormatUpsertPayload) {
    return this.saveTournamentFormat(payload.tournamentItemId || id, payload);
  },

  async deleteFormat(id: string) {
    throw new Error(`BE chưa có endpoint xoá toàn bộ cấu hình thể thức cho tournamentItem ${id}.`);
  },
};
