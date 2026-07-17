import api from "@/libs/axios";
import { readMatchSourceLabels } from "@/utils/matchSourceLabels";
import type { ChartData, SportRecord, SportStat } from "@/types/adminSportsConfig";
import type { FeeProgressData, SponsorRecord } from "@/types/orgFinanceMgmt";
import type { OrgRefereeRecord, OrgVenueRecord, ResourceStat } from "@/types/orgResourceMgmt";
import type { TournamentMgmtStat, TournamentRecord } from "@/types/orgTournamentMgmt";
import type { Match, MatchResult, Sport, Team, Tournament, TournamentDetail } from "@/types/tournament";

type ApiList<T = unknown> = T[] | { data?: T[]; pagination?: unknown } | { success?: boolean; data?: T[] };

const asArray = <T>(payload: ApiList<T>): T[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
};

const dateOrNow = (value: unknown) => {
  const date = value ? new Date(value as string) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const firstImage = (value: unknown) =>
  Array.isArray(value) ? String(value[0] || "") : String(value || "");

const normalizeStatus = (status: unknown): Tournament["status"] => {
  if (status === "playing" || status === "actived") return "ongoing";
  if (status === "completed" || status === "cancelled") return "completed";
  return "upcoming";
};

export const slugifySport = (value: unknown) => String(value || "")
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const textFromRef = (value: unknown, fallback = "") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.fullName || record.name || record.displayName || record.username || fallback);
  }
  return String(value);
};

const normalizeLocation = (location: unknown): Tournament["location"] => {
  if (!location) return {};
  if (typeof location === "string") {
    const [city = "", district = ""] = location.split(",").map((part) => part.trim());
    return { city, district };
  }
  const record = asRecord(location);
  return {
    city: typeof record.city === "string" ? record.city : "",
    district: typeof record.district === "string" ? record.district : "",
    detail: typeof record.detail === "string" ? record.detail : "",
  };
};

const readTournamentItem = (raw: Record<string, unknown>) => {
  const items = raw.tournamnetItem || raw.tournamentItem || raw.tournamentItems;
  if (Array.isArray(items) && items.length > 0 && typeof items[0] === "object") {
    return items[0] as Record<string, unknown>;
  }
  if (raw.categoryRule || raw.timeLine) return raw;
  return {};
};

const readCategoryRule = (raw: Record<string, unknown>, item: Record<string, unknown>) => {
  return asRecord(item.categoryRule || raw.categoryRule);
};

const readApiData = (payload: unknown) => {
  const record = asRecord(payload);
  return asRecord(record.data || record);
};

const parsePrizeCards = (value: unknown): TournamentDetail["prizes"] => {
  const fallback = [{ rank: "Giải thưởng", amount: "Chưa công bố", color: "bg-gray-100 text-gray-700 border-gray-300" }];
  if (!value) return fallback;
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      const record = asRecord(item);
      return {
        rank: String(record.rank || record.name || `Hạng ${index + 1}`),
        amount: String(record.amount || record.value || "Chưa công bố"),
        color: String(record.color || "bg-gray-100 text-gray-700 border-gray-300"),
      };
    });
  }
  return [{ ...fallback[0], amount: String(value) }];
};

export const normalizeTournament = (rawValue: unknown): Tournament => {
  const raw = asRecord(rawValue);
  const item = readTournamentItem(raw);
  const timeline = asRecord(raw.timeLine || item.timeLine);
  const categoryRule = readCategoryRule(raw, item);
  const rawMediaConfig = asRecord(raw.mediaConfig);
  const itemMediaConfig = asRecord(item.mediaConfig);
  const sportType = categoryRule.sportType ? [String(categoryRule.sportType)] : raw.numberOfSport ? [`${raw.numberOfSport} môn`] : [];

  return {
    _id: String(item._id || raw._id || ""),
    name: String(raw.name || item.name || "Giải đấu"),
    description: String(raw.description || item.description || ""),
    logo: String(raw.logo || item.logo || rawMediaConfig.logoUrl || itemMediaConfig.logoUrl || ""),
    banner: firstImage(rawMediaConfig.bannerUrls || itemMediaConfig.bannerUrls || raw.banner || item.banner),
    sportType,
    timeLine: {
      registrationStart: dateOrNow(timeline.registrationStart || raw.startDate),
      registrationEnd: dateOrNow(timeline.registrationEnd || raw.startDate),
      tournamentStart: dateOrNow(timeline.tournamentStart || raw.startDate),
      tournamentEnd: dateOrNow(timeline.tournamentEnd || raw.endDate),
    },
    paymentQR: String(raw.paymentQR || item.paymentQR || rawMediaConfig.paymentQRUrl || itemMediaConfig.paymentQRUrl || ""),
    prizes: String(raw.prizes || item.prizes || ""),
    galaConfig: {
      hasGala: Boolean(asRecord(raw.galaConfig).hasGala || asRecord(item.galaConfig).hasGala),
      time: asRecord(raw.galaConfig).time || asRecord(item.galaConfig).time ? dateOrNow(asRecord(raw.galaConfig).time || asRecord(item.galaConfig).time) : null,
      venue: String(asRecord(raw.galaConfig).venue || asRecord(item.galaConfig).venue || ""),
      description: String(asRecord(raw.galaConfig).description || asRecord(item.galaConfig).description || ""),
    },
    location: normalizeLocation(raw.location || item.location),
    baseRule: [],
    budget: { totalSponsor: 0, totalExpense: 0 },
    organizer: textFromRef(raw.organization || item.organization || raw.organizer, "Chưa có ban tổ chức"),
    sponsors: [],
    status: normalizeStatus(raw.status || item.status),
    registeredTeams: Number(
      raw.registeredTeams
      || item.registeredTeams
      || raw.registeredTeamCount
      || item.registeredTeamCount
      || raw.participantCount
      || item.participantCount
      || raw.teamsCount
      || item.teamsCount
      || 0,
    ),
    maxTeams: Number(raw.maxTeams || item.maxTeams || 0),
    createdAt: dateOrNow(raw.createdAt),
    updatedAt: dateOrNow(raw.updatedAt),
  };
};

export const getBackendTournaments = async (params?: Record<string, unknown>) => {
  const { includeCompleted, ...requestParams } = params || {};
  const query = { limit: 100, ...requestParams };
  const [multiResponse, singleResponse] = await Promise.allSettled([
    api.get<ApiList>("/tournaments", { params: query }),
    api.get<ApiList>("/tournaments/single", { params: query }),
  ]);
  const multi = multiResponse.status === "fulfilled" ? asArray(multiResponse.value.data) : [];
  const single = singleResponse.status === "fulfilled" ? asArray(singleResponse.value.data) : [];
  return [...multi, ...single]
    .map(normalizeTournament)
    .filter((tournament) => tournament._id && (includeCompleted ? true : tournament.status !== "completed"));
};

export const getBackendOrgTournaments = async () => {
  const [multiResponse, singleResponse] = await Promise.all([
    api.get<ApiList>("/tournaments/my/multi"),
    api.get<ApiList>("/tournaments/my/single"),
  ]);
  return [...asArray(multiResponse.data), ...asArray(singleResponse.data)].map(normalizeTournament);
};

export const getBackendTournamentDetail = async (id: string): Promise<{
  detail: TournamentDetail;
  teams: Team[];
  recentResults: MatchResult[];
  sports: Sport[];
  upcomingMatches: Match[];
}> => {
  let payload: unknown;
  try {
    payload = (await api.get(`/tournaments/single/${id}`)).data;
  } catch {
    payload = (await api.get(`/tournaments/multi/${id}`)).data;
  }
  const raw = readApiData(payload);
  const item = readTournamentItem(raw);
  const categoryRule = readCategoryRule(raw, item);
  const playerSlots = asRecord(categoryRule.playerSlotsPerTeam);
  const tournament = normalizeTournament(raw);
  const competitionFormat = asRecord(item.competitionFormat || raw.competitionFormat);
  const competitionConfig = asRecord(competitionFormat.config);
  const registeredTeams = Number(
    raw.registeredTeams
      || item.registeredTeams
      || raw.registeredTeamCount
      || item.registeredTeamCount
      || raw.participantCount
      || item.participantCount
      || raw.teamsCount
      || item.teamsCount
      || 0,
  );
  const maxTeams = Number(asRecord(categoryRule.customFields).maxTeams || raw.maxTeams || item.maxTeams || registeredTeams || 1);
  const registrationConfig = asRecord(item.registrationConfig || raw.registrationConfig);
  const sponsorshipConfig = asRecord(item.sponsorshipConfig || raw.sponsorshipConfig);

  let detail: TournamentDetail = {
    ...tournament,
    registeredTeams,
    maxTeams: maxTeams > 0 ? maxTeams : 1,
    about: tournament.description || "Chưa có mô tả chi tiết cho giải đấu này.",
    format: [
      {
        name: String(competitionFormat.name || competitionConfig.name || categoryRule.displayName || categoryRule.name || tournament.sportType[0] || "Thể thức"),
        description: String(competitionFormat.description || competitionConfig.description || categoryRule.description || `Số vận động viên mỗi đội: ${playerSlots.min || 1}-${playerSlots.max || 1}.`),
      },
    ],
    prizes: parsePrizeCards(item.prizes || raw.prizes),
    registrationMode: registrationConfig.mode === "external" ? "external" : "system",
    registrationFormUrl: String(registrationConfig.formUrl || ""),
    registrationInstructions: String(registrationConfig.instructions || ""),
    supportContacts: String(registrationConfig.supportContacts || ""),
    sponsorContact: String(sponsorshipConfig.contact || ""),
  };
  let teams: Team[] = [];
  let publicMatches: unknown[] = [];
  if (tournament._id) {
    try {
      const participantsResponse = await api.get<ApiList>(`/participants/tournament/${tournament._id}`);
      const participants = asArray(participantsResponse.data);
      if (participants.length > 0) {
        teams = participants.map((value) => {
          const participant = asRecord(value);
          return {
            _id: String(participant._id || ""),
            name: String(participant.name || "Đội thi đấu"),
            logo: String(participant.logo || ""),
            sport: tournament.sportType[0] || "Chưa cập nhật",
            location: String(asRecord(participant.representative).phone || "Chưa cập nhật"),
            stats: {
              athletes: Array.isArray(participant.lineup) ? participant.lineup.length : 0,
              wins: 0,
              winRate: "0%",
            },
            status: participant.registrationStatus === "approved" ? "active" : "pending",
          } satisfies Team;
        });
      }
    } catch {
      teams = [];
    }
    try {
      const matchesResponse = await api.get<ApiList>(`/matches/public/tournament-item/${tournament._id}`);
      publicMatches = asArray(matchesResponse.data);
    } catch {
      publicMatches = [];
    }
    try {
      const sponsorsResponse = await api.get<ApiList>(`/sponsors/tournament-item/${tournament._id}`);
      detail = {
        ...detail,
        sponsors: asArray(sponsorsResponse.data)
          .map((value) => {
            const sponsor = asRecord(value);
            return {
              _id: String(sponsor._id || sponsor.id || ""),
              name: String(sponsor.name || ""),
              logo: String(sponsor.logo || ""),
              website: String(sponsor.website || ""),
              sponsorType: String(sponsor.sponsorType || ""),
              sponsorshipType: String(sponsor.sponsorshipType || ""),
              amount: Number(sponsor.amount || 0),
              status: sponsor.status === "inactive" ? "inactive" as const : "actived" as const,
            };
          })
          .filter((sponsor) => sponsor.name && sponsor.status !== "inactive"),
      };
    } catch {
      detail = { ...detail, sponsors: [] };
    }
  }

  if (teams.length > 0 || registeredTeams === 0) {
    detail = {
      ...detail,
      registeredTeams: Math.min(Math.max(detail.registeredTeams, teams.length), detail.maxTeams),
    };
  }

  const mappedMatches = publicMatches.map((value, index) => {
    const match = asRecord(value);
    const stage = asRecord(match.stageId);
    const result = asRecord(match.matchResultId);
    const details = asRecord(result.details);
    const { teamA, teamB, nameA, nameB } = readMatchSourceLabels(match);
    const scheduledDate = match.scheduledTime ? new Date(String(match.scheduledTime)) : null;
    const hasValidSchedule = Boolean(scheduledDate && !Number.isNaN(scheduledDate.getTime()));
    const resultDate = result.updatedAt ? new Date(String(result.updatedAt)) : null;
    const matchUpdatedDate = match.updatedAt ? new Date(String(match.updatedAt)) : null;
    const completedSortDate = [resultDate, matchUpdatedDate, scheduledDate]
      .find((date) => date && !Number.isNaN(date.getTime())) || null;
    const court = asRecord(match.courtId);
    const courtName = String(court.name || court.label || match.courtName || match.venue || "");
    return {
      match: {
        _id: String(match._id || index + 1),
        tournamentId: tournament._id || id,
        tournamentName: tournament.name,
        round: String(stage.name || match.name || "Vòng đấu"),
        teamA: { name: nameA || "Chưa xác định", logoUrl: String(teamA.logo || ""), score: Number(details.teamA ?? 0) },
        teamB: { name: nameB || "Chưa xác định", logoUrl: String(teamB.logo || ""), score: Number(details.teamB ?? 0) },
        startTime: hasValidSchedule ? scheduledDate!.toISOString() : "",
        status: match.status === "completed" ? "finished" : match.status === "live" ? "live" : "scheduled",
      } satisfies Match,
      raw: match,
      scheduledAt: hasValidSchedule ? scheduledDate!.getTime() : null,
      completedSortAt: completedSortDate ? completedSortDate.getTime() : 0,
      courtName,
    };
  });
  const now = Date.now();
  const completedMatches = mappedMatches
    .filter((entry) => entry.match.status === "finished")
    .sort((a, b) => b.completedSortAt - a.completedSortAt)
    .slice(0, 5);
  const futureMatches = mappedMatches
    .filter((entry) => entry.match.status !== "finished" && entry.scheduledAt !== null && entry.scheduledAt > now)
    .sort((a, b) => (a.scheduledAt || 0) - (b.scheduledAt || 0));
  const nearestSlot = futureMatches[0]?.scheduledAt;
  const upcomingMatches = nearestSlot
    ? futureMatches
        .filter((entry) => entry.scheduledAt === nearestSlot)
        .sort((a, b) => a.courtName.localeCompare(b.courtName, "vi") || a.match.teamA.name.localeCompare(b.match.teamA.name, "vi"))
        .map((entry) => ({ ...entry.match, tournamentId: entry.match.tournamentId || id }))
    : [];

  return {
    detail,
    teams,
    recentResults: completedMatches
      .map((entry) => ({
        _id: entry.match._id,
        date: entry.match.startTime ? new Date(entry.match.startTime).toLocaleDateString("vi-VN") : "Chưa cập nhật",
        teamA: { name: entry.match.teamA.name, logo: entry.match.teamA.logoUrl, score: entry.match.teamA.score || 0 },
        teamB: { name: entry.match.teamB.name, logo: entry.match.teamB.logoUrl, score: entry.match.teamB.score || 0 },
        stadium: entry.courtName || "Chưa cập nhật",
      } satisfies MatchResult)),
    sports: buildSportsFromTournaments([tournament]),
    upcomingMatches,
  };
};

export const buildSportsFromTournaments = (tournaments: Tournament[]): Sport[] => {
  const counts = new Map<string, number>();
  tournaments.forEach((tournament) => {
    const sports = tournament.sportType.length > 0 ? tournament.sportType : ["Khác"];
    sports.forEach((sport) => counts.set(sport, (counts.get(sport) || 0) + 1));
  });

  if (counts.size === 0) return [];
  return Array.from(counts.entries()).map(([name, eventCount], index) => ({
    _id: `backend-sport-${index + 1}`,
    name,
    slug: slugifySport(name),
    iconUrl: "",
    eventCount,
  }));
};

export const mapTournamentMgmt = (tournaments: Tournament[]): { stats: TournamentMgmtStat[]; records: TournamentRecord[] } => {
  const total = tournaments.length;
  const live = tournaments.filter((item) => item.status === "ongoing").length;
  const open = tournaments.filter((item) => item.status === "upcoming").length;
  const completed = tournaments.filter((item) => item.status === "completed").length;

  return {
    stats: [
      { id: "total", label: "Tổng giải", value: total, iconType: "total", color: "text-blue-600" },
      { id: "live", label: "Đang diễn ra", value: live, iconType: "live", color: "text-green-600" },
      { id: "open", label: "Sắp mở", value: open, iconType: "open", color: "text-amber-600" },
      { id: "completed", label: "Hoàn thành", value: completed, iconType: "completed", color: "text-slate-600" },
    ],
    records: tournaments.map((item) => ({
      id: item._id || item.name,
      kind: item.sportType.length > 1 || item.sportType[0]?.includes("môn") ? "multi" : "single",
      name: item.name,
      season: String(item.timeLine.tournamentStart.getFullYear()),
      format: item.sportType.join(", ") || "Chưa cấu hình",
      sport: item.sportType[0] || "Khác",
      status: item.status === "ongoing" ? "Live" : item.status === "completed" ? "Completed" : "Registration Open",
      registration: { current: 0, max: 0, statusText: "Chưa có dữ liệu đăng ký", isOpen: item.status === "upcoming" },
      teamsCount: 0,
      startDate: item.timeLine.tournamentStart.toISOString(),
      endDate: item.timeLine.tournamentEnd.toISOString(),
      revenue: { amount: "0", projectedText: "Chưa có dữ liệu doanh thu", isUp: false },
    })),
  };
};

export const getFirstTournamentItemId = async () => {
  const response = await api.get<ApiList>("/tournaments/my/single");
  const first = asRecord(asArray(response.data)[0]);
  return String(first._id || "");
};

export const getBackendSponsors = async (tournamentItemId: string): Promise<{ feeProgress: FeeProgressData; sponsors: SponsorRecord[] }> => {
  if (!tournamentItemId) throw new Error("Thiếu tournamentItemId");
  const response = await api.get<ApiList>(`/sponsors/tournament-item/${tournamentItemId}`);
  const sponsors = asArray(response.data).map((value) => {
    const raw = asRecord(value);
    return {
      id: String(raw._id || ""),
      name: String(raw.name || ""),
      logoUrl: String(raw.logo || ""),
      tier: String(raw.sponsorType || "Other"),
      amount: Number(raw.amount || 0),
      status: raw.status === "inactive" ? "Expired" : "Active",
    } satisfies SponsorRecord;
  });
  const collected = sponsors.reduce((sum, sponsor) => sum + sponsor.amount, 0);
  return {
    sponsors,
    feeProgress: {
      collectedAmount: collected,
      expectedAmount: collected,
      progressPercentage: collected > 0 ? 100 : 0,
    },
  };
};

export const getBackendResources = async (tournamentItemId: string): Promise<{
  venueStats: ResourceStat[];
  refereeStats: ResourceStat[];
  venues: OrgVenueRecord[];
  referees: OrgRefereeRecord[];
}> => {
  if (!tournamentItemId) throw new Error("Missing tournament item for resource lookup");

  const [courtResponse, refereeResponse] = await Promise.all([
    api.get<ApiList>(`/courts/tournament-item/${tournamentItemId}`),
    api.get<ApiList>(`/tournament-referees/tournament-item/${tournamentItemId}`),
  ]);

  const venues = asArray(courtResponse.data).map((rawValue) => {
    const raw = asRecord(rawValue);
    const status = raw.status === "maintenance" ? "Maintenance" : raw.status === "busy" ? "Booked" : raw.status === "inactived" ? "Closed" : "Available";
    return {
      id: String(raw._id || raw.id || ""),
      name: String(raw.name || "Sân thi đấu"),
      location: String(raw.location || ""),
      type: "Sân thi đấu",
      sports: Array.isArray(raw.sportTypes) ? raw.sportTypes.map(String) : ["Chưa cấu hình"],
      status,
      nextBooking: "Chưa có lịch sử dụng tiếp theo",
    } satisfies OrgVenueRecord;
  });

  const referees = asArray(refereeResponse.data).map((rawValue) => {
    const raw = asRecord(rawValue);
    const status = raw.status === "assigned" ? "Assigned" : raw.status === "unavailable" ? "Unavailable" : "Available";
    const user = asRecord(raw.userId);
    const matchesAssigned = Number(raw.matchesAssigned || 0);
    const workload = matchesAssigned >= 8 ? "Over" : matchesAssigned >= 5 ? "High" : matchesAssigned >= 2 ? "Med" : "Low";
    return {
      id: String(raw._id || raw.id || ""),
      name: String(raw.name || "Trọng tài"),
      phoneNumber: String(raw.phoneNumber || user.phoneNumber || ""),
      avatar: String(raw.name || "T").trim().slice(0, 1).toUpperCase(),
      refId: String(raw._id || raw.id || ""),
      qualification: String(raw.qualification || "Chưa cập nhật"),
      experience: Number(raw.experience || 0),
      matchesAssigned,
      workload,
      status,
      accountLinked: Boolean(user._id || user.id || raw.userId),
      accountLabel: String(user.username || user.email || ""),
    } satisfies OrgRefereeRecord;
  });

  return {
    venueStats: [
      { id: "total", label: "Tổng sân", value: venues.length, subtext: "Đang quản lý", iconType: "total", color: "text-blue-600" },
      { id: "available", label: "Sẵn sàng", value: venues.filter((venue) => venue.status === "Available").length, subtext: "Có thể xếp lịch", iconType: "available", color: "text-green-600" },
      { id: "maintenance", label: "Bảo trì", value: venues.filter((venue) => venue.status === "Maintenance").length, subtext: "Cần kiểm tra", iconType: "maintenance", color: "text-amber-600" },
    ],
    refereeStats: [
      { id: "total", label: "Tổng trọng tài", value: referees.length, subtext: "Đang quản lý", iconType: "total", color: "text-blue-600" },
      { id: "available", label: "Sẵn sàng", value: referees.filter((referee) => referee.status === "Available").length, subtext: "Có thể phân công", iconType: "available", color: "text-green-600" },
      { id: "assigned", label: "Đã phân công", value: referees.filter((referee) => referee.status === "Assigned").length, subtext: "Đang làm nhiệm vụ", iconType: "activity", color: "text-amber-600" },
    ],
    venues,
    referees,
  };
};
export const getBackendSportsConfig = async (): Promise<{ stats: SportStat[]; sports: SportRecord[]; usage: ChartData[]; formats: ChartData[] }> => {
  const [templatesResponse, categoriesResponse] = await Promise.all([
    api.get<ApiList>("/rules/templates"),
    api.get<ApiList>("/rules/category-rules"),
  ]);

  const templates = asArray(templatesResponse.data) as Record<string, unknown>[];
  const categories = asArray(categoriesResponse.data) as Record<string, unknown>[];
  const sportNames = new Set([...templates, ...categories].map((item) => String(item.sportType || item.name || "Khác")));

  const sports: SportRecord[] = Array.from(sportNames).map((name, index) => {
    const rulesCount = categories.filter((item) => String(item.sportType || "Khác") === name).length;
    return {
      id: `backend-rule-${index + 1}`,
      name,
      icon: "🏆",
      status: "Hoạt động",
      tournamentsCount: 0,
      formatsCount: templates.filter((item) => String(item.sportType || item.name || "Khác") === name).length,
      rulesCount,
      orgsCount: 0,
      formats: [],
    };
  });

  return {
    stats: [
      { id: "sports", label: "Môn thể thao", value: sports.length, trend: "Đang hoạt động", iconType: "sports", color: "text-blue-600" },
      { id: "rules", label: "Bộ luật", value: categories.length, trend: "CategoryRule", iconType: "rules", color: "text-green-600" },
    ],
    sports,
    usage: sports.map((sport) => ({ name: sport.name, value: sport.rulesCount })),
    formats: sports.map((sport) => ({ name: sport.name, value: sport.formatsCount })),
  };
};
