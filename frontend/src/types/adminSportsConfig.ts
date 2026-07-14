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
}

export interface SportRecord {
  id: string;
  name: string;
  icon: string;
  status: "Hoat dong" | "Ban nhap" | "Vo hieu hoa" | string;
  tournamentsCount: number;
  formatsCount: number;
  rulesCount: number;
  orgsCount: number;
  formats: CompetitionFormat[];
}

export interface ChartData {
  name: string;
  value: number;
}
