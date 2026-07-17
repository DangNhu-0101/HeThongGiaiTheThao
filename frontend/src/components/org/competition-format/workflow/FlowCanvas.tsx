import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ChevronsDown, ChevronsUp, LocateFixed, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mapStagesToFlow } from "./FlowMapper";
import FlowEdge from "./FlowEdge";
import FlowNode from "./FlowNode";
import type { FlowEntrant, FlowNodeModel } from "./flowTypes";
import type { CompetitionStageConfig } from "@/types/competitionFormat";

interface Props {
  stages: CompetitionStageConfig[];
  focusedBranchId?: string;
  onFocusBranch: (stageId: string, branchId?: string) => void;
  onChangeStage: (stage: CompetitionStageConfig) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type AssignedSlotDrag = {
  stageId: string;
  branchId?: string;
  nodeId: string;
  globalIndex: number;
  label: string;
};

const isLuckyLabel = (value?: string) => /^Lucky\d+$/i.test(String(value || "").trim());

const FlowCanvas = ({ stages, focusedBranchId, onFocusBranch, onChangeStage }: Props) => {
  const graph = useMemo(() => mapStagesToFlow(stages), [stages]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const nodeDragRef = useRef<{ node: FlowNodeModel; x: number; y: number; nodeX: number; nodeY: number; moved: boolean } | null>(null);
  const connectDragRef = useRef<{ sourceNode: FlowNodeModel } | null>(null);
  const didInitialFitRef = useRef(false);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string>();
  const [hoveredNodeId, setHoveredNodeId] = useState<string>();
  const [connectionSourceId, setConnectionSourceId] = useState<string>();
  const [connectionPickerSourceId, setConnectionPickerSourceId] = useState<string>();
  const [connectionDraft, setConnectionDraft] = useState<{ sourceId: string; targetId: string }>();
  const [selectedConnectionTargetIds, setSelectedConnectionTargetIds] = useState<string[]>([]);
  const [connectPreview, setConnectPreview] = useState<{ sourceId: string; x: number; y: number }>();
  const [keyPanelOpen, setKeyPanelOpen] = useState(true);
  const [view, setView] = useState({ scale: 0.78, x: 24, y: 28 });

  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);
  const assignedLabels = useMemo(() => new Set(
    [
      ...stages.flatMap((stage) => stage.brackets.flatMap((branch) => branch.flowSlots || [])),
      ...stages.flatMap((stage) => stage.brackets.flatMap((branch) => branch.flowStandaloneMatches?.flatMap((match) => match.seedSlots || []) || [])),
      ...graph.nodes.flatMap((node) => node.seedSlots.filter((slot) => slot.locked)),
    ]
      .map((slot) => slot.sourceLabel)
      .filter(Boolean) as string[],
  ), [graph.nodes, stages]);
  const dragGroups = useMemo(() => {
    const rankingKeys = graph.nodes.filter((node) => node.type === "group").flatMap((node) => node.entrants);
    const isFinalMatch = (node: FlowNodeModel) => graph.edges.some((edge) => edge.source === node.id && edge.target === "champion");
    const winnerKeys = graph.nodes
      .filter((node) => node.kind === "match" && node.matchCode && !isFinalMatch(node))
      .map((node) => ({ id: `${node.id}:winner-key`, label: node.matchCode!, sourceNodeId: node.id }));
    const loserKeys = graph.nodes
      .filter((node) => node.kind === "match" && node.matchCode && !isFinalMatch(node))
      .map((node) => ({ id: `${node.id}:loser-key`, label: `L${node.matchCode!.replace("M", "")}`, sourceNodeId: node.id }));
    const luckyKeys = stages.flatMap((stage) => {
      if (!stage.wildcard.enabled || stage.wildcard.selection.slots <= 0) return [];
      const wildcardId = `${stage.id}:wildcard`;
      return Array.from({ length: stage.wildcard.selection.slots }, (_, index) => ({
        id: `${wildcardId}:${index + 1}`,
        label: `Lucky${index + 1}`,
        sourceNodeId: wildcardId,
      }));
    });
    const available = (items: FlowEntrant[]) => items.filter((item) => !assignedLabels.has(item.label));
    return [
      { title: "Key thứ hạng bảng", items: available(rankingKeys) },
      { title: "Key thắng trận", items: available(winnerKeys) },
      { title: "Key thua trận", items: available(loserKeys) },
      { title: "Lucky Team", items: available(luckyKeys) },
    ].filter((group) => group.items.length > 0);
  }, [assignedLabels, graph.edges, graph.nodes, stages]);
  const focusedNodeId = useMemo(
    () => graph.nodes.find((node) => node.branchId === focusedBranchId)?.id,
    [focusedBranchId, graph.nodes],
  );

  const fitView = useCallback(() => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = clamp(Math.min((rect.width - 48) / graph.width, (rect.height - 48) / graph.height), 0.35, 1.15);
    setView({
      scale,
      x: Math.max(24, (rect.width - graph.width * scale) / 2),
      y: Math.max(24, (rect.height - graph.height * scale) / 2),
    });
  }, [graph.height, graph.width]);

  const clearSeedInStage = (stage: CompetitionStageConfig, payload: AssignedSlotDrag) => ({
    ...stage,
    brackets: stage.brackets.map((branch) => {
      if (branch.id !== payload.branchId) return branch;
      if (payload.globalIndex < 0) {
        const slotIndex = Math.abs(payload.globalIndex) - 1;
        return {
          ...branch,
          flowStandaloneMatches: (branch.flowStandaloneMatches || []).map((match) => {
            if (match.id !== payload.nodeId) return match;
            const seedSlots = Array.from({ length: 2 }, (_, index) => match.seedSlots?.[index] || {
              id: `${match.id}:slot-${index + 1}`,
              label: `Slot ${index + 1}`,
            });
            seedSlots[slotIndex] = { ...seedSlots[slotIndex], sourceLabel: undefined };
            return { ...match, seedSlots };
          }),
        };
      }

      const rawSlotCount = Math.max(2, branch.totalTeamsIn || 2);
      const slotCount = rawSlotCount % 2 === 0 ? rawSlotCount : rawSlotCount + 1;
      const flowSlots = Array.from({ length: slotCount }, (_, index) => branch.flowSlots?.[index] || {
        id: `${branch.id}-slot-${index + 1}`,
        label: `Slot ${index + 1}`,
      });
      if (!flowSlots[payload.globalIndex]) return branch;
      flowSlots[payload.globalIndex] = {
        ...flowSlots[payload.globalIndex],
        sourceLabel: undefined,
        reservedForWildcard: undefined,
        sourceStageId: undefined,
        sourceGroupName: undefined,
        sourceRank: undefined,
      };
      return { ...branch, flowSlots };
    }),
  });

  const clientToGraphPoint = (clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    return {
      x: ((clientX - (rect?.left || 0)) - view.x) / view.scale,
      y: ((clientY - (rect?.top || 0)) - view.y) / view.scale,
    };
  };

  useEffect(() => {
    if (didInitialFitRef.current) return;
    didInitialFitRef.current = true;
    fitView();
  }, [fitView, graph.width, graph.height]);

  const activeNodeIds = useMemo(() => {
    const active = new Set<string>();
    if (hoveredEdgeId) {
      const edge = graph.edges.find((item) => item.id === hoveredEdgeId);
      if (edge) {
        active.add(edge.source);
        active.add(edge.target);
      }
    }
    if (hoveredNodeId) active.add(hoveredNodeId);
    if (focusedNodeId) active.add(focusedNodeId);
    return active;
  }, [focusedNodeId, graph.edges, hoveredEdgeId, hoveredNodeId]);

  const getStageAndBranch = (node: FlowNodeModel) => {
    const stage = stages.find((item) => item.id === node.stageId);
    const branch = stage?.brackets.find((item) => item.id === node.branchId);
    return { stage, branch };
  };

  const graphConnectionsForBranch = (branchId?: string) => {
    const sourceNodeIds = new Set(
      graph.nodes
        .filter((node) => node.kind !== "champion" && node.branchId === branchId)
        .map((node) => node.id),
    );
    return graph.edges
      .filter((edge) => sourceNodeIds.has(edge.source) && nodeById.get(edge.target)?.kind === "match")
      .map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        output: "WINNER" as const,
        targetSlot: edge.targetSlot,
        targetSlotId: edge.targetSlot ? `${edge.target}:slot-${edge.targetSlot}` : undefined,
        sourceStageId: nodeById.get(edge.source)?.stageId,
        targetStageId: nodeById.get(edge.target)?.stageId,
      }));
  };

  const updateBranchByNode = (node: FlowNodeModel, patcher: (branch: NonNullable<ReturnType<typeof getStageAndBranch>["branch"]>) => NonNullable<ReturnType<typeof getStageAndBranch>["branch"]>) => {
    const { stage, branch } = getStageAndBranch(node);
    if (!stage || !branch) return;
    onChangeStage({
      ...stage,
      brackets: stage.brackets.map((item) => item.id === branch.id ? patcher(branch) : item),
    });
  };

  const wouldCreateCycle = (sourceId: string, targetId: string, connections: Array<{ source: string; target: string }>) => {
    const adjacency = new Map<string, string[]>();
    connections.forEach((connection) => {
      adjacency.set(connection.source, [...(adjacency.get(connection.source) || []), connection.target]);
    });
    adjacency.set(sourceId, [...(adjacency.get(sourceId) || []), targetId]);
    const stack = [targetId];
    const visited = new Set<string>();
    while (stack.length) {
      const current = stack.pop()!;
      if (current === sourceId) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      stack.push(...(adjacency.get(current) || []));
    }
    return false;
  };

  const connectTargets = (sourceId: string, targetIds: string[]) => {
    const source = nodeById.get(sourceId);
    const uniqueTargetIds = [...new Set(targetIds)].filter((targetId) => targetId !== sourceId && nodeById.get(targetId)?.kind === "match");
    if (!source) return;

    updateBranchByNode(source, (branch) => {
      const nodeIds = new Set(graph.nodes.map((node) => node.id));
      const baseConnections = (branch.flowConnections || graphConnectionsForBranch(branch.id))
        .filter((connection) => nodeIds.has(connection.source) && nodeIds.has(connection.target));
      let nextConnections = source.kind === "match"
        ? baseConnections.filter((connection) => connection.source !== source.id)
        : baseConnections.filter((connection) => !(connection.source === source.id && uniqueTargetIds.includes(connection.target)));
      const graphEdgesAfterSourceRemoval = graph.edges
        .filter((edge) => edge.source !== source.id && nodeIds.has(edge.source) && nodeIds.has(edge.target));
      const graphConnections = graphEdgesAfterSourceRemoval
        .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
        .map((edge) => ({ source: edge.source, target: edge.target }));
      const skipped: string[] = [];
      const nextIncomingByTarget = new Map<string, number[]>();
      graphEdgesAfterSourceRemoval.forEach((edge) => {
        if (edge.targetSlot === 1 || edge.targetSlot === 2) {
          nextIncomingByTarget.set(edge.target, [...(nextIncomingByTarget.get(edge.target) || []), edge.targetSlot]);
        }
      });
      nextConnections.forEach((connection) => {
        if (connection.targetSlot === 1 || connection.targetSlot === 2) {
          const occupied = nextIncomingByTarget.get(connection.target) || [];
          if (!occupied.includes(connection.targetSlot)) {
            nextIncomingByTarget.set(connection.target, [...occupied, connection.targetSlot]);
          }
        }
      });

      uniqueTargetIds.forEach((targetId) => {
        const target = nodeById.get(targetId);
        if (!target) return;
        const incomingCount = graphEdgesAfterSourceRemoval.filter((edge) => edge.target === targetId).length;
        if (incomingCount >= 2) {
          skipped.push(target.matchCode || target.title);
          return;
        }
        if (source.kind === "match" && nextConnections.some((connection) => connection.source === source.id)) {
          skipped.push(target.matchCode || target.title);
          return;
        }
        if (wouldCreateCycle(source.id, targetId, graphConnections)) {
          skipped.push(target.matchCode || target.title);
          return;
        }
        const occupiedSlots = new Set(nextIncomingByTarget.get(targetId) || []);
        const removedSourceSlots = new Set(
          graph.edges
            .filter((edge) => edge.source === source.id && edge.target === targetId && (edge.targetSlot === 1 || edge.targetSlot === 2))
            .map((edge) => edge.targetSlot),
        );
        target.seedSlots.forEach((slot, index) => {
          const slotNumber = (index + 1) as 1 | 2;
          if (slot.sourceLabel && !removedSourceSlots.has(slotNumber)) occupiedSlots.add(slotNumber);
        });
        const targetSlot = (!occupiedSlots.has(1) ? 1 : !occupiedSlots.has(2) ? 2 : undefined) as 1 | 2 | undefined;
        if (!targetSlot) {
          skipped.push(target.matchCode || target.title);
          return;
        }
        const connection = {
          id: `${source.id}->${targetId}:slot-${targetSlot}`,
          source: source.id,
          target: targetId,
          label: source.matchCode || source.title,
          output: "WINNER" as const,
          targetSlot,
          targetSlotId: `${targetId}:slot-${targetSlot}`,
          sourceStageId: source.stageId,
          targetStageId: target.stageId,
        };
        if (!nextConnections.some((item) => item.id === connection.id)) nextConnections = [...nextConnections, connection];
        nextIncomingByTarget.set(targetId, [...(nextIncomingByTarget.get(targetId) || []), targetSlot]);
      });

      if (skipped.length) window.alert(`Một số match không thể nối: ${skipped.join(", ")}.`);
      const routeIds = new Set(nextConnections.map((connection) => connection.id));
      const flowConnectionRoutes = Object.fromEntries(
        Object.entries(branch.flowConnectionRoutes || {}).filter(([edgeId]) => routeIds.has(edgeId)),
      );
      return {
        ...branch,
        flowConnections: nextConnections,
        flowConnectionRoutes,
        flowConnectionsConfigured: true,
      };
    });
  };

  const selectNode = (node: FlowNodeModel) => {
    if (connectionSourceId && node.kind === "match" && node.id !== connectionSourceId) {
      setConnectionDraft({ sourceId: connectionSourceId, targetId: node.id });
      return;
    }
    onFocusBranch(node.stageId, node.branchId);
  };

  const assignSeed = (node: FlowNodeModel, globalIndex: number, entrant: FlowEntrant) => {
    const stage = stages.find((item) => item.id === node.stageId);
    const branch = stage?.brackets.find((item) => item.id === node.branchId);
    if (!stage || !branch) return;
    const origin = entrant.assignedSlot;
    if (origin && (origin.stageId !== node.stageId || origin.branchId !== node.branchId || origin.nodeId !== node.id || origin.globalIndex !== globalIndex)) {
      const originStage = stages.find((item) => item.id === origin.stageId);
      if (originStage && originStage.id !== stage.id) onChangeStage(clearSeedInStage(originStage, { ...origin, label: entrant.label }));
    }
    const workingStage = origin?.stageId === stage.id
      ? clearSeedInStage(stage, { ...origin, label: entrant.label })
      : stage;
    const workingBranch = workingStage.brackets.find((item) => item.id === node.branchId);
    if (!workingBranch) return;

    if (globalIndex < 0) {
      const slotIndex = Math.abs(globalIndex) - 1;
      onChangeStage({
        ...workingStage,
        brackets: workingStage.brackets.map((item) => {
          if (item.id !== workingBranch.id) return item;
          return {
            ...item,
            flowStandaloneMatches: (item.flowStandaloneMatches || []).map((match) => {
              if (match.id !== node.id) return match;
              const seedSlots = Array.from({ length: 2 }, (_, index) => match.seedSlots?.[index] || {
                id: `${match.id}:slot-${index + 1}`,
                label: `Slot ${index + 1}`,
              });
              seedSlots[slotIndex] = {
                ...seedSlots[slotIndex],
                sourceLabel: entrant.label,
              };
              return { ...match, seedSlots };
            }),
          };
        }),
      });
      return;
    }
    const rawSlotCount = Math.max(2, workingBranch.totalTeamsIn || 2);
    const slotCount = rawSlotCount % 2 === 0 ? rawSlotCount : rawSlotCount + 1;
    const slots = Array.from({ length: slotCount }, (_, index) => workingBranch.flowSlots?.[index] || {
      id: `${workingBranch.id}-slot-${index + 1}`,
      label: `Slot ${index + 1}`,
    });
    slots[globalIndex] = {
      ...slots[globalIndex],
      sourceLabel: entrant.label,
      reservedForWildcard: isLuckyLabel(entrant.label) ? true : slots[globalIndex].reservedForWildcard,
      sourceStageId: entrant.sourceNodeId.split(":")[0],
      sourceRank: entrant.rank,
    };
    onChangeStage({
      ...workingStage,
      brackets: workingStage.brackets.map((item) => item.id === workingBranch.id ? { ...item, flowSlots: slots } : item),
    });
  };

  const clearAssignedSeed = (payload: AssignedSlotDrag) => {
    const stage = stages.find((item) => item.id === payload.stageId);
    const branch = stage?.brackets.find((item) => item.id === payload.branchId);
    if (!stage || !branch) return;

    if (payload.globalIndex < 0) {
      const slotIndex = Math.abs(payload.globalIndex) - 1;
      onChangeStage({
        ...stage,
        brackets: stage.brackets.map((item) => {
          if (item.id !== branch.id) return item;
          return {
            ...item,
            flowStandaloneMatches: (item.flowStandaloneMatches || []).map((match) => {
              if (match.id !== payload.nodeId) return match;
              const seedSlots = Array.from({ length: 2 }, (_, index) => match.seedSlots?.[index] || {
                id: `${match.id}:slot-${index + 1}`,
                label: `Slot ${index + 1}`,
              });
              seedSlots[slotIndex] = {
                ...seedSlots[slotIndex],
                sourceLabel: undefined,
              };
              return { ...match, seedSlots };
            }),
          };
        }),
      });
      return;
    }

    const rawSlotCount = Math.max(2, branch.totalTeamsIn || 2);
    const slotCount = rawSlotCount % 2 === 0 ? rawSlotCount : rawSlotCount + 1;
    const slots = Array.from({ length: slotCount }, (_, index) => branch.flowSlots?.[index] || {
      id: `${branch.id}-slot-${index + 1}`,
      label: `Slot ${index + 1}`,
    });
    if (!slots[payload.globalIndex]) return;
    slots[payload.globalIndex] = {
      ...slots[payload.globalIndex],
      sourceLabel: undefined,
      reservedForWildcard: slots[payload.globalIndex].reservedForWildcard && isLuckyLabel(slots[payload.globalIndex].sourceLabel) ? true : undefined,
      sourceStageId: undefined,
      sourceGroupName: undefined,
      sourceRank: undefined,
    };
    onChangeStage({
      ...stage,
      brackets: stage.brackets.map((item) => item.id === branch.id ? { ...item, flowSlots: slots } : item),
    });
  };

  const addMatchToBranch = (stageId?: string, branchId?: string) => {
    const stage = stages.find((item) => item.id === stageId) || stages.find((item) => item.brackets.some((branch) => branch.id === branchId));
    const branch = stage?.brackets.find((item) => item.id === branchId) || stage?.brackets.find((item) => item.type === "knockout");
    if (!stage || !branch) return;
    const branchNodes = graph.nodes.filter((item) => item.kind === "match" && item.branchId === branch.id);
    const anchor = branchNodes[branchNodes.length - 1];
    const existingCodes = branchNodes
      .filter((item) => item.matchCode)
      .map((item) => Number(item.matchCode!.replace("M", "")))
      .filter((value) => !Number.isNaN(value));
    const nextCode = Math.max(0, ...existingCodes) + 1;
    const id = `${branch.id}:custom-${Date.now()}`;
    const x = (anchor?.x || 120) + 80;
    const y = (anchor?.y || 120) + 210;
    onChangeStage({
      ...stage,
      brackets: stage.brackets.map((item) => item.id === branch.id
        ? {
          ...item,
          flowStandaloneMatches: [
            ...(item.flowStandaloneMatches || []),
            {
              id,
              matchCode: `M${nextCode}`,
              x,
              y,
              seedSlots: [
                { id: `${id}:slot-1`, label: "Slot 1" },
                { id: `${id}:slot-2`, label: "Slot 2" },
              ],
            },
          ],
          flowNodePositions: {
            ...(item.flowNodePositions || {}),
            [id]: { x, y },
          },
          flowConnections: item.flowConnections || graphConnectionsForBranch(item.id),
          flowConnectionsConfigured: true,
        }
        : item),
    });
  };

  const moveNode = (node: FlowNodeModel, x: number, y: number) => {
    if (node.kind === "champion") return;
    updateBranchByNode(node, (branch) => ({
      ...branch,
      flowNodePositions: {
        ...(branch.flowNodePositions || {}),
        [node.id]: { x: Math.max(24, x), y: Math.max(80, y) },
      },
      flowStandaloneMatches: (branch.flowStandaloneMatches || []).map((match) => (
        match.id === node.id ? { ...match, x: Math.max(24, x), y: Math.max(80, y) } : match
      )),
    }));
  };

  const deleteMatch = (node: FlowNodeModel) => {
    updateBranchByNode(node, (branch) => {
      const flowConnections = (branch.flowConnections || graphConnectionsForBranch(branch.id))
        .filter((connection) => connection.source !== node.id && connection.target !== node.id);
      const routeIds = new Set(flowConnections.map((connection) => connection.id));
      return {
        ...branch,
        flowStandaloneMatches: (branch.flowStandaloneMatches || []).filter((match) => match.id !== node.id),
        flowDeletedMatchIds: node.id.includes(":custom-")
          ? branch.flowDeletedMatchIds
          : Array.from(new Set([...(branch.flowDeletedMatchIds || []), node.id])),
        flowConnections,
        flowConnectionsConfigured: true,
        flowConnectionRoutes: Object.fromEntries(
          Object.entries(branch.flowConnectionRoutes || {}).filter(([edgeId]) => routeIds.has(edgeId)),
        ),
        flowNodePositions: Object.fromEntries(
          Object.entries(branch.flowNodePositions || {}).filter(([nodeId]) => nodeId !== node.id),
        ),
      };
    });
    setConnectionPickerSourceId((current) => current === node.id ? undefined : current);
    setSelectedConnectionTargetIds((current) => current.filter((targetId) => targetId !== node.id));
  };

  const confirmConnection = () => {
    if (!connectionDraft) return;
    connectTargets(connectionDraft.sourceId, [connectionDraft.targetId]);
    setConnectionDraft(undefined);
    setConnectionSourceId(undefined);
    setConnectionPickerSourceId(undefined);
    setSelectedConnectionTargetIds([]);
  };

  const beginConnectDrag = (node: FlowNodeModel, event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    connectDragRef.current = { sourceNode: node };
    setConnectionSourceId(node.id);
    setConnectPreview({ sourceId: node.id, ...clientToGraphPoint(event.clientX, event.clientY) });
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const finishConnectDrag = (event: PointerEvent<HTMLElement>) => {
    const drag = connectDragRef.current;
    if (!drag) return false;
    const targetElement = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest("[data-flow-node-id]") as HTMLElement | null;
    const targetId = targetElement?.dataset.flowNodeId;
    if (targetId && targetId !== drag.sourceNode.id) {
      const target = nodeById.get(targetId);
      if (target?.kind === "match") {
        setConnectionDraft({ sourceId: drag.sourceNode.id, targetId });
      }
    }
    connectDragRef.current = null;
    setConnectPreview(undefined);
    return true;
  };

  const updateEdgeRoute = (edgeId: string, route: { bendX?: number; bendY?: number }) => {
    const edge = graph.edges.find((item) => item.id === edgeId);
    const source = edge ? nodeById.get(edge.source) : undefined;
    if (!edge || !source) return;
    updateBranchByNode(source, (branch) => ({
      ...branch,
      flowConnections: branch.flowConnections || graphConnectionsForBranch(branch.id),
      flowConnectionsConfigured: true,
      flowConnectionRoutes: {
        ...(branch.flowConnectionRoutes || {}),
        [edgeId]: {
          ...(branch.flowConnectionRoutes?.[edgeId] || {}),
          ...route,
        },
      },
    }));
  };

  return (
    <section className="flex h-full min-h-[820px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex min-h-20 shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-black uppercase text-foreground">Bracket Flow Canvas</h2>
          <p className="max-w-3xl text-xs leading-5 text-muted-foreground">
            Kéo key từ panel vào slot trận. Key đã dùng sẽ ẩn khỏi list; thay key khác thì key cũ quay lại. Đội thắng dùng mã trận M1, M2; đội thua dùng L1, L2 khi có nhánh thua.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon-sm" onClick={() => setView((current) => ({ ...current, scale: clamp(current.scale - 0.1, 0.3, 1.8) }))} title="Thu nhỏ">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-14 text-center text-xs font-bold text-muted-foreground">{Math.round(view.scale * 100)}%</span>
          <Button type="button" variant="outline" size="icon-sm" onClick={() => setView((current) => ({ ...current, scale: clamp(current.scale + 0.1, 0.3, 1.8) }))} title="Phóng to">
            <Plus className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon-sm" onClick={fitView} title="Fit view">
            <LocateFixed className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addMatchToBranch(stages.find((stage) => stage.brackets.some((branch) => branch.id === focusedBranchId))?.id, focusedBranchId)}
            disabled={!focusedBranchId}
            title="Thêm match độc lập vào nhánh đang chọn"
          >
            <Plus className="h-4 w-4" /> Match
          </Button>
        </div>
      </div>

      <div data-drag-panel="true" className="shrink-0 border-b border-border bg-card/95">
        <button
          type="button"
          className="flex h-9 w-full items-center justify-center gap-2 text-xs font-black uppercase text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => setKeyPanelOpen((value) => !value)}
        >
          {keyPanelOpen ? <ChevronsUp className="h-4 w-4" /> : <ChevronsDown className="h-4 w-4" />}
          {keyPanelOpen ? "Thu Keys" : "Kéo xuống Keys"}
        </button>
        {keyPanelOpen && (
          <div className="max-h-44 overflow-y-auto px-4 pb-3 beautiful-scrollbar">
          
            <div className="grid gap-3 lg:grid-cols-4">
              {dragGroups.map((group) => (
                <div key={group.title} className="min-w-0">
                  <p className="mb-2 text-[11px] font-black uppercase text-muted-foreground">{group.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span
                        key={item.id}
                        draggable
                        onDragStart={(event) => {
                          event.stopPropagation();
                          event.dataTransfer.setData("application/x-flow-entrant", JSON.stringify(item));
                          event.dataTransfer.effectAllowed = "copyMove";
                        }}
                        className="cursor-grab rounded-md border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-xs font-black text-primary shadow-sm active:cursor-grabbing"
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        ref={viewportRef}
        className="relative flex-1 overflow-auto bg-[#f8fbfd] beautiful-scrollbar"
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes("application/x-flow-assigned-slot")) event.preventDefault();
        }}
        onDrop={(event) => {
          const raw = event.dataTransfer.getData("application/x-flow-assigned-slot");
          if (!raw) return;
          if ((event.target as HTMLElement).closest("[data-flow-node='true']")) return;
          event.preventDefault();
          clearAssignedSeed(JSON.parse(raw) as AssignedSlotDrag);
        }}
        onWheel={(event) => {
          if (!event.ctrlKey) return;
          event.preventDefault();
          setView((current) => ({ ...current, scale: clamp(current.scale - event.deltaY * 0.001, 0.3, 1.8) }));
        }}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("[data-flow-node='true']")) return;
        }}
        onPointerMove={(event) => {
          if (connectDragRef.current) {
            setConnectPreview({
              sourceId: connectDragRef.current.sourceNode.id,
              ...clientToGraphPoint(event.clientX, event.clientY),
            });
            return;
          }
          if (nodeDragRef.current) {
            const drag = nodeDragRef.current;
            const nextX = drag.nodeX + (event.clientX - drag.x) / view.scale;
            const nextY = drag.nodeY + (event.clientY - drag.y) / view.scale;
            drag.moved = true;
            moveNode(drag.node, nextX, nextY);
            return;
          }
        }}
        onPointerUp={(event) => {
          const handledConnect = finishConnectDrag(event);
          nodeDragRef.current = null;
          if (handledConnect) return;
          if ((event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) {
            (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
          }
        }}
      >
        <div className="absolute inset-0 opacity-80 soft-grid-bg" />
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: graph.width, height: graph.height, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        >
          {graph.columns.map((column) => (
            <div key={column.id}>
              <div
                className="absolute top-20 rounded-lg border border-blue-100 bg-blue-50/15"
                style={{ left: column.x - 28, width: column.width + 56, height: graph.height - 140 }}
              />
              <div
                className="absolute top-8 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 text-center text-sm font-black uppercase text-blue-700"
                style={{ left: column.x, width: column.width }}
              >
                {column.title}
              </div>
            </div>
          ))}

          <svg className="absolute left-0 top-0 overflow-visible" width={graph.width} height={graph.height}>
            {graph.edges.map((edge) => (
              <FlowEdge
                key={edge.id}
                edge={edge}
                source={nodeById.get(edge.source)}
                target={nodeById.get(edge.target)}
                active={hoveredEdgeId === edge.id || activeNodeIds.has(edge.source) || activeNodeIds.has(edge.target)}
                onHover={setHoveredEdgeId}
                onRouteChange={updateEdgeRoute}
              />
            ))}
            {connectPreview && (() => {
              const source = nodeById.get(connectPreview.sourceId);
              if (!source) return null;
              const startX = source.x + source.width;
              const startY = source.y + source.height / 2;
              return (
                <path
                  d={`M ${startX} ${startY} L ${connectPreview.x} ${connectPreview.y}`}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={2}
                  strokeDasharray="8 6"
                  pointerEvents="none"
                />
              );
            })()}
          </svg>

          {graph.nodes.map((node) => (
            <div
              key={node.id}
              data-flow-node="true"
              data-flow-node-id={node.id}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(undefined)}
              onPointerDown={(event) => {
                if ((event.target as HTMLElement).closest("button,[data-flow-slot-drag='true']")) return;
                if (node.kind === "champion") return;
                nodeDragRef.current = {
                  node,
                  x: event.clientX,
                  y: event.clientY,
                  nodeX: node.x,
                  nodeY: node.y,
                  moved: false,
                };
                (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
              }}
            >
              <FlowNode
                node={node}
                selected={focusedNodeId === node.id || connectionSourceId === node.id}
                dimmed={activeNodeIds.size > 0 && !activeNodeIds.has(node.id)}
                onSelect={selectNode}
                onDropSeed={assignSeed}
                onAddBranchMatch={(sourceNode) => {
                  setConnectionPickerSourceId(sourceNode.id);
                  setSelectedConnectionTargetIds(graph.edges.filter((edge) => edge.source === sourceNode.id).map((edge) => edge.target));
                }}
                onStartConnect={(sourceNode) => setConnectionSourceId((current) => current === sourceNode.id ? undefined : sourceNode.id)}
                onBeginConnectDrag={beginConnectDrag}
                onDeleteMatch={deleteMatch}
              />
            </div>
          ))}
        </div>

        {connectionDraft && (
          <div className="absolute right-4 top-4 z-20 w-80 rounded-lg border border-border bg-card p-4 shadow-xl">
            <p className="text-sm font-black text-foreground">Connect matches</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Nối {nodeById.get(connectionDraft.sourceId)?.matchCode || "match nguồn"} vào {nodeById.get(connectionDraft.targetId)?.matchCode || "match đích"}.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setConnectionDraft(undefined)}>Hủy</Button>
              <Button type="button" size="sm" onClick={confirmConnection}>Connect</Button>
            </div>
          </div>
        )}

        {connectionPickerSourceId && (
          <div className="absolute right-4 top-4 z-20 w-80 rounded-lg border border-border bg-card p-4 shadow-xl">
            <p className="text-sm font-black text-foreground">Chọn match đích</p>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto beautiful-scrollbar">
              {graph.nodes
                .filter((node) => {
                  const source = nodeById.get(connectionPickerSourceId);
                  return source && node.kind === "match" && node.id !== source.id && node.stageOrder >= source.stageOrder;
                })
                .map((node) => (
                  <label
                    key={node.id}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-left text-sm font-bold hover:border-primary/40 hover:text-primary"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedConnectionTargetIds.includes(node.id)}
                        onChange={(event) => {
                          setSelectedConnectionTargetIds((current) => event.target.checked
                            ? [...new Set([...current, node.id])]
                            : current.filter((targetId) => targetId !== node.id));
                        }}
                      />
                      <span className="truncate">{node.matchCode || node.title}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{node.stageName}</span>
                  </label>
                ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setConnectionPickerSourceId(undefined);
                  setSelectedConnectionTargetIds([]);
                }}
              >
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  connectTargets(connectionPickerSourceId, selectedConnectionTargetIds);
                  setConnectionPickerSourceId(undefined);
                  setSelectedConnectionTargetIds([]);
                }}
              >
                Connect ({selectedConnectionTargetIds.length})
              </Button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default FlowCanvas;
