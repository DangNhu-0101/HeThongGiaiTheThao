import api from "@/libs/axios";
import type {
  TournamentKind,
  TournamentMgmtStat,
  TournamentOperationsState,
  TournamentRecord,
  TournamentUpsertPayload,
} from "@/types/orgTournamentMgmt";

type ApiList<T = unknown> = T[] | { data?: T[] };

const asArray = <T>(payload: ApiList<T>): T[] => {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
};

const formatDate = (value: unknown) => {
  const date = value ? new Date(String(value)) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const mapStatus = (status: unknown): TournamentRecord["status"] => {
  if (status === "playing" || status === "actived") return "Live";
  if (status === "completed" || status === "cancelled") return "Completed";
  return "Registration Open";
};

const readTimeline = (raw: Record<string, unknown>) => {
  const timeLine = asRecord(raw.timeLine);
  return {
    start: timeLine.tournamentStart || raw.startDate,
    end: timeLine.tournamentEnd || raw.endDate,
  };
};

const readSport = (raw: Record<string, unknown>, kind: TournamentKind) => {
  if (kind === "multi") return raw.numberOfSport ? `${raw.numberOfSport} mon` : "Nhieu mon";
  const categoryRule = asRecord(raw.categoryRule);
  return String(raw.sportType || categoryRule.sportType || "Chưa cấu hình");
};

const readFirstTournamentItemId = (raw: Record<string, unknown>, kind: TournamentKind) => {
  if (kind === "single") return String(raw._id || raw.id || "");
  const items = raw.tournamnetItem || raw.tournamentItems || raw.tournamentItem;
  if (Array.isArray(items) && items.length > 0) {
    if (typeof items[0] === "string") return items[0];
    const first = asRecord(items[0]);
    return String(first._id || first.id || items[0] || "");
  }
  return "";
};

const mapRecord = (rawValue: unknown, kind: TournamentKind): TournamentRecord => {
  const raw = asRecord(rawValue);
  const timeline = readTimeline(raw);
  const sport = readSport(raw, kind);
  const maxTeams = Number(raw.maxTeams || asRecord(asRecord(raw.categoryRule).customFields).maxTeams || 0);
  const registeredTeams = Number(raw.registeredTeams || 0);

  return {
    id: String(raw._id || raw.id || ""),
    tournamentItemId: readFirstTournamentItemId(raw, kind),
    kind,
    name: String(raw.name || "Giải đấu moi"),
    season: String((timeline.start ? new Date(String(timeline.start)).getFullYear() : new Date().getFullYear()) || ""),
    format: String(raw.format || (kind === "multi" ? "Hoi thao nhìeu mon" : "Giải đấu 1 mon")),
    sport,
    status: mapStatus(raw.status),
    registration: {
      current: registeredTeams,
      max: maxTeams,
      statusText: raw.status === "cancelled" ? "Đã hủy" : "Đang mở",
      isOpen: raw.status !== "completed" && raw.status !== "cancelled",
    },
    teamsCount: registeredTeams,
    startDate: formatDate(timeline.start),
    endDate: formatDate(timeline.end),
    revenue: { amount: "0", projectedText: "Chưa có dữ liệu doanh thu", isUp: false },
  };
};

const buildRegistrationConfig = (operations?: TournamentOperationsState) => {
  const mode = operations?.registrationMode || "system";
  return {
    mode,
    formUrl: mode === "external" ? operations?.registrationFormUrl || "" : "",
    zaloGroupUrl: mode === "external" ? operations?.zaloGroupUrl || "" : "",
    maxRegistrations: operations?.maxRegistrations || 0,
    instructions: mode === "external" ? operations?.registrationInstructions || "" : "",
    supportContacts: mode === "external" ? operations?.supportContacts || "" : "",
  };
};

const buildStats = (records: TournamentRecord[]): TournamentMgmtStat[] => [
  { id: "total", label: "Tong giai", value: records.length, iconType: "total", color: "text-blue-600 bg-blue-100" },
  { id: "live", label: "Đang diễn ra", value: records.filter((item) => item.status === "Live").length, iconType: "live", color: "text-red-600 bg-red-100" },
  { id: "open", label: "Mo đăng ký", value: records.filter((item) => item.status === "Registration Open").length, iconType: "open", color: "text-green-600 bg-green-100" },
  { id: "draft", label: "Ban nhap", value: records.filter((item) => item.status === "Draft").length, iconType: "draft", color: "text-gray-600 bg-gray-100" },
  { id: "completed", label: "Hoàn tất", value: records.filter((item) => item.status === "Completed").length, iconType: "completed", color: "text-emerald-600 bg-emerald-100" },
];

const toApiPayload = (payload: TournamentUpsertPayload) => {
  const locationText = payload.location?.detail || "";
  const locationParts = locationText.split(",").map((part) => part.trim());
  const bannerUrls = Array.isArray(payload.mediaConfig?.bannerUrls)
    ? payload.mediaConfig.bannerUrls.map(String)
    : payload.mediaConfig?.bannerUrl ? [String(payload.mediaConfig.bannerUrl)] : [];
  const paymentQR = String(payload.mediaConfig?.paymentQRUrl || payload.paymentConfig?.paymentQR || "");
  const timeLine = {
    registrationStart: payload.registrationStart,
    registrationEnd: payload.registrationEnd,
    tournamentStart: payload.tournamentStart,
    tournamentEnd: payload.tournamentEnd,
  };
  return {
    name: payload.name,
    description: payload.description,
    prizes: payload.prizes,
    format: payload.format,
    sportType: payload.sportType,
    maxTeams: payload.maxTeams,
    categoryRuleId: payload.categoryRuleId,
    categoryRuleIds: payload.categoryRuleIds,
    sportRules: payload.sportRules?.map((rule) => ({
      ...rule,
      registrationConfig: buildRegistrationConfig(rule.operations),
    })),
    feeEntry: payload.sportRules?.[0]?.feePerAthlete || 0,
    overview: payload.overview,
    registrationConfig: payload.registrationConfig,
    paymentConfig: payload.paymentConfig,
    sponsorshipConfig: payload.sponsorshipConfig,
    mediaConfig: payload.mediaConfig,
    galaConfig: payload.galaConfig,
    logo: String(payload.mediaConfig?.logoUrl || ""),
    // BE hiện tại lưu Tournament/TournamentItem.banner là String.
    // FE vẫn giữ nhìều banner trong state; chỉ gửi ảnh đầu tiên để không làm sai schema BE.
    banner: bannerUrls[0] || "",
    paymentQR,
    registrationStart: payload.registrationStart,
    registrationEnd: payload.registrationEnd,
    tournamentStart: payload.tournamentStart,
    tournamentEnd: payload.tournamentEnd,
    startDate: payload.tournamentStart,
    endDate: payload.tournamentEnd,
    timeLine,
    location: {
      detail: payload.location?.detail || "",
      district: payload.location?.district || locationParts[1] || "",
      city: payload.location?.city || locationParts[0] || "",
    },
  };
};

const singlePayloadForRule = (
  payload: TournamentUpsertPayload,
  rule: NonNullable<TournamentUpsertPayload["sportRules"]>[number],
): TournamentUpsertPayload => ({
  ...payload,
  name: rule.itemName || payload.name,
  description: rule.itemDescription || payload.description,
  prizes: rule.prizes ?? payload.prizes,
  format: rule.categoryName || payload.format,
  sportType: rule.sport || payload.sportType,
  categoryRuleId: rule.categoryRuleId,
  categoryRuleIds: rule.categoryRuleId ? [rule.categoryRuleId] : [],
  sportRules: [rule],
  registrationStart: rule.registrationStart || payload.registrationStart,
  registrationEnd: rule.registrationEnd || payload.registrationEnd,
  tournamentStart: rule.tournamentStart || payload.tournamentStart,
  tournamentEnd: rule.tournamentEnd || payload.tournamentEnd,
  location: { ...payload.location, detail: rule.location || payload.location?.detail || "" },
  maxTeams: rule.maxTeams || payload.maxTeams,
  mediaConfig: {
    ...payload.mediaConfig,
    logoUrl: rule.itemLogo || rule.operations?.logo || String(payload.mediaConfig?.logoUrl || ""),
    bannerUrls: rule.itemBanners || rule.operations?.banner || payload.mediaConfig?.bannerUrls,
    paymentQRUrl: rule.operations?.paymentQR || String(payload.mediaConfig?.paymentQRUrl || ""),
  },
});

const createCategoryRuleFromTemplate = async (categoryTemplateId: string, sportType: string) => {
  if (categoryTemplateId.startsWith("mock:")) {
    throw new Error("CategoryTemplate đang là fallback mock. Cần seed/trả danh mục thật từ BE trước khi tạo giải.");
  }
  const response = await api.post<{ success?: boolean; data?: { _id?: string; id?: string } }>("/rules/category-rules", {
    categoryTemplateId,
    sportType,
    editedRules: {},
  });
  const id = response.data.data?._id || response.data.data?.id;
  if (!id) throw new Error("BE không trả về categoryRuleId sau khi tạo từ CategoryTemplate.");
  return id;
};

const resolveCustomRules = async (payload: TournamentUpsertPayload): Promise<TournamentUpsertPayload> => {
  const resolvedRules = await Promise.all((payload.sportRules || []).map(async (rule) => {
    if (rule.categoryRuleId) return rule;
    if (rule.categoryTemplateId) {
      const categoryRuleId = await createCategoryRuleFromTemplate(rule.categoryTemplateId, rule.sport || payload.sportType || "");
      return { ...rule, categoryRuleId };
    }
    return rule;
  }));
  const ids = resolvedRules.map((rule) => rule.categoryRuleId).filter((id): id is string => Boolean(id));
  if (!ids.length) {
    throw new Error("Vui lòng chọn nội dung thi đấu hợp lệ.");
  }
  return { ...payload, sportRules: resolvedRules, categoryRuleId: ids[0], categoryRuleIds: ids };
};

export const orgTournamentMgmtService = {
  async getMgmtData(): Promise<{ stats: TournamentMgmtStat[]; records: TournamentRecord[] }> {
    try {
      const [multiResponse, singleResponse] = await Promise.all([
        api.get<ApiList>("/tournaments/my/multi"),
        api.get<ApiList>("/tournaments/my/single"),
      ]);
      const records = [
        ...asArray(multiResponse.data).map((item) => mapRecord(item, "multi")),
        ...asArray(singleResponse.data).map((item) => mapRecord(item, "single")),
      ];
      return { stats: buildStats(records), records };
    } catch (error) {
      console.error("Không thể tải danh sách giải đấu từ BE.", error);
      return { stats: buildStats([]), records: [] };
    }
  },

  async createTournament(payload: TournamentUpsertPayload): Promise<unknown> {
    const resolved = await resolveCustomRules(payload);
    if (resolved.kind === "single" && (resolved.sportRules?.length || 0) > 1) {
      const results = [];
      for (const rule of resolved.sportRules || []) {
        results.push(await this.createTournament(singlePayloadForRule(resolved, rule)));
      }
      return { success: true, data: results };
    }
    const response = await api.post(
      resolved.kind === "multi" ? "/tournaments/multi" : "/tournaments/single",
      toApiPayload(resolved),
    );
    return response.data;
  },

  async updateTournament(id: string, payload: TournamentUpsertPayload) {
    const resolved = await resolveCustomRules(payload);
    const response = await api.put(
      resolved.kind === "multi" ? `/tournaments/multi/${id}` : `/tournaments/single/${id}`,
      toApiPayload(resolved),
    );
    return response.data;
  },

  async deleteTournament(id: string, kind: TournamentKind) {
    const response = await api.delete(
      kind === "multi" ? `/tournaments/multi/${id}` : `/tournaments/single/${id}`,
    );
    return response.data;
  },
};
