import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import api from "@/api/axiosConfig";
import type { TeamRef } from "./GroupStageTab";

export interface KnockoutMatch {
  _id: string;
  round?: number;
  matchName?: string;
  matchNumber?: number;
  courtId?: { name?: string };
  courtName?: string;
  team1?: TeamRef | string;
  team2?: TeamRef | string;
  team1Score?: number;
  team2Score?: number;
  status: string;
  isLosersBracket?: boolean;
  winnerTeamId?: TeamRef | string;
  scheduledStartTime?: string;
  actualStartTime?: string;
}

const getTeamName = (team: TeamRef | string | undefined, fallback = "Đang chờ"): string => {
  if (!team) return fallback;
  if (typeof team === "string") return team;
  return team.name || team.teamName || team.teamname || fallback;
};

const getTeamId = (team: TeamRef | string | undefined): string => {
  if (!team) return "";
  if (typeof team === "string") return team;
  return team._id || "";
};

const roundLabel = (match: KnockoutMatch): string => {
  if (match.matchName) return match.matchName;
  if (match.round === 1) return "Tứ kết";
  if (match.round === 2) return "Bán kết";
  if (match.round === 3) return "Chung kết";
  return `Vòng ${match.round || "-"}`;
};

export function KnockoutStageTab({ tournamentId }: { tournamentId: string }) {
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBracketData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/matches", {
          params: tournamentId ? { tournamentId, matchType: "knockout" } : { matchType: "knockout" },
        });
        if (isMounted) setMatches(res?.data?.data || []);
      } catch (error) {
        console.error("Lỗi tải Bracket:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchBracketData();
    return () => { isMounted = false; };
  }, [tournamentId]);

  const { winnersRounds, losersRounds } = useMemo(() => {
    const winnersMatches = matches.filter((m) => !m.isLosersBracket && !m.matchName?.toLowerCase().includes("nhánh thua"));
    const losersMatches = matches.filter((m) => m.isLosersBracket || m.matchName?.toLowerCase().includes("nhánh thua"));

    const groupByRound = (matchList: KnockoutMatch[]) => {
      const grouped = matchList.reduce((acc: Record<number, KnockoutMatch[]>, match) => {
        const round = match.round || 1;
        if (!acc[round]) acc[round] = [];
        acc[round].push(match);
        return acc;
      }, {});
      return Object.keys(grouped).map(Number).sort((a, b) => a - b).map((round) => ({
        round,
        matches: grouped[round].sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0)),
      }));
    };

    return { winnersRounds: groupByRound(winnersMatches), losersRounds: groupByRound(losersMatches) };
  }, [matches]);

  const MatchNode = ({ match }: { match: KnockoutMatch }) => {
    const timeValue = match.scheduledStartTime || match.actualStartTime;
    const winnerId = getTeamId(match.winnerTeamId);
    const team1Id = getTeamId(match.team1);
    const team2Id = getTeamId(match.team2);

    return (
      <div className="bg-white border border-slate-200 rounded-xl w-full shadow-sm overflow-hidden flex flex-col">
        <div className="bg-slate-700 text-white px-3 py-1.5 flex justify-between text-[11px] font-bold uppercase tracking-wider">
          <span>{roundLabel(match)}</span><span>{match.courtId?.name || match.courtName || "Sân 1"}</span>
        </div>
        <div className={`w-full flex justify-between px-3 py-2 border-b border-slate-100 text-sm ${winnerId && winnerId === team1Id ? "bg-green-50 text-green-700 font-bold" : "text-slate-700 font-medium"}`}>
          <span className="truncate pr-2">{getTeamName(match.team1, "Đang chờ")}</span><span>{match.status === "COMPLETED" ? match.team1Score : "0"}</span>
        </div>
        <div className={`w-full flex justify-between px-3 py-2 text-sm ${winnerId && winnerId === team2Id ? "bg-green-50 text-green-700 font-bold" : "text-slate-700 font-medium"}`}>
          <span className="truncate pr-2">{getTeamName(match.team2, "Đang chờ")}</span><span>{match.status === "COMPLETED" ? match.team2Score : "0"}</span>
        </div>
        <div className="text-center py-1.5 text-[11px] color-slate-500 bg-slate-50 font-medium border-t border-slate-100 flex items-center justify-center gap-1">
          ⏱️ {timeValue ? new Date(timeValue).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "15:00"}
        </div>
      </div>
    );
  };

  if (isLoading || matches.length === 0) {
    return (
      <div className="w-full overflow-x-auto p-6 bg-slate-50 rounded-2xl border border-slate-100 no-scrollbar">
        <div className="mb-8">
          <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-200 mb-6 font-bold tracking-widest border-none">▲ NHÁNH THẮNG</Badge>
          <div className="flex gap-10 min-w-[800px]">
            {[2, 1, 1].map((count, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-6 w-60 justify-center">
                 <Skeleton className="h-4 w-20 mx-auto mb-2" />
                {Array.from({ length: count }).map((_, nodeIdx) => (
                  <div key={nodeIdx} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <Skeleton className="h-7 w-full rounded-none bg-slate-100" />
                    <div className="p-3"><Skeleton className="h-4 w-3/4 mb-3" /><Skeleton className="h-4 w-1/2" /></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto p-6 bg-slate-50 rounded-2xl border border-slate-100 no-scrollbar">
      {winnersRounds.length > 0 && (
        <div className="mb-10">
          <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-200 mb-6 font-extrabold tracking-widest border-none text-xs px-3 py-1">▲ NHÁNH THẮNG (WINNERS)</Badge>
          <div className="flex gap-10 min-w-max items-center">
            {winnersRounds.map(({ round, matches: roundMatches }) => (
              <div key={`win-${round}`} className="flex flex-col gap-6 w-60 justify-center relative">
                <div className="text-center text-slate-500 font-bold text-xs uppercase mb-2">Vòng {round}</div>
                {roundMatches.map((match) => <MatchNode key={match._id} match={match} />)}
              </div>
            ))}
          </div>
        </div>
      )}
      {winnersRounds.length > 0 && losersRounds.length > 0 && <div className="h-px bg-slate-200 my-8 w-full" />}
      {losersRounds.length > 0 && (
        <div>
          <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 mb-6 font-extrabold tracking-widest border-none text-xs px-3 py-1">▼ NHÁNH THUA (LOSERS)</Badge>
          <div className="flex gap-10 min-w-max items-center">
            {losersRounds.map(({ round, matches: roundMatches }) => (
              <div key={`lose-${round}`} className="flex flex-col gap-6 w-60 justify-center relative">
                <div className="text-center text-slate-500 font-bold text-xs uppercase mb-2">Vòng Thua {round}</div>
                {roundMatches.map((match) => <MatchNode key={match._id} match={match} />)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}