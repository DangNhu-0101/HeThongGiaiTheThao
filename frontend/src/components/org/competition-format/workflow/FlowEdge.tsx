import type { PointerEvent } from "react";
import type { FlowEdgeModel, FlowNodeModel } from "./flowTypes";

interface Props {
  edge: FlowEdgeModel;
  source?: FlowNodeModel;
  target?: FlowNodeModel;
  active: boolean;
  onHover: (edgeId?: string) => void;
  onRouteChange: (edgeId: string, route: { bendX?: number; bendY?: number }) => void;
}

const FlowEdge = ({ edge, source, target, active, onHover, onRouteChange }: Props) => {
  if (!source || !target) return null;

  const startX = source.x + source.width;
  const startY = source.y + source.height / 2;
  const endX = target.x;
  const endY = target.kind === "match" && edge.targetSlot
    ? target.y + (edge.targetSlot === 1 ? 18 : 54)
    : target.y + target.height / 2;
  const middleX = edge.route?.bendX ?? startX + Math.max(42, (endX - startX) / 2);
  const middleY = edge.route?.bendY ?? endY;
  const path = `M ${startX} ${startY} H ${middleX} V ${middleY} H ${endX}${middleY === endY ? "" : ` V ${endY}`}`;
  const moveBendX = (event: PointerEvent<SVGPathElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    const matrix = svg?.getScreenCTM()?.inverse();
    if (!svg || !matrix) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const graphPoint = point.matrixTransform(matrix);
    onRouteChange(edge.id, { bendX: graphPoint.x });
  };
  const moveBendY = (event: PointerEvent<SVGPathElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    const matrix = svg?.getScreenCTM()?.inverse();
    if (!svg || !matrix) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const graphPoint = point.matrixTransform(matrix);
    onRouteChange(edge.id, { bendY: graphPoint.y });
  };

  return (
    <g onMouseEnter={() => onHover(edge.id)} onMouseLeave={() => onHover()}>
      <path d={path} fill="none" stroke="transparent" strokeWidth={18} />
      <path
        d={path}
        fill="none"
        stroke={active ? "#d71920" : "#8aa1b6"}
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={active ? 3 : 2}
        strokeDasharray={edge.label === "BTC chọn đội" ? "8 8" : undefined}
      />
      <path
        d={`M ${middleX} ${Math.min(startY, middleY)} V ${Math.max(startY, middleY)}`}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        style={{ cursor: "ew-resize" }}
        onPointerDown={(event) => {
          event.stopPropagation();
          (event.currentTarget as SVGPathElement).setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!(event.currentTarget as SVGPathElement).hasPointerCapture(event.pointerId)) return;
          moveBendX(event);
        }}
        onPointerUp={(event) => {
          if ((event.currentTarget as SVGPathElement).hasPointerCapture(event.pointerId)) {
            (event.currentTarget as SVGPathElement).releasePointerCapture(event.pointerId);
          }
        }}
      />
      <path
        d={`M ${Math.min(middleX, endX)} ${middleY} H ${Math.max(middleX, endX)}`}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        style={{ cursor: "ns-resize" }}
        onPointerDown={(event) => {
          event.stopPropagation();
          (event.currentTarget as SVGPathElement).setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!(event.currentTarget as SVGPathElement).hasPointerCapture(event.pointerId)) return;
          moveBendY(event);
        }}
        onPointerUp={(event) => {
          if ((event.currentTarget as SVGPathElement).hasPointerCapture(event.pointerId)) {
            (event.currentTarget as SVGPathElement).releasePointerCapture(event.pointerId);
          }
        }}
      />
      <path
        d={`M ${endX - 9} ${endY - 5} L ${endX} ${endY} L ${endX - 9} ${endY + 5}`}
        fill="none"
        stroke={active ? "#d71920" : "#8aa1b6"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 3 : 2}
      />
      {edge.label && (
        <text
          x={(startX + endX) / 2}
          y={middleY - 8}
          fill={active ? "#d71920" : "#637389"}
          fontSize={12}
          fontWeight={700}
          textAnchor="middle"
        >
          {edge.label}
        </text>
      )}
    </g>
  );
};

export default FlowEdge;
