import type { CompetitionMethodCode } from "@/types/competitionFormat";

export interface CompetitionMethodOption {
  value: CompetitionMethodCode;
  label: string;
  description: string;
  supportsRanking: boolean;
  supportsLosers: boolean;
  supportsWildcard: boolean;
}

const common: CompetitionMethodOption[] = [
  { value: "ROUND_ROBIN", label: "Đấu vòng tròn 1 lượt", description: "Mỗi đội gặp nhau một lần, xếp hạng theo điểm.", supportsRanking: true, supportsLosers: false, supportsWildcard: true },
  { value: "DOUBLE_ROUND_ROBIN", label: "Đấu vòng tròn 2 lượt", description: "Mỗi đội gặp nhau hai lượt.", supportsRanking: true, supportsLosers: false, supportsWildcard: true },
  { value: "SINGLE_ELIMINATION", label: "Loại trực tiếp 1 lần", description: "Thua một trận bị loại.", supportsRanking: false, supportsLosers: true, supportsWildcard: true },
  { value: "DOUBLE_ELIMINATION", label: "Loại kép", description: "Chỉ bị loại sau hai lần thua.", supportsRanking: false, supportsLosers: true, supportsWildcard: false },
  { value: "SWISS", label: "Hệ Thụy Sĩ", description: "Ghép đội có thành tích tương đương qua nhìều vòng.", supportsRanking: true, supportsLosers: false, supportsWildcard: true },
  { value: "RANKING", label: "Thi đấu tính hạng", description: "Tổng hợp thành tích để chọn top theo thứ hạng.", supportsRanking: true, supportsLosers: false, supportsWildcard: true },
  { value: "MANUAL_MATCHUP", label: "Ghép cặp thủ công", description: "Ban tổ chức tự thiết lập cặp đấu.", supportsRanking: false, supportsLosers: true, supportsWildcard: true },
];

const sportSupport: Record<string, CompetitionMethodCode[]> = {
  pickleball: ["ROUND_ROBIN", "DOUBLE_ROUND_ROBIN", "SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "RANKING", "MANUAL_MATCHUP"],
  "bóng đá": ["ROUND_ROBIN", "DOUBLE_ROUND_ROBIN", "SINGLE_ELIMINATION", "RANKING"],
  "cầu lông": ["ROUND_ROBIN", "SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "MANUAL_MATCHUP"],
  "bóng rổ": ["ROUND_ROBIN", "DOUBLE_ROUND_ROBIN", "SINGLE_ELIMINATION", "RANKING"],
  "bóng chuyền": ["ROUND_ROBIN", "SINGLE_ELIMINATION", "RANKING"],
  "quần vợt": ["ROUND_ROBIN", "SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "MANUAL_MATCHUP"],
  "bơi lội": ["RANKING", "MANUAL_MATCHUP"],
  "điền kinh": ["RANKING", "MANUAL_MATCHUP"],
};

export const getCompetitionMethods = (sportType: string) => {
  const supported = sportSupport[sportType.trim().toLowerCase()];
  return supported ? common.filter((method) => supported.includes(method.value)) : common;
};

export const getCompetitionMethod = (sportType: string, code: CompetitionMethodCode | "") =>
  getCompetitionMethods(sportType).find((method) => method.value === code);
