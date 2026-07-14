import api from "@/libs/axios";
import { asArray, asRecord, initials } from "@/services/orgMatchPlanningService";
import { competitionFormatService } from "@/services/competitionFormatService";
import type { CompetitionStageConfig, StageSeedAssignment } from "@/types/competitionFormat";
import type { GroupStanding, TeamStanding, TopPerformer } from "@/types/standing";

type ApiList<T = unknown> = T[] | { data?: T[]; success?: boolean };

const statusForRank = (rank: number, total: number): TeamStanding["status"] => {
  if (rank <= 2) return "advance";
  if (total > 3 && rank === 3) return "playoff";
  return "neutral";
};

const readParticipantName = (raw: Record<string, unknown>) => {
  const participant = asRecord(raw.participant || raw.teamOrPlayerId || raw.team || raw.player);
  return String(participant.name || participant.displayName || raw.participantName || raw.teamName || raw.name || "Đội thi đấu");
};

const readParticipantLogo = (raw: Record<string, unknown>, teamName: string) => {
  const participant = asRecord(raw.participant || raw.teamOrPlayerId || raw.team || raw.player);
  return String(participant.logo || participant.avatar || raw.participantLogo || initials(teamName));
};

const rankTeams = (teams: TeamStanding[]) => {
  const sorted = [...teams].sort((a, b) =>
    b.points - a.points
    || b.goalDifference - a.goalDifference
    || b.goalsFor - a.goalsFor
    || a.teamName.localeCompare(b.teamName),
  );
  return sorted.map((team, index) => ({
    ...team,
    rank: team.rank > 0 ? team.rank : index + 1,
  })).sort((a, b) => a.rank - b.rank);
};

const mapRowsToGroups = (rows: unknown[]): GroupStanding[] => {
  const byGroup = new Map<string, TeamStanding[]>();

  rows.forEach((value) => {
    const raw = asRecord(value);
    const group = asRecord(raw.groupId);
    const stage = asRecord(raw.stageId);
    const bracket = asRecord(raw.bracketId);
    const groupId = String(group._id || raw.groupId || bracket._id || raw.bracketId || stage._id || raw.stageId || "overall");
    const groupName = String(group.name || bracket.name || stage.name || "Bảng xếp hạng");
    const teamName = readParticipantName(raw);
    const team: TeamStanding = {
      id: String(raw._id || `${groupId}-${raw.teamOrPlayerId || teamName}`),
      rank: Number(raw.rank || 0),
      teamName,
      logo: readParticipantLogo(raw, teamName),
      played: Number(raw.played || raw.matchesPlayed || 0),
      won: Number(raw.wins || raw.won || 0),
      drawn: Number(raw.draws || raw.drawn || 0),
      lost: Number(raw.losses || raw.lost || 0),
      wins: Number(raw.wins || raw.won || 0),
      draws: Number(raw.draws || raw.drawn || 0),
      losses: Number(raw.losses || raw.lost || 0),
      goalsFor: Number(raw.goalsFor || raw.pointsFor || raw.scoreFor || 0),
      goalsAgainst: Number(raw.goalsAgainst || raw.pointsAgainst || raw.scoreAgainst || 0),
      goalDifference: Number(raw.goalDifference || raw.pointDifference || raw.pointsDiff || 0),
      points: Number(raw.points || 0),
      tournamentItemId: String(raw.tournamentItemId || ""),
      teamOrPlayerId: String(asRecord(raw.teamOrPlayerId)._id || raw.teamOrPlayerId || asRecord(raw.participant)._id || ""),
      participantType: raw.participantType === "player" ? "player" : "team",
      stageId: String(stage._id || raw.stageId || ""),
      groupId,
      customStats: asRecord(raw.customStats),
      status: "neutral",
    };
    byGroup.set(`${groupId}|${groupName}`, [...(byGroup.get(`${groupId}|${groupName}`) || []), team]);
  });

  return Array.from(byGroup.entries()).map(([key, teams]) => {
    const [groupId, groupName] = key.split("|");
    const sorted = rankTeams(teams);
    return {
      groupId,
      groupName,
      teams: sorted.map((team) => ({ ...team, status: statusForRank(team.rank, sorted.length) })),
    };
  });
};

const seedAssignmentsBySlot = (stage: CompetitionStageConfig) =>
  new Map((stage.seedAssignments || []).map((assignment) => [assignment.slotId, assignment]));

const teamFromAssignment = (
  assignment: StageSeedAssignment,
  groupId: string,
  rank: number,
): TeamStanding => ({
  id: `${groupId}-${assignment.participantId}`,
  rank,
  teamName: assignment.participantName || "Đội thi đấu",
  logo: assignment.participantLogo || initials(assignment.participantName || "Doi"),
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  points: 0,
  tournamentItemId: "",
  teamOrPlayerId: assignment.participantId,
  participantType: "team",
  stageId: assignment.stageId,
  groupId,
  customStats: { source: "seedAssignments", slotLabel: assignment.slotLabel },
  status: "neutral",
});

const groupsFromFormatConfig = async (tournamentId: string): Promise<GroupStanding[]> => {
  const format = await competitionFormatService.getTournamentFormat(tournamentId);
  const groups: GroupStanding[] = [];

  format.stages.forEach((stage) => {
    const assignments = seedAssignmentsBySlot(stage);
    stage.brackets
      .filter((branch) => branch.type === "group")
      .forEach((branch) => {
        const groupConfigs = branch.groups?.length
          ? branch.groups
          : [{ name: branch.name || stage.name || "Bang A", numberOfTeams: branch.totalTeamsIn || stage.input.teams || 0 }];

        groupConfigs.forEach((groupConfig, groupIndex) => {
          const groupId = `${stage.id}:${branch.id}:group-${groupIndex + 1}`;
          const teams = Array.from({ length: Math.max(0, Number(groupConfig.numberOfTeams) || 0) }, (_, slotIndex) => {
            const slotId = `${stage.id}:${branch.id}:group-${groupIndex + 1}:slot-${slotIndex + 1}`;
            const assignment = assignments.get(slotId);
            return assignment ? teamFromAssignment(assignment, groupId, slotIndex + 1) : null;
          }).filter(Boolean) as TeamStanding[];

          if (teams.length > 0) {
            groups.push({
              groupId,
              groupName: `${stage.name} - ${groupConfig.name || branch.name}`,
              teams: teams.map((team) => ({ ...team, status: statusForRank(team.rank, teams.length) })),
            });
          }
        });
      });
  });

  return groups;
};

export const standingsService = {
  async getStandingsData(tournamentId: string): Promise<{ groups: GroupStanding[]; topScorers: TopPerformer[]; topAssists: TopPerformer[] }> {
    let publishedGroups: GroupStanding[] = [];
    try {
      const response = await api.get<ApiList>(`/matches/public/standings/${tournamentId}`);
      publishedGroups = mapRowsToGroups(asArray(response.data));
    } catch (error) {
      console.warn("Không thể tai standings published, se thu fallback tu cấu hình.", error);
    }

    const groups = publishedGroups.length > 0 ? publishedGroups : await groupsFromFormatConfig(tournamentId);

    return { groups, topScorers: [], topAssists: [] };
  },
};
