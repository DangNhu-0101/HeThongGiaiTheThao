import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, Medal, Minus, Plus, RotateCcw, Trophy } from "lucide-react";
import api from "@/libs/axios";
import { Button } from "@/components/ui/button";
import { competitionFormatService } from "@/services/competitionFormatService";
import { mapStagesToFlow } from "@/components/org/competition-format/workflow/FlowMapper";
import { initialsFromSource, readMatchSourceLabels } from "@/utils/matchSourceLabels";
import type { CompetitionStageConfig } from "@/types/competitionFormat";
import type { FlowEdgeModel, FlowNodeModel } from "@/components/org/competition-format/workflow/flowTypes";

type ApiList<T = unknown> = T[] | { data?: T[]; success?: boolean };

interface ResolvedSlot {
  id: string;
  name: string;
  logo?: string;
  score?: number;
}

interface FinalOutcome {
  champion?: Record<string, unknown>;
  runnerUp?: Record<string, unknown>;
  confirmed: boolean;
}

const NODE_WIDTH = 224;
const NODE_HEIGHT = 126;
const CANVAS_PADDING = 48;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.8;
const DEFAULT_ZOOM = 0.8;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const asArray = <T,>(payload: ApiList<T> | unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  const data = asRecord(payload).data;
  return Array.isArray(data) ? data as T[] : [];
};

const clamp = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
const entityId = (value: unknown) => String(asRecord(value)._id || asRecord(value).id || value || "");
const entityName = (value: unknown) => String(asRecord(value).name || "").trim();

const readKnockoutData = async (tournamentId: string) => {
  const response = await api.get(`/matches/knockout/${tournamentId}`);
  return asRecord(asRecord(response.data).data || response.data);
};

const slotSourceLabel = (slot: FlowNodeModel["seedSlots"][number], index: number) =>
  String(slot.sourceLabel || slot.label || `Slot ${index + 1}`).trim();

const matchScore = (match: Record<string, unknown>, slotIndex: number) => {
  const details = asRecord(asRecord(match.matchResultId).details);
  const key = slotIndex === 0 ? "teamA" : "teamB";
  return details[key] === undefined ? undefined : Number(details[key] || 0);
};

const resolvedSlotFor = (match: Record<string, unknown> | undefined, slotIndex: number): ResolvedSlot | undefined => {
  if (!match) return undefined;
  const participants = Array.isArray(match.participants) ? match.participants.map(asRecord) : [];
  const participant = participants[slotIndex];
  const fallback = readMatchSourceLabels(match);
  const fallbackTeam = slotIndex === 0 ? fallback.teamA : fallback.teamB;
  const team = participant?.name ? participant : asRecord(fallbackTeam);
  const name = String(team.name || "").trim();
  if (!name) return undefined;
  return {
    id: entityId(team),
    name,
    logo: String(team.logo || initialsFromSource(name)),
    score: matchScore(match, slotIndex),
  };
};

const finalOutcomeFor = (match?: Record<string, unknown>): FinalOutcome => {
  if (!match || match.isFinalMatch !== true) return { confirmed: false };
  const champion = asRecord(match.winnerTeam);
  const runnerUp = asRecord(match.loserTeam);
  const confirmed = String(match.status || "").toLowerCase() === "completed"
    && String(asRecord(match.matchResultId).status || "").toLowerCase() === "confirmed"
    && Boolean(entityId(champion))
    && Boolean(entityId(runnerUp));
  return confirmed ? { champion, runnerUp, confirmed: true } : { confirmed: false };
};

const normalizeGraph = (nodes: FlowNodeModel[], edges: FlowEdgeModel[]) => {
  const minX = Math.min(...nodes.map((node) => node.x), 0);
  const minY = Math.min(...nodes.map((node) => node.y), 0);
  const offsetX = -minX + CANVAS_PADDING;
  const offsetY = -minY + CANVAS_PADDING;
  const normalizedNodes = nodes.map((node) => ({
    ...node,
    x: node.x + offsetX,
    y: node.y + offsetY,
  }));
  const normalizedEdges = edges.map((edge) => ({
    ...edge,
    route: edge.route ? {
      bendX: edge.route.bendX === undefined ? undefined : edge.route.bendX + offsetX,
      bendY: edge.route.bendY === undefined ? undefined : edge.route.bendY + offsetY,
    } : undefined,
  }));
  return {
    nodes: normalizedNodes,
    edges: normalizedEdges,
    width: Math.max(520, ...normalizedNodes.map((node) => node.x + NODE_WIDTH + CANVAS_PADDING)),
    height: Math.max(340, ...normalizedNodes.map((node) => node.y + NODE_HEIGHT + CANVAS_PADDING)),
  };
};

const sourcePoint = (node: FlowNodeModel) => ({ x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 2 });
const targetPoint = (node: FlowNodeModel, targetSlot?: 1 | 2) => ({
  x: node.x,
  y: node.y + (targetSlot === 2 ? 91 : 54),
});

const MatchCard = ({
  node,
  branchName,
  match,
  isFinal,
}: {
  node: FlowNodeModel;
  branchName: string;
  match?: Record<string, unknown>;
  isFinal: boolean;
}) => {
  const outcome = finalOutcomeFor(match);
  const championId = entityId(outcome.champion);
  const runnerUpId = entityId(outcome.runnerUp);

  return (
    <article
      className={`absolute overflow-hidden rounded-md border bg-card shadow-sm ${isFinal ? "border-amber-300" : "border-border"}`}
      style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
    >
      <div className="flex h-8 items-center justify-between gap-2 border-b border-border px-2">
        <span className="text-xs font-black text-amber-700">{node.matchCode || node.title}</span>
        <span className="min-w-0 truncate text-[9px] font-bold uppercase text-muted-foreground">
          {node.stageName}{branchName ? ` · ${branchName}` : ""}
        </span>
      </div>
      <div className="divide-y divide-border">
        {node.seedSlots.slice(0, 2).map((slot, index) => {
          const sourceLabel = slotSourceLabel(slot, index);
          const resolved = resolvedSlotFor(match, index);
          const isChampion = outcome.confirmed && resolved?.id === championId;
          const isRunnerUp = outcome.confirmed && resolved?.id === runnerUpId;
          return (
            <div key={slot.id || `${node.id}:${index}`} className={`h-[46px] px-2 py-1 ${isChampion ? "bg-amber-50" : "bg-background"}`}>
              <div className="flex items-center gap-1.5">
                <span className="min-w-0 flex-1 truncate text-[11px] font-black text-primary">{sourceLabel}</span>
                {isChampion && <span className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-700"><Trophy className="h-3 w-3" /> Quán quân</span>}
                {isRunnerUp && <span className="text-[9px] font-black uppercase text-muted-foreground">Á quân</span>}
                <span className="text-[11px] font-black text-muted-foreground">{resolved?.score ?? "-"}</span>
              </div>
              {resolved?.name && (
                <p className="mt-0.5 truncate text-[11px] font-bold text-foreground">{resolved.name}</p>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
};

const KeyExplanation = () => (
  <p className="text-sm leading-6 text-muted-foreground">
    <strong className="text-foreground">Các ký hiệu trong cây đấu</strong> được lấy trực tiếp từ cấu hình thể thức. A1, A2,... là các đội đạt thứ hạng tương ứng tại các bảng đấu; M1, M2,... là đội chiến thắng của các trận đấu tương ứng; L1, L2,... là đội thất bại của các trận đấu tương ứng; Lucky1, Lucky2,... là các đội nhận suất vé vớt. Khi bảng đấu hoặc trận đấu hoàn thành và kết quả được xác nhận, hệ thống sẽ tự động gán đội vào đúng vị trí theo key đã được cấu hình nhưng vẫn giữ nguyên ký hiệu nguồn của slot. Mỗi trận không có đường nối đi ra tại Stage cuối cùng được xem là một trận chung kết độc lập, đội thắng là Quán quân và đội thua là Á quân của nhánh đấu tương ứng.
  </p>
);

const BracketTab = ({ tournamentId }: { tournamentId: string }) => {
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<CompetitionStageConfig[]>([]);
  const [matches, setMatches] = useState<Record<string, unknown>[]>([]);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const [format, knockoutData] = await Promise.all([
          competitionFormatService.getTournamentFormat(tournamentId),
          readKnockoutData(tournamentId).catch(() => ({ matches: [] })),
        ]);
        if (!alive) return;
        setStages((format.stages || []).map((stage, index) => ({ stage, index }))
          .sort((a, b) => Number(a.stage.order) - Number(b.stage.order) || a.index - b.index)
          .map(({ stage }) => stage));
        setMatches(asArray<Record<string, unknown>>(knockoutData.matches));
      } catch (error) {
        console.error("Không thể tải cấu hình bracket", error);
        if (alive) {
          setStages([]);
          setMatches([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    const refresh = (event: Event) => {
      const syncedId = (event as CustomEvent<{ tournamentItemId?: string }>).detail?.tournamentItemId;
      if (!syncedId || syncedId === tournamentId) void load();
    };
    window.addEventListener("tournament-result-synced", refresh);
    return () => {
      alive = false;
      window.removeEventListener("tournament-result-synced", refresh);
    };
  }, [tournamentId]);

  const matchByNodeId = useMemo(() => {
    const byNodeId = new Map<string, Record<string, unknown>>();
    const byCode = new Map<string, Record<string, unknown>>();
    matches.forEach((match) => {
      const nodeId = String(match.formatNodeId || "");
      const code = String(match.name || "").trim().toUpperCase();
      if (nodeId) byNodeId.set(nodeId, match);
      if (code && !byCode.has(code)) byCode.set(code, match);
    });
    return { byNodeId, byCode };
  }, [matches]);

  const view = useMemo(() => {
    const graph = mapStagesToFlow(stages);
    const nodes = graph.nodes.filter((node) => node.kind === "match");
    const nodeIds = new Set(nodes.map((node) => node.id));
    const savedEdges: FlowEdgeModel[] = stages.flatMap((stage) => stage.brackets.flatMap((branch) =>
      (branch.flowConnections || []).map((connection) => ({
        id: connection.id,
        source: connection.source,
        target: connection.target,
        label: connection.label,
        targetSlot: connection.targetSlot,
        route: branch.flowConnectionRoutes?.[connection.id],
      })),
    )).filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
    const edges = savedEdges.length > 0 ? savedEdges : graph.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
    const outgoing = new Set(edges.map((edge) => edge.source));
    const stageOrderById = new Map(stages.map((stage, index) => [stage.id, Number(stage.order ?? index + 1)]));
    const finalStageOrder = nodes.length
      ? Math.max(...nodes.map((node) => stageOrderById.get(node.stageId) ?? node.stageOrder))
      : 0;
    const finalNodeIds = new Set(nodes
      .filter((node) => (stageOrderById.get(node.stageId) ?? node.stageOrder) === finalStageOrder && !outgoing.has(node.id))
      .map((node) => node.id));
    const branchNames = new Map(stages.flatMap((stage) => stage.brackets.map((branch) => [branch.id, branch.name] as const)));
    return { ...normalizeGraph(nodes, edges), finalNodeIds, branchNames };
  }, [stages]);

  const matchForNode = (node: FlowNodeModel) => matchByNodeId.byNodeId.get(node.id)
    || matchByNodeId.byCode.get(String(node.matchCode || node.title).toUpperCase());

  const finalNodes = useMemo(() => view.nodes.filter((node) => view.finalNodeIds.has(node.id)), [view]);

  const centerTree = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({
      left: Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2),
      top: Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2),
      behavior: "smooth",
    });
  };

  const resetZoom = () => setZoom(DEFAULT_ZOOM);

  if (loading) return <div className="animate-pulse py-20 text-center font-medium text-muted-foreground">Đang tải cấu hình bracket...</div>;

  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black uppercase text-foreground">Bracket</h3>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Cây đấu được đọc trực tiếp từ cấu hình Thể thức đã lưu.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="icon-sm" onClick={() => setZoom((value) => clamp(value + 0.1))} title="Phóng to" aria-label="Phóng to"><Plus className="h-4 w-4" /></Button>
          <Button type="button" variant="outline" size="icon-sm" onClick={() => setZoom((value) => clamp(value - 0.1))} title="Thu nhỏ" aria-label="Thu nhỏ"><Minus className="h-4 w-4" /></Button>
          <Button type="button" variant="outline" size="sm" onClick={resetZoom} title="Reset zoom"><RotateCcw className="h-4 w-4" /> Reset</Button>
          <Button type="button" variant="outline" size="sm" onClick={centerTree} title="Căn giữa cây"><LocateFixed className="h-4 w-4" /> Căn giữa</Button>
          <span className="w-12 text-center text-xs font-bold text-muted-foreground">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {view.nodes.length === 0 ? (
        <div className="border border-dashed border-border p-10 text-center text-sm font-bold text-muted-foreground">Chưa có cấu hình knockout trong tab Thể thức cho giải này.</div>
      ) : (
        <div
          ref={viewportRef}
          className="max-h-[70vh] min-h-[420px] cursor-grab overflow-auto border border-border bg-[#f8fbfd] active:cursor-grabbing beautiful-scrollbar"
          style={{ touchAction: "none" }}
          onPointerDown={(event) => {
            if (event.button !== 0 || !viewportRef.current) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = { x: event.clientX, y: event.clientY, left: viewportRef.current.scrollLeft, top: viewportRef.current.scrollTop };
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            const viewport = viewportRef.current;
            if (!drag || !viewport) return;
            viewport.scrollLeft = drag.left - (event.clientX - drag.x);
            viewport.scrollTop = drag.top - (event.clientY - drag.y);
          }}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }}
        >
          <div className="relative" style={{ width: view.width * zoom, height: view.height * zoom }}>
            <div className="relative origin-top-left" style={{ width: view.width, height: view.height, transform: `scale(${zoom})` }}>
              <svg className="absolute inset-0 overflow-visible" width={view.width} height={view.height} aria-hidden="true">
                {view.edges.map((edge, edgeIndex) => {
                  const source = view.nodes.find((node) => node.id === edge.source);
                  const target = view.nodes.find((node) => node.id === edge.target);
                  if (!source || !target) return null;
                  const start = sourcePoint(source);
                  const end = targetPoint(target, edge.targetSlot);
                  const bendX = edge.route?.bendX ?? start.x + Math.max(36, (end.x - start.x) / 2);
                  const bendY = edge.route?.bendY ?? end.y;
                  return (
                    <g key={`${edge.id}:${edgeIndex}`}>
                      <path d={`M ${start.x} ${start.y} H ${bendX} V ${bendY} H ${end.x}${bendY === end.y ? "" : ` V ${end.y}`}`} fill="none" stroke="#2563eb" strokeOpacity={0.7} strokeWidth={2} />
                      {edge.label && <text x={(start.x + end.x) / 2} y={end.y - 6} className="fill-primary text-[10px] font-bold">{edge.label}</text>}
                    </g>
                  );
                })}
              </svg>
              {view.nodes.map((node) => (
                <MatchCard
                  key={node.id}
                  node={node}
                  branchName={view.branchNames.get(node.branchId || "") || ""}
                  match={matchForNode(node)}
                  isFinal={view.finalNodeIds.has(node.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {finalNodes.length > 0 && (
        <section className="space-y-3 border-t border-border pt-5">
          <h4 className="text-base font-black text-foreground">Kết quả các trận chung kết</h4>
          <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {finalNodes.map((node) => {
              const outcome = finalOutcomeFor(matchForNode(node));
              return (
                <div key={node.id} className="border-l-2 border-amber-300 pl-3">
                  <p className="text-sm font-black text-foreground">Trận {node.matchCode || node.title}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm"><Trophy className="h-4 w-4 text-amber-600" /><span className="font-bold">Quán quân:</span> {outcome.confirmed ? entityName(outcome.champion) : "Chưa xác định"}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm"><Medal className="h-4 w-4 text-muted-foreground" /><span className="font-bold">Á quân:</span> {outcome.confirmed ? entityName(outcome.runnerUp) : "Chưa xác định"}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <KeyExplanation />
    </div>
  );
};

export default BracketTab;
