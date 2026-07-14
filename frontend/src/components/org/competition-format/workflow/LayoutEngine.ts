import type { FlowGraph, FlowNodeModel, FlowStageColumn } from "./flowTypes";

const COLUMN_WIDTH = 320;
const COLUMN_GAP = 280;
const TOP = 120;
const NODE_GAP = 160;
const LANE_GAP = 260;
const PADDING = 120;

export const layoutFlow = (
  nodes: FlowNodeModel[],
  columns: Omit<FlowStageColumn, "x" | "width" | "height">[],
  edges: FlowGraph["edges"],
): FlowGraph => {
  const laidOutColumns: FlowStageColumn[] = columns.map((column, index) => ({
    ...column,
    x: PADDING + index * (COLUMN_WIDTH + COLUMN_GAP),
    width: COLUMN_WIDTH,
    height: 0,
  }));

  const laidOutNodes = nodes.map((node) => ({ ...node }));

  laidOutColumns.forEach((column) => {
    const columnNodes = laidOutNodes
      .filter((node) => node.stageOrder === column.order)
      .sort((a, b) => (a.laneIndex ?? 0) - (b.laneIndex ?? 0));
    const laneBreaks = columnNodes.reduce((count, node, index) => {
      if (index === 0) return count;
      return (columnNodes[index - 1].laneIndex ?? 0) === (node.laneIndex ?? 0) ? count : count + 1;
    }, 0);
    const totalHeight = columnNodes.reduce((sum, node) => sum + node.height, 0)
      + Math.max(0, columnNodes.length - 1) * NODE_GAP
      + laneBreaks * LANE_GAP;
    let cursor = TOP + Math.max(0, (760 - totalHeight) / 2);

    columnNodes.forEach((node, index) => {
      if (index > 0 && (columnNodes[index - 1].laneIndex ?? 0) !== (node.laneIndex ?? 0)) {
        cursor += LANE_GAP;
      }
      node.x = column.x;
      node.y = cursor;
      cursor += node.height + NODE_GAP;
    });

    column.height = Math.max(760, cursor + TOP);
  });

  const nodeById = new Map(laidOutNodes.map((node) => [node.id, node]));
  const incomingEdges = new Map<string, FlowGraph["edges"]>();
  edges.forEach((edge) => {
    incomingEdges.set(edge.target, [...(incomingEdges.get(edge.target) || []), edge]);
  });

  laidOutColumns
    .map((column) => column.order)
    .sort((a, b) => a - b)
    .forEach((order) => {
      laidOutNodes
        .filter((node) => node.stageOrder === order)
        .forEach((node) => {
          const incoming = incomingEdges.get(node.id) || [];
          const parentNodes = incoming
            .flatMap((edge) => {
              const parent = nodeById.get(edge.source);
              return parent && parent.kind === "match" && parent.laneIndex === node.laneIndex ? [parent] : [];
            });

          if (node.manualPosition || parentNodes.length < 2) return;

          const parentCenters = parentNodes.map((parent) => parent.y + parent.height / 2);
          const averageCenter = parentCenters.reduce((sum, value) => sum + value, 0) / parentCenters.length;
          node.y = averageCenter - node.height / 2;
        });
    });

  laidOutNodes.forEach((node) => {
    if (!node.manualPosition) return;
    node.x = node.manualPosition.x;
    node.y = node.manualPosition.y;
  });

  laidOutColumns.forEach((column) => {
    const columnNodes = laidOutNodes.filter((node) => node.stageOrder === column.order);
    const bottom = Math.max(...columnNodes.map((node) => node.y + node.height), 760);
    column.height = bottom + TOP;
  });

  const autoWidth = PADDING * 2 + laidOutColumns.length * COLUMN_WIDTH + Math.max(0, laidOutColumns.length - 1) * COLUMN_GAP;
  const width = Math.max(autoWidth, ...laidOutNodes.map((node) => node.x + node.width + PADDING));
  const height = Math.max(940, ...laidOutColumns.map((column) => column.height));

  return { nodes: laidOutNodes, edges, columns: laidOutColumns, width, height };
};
