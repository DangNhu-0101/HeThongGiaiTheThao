import { useEffect, useMemo, useState } from "react";
import { Medal, Trophy } from "lucide-react";
import api from "@/libs/axios";
import { asArray, asRecord, initials } from "@/services/orgMatchPlanningService";
import { readMatchSourceLabels } from "@/utils/matchSourceLabels";

type ApiList<T = unknown> = T[] | { data?: T[]; success?: boolean };

interface SlotView {
  key: string;
  name: string;
  logo: string;
  score?: number;
}

interface KnockoutCard {
  id: string;
  code: string;
  stageId: string;
  stageName: string;
  stageOrder: number;
  scheduledTime?: string;
  branchKey: string;
  branchName: string;
  slots: SlotView[];
  previousMatchIds: string[];
  status: string;
  isFinalStageMatch: boolean;
  winner?: SlotView;
  score?: { teamA: number; teamB: number };
}

interface Achievement {
  _id: string;
  branchKey: string;
  branchName?: string;
  finalMatchId?: { _id?: string; name?: string; status?: string } | string;
  finalStageId?: { _id?: string; name?: string; number?: number } | string;
  championParticipantId?: { _id?: string; name?: string; logo?: string } | null;
  runnerUpParticipantId?: { _id?: string; name?: string; logo?: string } | null;
  finalScore?: { teamA?: number; teamB?: number };
}

const CARD_WIDTH = 300;
const CARD_HEIGHT = 168;
const COLUMN_GAP = 170;
const ROW_GAP = 92;
const TOP = 86;
const LEFT = 28;

const readKnockoutData = async (tournamentId: string) => {
  const response = await api.get(`/matches/knockout/${tournamentId}`);
  return asRecord(asRecord(response.data).data || response.data);
};

const fallbackMatches = async (tournamentId: string) => {
  const response = await api.get<ApiList>(`/matches/public/tournament-item/${tournamentId}`);
  return { matches: asArray(response.data), achievements: [] };
};

const cleanSlotKey = (value: unknown, fallback: string) => {
  const text = String(value || "").trim();
  if (!text) return fallback;
  return text.replace(/^Winner:\s*/i, "").trim();
};

const mapMatch = (item: unknown, index: number): KnockoutCard | null => {
  const raw = asRecord(item);
  const bracket = asRecord(raw.bracketId);
  if (bracket.type && String(bracket.type) !== "knockout") return null;
  const stage = asRecord(raw.stageId);
  const result = asRecord(raw.matchResultId);
  const details = asRecord(result.details);
  const labels = Array.isArray(raw.formatSlotLabels) ? raw.formatSlotLabels : [];
  const { teamA, teamB, nameA, nameB } = readMatchSourceLabels(raw);
  const winner = asRecord(raw.winnerParticipantId);
  const code = String(raw.name || `M${index + 1}`);
  const slots = [
    {
      key: cleanSlotKey(labels[0], "Seed 1"),
      name: String(teamA.name || nameA || cleanSlotKey(labels[0], "Seed 1")),
      logo: String(teamA.logo || initials(String(teamA.name || nameA || labels[0] || "S1"))),
      score: details.teamA !== undefined ? Number(details.teamA || 0) : undefined,
    },
    {
      key: cleanSlotKey(labels[1], "Seed 2"),
      name: String(teamB.name || nameB || cleanSlotKey(labels[1], "Seed 2")),
      logo: String(teamB.logo || initials(String(teamB.name || nameB || labels[1] || "S2"))),
      score: details.teamB !== undefined ? Number(details.teamB || 0) : undefined,
    },
  ];
  const score = details.teamA !== undefined || details.teamB !== undefined
    ? { teamA: Number(details.teamA || 0), teamB: Number(details.teamB || 0) }
    : undefined;
  const winnerSlot = winner.name
    ? {
      key: String(winner._id || winner.id || ""),
      name: String(winner.name),
      logo: String(winner.logo || initials(String(winner.name))),
    }
    : score && score.teamA !== score.teamB
      ? slots[score.teamA > score.teamB ? 0 : 1]
      : undefined;
  return {
    id: String(raw._id || code),
    code,
    stageId: String(stage._id || raw.stageId || ""),
    stageName: String(stage.name || "Sơ đồ"),
    stageOrder: Number(stage.number || raw.round || 1),
    scheduledTime: raw.scheduledTime ? String(raw.scheduledTime) : undefined,
    branchKey: String(raw.branchKey || bracket._id || "knockout"),
    branchName: String(bracket.name || "Sơ đồ"),
    slots,
    previousMatchIds: Array.isArray(raw.previousMatches)
      ? raw.previousMatches.map((entry) => String(asRecord(asRecord(entry).matchId)._id || asRecord(entry).matchId || "")).filter(Boolean)
      : [],
    status: String(raw.status || "pending"),
    isFinalStageMatch: Boolean(raw.isFinalStageMatch),
    winner: winnerSlot,
    score,
  };
};

const cardIdentityKey = (card: KnockoutCard) => `${card.stageId}:${card.code.trim().toUpperCase()}`;

const cardPriority = (card: KnockoutCard) => {
  let score = 0;
  if (["completed", "walkover", "forfeited"].includes(card.status)) score += 1000;
  if (card.status === "live") score += 900;
  if (card.scheduledTime) score += 600;
  if (card.score) score += 100;
  score += card.slots.filter((slot) => slot.name && slot.name !== slot.key).length * 50;
  return score;
};

const canonicalizeCards = (items: KnockoutCard[]) => {
  const chosen = new Map<string, KnockoutCard>();
  const idToCanonicalId = new Map<string, string>();
  const passthrough: KnockoutCard[] = [];

  items.forEach((card) => {
    const key = cardIdentityKey(card);
    if (!card.stageId || !card.code) {
      passthrough.push(card);
      return;
    }
    const current = chosen.get(key);
    if (!current || cardPriority(card) > cardPriority(current)) {
      if (current) idToCanonicalId.set(current.id, card.id);
      chosen.set(key, card);
    } else {
      idToCanonicalId.set(card.id, current.id);
    }
  });

  const canonical = [...passthrough, ...chosen.values()];
  const byCode = new Map<string, KnockoutCard[]>();
  canonical.forEach((card) => {
    const code = card.code.trim().toUpperCase();
    if (!byCode.has(code)) byCode.set(code, []);
    byCode.get(code)?.push(card);
  });

  return canonical.map((card) => {
    const previous = new Set(
      card.previousMatchIds
        .map((id) => idToCanonicalId.get(id) || id)
        .filter((id) => id && id !== card.id),
    );
    const slots = card.slots.map((slot) => {
      const sourceCode = slot.key.trim().toUpperCase();
      const source = (byCode.get(sourceCode) || [])
        .filter((candidate) => candidate.stageOrder < card.stageOrder)
        .sort((a, b) => b.stageOrder - a.stageOrder)[0];
      if (source) previous.add(source.id);
      if (source?.winner && ["completed", "walkover", "forfeited"].includes(source.status)) {
        return { ...source.winner, key: slot.key };
      }
      return slot;
    });
    return { ...card, slots, previousMatchIds: Array.from(previous) };
  });
};

const roundName = (count: number, fallback: string) => {
  if (count >= 8) return "Round of 16";
  if (count === 4) return "Quarter Final";
  if (count === 2) return "Semi Final";
  if (count === 1) return "Final";
  return fallback || "Sơ đồ";
};

const buildBranchLayout = (cards: KnockoutCard[]) => {
  const stages = Array.from(new Map(cards.map((card) => [card.stageOrder, card.stageName])).entries()).sort((a, b) => a[0] - b[0]);
  const byStage = stages.map(([order, name]) => ({
    order,
    name,
    cards: cards.filter((card) => card.stageOrder === order).sort((a, b) => a.code.localeCompare(b.code)),
  }));
  const positions = new Map<string, { left: number; top: number }>();
  byStage.forEach((stage, stageIndex) => {
    stage.cards.forEach((card, cardIndex) => {
      const parentPositions = card.previousMatchIds.map((id) => positions.get(id)).filter(Boolean) as { left: number; top: number }[];
      const top = parentPositions.length >= 2
        ? parentPositions.reduce((sum, pos) => sum + pos.top + CARD_HEIGHT / 2, 0) / parentPositions.length - CARD_HEIGHT / 2
        : TOP + cardIndex * (CARD_HEIGHT + ROW_GAP);
      positions.set(card.id, { left: LEFT + stageIndex * (CARD_WIDTH + COLUMN_GAP), top });
    });
  });
  const width = LEFT * 2 + byStage.length * CARD_WIDTH + Math.max(0, byStage.length - 1) * COLUMN_GAP;
  const bottom = Math.max(460, ...Array.from(positions.values()).map((pos) => pos.top + CARD_HEIGHT + TOP));
  return { byStage, positions, width, height: bottom };
};

const connectedTrees = (cards: KnockoutCard[]) => {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const links = new Map<string, Set<string>>();
  cards.forEach((card) => {
    if (!links.has(card.id)) links.set(card.id, new Set());
    card.previousMatchIds.forEach((sourceId) => {
      if (!byId.has(sourceId)) return;
      links.get(card.id)?.add(sourceId);
      if (!links.has(sourceId)) links.set(sourceId, new Set());
      links.get(sourceId)?.add(card.id);
    });
  });

  const visited = new Set<string>();
  const trees: KnockoutCard[][] = [];
  cards.forEach((card) => {
    if (visited.has(card.id)) return;
    const queue = [card.id];
    const ids: string[] = [];
    visited.add(card.id);
    while (queue.length) {
      const id = queue.shift()!;
      ids.push(id);
      (links.get(id) || new Set()).forEach((nextId) => {
        if (visited.has(nextId)) return;
        visited.add(nextId);
        queue.push(nextId);
      });
    }
    trees.push(ids.map((id) => byId.get(id)).filter(Boolean) as KnockoutCard[]);
  });
  return trees.sort((a, b) => Math.min(...a.map((card) => card.stageOrder)) - Math.min(...b.map((card) => card.stageOrder)));
};

const isTerminalCard = (card: KnockoutCard, branchCards: KnockoutCard[]) => {
  const hasChild = branchCards.some((item) => item.previousMatchIds.includes(card.id));
  return !hasChild;
};

const AchievementPanel = ({ achievements, branchName, finalCards }: { achievements: Achievement[]; branchName: string; finalCards: KnockoutCard[] }) => (
  <div className="grid gap-3 md:grid-cols-2">
    {achievements.length ? achievements.map((item) => {
      const champion = item.championParticipantId;
      const runner = item.runnerUpParticipantId;
      const score = item.finalScore ? `${item.finalScore.teamA ?? 0} - ${item.finalScore.teamB ?? 0}` : "";
      const finalMatch = asRecord(item.finalMatchId);
      const finalCode = String(finalMatch.name || "");
      return (
        <div key={item._id} className="grid gap-3 sm:grid-cols-2 md:col-span-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-amber-700"><Trophy className="h-5 w-5" /><span className="text-xs font-black uppercase">Quán quân</span></div>
            {finalCode && <p className="mb-1 text-xs font-black text-amber-700">{finalCode}: Đội thắng trận {finalCode}</p>}
            <p className="text-lg font-black text-foreground">{champion?.name || "Chưa xác định"}</p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">{item.branchName || branchName} {score && `- ${score}`}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-slate-600"><Medal className="h-5 w-5" /><span className="text-xs font-black uppercase">Á quân</span></div>
            {finalCode && <p className="mb-1 text-xs font-black text-slate-600">L{finalCode.replace(/^M/i, "")}: Đội thua trận {finalCode}</p>}
            <p className="text-lg font-black text-foreground">{runner?.name || "Chưa xác định"}</p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">{item.branchName || branchName} {score && `- ${score}`}</p>
          </div>
        </div>
      );
    }) : finalCards.length ? finalCards.map((card) => (
      <div key={card.id} className="grid gap-3 sm:grid-cols-2 md:col-span-2">
        <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-700"><Trophy className="h-5 w-5" /><span className="text-xs font-black uppercase">Quán quân</span></div>
          <p className="mb-1 text-xs font-black text-amber-700">{card.code}: Đội thắng trận {card.code}</p>
          <p className="font-black text-muted-foreground">Chưa xác định</p>
        </div>
        <div className="rounded-lg border border-dashed border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground"><Medal className="h-5 w-5" /><span className="text-xs font-black uppercase">Á quân</span></div>
          <p className="mb-1 text-xs font-black text-muted-foreground">L{card.code.replace(/^M/i, "")}: Đội thua trận {card.code}</p>
          <p className="font-black text-muted-foreground">Chưa xác định</p>
        </div>
      </div>
    )) : (
      <>
        <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-700"><Trophy className="h-5 w-5" /><span className="text-xs font-black uppercase">Quán quân</span></div>
          <p className="font-black text-muted-foreground">Chưa xác định</p>
        </div>
        <div className="rounded-lg border border-dashed border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground"><Medal className="h-5 w-5" /><span className="text-xs font-black uppercase">Á quân</span></div>
          <p className="font-black text-muted-foreground">Chưa xác định</p>
        </div>
      </>
    )}
  </div>
);

const BracketTab = ({ tournamentId }: { tournamentId: string }) => {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<KnockoutCard[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await readKnockoutData(tournamentId).catch(() => fallbackMatches(tournamentId));
        if (!alive) return;
        setCards(canonicalizeCards(asArray(data.matches as ApiList).map(mapMatch).filter(Boolean) as KnockoutCard[]));
        setAchievements(asArray(data.achievements as ApiList<Achievement>) as Achievement[]);
      } catch (error) {
        console.error("Không thể tai knockout bracket", error);
        setCards([]);
        setAchievements([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const refresh = (event: Event) => {
      const syncedTournamentId = (event as CustomEvent<{ tournamentItemId?: string }>).detail?.tournamentItemId;
      if (!syncedTournamentId || syncedTournamentId === tournamentId) void load();
    };
    window.addEventListener("tournament-result-synced", refresh);
    return () => {
      alive = false;
      window.removeEventListener("tournament-result-synced", refresh);
    };
  }, [tournamentId]);

  const branches = useMemo(() => {
    return connectedTrees(cards).map((branchCards, index) => {
      const finalIds = new Set(branchCards.filter((card) => isTerminalCard(card, branchCards)).map((card) => card.id));
      const branchKey = branchCards.map((card) => card.branchKey).sort().join("|") || `tree-${index + 1}`;
      return {
      branchKey,
      name: branchCards[0]?.branchName || "Sơ đồ",
      cards: branchCards,
      achievements: achievements.filter((item) => {
        const finalMatch = asRecord(item.finalMatchId);
        const finalId = String(finalMatch._id || item.finalMatchId || "");
        return finalIds.has(finalId) || branchCards.some((card) => card.branchKey === item.branchKey);
      }),
      layout: buildBranchLayout(branchCards),
      };
    });
  }, [achievements, cards]);

  if (loading) return <div className="py-20 text-center font-medium text-muted-foreground animate-pulse">Đang tải sơ đồ knockout...</div>;

  return (
    <div className="space-y-6 py-8">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-black uppercase text-foreground">Sơ đồ knock-out</h3>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">Bracket hien thi theo nhanh, stage va duong di that cua trận đấu.</p>
      </div>

      {branches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm font-bold text-muted-foreground">Chưa có cấu hình knockout cho giai nay.</div>
      ) : branches.map((branch) => (
        <section key={branch.branchKey} className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-base font-black uppercase text-foreground">{branch.name}</h4>
            <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-black uppercase text-muted-foreground">{branch.cards.length} tran</span>
          </div>
          <AchievementPanel
            achievements={branch.achievements}
            branchName={branch.name}
            finalCards={branch.cards.filter((card) => isTerminalCard(card, branch.cards))}
          />
          <div className="overflow-x-auto rounded-xl border border-border bg-[#f8fbfd] p-4 beautiful-scrollbar">
            <div className="relative" style={{ width: branch.layout.width, height: branch.layout.height }}>
              <svg className="absolute inset-0 overflow-visible" width={branch.layout.width} height={branch.layout.height}>
                {branch.cards.flatMap((target) => target.previousMatchIds.map((sourceId) => {
                  const source = branch.layout.positions.get(sourceId);
                  const targetPos = branch.layout.positions.get(target.id);
                  if (!source || !targetPos) return null;
                  const startX = source.left + CARD_WIDTH;
                  const startY = source.top + CARD_HEIGHT / 2;
                  const endX = targetPos.left;
                  const endY = targetPos.top + CARD_HEIGHT / 2;
                  const midX = startX + (endX - startX) / 2;
                  return <path key={`${sourceId}->${target.id}`} d={`M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`} fill="none" stroke="#2563eb" strokeWidth={2} strokeOpacity={0.6} />;
                }))}
              </svg>
              {branch.layout.byStage.map((stage, stageIndex) => (
                <div key={stage.order}>
                  <div className="absolute rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center text-sm font-black uppercase text-blue-700" style={{ left: LEFT + stageIndex * (CARD_WIDTH + COLUMN_GAP), top: 18, width: CARD_WIDTH }}>
                    {roundName(stage.cards.length, stage.name)}
                  </div>
                  {stage.cards.map((card) => {
                    const pos = branch.layout.positions.get(card.id);
                    if (!pos) return null;
                    return (
                      <article key={card.id} className="absolute rounded-lg border border-border bg-card p-3 shadow-sm" style={{ left: pos.left, top: pos.top, width: CARD_WIDTH, minHeight: CARD_HEIGHT }}>
                        <div className="mb-3 flex items-center justify-between">
                          <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-black text-amber-700">{card.code}</span>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">{isTerminalCard(card, branch.cards) ? "Final" : card.status}</span>
                        </div>
                        {card.slots.map((slot, index) => (
                          <div key={`${card.id}-${index}`} className="mb-2 rounded border border-border bg-background px-2 py-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] text-secondary-foreground">{slot.logo || initials(slot.name || "Chưa xác định")}</span>
                              <span className="truncate">{slot.name || "Chưa xác định"}</span>
                              <span className="ml-auto rounded bg-muted px-2 py-0.5 text-sm font-black text-primary">{slot.score ?? (index === 0 ? card.score?.teamA : card.score?.teamB) ?? "-"}</span>
                            </div>
                          </div>
                        ))}
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default BracketTab;
