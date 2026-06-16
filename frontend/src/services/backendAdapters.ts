import api from "@/libs/axios";
import { mockSports } from "@/data/mockHomeData";
import type { Sport, Tournament } from "@/types/tournament";
import type { TournamentMgmtStat, TournamentRecord } from "@/types/orgTournamentMgmt";
import type { FeeProgressData, SponsorRecord } from "@/types/orgFinanceMgmt";
import type { OrgRefereeRecord, OrgVenueRecord, ResourceStat } from "@/types/orgResourceMgmt";
import type { ChartData, SportRecord, SportStat } from "@/types/adminSportsConfig";

type ApiList<T = unknown> = T[] | { data?: T[]; pagination?: unknown } | { success?: boolean; data?: T[] };

const asArray = <T>(payload: ApiList<T>): T[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

const dateOrNow = (value: unknown) => (value ? new Date(value as string) : new Date());

const normalizeStatus = (status: unknown): Tournament["status"] => {
  if (status === "playing" || status === "actived") return "ongoing";
  if (status === "completed" || status === "cancelled") return "completed";
  return "upcoming";
};

const textFromRef = (value: unknown, fallback = "") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.name || record.displayName || record._id || fallback);
  }
  return String(value);
};

const normalizeLocation = (location: unknown): Tournament["location"] => {
  if (!location) return {};
  if (typeof location === "string") return { city: location };
  const record = location as Record<string, unknown>;
  return {
    city: typeof record.city === "string" ? record.city : "",
    district: typeof record.district === "string" ? record.district : "",
  };
};

const readTournamentItem = (raw: Record<string, unknown>) => {
  const items = raw.tournamnetItem || raw.tournamentItem || raw.tournamentItems;
  if (Array.isArray(items) && items.length > 0 && typeof items[0] === "object") {
    return items[0] as Record<string, unknown>;
  }
  return {};
};

export const normalizeTournament = (rawValue: unknown): Tournament => {
  const raw = (rawValue || {}) as Record<string, unknown>;
  const item = readTournamentItem(raw);
  const timeline = (raw.timeLine || item.timeLine || {}) as Record<string, unknown>;
  const categoryRule = (item.categoryRule || raw.categoryRule || {}) as Record<string, unknown>;
  const sportType = categoryRule.sportType ? [String(categoryRule.sportType)] : [];

  return {
    _id: String(raw._id || item._id || ""),
    name: String(raw.name || item.name || "Giải đấu"),
    description: String(raw.description || item.description || ""),
    logo: String(raw.logo || item.logo || ""),
    banner: String(raw.banner || item.banner || ""),
    sportType,
    timeLine: {
      registrationStart: dateOrNow(timeline.registrationStart || raw.startDate),
      registrationEnd: dateOrNow(timeline.registrationEnd || raw.startDate),
      tournamentStart: dateOrNow(timeline.tournamentStart || raw.startDate),
      tournamentEnd: dateOrNow(timeline.tournamentEnd || raw.endDate),
    },
    paymentQR: String(raw.paymentQR || item.paymentQR || ""),
    prizes: String(raw.prizes || item.prizes || ""),
    galaConfig: {
      hasGala: Boolean((raw.galaConfig as Record<string, unknown> | undefined)?.hasGala || (item.galaConfig as Record<string, unknown> | undefined)?.hasGala),
      time: null,
      venue: String((raw.galaConfig as Record<string, unknown> | undefined)?.venue || (item.galaConfig as Record<string, unknown> | undefined)?.venue || ""),
      description: String((raw.galaConfig as Record<string, unknown> | undefined)?.description || (item.galaConfig as Record<string, unknown> | undefined)?.description || ""),
    },
    location: normalizeLocation(raw.location || item.location),
    baseRule: [],
    budget: { totalSponsor: 0, totalExpense: 0 },
    organizer: textFromRef(raw.organization || raw.organizer),
    sponsors: [],
    status: normalizeStatus(raw.status || item.status),
    createdAt: dateOrNow(raw.createdAt),
    updatedAt: dateOrNow(raw.updatedAt),
  };
};

export const getBackendTournaments = async (params?: Record<string, unknown>) => {
  const response = await api.get<ApiList>("/tournaments", { params });
  return asArray(response.data).map(normalizeTournament);
};

export const getBackendOrgTournaments = async () => {
  const response = await api.get<ApiList>("/tournaments/organization");
  return asArray(response.data).map(normalizeTournament);
};

export const buildSportsFromTournaments = (tournaments: Tournament[]): Sport[] => {
  const counts = new Map<string, number>();
  tournaments.forEach((tournament) => {
    const sports = tournament.sportType.length > 0 ? tournament.sportType : ["Khác"];
    sports.forEach((sport) => counts.set(sport, (counts.get(sport) || 0) + 1));
  });

  if (counts.size === 0) return mockSports;
  return Array.from(counts.entries()).map(([name, eventCount], index) => ({
    _id: `backend-sport-${index + 1}`,
    name,
    iconUrl: mockSports.find((sport) => sport.name.toLowerCase() === name.toLowerCase())?.iconUrl || "🏆",
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
      name: item.name,
      season: String(item.timeLine.tournamentStart.getFullYear()),
      format: item.sportType.join(", ") || "Chưa cấu hình",
      sport: item.sportType[0] || "Khác",
      status: item.status === "ongoing" ? "Live" : item.status === "completed" ? "Completed" : "Registration Open",
      registration: { current: 0, max: 0, statusText: "Chưa có dữ liệu đăng ký", isOpen: item.status === "upcoming" },
      teamsCount: 0,
      startDate: item.timeLine.tournamentStart.toISOString(),
      endDate: item.timeLine.tournamentEnd.toISOString(),
      revenue: { amount: "0", projectedText: "Backend chưa trả doanh thu", isUp: false },
    })),
  };
};

export const getFirstTournamentItemId = async () => {
  const response = await api.get<ApiList>("/tournaments", { params: { limit: 1 } });
  const first = asArray(response.data)[0] as Record<string, unknown> | undefined;
  if (!first) return "";
  const item = readTournamentItem(first);
  return String(item._id || first._id || "");
};

export const getBackendSponsors = async (): Promise<{ feeProgress: FeeProgressData; sponsors: SponsorRecord[] }> => {
  const tournamentItemId = await getFirstTournamentItemId();
  if (!tournamentItemId) throw new Error("Missing tournament item for sponsor lookup");

  const response = await api.get<ApiList>(`/sponsors/tournament/${tournamentItemId}`);
  const sponsors = asArray(response.data).map((rawValue) => {
    const raw = rawValue as Record<string, unknown>;
    return {
      id: String(raw._id || raw.id || ""),
      name: String(raw.name || "Nhà tài trợ"),
      logoUrl: String(raw.logo || ""),
      tier: String(raw.sponsorType || "Other"),
      amount: Number(raw.amount || 0),
      status: raw.status === "inactive" ? "Expired" : "Active",
    } satisfies SponsorRecord;
  });

  const collectedAmount = sponsors.reduce((sum, sponsor) => sum + sponsor.amount, 0);
  const expectedAmount = collectedAmount || 0;
  return {
    feeProgress: {
      expectedAmount,
      collectedAmount,
      progressPercentage: expectedAmount > 0 ? Math.round((collectedAmount / expectedAmount) * 100) : 0,
    },
    sponsors,
  };
};

export const getBackendResources = async (): Promise<{
  venueStats: ResourceStat[];
  refereeStats: ResourceStat[];
  venues: OrgVenueRecord[];
  referees: OrgRefereeRecord[];
}> => {
  const tournamentItemId = await getFirstTournamentItemId();
  if (!tournamentItemId) throw new Error("Missing tournament item for court lookup");

  const response = await api.get<ApiList>(`/courts/tournament/${tournamentItemId}`);
  const venues = asArray(response.data).map((rawValue) => {
    const raw = rawValue as Record<string, unknown>;
    const status = raw.status === "maintenance" ? "Maintenance" : raw.status === "busy" ? "Booked" : raw.status === "inactive" ? "Closed" : "Available";
    return {
      id: String(raw._id || raw.id || ""),
      name: String(raw.name || "Sân thi đấu"),
      location: String(raw.location || ""),
      type: "Sân thi đấu",
      sports: Array.isArray(raw.sportTypes) ? raw.sportTypes.map(String) : ["Chưa cấu hình"],
      status,
      nextBooking: "Backend chưa trả lịch đặt sân",
    } satisfies OrgVenueRecord;
  });

  return {
    venueStats: [
      { id: "total", label: "Tổng sân", value: venues.length, subtext: "Từ backend", iconType: "total", color: "text-blue-600" },
      { id: "available", label: "Sẵn sàng", value: venues.filter((venue) => venue.status === "Available").length, subtext: "Có thể xếp lịch", iconType: "available", color: "text-green-600" },
      { id: "maintenance", label: "Bảo trì", value: venues.filter((venue) => venue.status === "Maintenance").length, subtext: "Cần kiểm tra", iconType: "maintenance", color: "text-amber-600" },
    ],
    refereeStats: [],
    venues,
    referees: [],
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
      { id: "sports", label: "Môn thể thao", value: sports.length, trend: "Từ backend", iconType: "sports", color: "text-blue-600" },
      { id: "rules", label: "Bộ luật", value: categories.length, trend: "CategoryRule", iconType: "rules", color: "text-green-600" },
    ],
    sports,
    usage: sports.map((sport) => ({ name: sport.name, value: sport.rulesCount })),
    formats: sports.map((sport) => ({ name: sport.name, value: sport.formatsCount })),
  };
};
