export interface SportStat {
  id: string;
  label: string;
  value: string | number;
  trend: string;
  iconType: "sports" | "formats" | "rules" | "tournaments" | "pending";
  color: string;
}

export interface CompetitionFormat {
  id: string;
  name: string;
  type: string;
  minTeams: number;
  maxTeams: number;
  description: string;
  isDefault?: boolean;
  stageCount?: number;
  hasGroups?: boolean;
  hasKnockout?: boolean;
  hasDoubleElimination?: boolean;
}

export interface SportRecord {
  id: string;
  name: string;
  englishName?: string;
  slug?: string;
  imageUrl?: string;
  icon: string;
  status: "Hoat dong" | "Ban nhap" | "Vo hieu hoa" | string;
  tournamentsCount: number;
  formatsCount: number;
  rulesCount: number;
  orgsCount: number;
  categories?: Array<{ code: string; name: string; playerSlotsPerTeam?: { min?: number; max?: number }; status?: string }>;
  stages?: Array<{ name: string; type: string; format?: string; scoring?: string; advanceCriteria?: string }>;
  updatedAt?: string;
  formats: CompetitionFormat[];
}

export interface ChartData {
  name: string;
  value: number;
}
