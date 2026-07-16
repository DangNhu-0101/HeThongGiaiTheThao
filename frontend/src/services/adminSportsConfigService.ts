import api from "@/libs/axios";
import type { ChartData, CompetitionFormat, SportRecord, SportStat } from "@/types/adminSportsConfig";
import type { FormatConfigState } from "@/types/tournament";

type ApiList<T = unknown> = T[] | { data?: T[] };

const asArray = <T>(payload: ApiList<T>): T[] => {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
};

const readFlag = (value: unknown) => Boolean(value);

const mapTemplateToFormat = (value: unknown, index: number): CompetitionFormat => {
  const template = asRecord(value);
  return {
    id: String(template.id || template._id || `template-${index}`),
    name: String(template.name || template.templateName || "Thể thức thi đấu"),
    type: String(template.stageType || "template"),
    minTeams: Number(asRecord(template.defaultSettings).minTeams || 2),
    maxTeams: Number(asRecord(template.defaultSettings).maxTeams || 64),
    description: String(template.description || "Cấu hình thể thức mẫu"),
    isDefault: index === 0,
    stageCount: Number(template.stageCount || 1),
    hasGroups: readFlag(template.hasGroups),
    hasKnockout: readFlag(template.hasKnockout),
    hasDoubleElimination: readFlag(template.hasDoubleElimination),
  };
};

const mapSport = (value: unknown, index: number): SportRecord => {
  const sport = asRecord(value);
  const templates = asArray(sport.templates as ApiList);
  const categories = asArray(sport.categories as ApiList).map((category) => {
    const item = asRecord(category);
    return {
      code: String(item.code || ""),
      name: String(item.name || ""),
      playerSlotsPerTeam: asRecord(item.playerSlotsPerTeam),
      status: String(item.status || "actived"),
    };
  });
  const stages = asArray(sport.stages as ApiList).map((stage) => {
    const item = asRecord(stage);
    return {
      name: String(item.name || ""),
      type: String(item.type || ""),
      format: String(item.format || ""),
      scoring: String(item.scoring || ""),
      advanceCriteria: String(item.advanceCriteria || ""),
    };
  });

  return {
    id: String(sport.name || sport.displayName || `sport-${index}`),
    name: String(sport.displayName || sport.name || "Môn thể thao"),
    englishName: String(sport.englishName || ""),
    slug: String(sport.slug || ""),
    imageUrl: String(sport.imageUrl || ""),
    icon: "",
    status: sport.status === "actived" ? "Hoạt động" : "Vô hiệu hóa",
    tournamentsCount: Number(sport.tournamentsCount || 0),
    formatsCount: Number(sport.formatsCount || templates.length),
    rulesCount: Number(sport.rulesCount || categories.length),
    orgsCount: 0,
    categories,
    stages,
    updatedAt: String(sport.updatedAt || ""),
    formats: templates.map(mapTemplateToFormat),
  };
};

const getBackendConfigData = async (): Promise<{ stats: SportStat[]; sports: SportRecord[]; usage: ChartData[]; formats: ChartData[] }> => {
  const response = await api.get<ApiList<Record<string, unknown>>>("/rules/sports", { params: { includeInactive: true } });
  const sports = asArray(response.data).map(mapSport);

  return {
    stats: [
      { id: "sports", label: "Môn thể thao", value: sports.length, trend: "Từ database", iconType: "sports", color: "text-blue-600" },
      { id: "formats", label: "Mẫu thể thức", value: sports.reduce((total, sport) => total + sport.formatsCount, 0), trend: "Đã import", iconType: "formats", color: "text-amber-600" },
      { id: "rules", label: "Hạng mục", value: sports.reduce((total, sport) => total + sport.rulesCount, 0), trend: "Đang áp dụng", iconType: "rules", color: "text-green-600" },
    ],
    sports,
    usage: sports.map((sport) => ({ name: sport.name, value: sport.tournamentsCount })),
    formats: sports.map((sport) => ({ name: sport.name, value: sport.formatsCount })),
  };
};

export const adminSportsConfigService = {
  async getConfigData(): Promise<{ stats: SportStat[]; sports: SportRecord[]; usage: ChartData[]; formats: ChartData[] }> {
    return getBackendConfigData();
  },

  async setSportActive(sportName: string, active: boolean) {
    const encoded = encodeURIComponent(sportName);
    await api.patch(`/rules/sports/${encoded}/status`, { active });
  },

  async createFormat(sportName: string, formData: FormatConfigState) {
    void sportName;
    void formData;
    throw new Error("Chưa hỗ trợ tạo format tùy chỉnh");
  },
};
