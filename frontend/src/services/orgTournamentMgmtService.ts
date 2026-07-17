import api from "@/libs/axios";
import type {
  TournamentKind,
  TournamentMgmtStat,
  TournamentItemSummary,
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

const isActiveTournamentRecord = (value: unknown) => {
  const raw = asRecord(value);
  return String(raw.status || "").toLowerCase() !== "cancelled";
};

const formatDate = (value: unknown) => {
  const date = value ? new Date(String(value)) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatDateTimeInput = (value: unknown) => {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const mapStatus = (status: unknown, timelineEnd?: unknown): TournamentRecord["status"] => {
  const endDate = timelineEnd ? new Date(String(timelineEnd)) : null;
  if (endDate && !Number.isNaN(endDate.getTime()) && endDate.getTime() < Date.now()) return "Completed";
  if (status === "playing" || status === "actived") return "Live";
  if (status === "completed" || status === "cancelled") return "Completed";
  return "Registration Open";
};

const readTimeline = (raw: Record<string, unknown>) => {
  const timeLine = asRecord(raw.timeLine);
  return {
    registrationEnd: timeLine.registrationEnd || raw.registrationEnd,
    start: timeLine.tournamentStart || raw.startDate,
    end: timeLine.tournamentEnd || raw.endDate,
  };
};

const readSport = (raw: Record<string, unknown>, kind: TournamentKind) => {
  if (kind === "multi") return raw.numberOfSport ? `${raw.numberOfSport} môn` : "Nhiều môn";
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

const readTournamentItemRecords = (raw: Record<string, unknown>, kind: TournamentKind) => {
  const items = raw.tournamnetItem || raw.tournamentItems || raw.tournamentItem;
  if (Array.isArray(items)) return items.map(asRecord).filter((item) => Object.keys(item).length > 0);
  if (kind === "single") return [raw];
  return [];
};

const mapTournamentItemSummary = (item: Record<string, unknown>): TournamentItemSummary => {
  const itemLocation = asRecord(item.location);
  const itemLocationText = typeof item.location === "string" ? item.location : "";
  const itemTimeline = asRecord(item.timeLine);
  return {
    id: String(item._id || item.id || ""),
    name: String(item.name || "Nội dung thi đấu"),
    description: String(item.description || ""),
    sportType: String(item.sportType || ""),
    format: String(item.format || ""),
    competitionFormat: String(item.competitionFormat || ""),
    status: String(item.status || ""),
    logo: String(item.logo || ""),
    banner: String(item.banner || ""),
    paymentQR: String(item.paymentQR || ""),
    feeEntry: Number(item.feeEntry || 0),
    maxTeams: Number(item.maxTeams || 0),
    registeredTeams: Number(item.registeredTeams || 0),
    prizes: String(item.prizes || ""),
    location: {
      city: String(itemLocation.city || ""),
      district: String(itemLocation.district || ""),
      detail: String(itemLocation.detail || itemLocationText || ""),
    },
    timeLine: {
      registrationStart: formatDateTimeInput(itemTimeline.registrationStart),
      registrationEnd: formatDateTimeInput(itemTimeline.registrationEnd),
      tournamentStart: formatDateTimeInput(itemTimeline.tournamentStart),
      tournamentEnd: formatDateTimeInput(itemTimeline.tournamentEnd),
    },
  };
};

const mapRecord = (rawValue: unknown, kind: TournamentKind): TournamentRecord => {
  const raw = asRecord(rawValue);
  const tournamentItems = readTournamentItemRecords(raw, kind);
  const itemSummaries = tournamentItems.map(mapTournamentItemSummary);
  const firstItem = itemSummaries[0];
  const timeline = readTimeline(raw);
  const sport = readSport(raw, kind);
  const maxTeamsFromItems = itemSummaries.reduce((sum, item) => sum + Number(item.maxTeams || 0), 0);
  const registeredTeamsFromItems = itemSummaries.reduce((sum, item) => sum + Number(item.registeredTeams || 0), 0);
  const maxTeams = Number(raw.maxTeams || maxTeamsFromItems || asRecord(asRecord(raw.categoryRule).customFields).maxTeams || 0);
  const registeredTeams = Number(raw.registeredTeams || registeredTeamsFromItems || 0);
  const location = asRecord(raw.location);
  const locationText = typeof raw.location === "string" ? raw.location : "";
  const mediaConfig = asRecord(raw.mediaConfig);
  const registrationConfig = asRecord(raw.registrationConfig);
  const paymentConfig = asRecord(raw.paymentConfig);
  const sponsorshipConfig = asRecord(raw.sponsorshipConfig);
  const galaConfig = asRecord(raw.galaConfig);
  const banner = raw.banner || mediaConfig.bannerUrl || mediaConfig.bannerUrls || firstItem?.banner;
  const coverImage = Array.isArray(banner) ? String(banner[0] || "") : String(banner || "");
  const registrationMode = String(registrationConfig.mode || registrationConfig.registrationMode || "system") as TournamentOperationsState["registrationMode"];
  const rawBanner = raw.banner || mediaConfig.bannerUrls || mediaConfig.bannerUrl;
  const bannerList = Array.isArray(rawBanner) ? rawBanner.map(String) : rawBanner ? [String(rawBanner)] : [];
  const sponsorTiers = sponsorshipConfig.tiers;

  return {
    id: String(raw._id || raw.id || ""),
    tournamentItemId: readFirstTournamentItemId(raw, kind),
    kind,
    name: String(raw.name || "Giải đấu mới"),
    season: String((timeline.start ? new Date(String(timeline.start)).getFullYear() : new Date().getFullYear()) || ""),
    format: String(raw.format || (kind === "multi" ? "Hội thao nhiều môn" : "Giải đấu 1 môn")),
    sport,
    competitionType: kind === "multi" ? "Hội thao" : "Giải đơn",
    venue: String(location.detail || location.district || location.city || locationText || "Chưa cập nhật"),
    registrationDeadline: formatDate(timeline.registrationEnd),
    feeEntry: Number(raw.feeEntry || asRecord(raw.paymentConfig).feePerAthlete || 0),
    coverImage,
    published: raw.status !== "draft",
    description: String(raw.description || ""),
    prizes: String(raw.prizes || ""),
    rawLocation: {
      city: String(location.city || ""),
      district: String(location.district || ""),
      detail: String(location.detail || locationText || ""),
    },
    rawTimeline: {
      registrationStart: formatDateTimeInput(raw.registrationStart || asRecord(raw.timeLine).registrationStart),
      registrationEnd: formatDateTimeInput(timeline.registrationEnd),
      tournamentStart: formatDateTimeInput(timeline.start),
      tournamentEnd: formatDateTimeInput(timeline.end),
    },
    categoryRuleId: String(asRecord(raw.categoryRule)._id || asRecord(raw.categoryRule).id || raw.categoryRuleId || ""),
    operations: {
      registrationMode: registrationMode === "external" ? "external" : "system",
      registrationFormUrl: String(registrationConfig.formUrl || registrationConfig.registrationFormUrl || ""),
      zaloGroupUrl: String(registrationConfig.zaloGroupUrl || ""),
      maxRegistrations: Number(registrationConfig.maxRegistrations || maxTeams || 0),
      registrationInstructions: String(registrationConfig.instructions || registrationConfig.registrationInstructions || ""),
      supportContacts: String(registrationConfig.supportContacts || ""),
      feeIncludes: String(paymentConfig.feeIncludes || ""),
      bankName: String(paymentConfig.bankName || ""),
      accountName: String(paymentConfig.accountName || ""),
      accountNumber: String(paymentConfig.accountNumber || ""),
      transferContent: String(paymentConfig.transferContent || ""),
      paymentInstructions: String(paymentConfig.instructions || paymentConfig.paymentInstructions || ""),
      refundPolicy: String(paymentConfig.refundPolicy || ""),
      mediaConsent: Boolean(mediaConfig.consent || mediaConfig.mediaConsent),
      mediaUsageTerms: String(mediaConfig.usageTerms || mediaConfig.mediaUsageTerms || ""),
      logo: String(raw.logo || mediaConfig.logoUrl || firstItem?.logo || ""),
      banner: bannerList,
      paymentQR: String(raw.paymentQR || mediaConfig.paymentQRUrl || paymentConfig.paymentQR || firstItem?.paymentQR || ""),
      hasGala: Boolean(galaConfig.hasGala),
      galaStart: formatDateTimeInput(galaConfig.galaStart || galaConfig.time),
      galaEnd: formatDateTimeInput(galaConfig.galaEnd),
      galaVenue: String(galaConfig.venue || galaConfig.galaVenue || ""),
      galaDescription: String(galaConfig.description || galaConfig.galaDescription || ""),
      sponsorContact: String(sponsorshipConfig.contact || ""),
      sponsorTiers: Array.isArray(sponsorTiers) ? sponsorTiers as TournamentOperationsState["sponsorTiers"] : [],
    },
    rawTournamentItems: itemSummaries,
    status: mapStatus(raw.status, timeline.end),
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

const withParticipantCounts = async (records: TournamentRecord[]) => {
  const enriched = await Promise.all(records.map(async (record) => {
    const itemIds = record.kind === "multi"
      ? (record.rawTournamentItems || []).map((item) => item.id).filter(Boolean)
      : [record.tournamentItemId || record.id].filter(Boolean);
    if (itemIds.length === 0) return record;
    try {
      const responses = await Promise.all(itemIds.map((itemId) =>
        api.get<{ data?: Array<{ type?: string; registrationStatus?: string }> }>(`/participants/tournament/${itemId}`),
      ));
      const current = responses.reduce((sum, response) =>
        sum + (response.data.data || []).filter((item) => item.type === "team").length, 0);
      return {
        ...record,
        teamsCount: current,
        registration: {
          ...record.registration,
          current,
          statusText: record.status === "Completed" ? "Đã kết thúc" : record.registration.statusText,
          isOpen: record.status !== "Completed" && record.registration.isOpen,
        },
      };
    } catch (error) {
      console.warn("Không thể đồng bộ số đội đăng ký của giải", record.name, error);
      return record;
    }
  }));
  return enriched;
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
  { id: "total", label: "Tổng giải", value: records.length, iconType: "total", color: "text-primary bg-primary-light/30" },
  { id: "live", label: "Đang diễn ra", value: records.filter((item) => item.status === "Live").length, iconType: "live", color: "text-destructive bg-destructive/10" },
  { id: "open", label: "Mở đăng ký", value: records.filter((item) => item.status === "Registration Open").length, iconType: "open", color: "text-green-600 bg-green-100" },
  { id: "draft", label: "Bản nháp", value: records.filter((item) => item.status === "Draft").length, iconType: "draft", color: "text-slate-600 bg-slate-100" },
  { id: "completed", label: "Hoàn tất", value: records.filter((item) => item.status === "Completed").length, iconType: "completed", color: "text-green-600 bg-green-100" },
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
    // FE vẫn giữ nhiều banner trong state; chỉ gửi ảnh đầu tiên để không làm sai schema BE.
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
      const records = await withParticipantCounts([
        ...asArray(multiResponse.data).filter(isActiveTournamentRecord).map((item) => mapRecord(item, "multi")),
        ...asArray(singleResponse.data).filter(isActiveTournamentRecord).map((item) => mapRecord(item, "single")),
      ]);
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

  async exportTournamentPdf(record: TournamentRecord): Promise<Blob> {
    if (record.kind !== "single") {
      throw new Error("Xuất PDF hiện hỗ trợ giải đơn. Hội thao nhiều môn sẽ dùng mẫu tổng hợp riêng.");
    }
    const response = await api.get(`/tournaments/single/${record.id}/export/pdf`, {
      responseType: "blob",
    });
    return response.data;
  },
};
