export interface SportStat {
  id: string;
  label: string;
  value: string | number;
  trend: string;
  iconType: 'sports' | 'formats' | 'rules' | 'tournaments' | 'pending';
  color: string;
}

export interface CompetitionFormat {
  id: string;
  name: string;
  type: string; // VD: Vòng tròn, Loại trực tiếp...
  minTeams: number;
  maxTeams: number;
  description: string;
  isDefault?: boolean;
}

export interface SportRecord {
  id: string;
  name: string;
  icon: string; // Dùng 1 ký tự hoặc tên icon
  status: 'Hoạt động' | 'Bản nháp' | 'Vô hiệu hóa';
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