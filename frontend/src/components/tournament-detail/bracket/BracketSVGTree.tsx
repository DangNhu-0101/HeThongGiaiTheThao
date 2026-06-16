import React, { useMemo } from "react";
import type { BracketTreeNode } from "@/types/bracketTree";
import BracketNodeCard from "@/components/tournament-detail/bracket/BracketNodeCard";

// Cấu hình kích thước
const CARD_W = 240;
const CARD_H = 110;
const H_GAP = 50; // Khoảng cách ngang giữa các cột
const V_GAP = 24; // Khoảng cách dọc giữa các dòng

// Kiểu dữ liệu lưu trữ vị trí sau khi đo
type MeasuredNode = {
  node: BracketTreeNode;
  width: number;
  height: number;
  x: number;
  y: number;
  centerY: number;
  children: MeasuredNode[];
};

// Thuật toán đệ quy tính toán tọa độ (Layout từ Trái sang Phải)
function buildLayout(node: BracketTreeNode, startX: number, startY: number): MeasuredNode {
  if (!node.children || node.children.length === 0) {
    return { node, width: CARD_W, height: CARD_H, x: startX, y: startY, centerY: startY + CARD_H / 2, children: [] };
  }

  // Đo con thứ 1
  const child0 = buildLayout(node.children[0], startX, startY);
  
  // Đo con thứ 2 (đặt ngay bên dưới con thứ 1)
  let child1: MeasuredNode | undefined;
  if (node.children.length > 1) {
    child1 = buildLayout(node.children[1], startX, child0.y + child0.height + V_GAP);
  }

  // Tính toán vị trí của thẻ hiện tại (đẩy sang cột bên phải)
  const currentX = Math.max(child0.x + child0.width, (child1?.x || 0) + (child1?.width || 0)) + H_GAP;
  const currentCenterY = child1 ? (child0.centerY + child1.centerY) / 2 : child0.centerY;
  const currentY = currentCenterY - CARD_H / 2;
  const totalHeight = child1 ? (child1.y + child1.height) - child0.y : child0.height;

  return {
    node,
    width: (currentX + CARD_W) - startX,
    height: totalHeight,
    x: currentX,
    y: currentY,
    centerY: currentCenterY,
    children: child1 ? [child0, child1] : [child0]
  };
}

const BracketSVGTree = ({ rootData }: { rootData: BracketTreeNode }) => {
  // Tính toán layout 1 lần duy nhất
  const layout = useMemo(() => buildLayout(rootData, 20, 20), [rootData]);

  // Hàm đệ quy vẽ Đường nối (Lines)
  const renderLines = (measured: MeasuredNode, elements: React.ReactNode[]) => {
    if (measured.children.length === 2) {
      const c0 = measured.children[0];
      const c1 = measured.children[1];
      const startX = c0.x + CARD_W;
      const midX = startX + H_GAP / 2;
      const endX = measured.x;

      // Nối từ con 0 đến node cha
      elements.push(
        <path key={`path-0-${measured.node.id}`} 
          d={`M ${startX} ${c0.centerY} L ${midX} ${c0.centerY} L ${midX} ${measured.centerY} L ${endX} ${measured.centerY}`} 
          fill="none" stroke="var(--color-border)" strokeWidth="2" 
        />
      );
      // Nối từ con 1 lên đường giữa
      elements.push(
        <path key={`path-1-${measured.node.id}`} 
          d={`M ${startX} ${c1.centerY} L ${midX} ${c1.centerY} L ${midX} ${measured.centerY}`} 
          fill="none" stroke="var(--color-border)" strokeWidth="2" 
        />
      );

      renderLines(c0, elements);
      renderLines(c1, elements);
    }
  };

  // Hàm đệ quy vẽ Thẻ (Cards)
  const renderCards = (measured: MeasuredNode, elements: React.ReactNode[]) => {
    elements.push(
      <foreignObject key={`card-${measured.node.id}`} x={measured.x} y={measured.y} width={CARD_W} height={CARD_H}>
        <BracketNodeCard match={measured.node} />
      </foreignObject>
    );
    measured.children.forEach(c => renderCards(c, elements));
  };

  const lineElements: React.ReactNode[] = [];
  const cardElements: React.ReactNode[] = [];
  renderLines(layout, lineElements);
  renderCards(layout, cardElements);

  // Kích thước tổng thể của SVG (cộng thêm padding)
  const svgWidth = layout.width + 40;
  const svgHeight = layout.height + 40;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-auto beautiful-scrollbar p-4">
      <svg width={svgWidth} height={svgHeight} className="min-w-full">
        {/* Render lines trước để nằm dưới thẻ */}
        {lineElements}
        {cardElements}
      </svg>
    </div>
  );
};
export default BracketSVGTree;