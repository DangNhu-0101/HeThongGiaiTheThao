import api from "@/libs/axios";
import type { HomeDataResponse } from "@/types/api";
import type { Match, Sport, Tournament } from "@/types/tournament";
import { readMatchSourceLabels } from "@/utils/matchSourceLabels";
import { buildSportsFromTournaments, getBackendTournaments } from "./backendAdapters";

type ApiList<T = unknown> = T[] | { data?: T[]; success?: boolean; message?: string };

const asArray = <T>(payload: ApiList<T>): T[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
};

const parseDate = (value: unknown) => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const cleanSportName = (value: unknown) => {
  const text = String(value || "").trim();
  if (!text || /^[A-Z0-9_-]{1,4}$/.test(text)) return "";
  return text;
};

const sortTournamentsForHome = (tournaments: Tournament[]) => {
  const now = Date.now();
  const rank = (item: Tournament) => {
    const registrationEnd = item.timeLine.registrationEnd?.getTime?.() || 0;
    const start = item.timeLine.tournamentStart?.getTime?.() || 0;
    if (item.status === "ongoing") return 0;
    if (registrationEnd >= now) return 1;
    if (start >= now) return 2;
    if (item.status === "upcoming") return 3;
    return 4;
  };

  return [...tournaments].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    return (a.timeLine.tournamentStart?.getTime?.() || 0) - (b.timeLine.tournamentStart?.getTime?.() || 0);
  });
};

const mapSportTemplates = (payload: unknown, tournaments: Tournament[]): Sport[] => {
  const tournamentCounts = new Map<string, number>();
  tournaments.forEach((tournament) => {
    tournament.sportType.forEach((name) => {
      const cleanName = cleanSportName(name);
      if (cleanName) tournamentCounts.set(cleanName, (tournamentCounts.get(cleanName) || 0) + 1);
    });
  });

  const sports = asArray(payload as ApiList).map((value, index) => {
    const raw = asRecord(value);
    const name = cleanSportName(raw.sportType || raw.name || raw.displayName);
    if (!name) return null;
    return {
      _id: String(raw._id || raw.id || `sport-${index + 1}`),
      name,
      iconUrl: String(raw.iconUrl || raw.icon || ""),
      imageUrl: String(raw.imageUrl || raw.image || raw.banner || ""),
      eventCount: tournamentCounts.get(name) || 0,
    } satisfies Sport;
  }).filter(Boolean) as Sport[];

  if (sports.length > 0) return sports;
  return buildSportsFromTournaments(tournaments);
};

const mapPublicMatch = (value: unknown, tournament: Tournament, index: number): Match | null => {
  const raw = asRecord(value);
  const scheduledAt = parseDate(raw.scheduledTime || raw.startTime);
  if (!scheduledAt) return null;

  const status = String(raw.status || "").toLowerCase();
  if (["cancelled", "canceled", "deleted"].includes(status)) return null;

  const stage = asRecord(raw.stageId);
  const group = asRecord(raw.groupId);
  const court = asRecord(raw.courtId);
  const result = asRecord(raw.matchResultId);
  const details = asRecord(result.details);
  const { teamA, teamB, nameA, nameB } = readMatchSourceLabels(raw);

  return {
    _id: String(raw._id || `${tournament._id || tournament.name}-${index}`),
    tournamentId: tournament._id || "",
    tournamentName: tournament.name,
    round: String(stage.name || raw.roundName || raw.name || "Vòng đấu"),
    groupName: String(group.name || ""),
    courtName: String(court.name || raw.courtName || raw.venue || ""),
    teamA: {
      name: nameA || String(teamA.name || "Chưa xác định"),
      logoUrl: String(teamA.logo || ""),
      score: Number(details.teamA ?? 0),
    },
    teamB: {
      name: nameB || String(teamB.name || "Chưa xác định"),
      logoUrl: String(teamB.logo || ""),
      score: Number(details.teamB ?? 0),
    },
    startTime: scheduledAt.toISOString(),
    status: status === "completed" ? "finished" : status === "live" ? "live" : "scheduled",
  };
};

const getUpcomingMatches = async (tournaments: Tournament[]) => {
  const now = Date.now();
  const candidates = tournaments.filter((item) => item._id).slice(0, 12);
  const responses = await Promise.allSettled(
    candidates.map(async (tournament) => {
      const response = await api.get<ApiList>(`/matches/public/tournament-item/${tournament._id}`);
      return asArray(response.data).map((match, index) => mapPublicMatch(match, tournament, index)).filter(Boolean) as Match[];
    }),
  );

  const matches = responses
    .flatMap((response) => (response.status === "fulfilled" ? response.value : []))
    .filter((match) => match.status !== "finished" && new Date(match.startTime).getTime() > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const nearestTime = matches[0]?.startTime;
  if (!nearestTime) return [];
  return matches.filter((match) => match.startTime === nearestTime).slice(0, 6);
};

export const homeService = {
  async getHomeData(): Promise<HomeDataResponse> {
    const tournaments = sortTournamentsForHome(await getBackendTournaments({ limit: 100, includeCompleted: true }));
    const [sportsResponse, upcomingMatches] = await Promise.all([
      api.get<ApiList>("/rules/templates").then((response) => mapSportTemplates(response.data, tournaments)),
      getUpcomingMatches(tournaments),
    ]);

    const sports = sportsResponse.length > 0 ? sportsResponse : buildSportsFromTournaments(tournaments);
    const totalTeams = tournaments.reduce((sum, item) => sum + Number(item.registeredTeams || 0), 0);

    return {
      tournaments: tournaments.slice(0, 6),
      matches: upcomingMatches,
      sports,
      stats: {
        ongoingTournaments: tournaments.filter((item) => item.status === "ongoing").length,
        totalTeams,
        totalSports: sports.length,
        totalAthletesOrRegistrations: totalTeams,
      },
    };
  },
};
