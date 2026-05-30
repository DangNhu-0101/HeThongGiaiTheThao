import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import api from "@/api/axiosConfig";

export interface TeamRef {
  _id?: string;
  name?: string;
  teamName?: string;
  teamname?: string;
}

export interface GroupMatch {
  _id: string;
  groupId?: { name?: string };
  group?: string;
  courtId?: { name?: string };
  courtName?: string;
  team1?: TeamRef | string;
  team2?: TeamRef | string;
  team1Score?: number;
  team2Score?: number;
  status: string;
  scheduledStartTime?: string;
  actualStartTime?: string;
  createdAt?: string;
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface ProcessedMatch {
  id: string;
  team1: string;
  team2: string;
  court: string;
  time: string;
  status: string;
  result: { t1: number; t2: number };
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

const emptyRow = (team: TeamRef | string | undefined): TeamStanding => ({
  teamId: getTeamId(team),
  teamName: getTeamName(team),
  played: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  points: 0,
});

export function GroupStageTab({ tournamentId }: { tournamentId: string }) {
  const [standingsData, setStandingsData] = useState<Record<string, TeamStanding[]>>({});
  const [matchesData, setMatchesData] = useState<Record<string, ProcessedMatch[]>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/matches", {
          params: tournamentId ? { tournamentId, matchType: "group" } : { matchType: "group" },
        });

        if (!isMounted) return;
        const matches: GroupMatch[] = res?.data?.data || [];
        const nextStandings: Record<string, Record<string, TeamStanding>> = {};
        const nextMatches: Record<string, ProcessedMatch[]> = {};

        matches.forEach((match) => {
          const groupName = match.groupId?.name || match.group || "Chưa phân bảng";
          if (!nextStandings[groupName]) nextStandings[groupName] = {};
          if (!nextMatches[groupName]) nextMatches[groupName] = [];

          const team1Id = getTeamId(match.team1);
          const team2Id = getTeamId(match.team2);
          
          if (team1Id && !nextStandings[groupName][team1Id]) nextStandings[groupName][team1Id] = emptyRow(match.team1);
          if (team2Id && !nextStandings[groupName][team2Id]) nextStandings[groupName][team2Id] = emptyRow(match.team2);

          if (match.status === "COMPLETED") {
            const row1 = nextStandings[groupName][team1Id];
            const row2 = nextStandings[groupName][team2Id];
            const score1 = match.team1Score ?? 0;
            const score2 = match.team2Score ?? 0;

            if (row1 && row2) {
              row1.played += 1;
              row2.played += 1;
              row1.goalsFor += score1;
              row1.goalsAgainst += score2;
              row2.goalsFor += score2;
              row2.goalsAgainst += score1;
              row1.goalDifference = row1.goalsFor - row1.goalsAgainst;
              row2.goalDifference = row2.goalsFor - row2.goalsAgainst;

              if (score1 > score2) { row1.wins += 1; row2.losses += 1; row1.points += 3; } 
              else if (score2 > score1) { row2.wins += 1; row1.losses += 1; row2.points += 3; } 
              else { row1.draws += 1; row2.draws += 1; row1.points += 1; row2.points += 1; }
            }
          }

          const timeValue = match.scheduledStartTime || match.actualStartTime || match.createdAt;
          nextMatches[groupName].push({
            id: match._id,
            team1: getTeamName(match.team1),
            team2: getTeamName(match.team2),
            court: match.courtId?.name || match.courtName || "Chưa xếp sân",
            time: timeValue ? new Date(timeValue).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "Chưa xếp lịch",
            status: match.status,
            result: { t1: match.team1Score ?? 0, t2: match.team2Score ?? 0 },
          });
        });

        const sortedStandings: Record<string, TeamStanding[]> = {};
        Object.entries(nextStandings).forEach(([groupName, rows]) => {
          sortedStandings[groupName] = Object.values(rows).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);
        });

        setStandingsData(sortedStandings);
        setMatchesData(nextMatches);
        setExpandedGroups(Object.fromEntries(Object.keys(nextMatches).map((g) => [g, false])));
      } catch (error) {
        console.error("Lỗi tải dữ liệu bảng xếp hạng:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchData();
    return () => { isMounted = false; };
  }, [tournamentId]);

  if (isLoading || Object.keys(standingsData).length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {[1, 2].map((i) => (
          <Card key={i} className="border-t-4 border-t-sky-500 shadow-sm">
            <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between pb-3"><Skeleton className="h-6 w-24" /><Skeleton className="h-4 w-16" /></CardHeader>
            <CardContent className="p-4 space-y-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
      {Object.keys(standingsData).sort().map((groupName) => (
        <Card key={groupName} className="border-t-4 border-t-sky-600 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b p-4 flex flex-row items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setExpandedGroups((p) => ({ ...p, [groupName]: !p[groupName] }))}>
            <CardTitle className="text-lg font-bold text-sky-900 m-0">{groupName}</CardTitle>
            <div className="text-xs font-bold text-sky-600 flex items-center gap-1">{expandedGroups[groupName] ? <><ChevronUp className="h-4 w-4" /> Ẩn Lịch</> : <><ChevronDown className="h-4 w-4" /> Xem Lịch</>}</div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow><TableHead className="w-12 text-center">#</TableHead><TableHead>TÊN ĐỘI</TableHead><TableHead className="text-center">Trận</TableHead><TableHead className="text-center">T</TableHead><TableHead className="text-center">B</TableHead><TableHead className="text-center">HS</TableHead><TableHead className="text-center text-sky-800 font-bold">Điểm</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {standingsData[groupName].map((item, idx) => (
                <TableRow key={item.teamId} className={idx === 0 ? "bg-sky-50/50" : ""}>
                  <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                  <TableCell className="font-bold text-slate-800">{item.teamName} {idx === 0 && <Badge className="ml-2 text-[10px] h-5 px-1.5 bg-sky-500 hover:bg-sky-600 border-none">TOP</Badge>}</TableCell>
                  <TableCell className="text-center">{item.played}</TableCell>
                  <TableCell className="text-center">{item.wins}</TableCell>
                  <TableCell className="text-center">{item.losses}</TableCell>
                  <TableCell className="text-center">{item.goalDifference > 0 ? `+${item.goalDifference}` : item.goalDifference}</TableCell>
                  <TableCell className="text-center font-extrabold text-sky-800 text-base">{item.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {expandedGroups[groupName] && (
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <h4 className="text-sm font-bold text-sky-700 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2"><CalendarDays className="h-4 w-4" /> LỊCH THI ĐẤU {groupName.toUpperCase()}</h4>
              <div className="space-y-3">
                {matchesData[groupName]?.map((match) => (
                  <div key={match.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm gap-4">
                    <div className="flex flex-col text-xs text-slate-500 min-w-[100px]"><span className="font-medium">{match.time}</span><span className="font-bold text-slate-800 truncate">{match.court}</span></div>
                    <span className="flex-1 font-semibold text-slate-800 text-right truncate">{match.team1}</span>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold min-w-[60px] text-center ${match.status === "COMPLETED" ? "bg-slate-800 text-sky-300" : "bg-slate-100 text-slate-600"}`}>{match.status === "COMPLETED" ? `${match.result.t1} - ${match.result.t2}` : "VS"}</div>
                    <span className="flex-1 font-semibold text-slate-800 text-left truncate">{match.team2}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}