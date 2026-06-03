import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import api from "@/api/axiosConfig";
import type { IStage } from "@/types/rules";

export interface TeamRef {
  _id?: string;
  name?: string;
  teamName?: string;
  teamname?: string;
}

export interface GroupMatch {
  _id: string;
  groupId?: { _id?: string; name?: string };
  group?: string;
  courtId?: { name?: string };
  courtName?: string;
  team1?: TeamRef | string;
  team2?: TeamRef | string;
  team1Name?: string;
  team2Name?: string;
  team1SlotCode?: string;
  team2SlotCode?: string;
  slotCode?: string;
  winnerTarget?: string;
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
  slotCode: string;
  sourceLabel: string;
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
  slotCode: string;
  winnerTarget?: string;
}

interface GroupSlot {
  groupName: string;
  groupCode: string;
  teamSlots: Array<{
    slotCode: string;
    sourceLabel: string;
    rank: number;
    advances: boolean;
  }>;
}

const getTeamName = (team: TeamRef | string | undefined, fallback = "Chờ đội"): string => {
  if (!team) return fallback;
  if (typeof team === "string") return team;
  return team.name || team.teamName || team.teamname || fallback;
};

const getTeamId = (team: TeamRef | string | undefined): string => {
  if (!team) return "";
  if (typeof team === "string") return team;
  return team._id || "";
};

const normalizeName = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

const formatTime = (value?: string) =>
  value ? new Date(value).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "Chưa xếp lịch";

const buildSlotsFromStages = (stages: IStage[]): GroupSlot[] => {
  const groupStages = stages.filter((stage) => stage.type === "GROUP_STAGE");
  const result: GroupSlot[] = [];

  groupStages.forEach((stage, stageIndex) => {
    const stageNo = stage.stageNumber || stageIndex + 1;
    stage.branches.forEach((branch, branchIndex) => {
      Array.from({ length: branch.numberOfGroups || 0 }, (_, groupIndex) => {
        const groupCode = `R${stageNo}-B${branchIndex + 1}-G${groupIndex + 1}`;
        const groupName = `${branch.name && branch.name !== "Nhánh chính" ? `${branch.name} - ` : ""}Bảng ${String.fromCharCode(65 + result.length)}`;
        result.push({
          groupName,
          groupCode,
          teamSlots: Array.from({ length: branch.playersPerGroup || 0 }, (_, idx) => {
            const rank = idx + 1;
            return {
              rank,
              slotCode: `${groupCode}-P${rank}`,
              sourceLabel: `${groupName} / Vị trí ${rank}`,
              advances: branch.selectedRanks.includes(rank),
            };
          }),
        });
      });
    });
  });

  return result;
};

const buildSlotsFromMatches = (matches: GroupMatch[]): GroupSlot[] => {
  const grouped = new Map<string, Set<string>>();

  matches.forEach((match) => {
    const groupName = match.groupId?.name || match.group || "Chưa phân bảng";
    if (!grouped.has(groupName)) grouped.set(groupName, new Set());
    const teamIds = grouped.get(groupName);
    if (match.team1SlotCode) teamIds?.add(match.team1SlotCode);
    if (match.team2SlotCode) teamIds?.add(match.team2SlotCode);
  });

  return Array.from(grouped.entries()).map(([groupName, slotCodes], index) => {
    const groupCode = Array.from(slotCodes)[0]?.replace(/-P\d+$/, "") || `R1-B1-G${index + 1}`;
    const slotCount = Math.max(2, slotCodes.size);
    return {
      groupName,
      groupCode,
      teamSlots: Array.from({ length: slotCount }, (_, slotIndex) => {
        const rank = slotIndex + 1;
        return {
          rank,
          slotCode: `${groupCode}-P${rank}`,
          sourceLabel: `${groupName} / Vị trí ${rank}`,
          advances: rank <= 2,
        };
      }),
    };
  });
};

const emptyRow = (slot: GroupSlot["teamSlots"][number], teamName = "Chờ đội"): TeamStanding => ({
  teamId: slot.slotCode,
  teamName,
  slotCode: slot.slotCode,
  sourceLabel: slot.sourceLabel,
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
  const [stageSlots, setStageSlots] = useState<GroupSlot[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [matchesRes, stagesRes] = await Promise.all([
          api.get("/matches", {
            params: tournamentId ? { tournamentId, matchType: "group", isPublished: true } : { matchType: "group", isPublished: true },
          }),
          api.get(`/stages/get-stages/${tournamentId}`).catch(() => ({ data: { data: [] } })),
        ]);

        if (!isMounted) return;

        const matches: GroupMatch[] = matchesRes?.data?.data || [];
        let configuredSlots = buildSlotsFromStages(stagesRes.data?.data || stagesRes.data?.rule?.stageTree || []);
        const hasMatchingConfiguredGroup = matches.some((match) => {
          const groupName = match.groupId?.name || match.group || "";
          return configuredSlots.some((slot) => normalizeName(slot.groupName) === normalizeName(groupName));
        });
        if (!configuredSlots.length || !hasMatchingConfiguredGroup) configuredSlots = buildSlotsFromMatches(matches);

        const nextStandings: Record<string, Record<string, TeamStanding>> = {};
        const nextMatches: Record<string, ProcessedMatch[]> = {};

        configuredSlots.forEach((group) => {
          nextStandings[group.groupName] = {};
          nextMatches[group.groupName] = [];
          group.teamSlots.forEach((slot) => {
            const teamNumber = slot.rank;
            nextStandings[group.groupName][slot.slotCode] = emptyRow(slot, `Team ${teamNumber}`);
          });
        });

        matches.forEach((match) => {
          const rawGroupName = match.groupId?.name || match.group || "Chưa phân bảng";
          const knownGroup = configuredSlots.find((slot) => normalizeName(slot.groupName) === normalizeName(rawGroupName));
          if (!knownGroup) return;

          const groupName = knownGroup.groupName;
          const ensureRow = (slotCode?: string, team?: TeamRef | string, fallback?: string) => {
            if (!slotCode) return null;
            const slot = knownGroup.teamSlots.find((item) => item.slotCode === slotCode)
              || { slotCode, sourceLabel: `${groupName} / slot`, rank: 0, advances: false };
            const row = nextStandings[groupName][slotCode] || emptyRow(slot, fallback || "Chờ đội");
            row.teamId = getTeamId(team) || slotCode;
            row.teamName = getTeamName(team, fallback || row.teamName);
            nextStandings[groupName][slotCode] = row;
            return row;
          };

          const row1 = ensureRow(match.team1SlotCode, match.team1, match.team1Name || "Team 1");
          const row2 = ensureRow(match.team2SlotCode, match.team2, match.team2Name || "Team 2");

          if (match.status === "COMPLETED" && row1 && row2) {
            const score1 = match.team1Score ?? 0;
            const score2 = match.team2Score ?? 0;
            row1.played += 1;
            row2.played += 1;
            row1.goalsFor += score1;
            row1.goalsAgainst += score2;
            row2.goalsFor += score2;
            row2.goalsAgainst += score1;
            row1.goalDifference = row1.goalsFor - row1.goalsAgainst;
            row2.goalDifference = row2.goalsFor - row2.goalsAgainst;

            if (score1 > score2) {
              row1.wins += 1; row2.losses += 1; row1.points += 3;
            } else if (score2 > score1) {
              row2.wins += 1; row1.losses += 1; row2.points += 3;
            } else {
              row1.draws += 1; row2.draws += 1; row1.points += 1; row2.points += 1;
            }
          }

          nextMatches[groupName].push({
            id: match._id,
            team1: getTeamName(match.team1, match.team1Name || "Team 1"),
            team2: getTeamName(match.team2, match.team2Name || "Team 2"),
            court: match.courtId?.name || match.courtName || "Chưa xếp sân",
            time: formatTime(match.scheduledStartTime || match.actualStartTime || match.createdAt),
            status: match.status,
            result: { t1: match.team1Score ?? 0, t2: match.team2Score ?? 0 },
            slotCode: match.slotCode || `${knownGroup.groupCode}-M${nextMatches[groupName].length + 1}`,
            winnerTarget: match.winnerTarget || "Xếp hạng bảng sẽ seed vào knock-out",
          });
        });

        const sortedStandings: Record<string, TeamStanding[]> = {};
        Object.entries(nextStandings).forEach(([groupName, rows]) => {
          sortedStandings[groupName] = Object.values(rows).sort((a, b) =>
            b.points - a.points ||
            b.goalDifference - a.goalDifference ||
            b.goalsFor - a.goalsFor ||
            a.slotCode.localeCompare(b.slotCode)
          );
        });

        setStageSlots(configuredSlots);
        setStandingsData(sortedStandings);
        setMatchesData(nextMatches);
        setExpandedGroups(Object.fromEntries(Object.keys(nextMatches).map((g) => [g, false])));
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu bảng xếp hạng:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchData();
    return () => { isMounted = false; };
  }, [tournamentId]);

  const groupNames = useMemo(() => Object.keys(standingsData).sort(), [standingsData]);

  if (isLoading) {
    return (
      <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="border-t-4 border-t-sky-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50 pb-3">
              <Skeleton className="h-6 w-24" /><Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (groupNames.length === 0) {
    return (
      <Card className="mt-4 border-dashed border-slate-300 bg-slate-50">
        <CardContent className="p-6 text-sm text-slate-500">
          Chưa có slot vòng bảng. Hãy lưu cấu hình vòng đấu hoặc khởi tạo khung phân bảng.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
      {groupNames.map((groupName) => {
        const configured = stageSlots.find((slot) => slot.groupName === groupName);
        return (
          <Card key={groupName} className="overflow-hidden border-t-4 border-t-sky-600 bg-white shadow-sm">
            <CardHeader className="flex cursor-pointer flex-row items-center justify-between border-b bg-slate-50 p-4 transition-colors hover:bg-slate-100" onClick={() => setExpandedGroups((p) => ({ ...p, [groupName]: !p[groupName] }))}>
              <div>
                <CardTitle className="m-0 text-lg font-bold text-sky-900">{groupName}</CardTitle>
                <div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                  <MapPin className="h-3 w-3" />
                  {configured?.groupCode || "DB-SLOT"}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-sky-600">
                <Badge variant="outline">{standingsData[groupName].length} slot</Badge>
                {expandedGroups[groupName] ? <><ChevronUp className="h-4 w-4" /> Ẩn lịch</> : <><ChevronDown className="h-4 w-4" /> Xem lịch</>}
              </div>
            </CardHeader>
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-16 text-center">Slot</TableHead>
                  <TableHead>Đội</TableHead>
                  <TableHead className="text-center">Trận</TableHead>
                  <TableHead className="text-center">T</TableHead>
                  <TableHead className="text-center">B</TableHead>
                  <TableHead className="text-center">HS</TableHead>
                  <TableHead className="text-center font-bold text-sky-800">Điểm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standingsData[groupName].map((item) => (
                  <TableRow key={`${item.teamId}-${item.slotCode}`}>
                    <TableCell className="text-center">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">{item.slotCode}</span>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-800">{item.teamName}</div>
                      <div className="text-[10px] text-slate-400">{item.sourceLabel}</div>
                    </TableCell>
                    <TableCell className="text-center">{item.played}</TableCell>
                    <TableCell className="text-center">{item.wins}</TableCell>
                    <TableCell className="text-center">{item.losses}</TableCell>
                    <TableCell className="text-center">{item.goalDifference > 0 ? `+${item.goalDifference}` : item.goalDifference}</TableCell>
                    <TableCell className="text-center text-base font-extrabold text-sky-800">{item.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {expandedGroups[groupName] && (
              <div className="border-t border-slate-100 bg-slate-50 p-4">
                <h4 className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-bold text-sky-700">
                  <CalendarDays className="h-4 w-4" /> Lịch thi đấu {groupName.toUpperCase()}
                </h4>
                <div className="space-y-3">
                  {(matchesData[groupName] || []).length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-400">
                      Slot bảng đã sẵn sàng, đội thật sẽ được đổ vào sau khi import/phân bảng.
                    </div>
                  ) : matchesData[groupName]?.map((match) => (
                    <div key={match.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="min-w-[120px] text-xs text-slate-500">
                        <span className="block font-mono text-[10px] font-bold text-slate-400">{match.slotCode}</span>
                        <span className="font-medium">{match.time}</span>
                        <span className="block truncate font-bold text-slate-800">{match.court}</span>
                      </div>
                      <span className="flex-1 truncate text-right font-semibold text-slate-800">{match.team1}</span>
                      <div className={`min-w-[60px] rounded-full px-3 py-1 text-center text-xs font-bold ${match.status === "COMPLETED" ? "bg-slate-800 text-sky-300" : "bg-slate-100 text-slate-600"}`}>
                        {match.status === "COMPLETED" ? `${match.result.t1} - ${match.result.t2}` : "VS"}
                      </div>
                      <span className="flex-1 truncate text-left font-semibold text-slate-800">{match.team2}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
