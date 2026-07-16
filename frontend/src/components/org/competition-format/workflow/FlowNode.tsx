import { Circle, Plus, Trash2 } from "lucide-react";
import type { PointerEvent } from "react";
import { cn } from "@/libs/utils";
import type { FlowEntrant, FlowNodeModel } from "./flowTypes";

interface Props {
  node: FlowNodeModel;
  selected: boolean;
  dimmed: boolean;
  onSelect: (node: FlowNodeModel) => void;
  onDropSeed: (node: FlowNodeModel, globalIndex: number, entrant: FlowEntrant) => void;
  onAddBranchMatch: (node: FlowNodeModel) => void;
  onStartConnect: (node: FlowNodeModel) => void;
  onBeginConnectDrag: (node: FlowNodeModel, event: PointerEvent<HTMLElement>) => void;
  onDeleteMatch: (node: FlowNodeModel) => void;
}

const initials = (value?: string) => {
  if (!value) return "-";
  const cleaned = value.replace(/[^A-Za-z0-9\s]/g, " ").trim();
  if (!cleaned) return "-";
  return cleaned
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};


const matchSlots = (node: FlowNodeModel) =>
  Array.from({ length: 2 }, (_, index) => node.seedSlots[index] || {
    id: `${node.id}:fallback-slot-${index + 1}`,
    label: `Đội ${index + 1}`,
    globalIndex: index,
  });

const FlowNode = ({
  node,
  selected,
  dimmed,
  onSelect,
  onDropSeed,
  onAddBranchMatch,
  onStartConnect,
  onBeginConnectDrag,
  onDeleteMatch,
}: Props) => {
  const isMatch = node.kind === "match";
  const displayRows = isMatch ? matchSlots(node) : [];

  return (
    <div
      role="button"
      tabIndex={0}
      title={node.title}
      onClick={() => onSelect(node)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect(node);
      }}
      className={cn(
        "absolute cursor-move overflow-visible rounded-lg text-left transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20",
        dimmed && "opacity-45",
      )}
      style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
    >
      <div
        className={cn(
          "flex h-full w-full flex-col overflow-hidden rounded-lg border bg-card text-sm shadow-sm",
          selected ? "border-primary ring-4 ring-primary/15" : "border-border",
        )}
      >
        {isMatch ? (
          <>
            {displayRows.map((slot, index) => {
              const filled = Boolean(slot.sourceLabel);
              const locked = Boolean(slot.locked);
              return (
                <div
                  key={slot.id}
                  data-flow-slot-drag={filled && !locked ? "true" : undefined}
                  draggable={filled && !locked}
                  onDragStart={(event) => {
                    if (!filled || locked || slot.globalIndex === undefined || !slot.sourceLabel) return;
                    event.stopPropagation();
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("application/x-flow-assigned-slot", JSON.stringify({
                      stageId: node.stageId,
                      branchId: node.branchId,
                      nodeId: node.id,
                      globalIndex: slot.globalIndex,
                      label: slot.sourceLabel,
                    }));
                    event.dataTransfer.setData("application/x-flow-entrant", JSON.stringify({
                      id: `${node.id}:assigned:${slot.globalIndex}`,
                      label: slot.sourceLabel,
                      sourceNodeId: node.id,
                      assignedSlot: {
                        stageId: node.stageId,
                        branchId: node.branchId,
                        nodeId: node.id,
                        globalIndex: slot.globalIndex,
                      },
                    }));
                  }}
                  onPointerDown={(event) => {
                    if (filled && !locked) event.stopPropagation();
                  }}
                  onDragOver={(event) => {
                    if (!locked) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    if (locked || slot.globalIndex === undefined) return;
                    event.preventDefault();
                    const raw = event.dataTransfer.getData("application/x-flow-entrant");
                    if (!raw) return;
                    onDropSeed(node, slot.globalIndex, JSON.parse(raw) as FlowEntrant);
                  }}
                  className={cn(
                    "flex h-9 items-center justify-between gap-2 px-2",
                    index === 0 && "border-b border-border",
                    filled && "bg-green-50/50",
                    !locked && !filled && "bg-primary/5",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
                      {initials(slot.sourceLabel || slot.label)}
                    </div>
                    <span className={cn("truncate text-xs font-semibold", filled || locked ? "text-foreground" : "text-muted-foreground italic")}>
                      {slot.sourceLabel || slot.label}
                    </span>
                  </div>
                  <span className={cn("shrink-0 text-xs font-bold", locked ? "text-green-600" : "text-muted-foreground")}>
                    {locked ? "OK" : "-"}
                  </span>
                </div>
              );
            })}
            <div className="flex flex-1 flex-col justify-center gap-0.5 border-t border-border bg-muted/50 px-2 text-[10px]">
              <div className="flex items-center justify-between gap-2">
                {node.id.includes(":custom-") && <span className="shrink-0 font-bold text-primary">Custom</span>}
              </div>
              <span className="truncate font-black text-primary">Key thắng: {node.matchCode || node.title}</span>
            </div>
          </>
        ) : (
          <>
            <div className="border-b border-border px-3 py-2">
              <p className="truncate text-sm font-black text-foreground">{node.title}</p>
              {node.subtitle && <p className="mt-0.5 truncate text-[11px] font-bold text-muted-foreground">{node.subtitle}</p>}
            </div>
            <div className="flex-1 space-y-2 overflow-hidden px-3 py-2">
              {node.rows.slice(0, 5).map((row, index) => (
                <div key={`${node.id}-row-${index}`} className="flex min-h-8 items-center rounded-md border border-border bg-background px-2 text-xs font-semibold leading-4 text-foreground">
                  <span className="truncate">{row}</span>
                </div>
              ))}
            </div>
      
          </>
        )}
      </div>

      {node.kind !== "champion" && (
        <>
          <button
            type="button"
            title="Tao hoac doi connection"
            onClick={(event) => {
              event.stopPropagation();
              onAddBranchMatch(node);
            }}
            className="absolute -right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-primary/30 bg-card text-primary shadow-sm hover:bg-primary hover:text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Connect toi match khac"
            onClick={(event) => {
              event.stopPropagation();
              onStartConnect(node);
            }}
            className="absolute right-3 top-3 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-black uppercase text-muted-foreground shadow-sm hover:border-primary/40 hover:text-primary"
          >
            Connect
          </button>
          {isMatch && (
            <button
              type="button"
              title="Xoa match"
              onClick={(event) => {
                event.stopPropagation();
                onDeleteMatch(node);
              }}
              className="absolute right-20 top-3 rounded-md border border-destructive/20 bg-background px-2 py-1 text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <span
            role="button"
            tabIndex={0}
            title="Kéo điểm nối sang match khác"
            onPointerDown={(event) => onBeginConnectDrag(node, event)}
            className="absolute -right-2 top-[calc(50%-34px)] flex h-5 w-5 cursor-crosshair items-center justify-center rounded-full border border-blue-300 bg-blue-50 text-blue-600 shadow-sm hover:bg-blue-600 hover:text-white"
          >
            <Circle className="h-2.5 w-2.5 fill-current" />
          </span>
        </>
      )}
    </div>
  );
};

export default FlowNode;
