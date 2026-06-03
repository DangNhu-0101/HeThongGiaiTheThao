import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GitBranch, MapPin, Swords } from "lucide-react";

import api from "@/api/axiosConfig";
import type { IStage } from "@/types/rules";
import type { TeamRef } from "./GroupStageTab";

export interface KnockoutMatch {
  _id: string;
  round?: number;
  roundName?: string;
  matchName?: string;
  matchNumber?: number;
  courtId?: { name?: string };
  courtName?: string;
  team1?: TeamRef | string;
  team2?: TeamRef | string;
  team1Name?: string;
  team2Name?: string;
  team1Score?: number;
  team2Score?: number;
  status: string;
  winnerTeamId?: TeamRef | string;
  scheduledStartTime?: string;
  actualStartTime?: string;
}

type StageWithPath = IStage & {
  displayRound?: number;
  matchStartNumber?: number;
  nextMatchStartNumber?: number;
  pathLabel?: string;
};

const getBranchNo = (stage: IStage) => {
  const match = String(stage.branchName || "").match(/\d+/);
  return match ? Number(match[0]) : 1;
};

const getTeamName = (team: TeamRef | string | undefined, fallback = "Chá» Ä‘á»™i"): string => {
  if (!team) return fallback;
  if (typeof team === "string") return team;
  return team.name || team.teamName || team.teamname || fallback;
};

const getTeamId = (team: TeamRef | string | undefined): string => {
  if (!team) return "";
  if (typeof team === "string") return team;
  return team._id || "";
};

const groupByBranch = (stages: IStage[]) => stages.reduce<Record<string, IStage[]>>((acc, stage) => {
  const key = stage.branchName || "Nhanh chinh";
  if (!acc[key]) acc[key] = [];
  acc[key].push(stage);
  return acc;
}, {});

const getStageMatchCount = (stage: StageWithPath, fallback = 1) =>
  Math.max(1, Math.floor(Number(stage.totalTeamsIn || fallback * 2 || 2) / 2));

const SourceBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase text-slate-500">
    <MapPin className="h-3 w-3" />
    {children}
  </span>
);

const isSameStageMatch = (match: KnockoutMatch, stage: StageWithPath) => {
  const matchNumber = Number(match.matchNumber || 0);
  if (stage.matchStartNumber && matchNumber) {
    const endMatchNumber = stage.matchStartNumber + getStageMatchCount(stage) - 1;
    return matchNumber >= stage.matchStartNumber && matchNumber <= endMatchNumber;
  }

  const round = Number(match.round || 0);
  if (round && round === (stage.displayRound || stage.stageNumber)) return true;
  const labels = [match.roundName, match.matchName].filter(Boolean).join(" ").toLowerCase();
  return Boolean(labels && (labels.includes(stage.stageName.toLowerCase()) || labels.includes((stage.knockoutRound || "").toLowerCase())));
};

const matchesForStage = (matches: KnockoutMatch[], stage: StageWithPath) => {
  const exact = matches.filter((match) => isSameStageMatch(match, stage));
  if (exact.length) return exact;
  return matches.filter((match) => Number(match.round || 0) === (stage.displayRound || stage.stageNumber));
};

const flattenKnockoutStages = (stages: IStage[]): IStage[] =>
  stages.flatMap((stage) => [
    ...(stage.type === "KNOCKOUT" ? [stage] : []),
    ...flattenKnockoutStages(stage.substages || []),
  ]);

const buildStagesFromMatches = (matches: KnockoutMatch[]): IStage[] => {
  const rounds = Array.from(new Set(matches.map((match) => Number(match.round || 1)))).sort((a, b) => a - b);
  return rounds.map((round) => {
    const roundMatches = matches.filter((match) => Number(match.round || 1) === round);
    const firstMatch = roundMatches[0];
    return {
      id: `round-${round}`,
      parentId: null,
      stageNumber: round,
      stageName: firstMatch?.roundName || firstMatch?.matchName || `VÃ²ng ${round}`,
      type: "KNOCKOUT",
      branchName: "NhÃ¡nh chÃ­nh",
      hasBranches: false,
      branches: [],
      hasWildcards: false,
      wildcardsCount: 0,
      wildcardCriteria: [],
      wildcardPriorityOrder: [],
      winPoints: 1,
      lossPoints: 0,
      rankingCriteria: [],
      rankingPriorityOrder: [],
      matchFormat: "1_SET",
      matchDuration: 60,
      touchPoint: 11,
      winByGap: 1,
      maxPoints: null,
      changeSideAt: 6,
      substages: [],
      knockoutRound: firstMatch?.roundName || "",
      hasBronzeMatch: false,
      totalTeamsIn: Math.max(2, roundMatches.length * 2),
    };
  });
};

const withDisplayRounds = (stages: StageWithPath[]): StageWithPath[] => {
  const branchRoundCounters: Record<string, number> = {};
  const branchMatchCounters: Record<string, number> = {};

  return stages.map((stage) => {
    const branchKey = stage.branchName || stage.pathLabel || "main";
    branchRoundCounters[branchKey] = (branchRoundCounters[branchKey] || 1) + 1;

    const matchStartNumber = branchMatchCounters[branchKey] || 1;
    const matchCount = getStageMatchCount(stage);
    const nextMatchStartNumber = matchStartNumber + matchCount;
    branchMatchCounters[branchKey] = nextMatchStartNumber;

    return {
      ...stage,
      displayRound: branchRoundCounters[branchKey],
      matchStartNumber,
      nextMatchStartNumber: matchCount > 1 ? nextMatchStartNumber : undefined,
    };
  });
};

interface TeamLineProps {
  slot: "A" | "B";
  team?: TeamRef | string;
  score?: number;
  fallback: string;
  winner: boolean;
  matchStatus?: string;
  code: string;
  target: string;
}

const TeamLine = ({
  slot,
  team,
  score,
  fallback,
  winner,
  matchStatus,
  code,
  target,
}: TeamLineProps) => (
  <div className={`border-b border-slate-100 px-3 py-2 text-sm last:border-b-0 ${winner ? "bg-emerald-50 font-bold text-emerald-700" : "text-slate-700"}`}>
    <div className="flex justify-between gap-2">
      <span className="truncate pr-2">{getTeamName(team, fallback)}</span>
      <span>{matchStatus === "COMPLETED" ? score ?? 0 : "0"}</span>
    </div>
    <div className="mt-1 flex justify-between gap-2 text-[10px] text-slate-400">
      <span className="font-mono">{code}-{slot === "A" ? 1 : 2}</span>
      <span>{target}</span>
    </div>
  </div>
);

const MatchNode = ({
  stage,
  matchNo,
  matchIndex,
  match,
  pathLabel,
}: {
  stage: StageWithPath;
  matchNo: number;
  matchIndex: number;
  match?: KnockoutMatch;
  pathLabel?: string;
}) => {
  const stageNo = stage.displayRound || stage.stageNumber || 1;
  const code = `R${stageNo}-B${getBranchNo(stage)}-M${matchNo}`;
  const isFinal = !stage.nextMatchStartNumber || getStageMatchCount(stage) <= 1;
  const nextMatchStartNumber = stage.nextMatchStartNumber || 0;
  const nextWinnerSlot = isFinal
    ? "Tháº¯ng -> VÃ´ Ä‘á»‹ch"
    : `Tháº¯ng -> R${stageNo + 1}-B${getBranchNo(stage)}-M${nextMatchStartNumber + Math.floor(matchIndex / 2)}-${matchIndex % 2 === 0 ? 1 : 2}`;
  const loserSlot = isFinal ? "Thua -> Ã quÃ¢n" : "Thua -> Loáº¡i";
  const resultTarget = `${nextWinnerSlot} | ${loserSlot}`;
  const winnerId = getTeamId(match?.winnerTeamId);
  const team1Id = getTeamId(match?.team1);
  const team2Id = getTeamId(match?.team2);
  const timeValue = match?.scheduledStartTime || match?.actualStartTime;

  return (
    <div className="relative overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
      <span className="pointer-events-none absolute left-full top-1/2 h-px w-8 bg-slate-300" />
      <div className="flex items-center justify-between gap-2 rounded-t-xl bg-slate-700 px-3 py-1.5 text-[11px] font-bold uppercase text-white">
        <span>{stage.knockoutRound || stage.stageName}</span>
        <span>{match?.courtId?.name || match?.courtName || "Chua gan san"}</span>
      </div>
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-1.5">
        <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase text-slate-500">
          <SourceBadge>{code}</SourceBadge>
          {pathLabel && <span className="rounded bg-rose-50 px-2 py-0.5 text-rose-700">{pathLabel}</span>}
        </div>
      </div>
      <TeamLine
        slot="A"
        team={match?.team1}
        score={match?.team1Score}
        fallback={match?.team1Name || `${code}-1`}
        winner={!!winnerId && winnerId === team1Id}
        matchStatus={match?.status}
        code={code}
        target={resultTarget}
      />
      <TeamLine
        slot="B"
        team={match?.team2}
        score={match?.team2Score}
        fallback={match?.team2Name || `${code}-2`}
        winner={!!winnerId && winnerId === team2Id}
        matchStatus={match?.status}
        code={code}
        target={resultTarget}
      />
      <div className="rounded-b-xl bg-slate-50 px-3 py-2 text-center text-[11px] font-medium text-slate-500">
        {timeValue ? new Date(timeValue).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "Chua xep lich"}
      </div>
    </div>
  );
};

const KnockoutStageNode = ({ stage, matches }: { stage: StageWithPath; matches: KnockoutMatch[] }) => {
  const stageMatches = matchesForStage(matches, stage).sort((a, b) => Number(a.matchNumber || 0) - Number(b.matchNumber || 0));
  const matchCount = getStageMatchCount(stage, stageMatches.length || 1);
  const matchStartNumber = stage.matchStartNumber || 1;
  return (
    <div className="relative min-w-[280px] rounded-2xl border border-rose-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Swords className="h-4 w-4 text-rose-600" />
        <h3 className="text-sm font-extrabold text-slate-800">{stage.stageName}</h3>
        <SourceBadge>R{stage.displayRound || stage.stageNumber || 1}</SourceBadge>
      </div>
      <div className="mb-3 text-[11px] font-bold uppercase text-slate-500">
        {stage.knockoutRound || "Knockout"} - {stage.totalTeamsIn || 0} Äá»™i vÃ o
      </div>
      <div className="space-y-4">
        {Array.from({ length: matchCount }, (_, index) => {
          const matchNo = matchStartNumber + index;
          return (
            <MatchNode
              key={`${stage.id}-${matchNo}`}
              stage={stage}
              matchNo={matchNo}
              matchIndex={index}
              match={stageMatches.find((match) => Number(match.matchNumber || 0) === matchNo) || stageMatches[index]}
              pathLabel={stage.pathLabel}
            />
          );
        })}
      </div>
    </div>
  );
};

const KnockoutFlow = ({ stages, matches }: { stages: StageWithPath[]; matches: KnockoutMatch[] }) => {
  if (!stages.length) return null;
  const [current, ...rest] = stages;

  if (current.type !== "KNOCKOUT") {
    const childGroups = current.substages?.length ? groupByBranch(current.substages) : {};
    return (
      <div className="flex flex-col gap-8">
        {Object.entries(childGroups).map(([branchName, branchStages]) => (
          <div key={branchName} className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase text-slate-500">
              <GitBranch className="h-4 w-4" />
              {branchName}
            </div>
            <KnockoutFlow stages={branchStages.map((stage) => ({ ...stage, pathLabel: branchName }))} matches={matches} />
          </div>
        ))}
      </div>
    );
  }

  const childGroups = current.substages?.length ? groupByBranch(current.substages) : {};
  const hasChildren = Object.keys(childGroups).length > 0;

  return (
    <div className="flex min-w-max items-start gap-10">
      <KnockoutStageNode stage={current} matches={matches} />
      {hasChildren ? (
        <div className="flex flex-col gap-8">
          {Object.entries(childGroups).map(([branchName, branchStages]) => (
            <div key={branchName} className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase text-slate-500">
                <GitBranch className="h-4 w-4" />
                {branchName}
              </div>
              <KnockoutFlow stages={branchStages.map((stage) => ({ ...stage, pathLabel: branchName }))} matches={matches} />
            </div>
          ))}
        </div>
      ) : (
        <KnockoutFlow stages={rest} matches={matches} />
      )}
    </div>
  );
};

export function KnockoutStageTab({ tournamentId }: { tournamentId: string }) {
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [stageTree, setStageTree] = useState<IStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBracketData = async () => {
      try {
        setIsLoading(true);
        const [matchesRes, stagesRes] = await Promise.all([
          api.get("/matches", {
            params: tournamentId ? { tournamentId, matchType: "knockout", isPublished: true } : { matchType: "knockout", isPublished: true },
          }),
          api.get(`/stages/get-stages/${tournamentId}`).catch(() => ({ data: { data: [] } })),
        ]);

        if (!isMounted) return;
        setMatches(matchesRes?.data?.data || []);
        setStageTree(stagesRes.data?.data || stagesRes.data?.rule?.stageTree || []);
      } catch (error) {
        console.error("Loi tai bracket:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchBracketData();
    return () => { isMounted = false; };
  }, [tournamentId]);

  const knockoutRoots = useMemo(() => {
    if (!matches.length) return [];
    const configuredKnockouts = flattenKnockoutStages(stageTree);
    return withDisplayRounds(configuredKnockouts.length ? configuredKnockouts : buildStagesFromMatches(matches));
  }, [matches, stageTree]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
        Dang tai khung knockout...
      </div>
    );
  }

  if (!knockoutRoots.length) {
    return (
      <Card className="rounded-2xl border-dashed border-slate-300 bg-slate-50">
        <CardContent className="p-6 text-sm text-slate-500">
          Chua co cau hinh vong dau de ve khung knockout.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50 p-6">
      <Badge className="mb-6 border-none bg-sky-100 px-3 py-1 text-xs font-extrabold tracking-widest text-sky-800 hover:bg-sky-200">
        KNOCKOUT TREE THEO CAU HINH VONG
      </Badge>
      <KnockoutFlow stages={knockoutRoots} matches={matches} />
    </div>
  );
}

