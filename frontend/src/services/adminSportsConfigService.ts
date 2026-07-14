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

const mapStageToFormat = (stageValue: unknown, index: number): CompetitionFormat => {
  const stage = asRecord(stageValue);
  const formatConfig = asRecord(stage.formatConfig);
  const config = asRecord(stage.config);
  const defaultValues = asRecord(config.defaultValues);
  const groupStage = asRecord(defaultValues.groupStage);
  const knockout = asRecord(defaultValues.knockout);
  const participantCount = Number(knockout.participantCount || 0);
  const numberOfGroups = Number(groupStage.numberOfGroups || 0);
  const teamsPerGroup = Number(groupStage.teamsPerGroup || 0);

  return {
    id: String(stage._id || stage.id || `format-${index}`),
    name: String(stage.name || formatConfig.name || "Thể thức thi dau"),
    type: String(formatConfig.type || stage.type || stage.format || "FORMAT"),
    minTeams: Number(formatConfig.minTeams) || participantCount || Math.max(2, numberOfGroups * 2) || 2,
    maxTeams: Number(formatConfig.maxTeams) || participantCount || numberOfGroups * teamsPerGroup || 32,
    description: String(formatConfig.description || stage.description || stage.format || stage.advanceCriteria || "Cấu hình thể thức thi dau"),
    isDefault: index === 0,
  };
};

const getBackendConfigData = async (): Promise<{ stats: SportStat[]; sports: SportRecord[]; usage: ChartData[]; formats: ChartData[] }> => {
  const [templatesResponse, categoryRulesResponse] = await Promise.all([
    api.get<ApiList<Record<string, unknown>>>("/rules/templates"),
    api.get<ApiList<Record<string, unknown>>>("/rules/category-rules"),
  ]);

  const templates = asArray(templatesResponse.data);
  const categoryRules = asArray(categoryRulesResponse.data);
  const sportNames = new Set([...templates, ...categoryRules].map((item) => String(item.sportType || item.name || "Khac")));

  const sports: SportRecord[] = Array.from(sportNames).map((sportName, index) => {
    const sportTemplates = templates.filter((item) => String(item.sportType || item.name || "Khac") === sportName);
    const sportRules = categoryRules.filter((item) => String(item.sportType || "Khac") === sportName);
    const formats = [
      ...sportTemplates.flatMap((template) => asArray(asRecord(template).stages as ApiList).map(mapStageToFormat)),
      ...sportRules.filter((rule) => rule.source === "custom").map(mapStageToFormat),
    ];

    return {
      id: `backend-rule-${index + 1}`,
      name: sportName,
      icon: "",
      status: "Hoat dong",
      tournamentsCount: 0,
      formatsCount: formats.length || sportTemplates.length,
      rulesCount: sportRules.length,
      orgsCount: 0,
      formats,
    };
  });

  return {
    stats: [
      { id: "sports", label: "Mon the thao", value: sports.length, trend: "Đang hoạt động", iconType: "sports", color: "text-blue-600" },
      { id: "formats", label: "Mau thể thức", value: sports.reduce((total, sport) => total + sport.formatsCount, 0), trend: "Đã cấu hình", iconType: "formats", color: "text-amber-600" },
      { id: "rules", label: "Bo luat", value: categoryRules.length, trend: "Đang áp dụng", iconType: "rules", color: "text-green-600" },
    ],
    sports,
    usage: sports.map((sport) => ({ name: sport.name, value: sport.rulesCount })),
    formats: sports.map((sport) => ({ name: sport.name, value: sport.formatsCount })),
  };
};

export const adminSportsConfigService = {
  async getConfigData(): Promise<{ stats: SportStat[]; sports: SportRecord[]; usage: ChartData[]; formats: ChartData[] }> {
    try {
      return await getBackendConfigData();
    } catch (error) {
      console.error("Không thể tai cấu hình mon the thao", error);
      return {
        stats: [],
        sports: [],
        usage: [],
        formats: [],
      };
    }
  },

  async createFormat(sportName: string, formData: FormatConfigState) {
    void sportName;
    void formData;
    throw new Error("Chưa hỗ trợ tạo format tùy chỉnh");
  },
};
