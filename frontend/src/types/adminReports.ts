export interface ReportStatItem {
  id: string;
  label: string;
  value: string | number;
  trend: string;
  isPositive: boolean;
  iconType: 'athletes' | 'teams' | 'revenue';
}

export interface TrendDataPoint {
  month: string;
  athletes: number;
}

export interface DistributionDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface ExportFileItem {
  id: string;
  name: string;
  description: string;
  format: 'XLSX' | 'CSV' | 'PDF';
  size: string;
}