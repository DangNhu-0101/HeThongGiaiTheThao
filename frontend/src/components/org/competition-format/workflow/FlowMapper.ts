import type { BracketType, CompetitionStageConfig, StageBracketConfig } from "@/types/competitionFormat";
import { layoutFlow } from "./LayoutEngine";
import { generateRoundRobinEntrants, generateRoundRobinRows } from "./RoundRobinGenerator";
import type { FlowEdgeModel, FlowEntrant, FlowNodeModel, FlowStageColumn } from "./flowTypes";

const MATCH_SLOT_COUNT = 2;

const typeLabel: Record<BracketType, string> = {
  group: "Vòng bảng",
  knockout: "Knockout",
  swiss: "Swiss",
  custom: "Custom",
};

const accentForType = (type: BracketType): FlowNodeModel["accent"] => {
  if (type === "group") return "green";
  if (type === "knockout") return "blue";
  if (type === "swiss") return "amber";
  return "slate";
};

const evenSlotCount = (value: number) => {
  const safe = Math.max(MATCH_SLOT_COUNT, Number(value) || MATCH_SLOT_COUNT);
  return safe % MATCH_SLOT_COUNT === 0 ? safe : safe + 1;
};

const isLuckyLabel = (value?: string) => /^Lucky\d+$/i.test(String(value || "").trim());

const getVisibleDeletedMatchIds = (
  stage: CompetitionStageConfig,
  branch: StageBracketConfig,
  teamCount: number,
) => {
  const deletedIds = new Set(branch.flowDeletedMatchIds || []);
  const flowSlots = branch.flowSlots || [];
  const wildcardSlotCount = flowSlots.filter((slot) => slot.reservedForWildcard || isLuckyLabel(slot.sourceLabel)).length;
  if (!wildcardSlotCount) return deletedIds;

  const baseSlotCount = evenSlotCount(Math.max(
    MATCH_SLOT_COUNT,
    flowSlots.filter((slot) => !slot.reservedForWildcard && !isLuckyLabel(slot.sourceLabel)).length,
    teamCount - wildcardSlotCount,
  ));
  const previousDefaultMatchCount = Math.max(1, Math.ceil(baseSlotCount / MATCH_SLOT_COUNT));
  const nextDefaultMatchCount = Math.max(1, Math.ceil(teamCount / MATCH_SLOT_COUNT));
  for (let index = previousDefaultMatchCount; index < nextDefaultMatchCount; index += 1) {
    deletedIds.delete(`${stage.id}:${branch.id}:m-${index + 1}`);
  }
  return deletedIds;
};

const ensureFlowSlots = (branch: StageBracketConfig, countHint?: number) => {
  const count = evenSlotCount(countHint || branch.totalTeamsIn || MATCH_SLOT_COUNT);
  return Array.from({ length: count }, (_, index) => branch.flowSlots?.[index] || {
    id: `${branch.id}-slot-${index + 1}`,
    label: `Slot ${index + 1}`,
  });
};

const ensureTwoSeedSlots = (
  nodeId: string,
  seedSlots: FlowNodeModel["seedSlots"],
): FlowNodeModel["seedSlots"] => {
  const base = seedSlots.slice(0, MATCH_SLOT_COUNT);
  return Array.from({ length: MATCH_SLOT_COUNT }, (_, index) => base[index] || {
    id: `${nodeId}:slot-${index + 1}`,
    label: `Slot ${index + 1}`,
    globalIndex: index,
  });
};

const winnerLabelForNode = (node?: FlowNodeModel) => node?.matchCode || "M?";

const mergeIncomingSlots = (
  node: FlowNodeModel,
  incoming: FlowEdgeModel[],
  allNodes: FlowNodeModel[],
) => {
  const seedSlots = ensureTwoSeedSlots(node.id, node.seedSlots);
  const usedSlots = new Set<number>();
  incoming.slice(0, MATCH_SLOT_COUNT).forEach((edge, index) => {
    const sourceNode = allNodes.find((item) => item.id === edge.source);
    const sourceIsMatch = sourceNode?.kind === "match";
    const label = edge.label || winnerLabelForNode(sourceNode);
    const explicitSlotIndex = edge.targetSlot ? edge.targetSlot - 1 : undefined;
    const fallbackSlotIndex = seedSlots.findIndex((slot, slotIndex) => !usedSlots.has(slotIndex) && !slot.sourceLabel);
    const slotIndex = explicitSlotIndex !== undefined && explicitSlotIndex >= 0 && explicitSlotIndex < MATCH_SLOT_COUNT
      ? explicitSlotIndex
      : fallbackSlotIndex >= 0 ? fallbackSlotIndex : index;
    usedSlots.add(slotIndex);
    if (!sourceIsMatch) {
      seedSlots[slotIndex] = {
        ...seedSlots[slotIndex],
        id: `${node.id}:incoming-open-${slotIndex + 1}`,
        locked: false,
      };
      return;
    }
    seedSlots[slotIndex] = {
      ...seedSlots[slotIndex],
      id: `${node.id}:incoming-${slotIndex + 1}`,
      label,
      sourceLabel: label,
      locked: sourceIsMatch,
      globalIndex: sourceIsMatch ? undefined : seedSlots[slotIndex].globalIndex,
    };
  });
  return seedSlots;
};

const winnerEntrants = (nodeIds: string[], nodes: FlowNodeModel[]): FlowEntrant[] =>
  nodeIds.map((nodeId, index) => ({
    id: `${nodeId}:winner`,
    label: winnerLabelForNode(nodes.find((node) => node.id === nodeId)),
    sourceNodeId: nodeId,
    rank: index + 1,
  }));

const createBaseNode = (
  stage: CompetitionStageConfig,
  branch: StageBracketConfig,
  id: string,
  laneIndex = 0,
): Omit<FlowNodeModel, "title" | "subtitle" | "inputTeams" | "outputTeams" | "rows" | "entrants" | "height" | "kind" | "seedSlots"> => ({
  id,
  stageId: stage.id,
  branchId: branch.id,
  type: branch.type,
  rule: branch.selection.mode,
  x: 0,
  y: 0,
  width: 300,
  stageOrder: stage.order,
  stageName: stage.name,
  laneIndex,
  manualPosition: branch.flowNodePositions?.[id],
  accent: accentForType(branch.type),
});

const makeGroupNode = (stage: CompetitionStageConfig, branch: StageBracketConfig, laneIndex: number): FlowNodeModel => {
  const nodeId = `${stage.id}:${branch.id}`;
  const rows = generateRoundRobinRows(branch);
  const entrants = generateRoundRobinEntrants(branch, nodeId);

  return {
    ...createBaseNode(stage, branch, nodeId, laneIndex),
    kind: "branch",
    title: branch.name,
    subtitle: typeLabel[branch.type],
    inputTeams: branch.totalTeamsIn,
    outputTeams: entrants.length,
    height: Math.max(220, 118 + Math.min(rows.length, 5) * 36),
    rows,
    entrants,
    seedSlots: [],
  };
};

const makeGenericNode = (stage: CompetitionStageConfig, branch: StageBracketConfig, laneIndex: number): FlowNodeModel => {
  const nodeId = `${stage.id}:${branch.id}`;
  return {
    ...createBaseNode(stage, branch, nodeId, laneIndex),
    kind: "branch",
    title: branch.name,
    subtitle: typeLabel[branch.type],
    inputTeams: branch.totalTeamsIn,
    outputTeams: branch.selection.slots,
    height: 150,
    rows: [],
    entrants: Array.from({ length: Math.max(1, branch.selection.slots) }, (_, index) => ({
      id: `${nodeId}:slot:${index + 1}`,
      label: `${branch.name} ${index + 1}`,
      sourceNodeId: nodeId,
    })),
    seedSlots: [],
  };
};

const makeKnockoutNodes = (
  stage: CompetitionStageConfig,
  branch: StageBracketConfig,
  laneIndex: number,
  nextMatchCode: () => string,
): { nodes: FlowNodeModel[]; edges: FlowEdgeModel[]; outputNodeIds: string[]; entrants: FlowEntrant[] } => {
  const nodes: FlowNodeModel[] = [];
  const edges: FlowEdgeModel[] = [];
  const teamCount = evenSlotCount(Math.max(branch.flowSlots?.length || 0, branch.totalTeamsIn || MATCH_SLOT_COUNT));
  const flowSlots = ensureFlowSlots(branch, teamCount);
  const defaultMatchCount = Math.max(1, Math.ceil(teamCount / MATCH_SLOT_COUNT));
  const deletedMatchIds = getVisibleDeletedMatchIds(stage, branch, teamCount);

  for (let index = 0; index < defaultMatchCount; index += 1) {
    const matchCode = nextMatchCode();
    const nodeId = `${stage.id}:${branch.id}:m-${index + 1}`;
    if (deletedMatchIds.has(nodeId)) continue;
    const firstSlot = flowSlots[index * MATCH_SLOT_COUNT];
    const secondSlot = flowSlots[index * MATCH_SLOT_COUNT + 1];
    nodes.push({
      ...createBaseNode(stage, branch, nodeId, laneIndex),
      stageOrder: stage.order,
      kind: "match",
      title: matchCode,
      subtitle: "",
      inputTeams: MATCH_SLOT_COUNT,
      outputTeams: 1,
      height: 126,
      rows: [],
      entrants: [],
      seedSlots: [
        { id: `${nodeId}:slot-1`, label: firstSlot?.label || `Slot ${index * MATCH_SLOT_COUNT + 1}`, globalIndex: index * MATCH_SLOT_COUNT, sourceLabel: firstSlot?.sourceLabel },
        { id: `${nodeId}:slot-2`, label: secondSlot?.label || `Slot ${index * MATCH_SLOT_COUNT + 2}`, globalIndex: index * MATCH_SLOT_COUNT + 1, sourceLabel: secondSlot?.sourceLabel },
      ],
      matchCode,
    });
  }

  (branch.flowStandaloneMatches || []).forEach((match) => {
    const nodeId = match.id;
    const matchCode = match.matchCode?.trim() || nextMatchCode();
    const seedSlots = ensureTwoSeedSlots(nodeId, [
      {
        id: match.seedSlots?.[0]?.id || `${nodeId}:slot-1`,
        label: match.seedSlots?.[0]?.label || "Slot 1",
        sourceLabel: match.seedSlots?.[0]?.sourceLabel,
        globalIndex: -1,
      },
      {
        id: match.seedSlots?.[1]?.id || `${nodeId}:slot-2`,
        label: match.seedSlots?.[1]?.label || "Slot 2",
        sourceLabel: match.seedSlots?.[1]?.sourceLabel,
        globalIndex: -2,
      },
    ]);

    nodes.push({
      ...createBaseNode(stage, branch, nodeId, laneIndex),
      manualPosition: branch.flowNodePositions?.[nodeId] || (match.x !== undefined && match.y !== undefined ? { x: match.x, y: match.y } : undefined),
      stageOrder: stage.order,
      kind: "match",
      title: matchCode,
      subtitle: "Match them thu cong",
      inputTeams: MATCH_SLOT_COUNT,
      outputTeams: 1,
      height: 126,
      rows: [],
      entrants: [],
      seedSlots,
      matchCode,
    });
  });

  (branch.flowConnections || []).forEach((connection) => {
    if (!nodes.some((node) => node.id === connection.source) || !nodes.some((node) => node.id === connection.target)) return;
    const sourceNode = nodes.find((node) => node.id === connection.source);
    edges.push({
      id: connection.id,
      source: connection.source,
      target: connection.target,
      label: connection.label || winnerLabelForNode(sourceNode),
      targetSlot: connection.targetSlot,
      route: branch.flowConnectionRoutes?.[connection.id],
    });
  });

  const outputNodeIds = nodes.filter((node) => node.kind === "match").map((node) => node.id);
  return {
    nodes,
    edges,
    outputNodeIds,
    entrants: winnerEntrants(outputNodeIds, nodes),
  };
};

export const mapStagesToFlow = (stages: CompetitionStageConfig[]) => {
  const nodes: FlowNodeModel[] = [];
  const edges: FlowEdgeModel[] = [];
  const manualConnections: FlowEdgeModel[] = [];
  const matchCounterRef = { current: 1 };
  const nextMatchCode = () => `M${matchCounterRef.current++}`;

  stages.forEach((stage) => {
    stage.brackets.forEach((branch, branchIndex) => {
      const laneIndex = branch.type === "group" ? 0 : branchIndex;
      if (branch.type === "group") {
        nodes.push(makeGroupNode(stage, branch, laneIndex));
        return;
      }

      if (branch.type === "knockout") {
        const result = makeKnockoutNodes(stage, branch, laneIndex, nextMatchCode);
        nodes.push(...result.nodes);
        manualConnections.push(...result.edges);
        return;
      }

      nodes.push(makeGenericNode(stage, branch, laneIndex));
    });
  });

  const manualById = new Map(manualConnections.map((edge) => [edge.id, edge]));
  stages.forEach((stage) => {
    stage.brackets.forEach((branch) => {
      (branch.flowConnections || []).forEach((connection) => {
        const sourceNode = nodes.find((node) => node.id === connection.source);
        const targetNode = nodes.find((node) => node.id === connection.target);
        if (!sourceNode || !targetNode) return;
        manualById.set(connection.id, {
          id: connection.id,
          source: connection.source,
          target: connection.target,
          label: connection.label || winnerLabelForNode(sourceNode),
          targetSlot: connection.targetSlot,
          route: branch.flowConnectionRoutes?.[connection.id],
        });
      });
    });
  });

  const manualEdges = Array.from(manualById.values());
  const manualSourceIds = new Set(manualEdges.map((edge) => edge.source));
  edges.push(...manualEdges);
  const validEdges = edges.filter((edge) => !manualSourceIds.has(edge.source) || manualById.has(edge.id));

  const incomingCount = new Map<string, number>();
  const outgoingCount = new Map<string, number>();
  const cappedEdges = validEdges.filter((edge) => {
    const source = nodes.find((node) => node.id === edge.source);
    const target = nodes.find((node) => node.id === edge.target);
    if (!source || !target) return false;
    const outgoing = outgoingCount.get(edge.source) || 0;
    const incoming = incomingCount.get(edge.target) || 0;
    if (source.kind === "match" && outgoing >= 1) return false;
    if (target.kind === "match" && incoming >= MATCH_SLOT_COUNT) return false;
    outgoingCount.set(edge.source, outgoing + 1);
    incomingCount.set(edge.target, incoming + 1);
    return true;
  });

  const incomingEdgesByTarget = new Map<string, FlowEdgeModel[]>();
  cappedEdges.forEach((edge) => {
    incomingEdgesByTarget.set(edge.target, [...(incomingEdgesByTarget.get(edge.target) || []), edge]);
  });

  const slottedEdges = cappedEdges.map((edge) => {
    const target = nodes.find((node) => node.id === edge.target);
    if (target?.kind !== "match") return edge;
    if (edge.targetSlot === 1 || edge.targetSlot === 2) return edge;
    const slotIndex = incomingEdgesByTarget.get(edge.target)?.findIndex((item) => item.id === edge.id) ?? -1;
    if (slotIndex < 0 || slotIndex >= MATCH_SLOT_COUNT) return edge;
    return { ...edge, targetSlot: (slotIndex + 1) as 1 | 2 };
  });

  let changed = true;
  while (changed) {
    changed = false;
    slottedEdges.forEach((edge) => {
      const source = nodes.find((node) => node.id === edge.source);
      const target = nodes.find((node) => node.id === edge.target);
      if (!source || !target || source.kind !== "match" || target.kind !== "match") return;
      const nextOrder = source.stageOrder + 1;
      if (target.stageOrder < nextOrder) {
        target.stageOrder = nextOrder;
        changed = true;
      }
    });
  }

  nodes.forEach((node) => {
    if (node.kind !== "match") return;
    const incoming = incomingEdgesByTarget.get(node.id) || [];
    node.seedSlots = incoming.length
      ? mergeIncomingSlots(node, incoming.map((edge) => slottedEdges.find((item) => item.id === edge.id) || edge), nodes)
      : ensureTwoSeedSlots(node.id, node.seedSlots);
  });

  const columnOrders = Array.from(new Set(nodes.map((node) => node.stageOrder))).sort((a, b) => a - b);
  const columns: Omit<FlowStageColumn, "x" | "width" | "height">[] = columnOrders.map((order, index) => {
    const stage = stages.find((item) => item.order === order);
    const firstNode = nodes.find((node) => node.stageOrder === order);
    return {
      id: `stage-column-${order}`,
      title: stage?.name || firstNode?.stageName || `Stage ${index + 1}`,
      order,
    };
  });

  return layoutFlow(nodes, columns, slottedEdges);
};
