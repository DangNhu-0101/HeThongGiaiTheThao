export interface AdminStat {
  id: string;
  label: string;
  value: string | number;
  trend: string;
  isPositive?: boolean;
  type: 'orgs' | 'tournaments' | 'users' | 'sports' | 'pending';
}

export interface AdminOrgRecord {
  id: string;
  name: string;
  email: string;
  plan: 'Doanh nghiệp' | 'Chuyên nghiệp' | 'Cơ bản';
  status: 'Hoạt động' | 'Chờ duyệt' | 'Đình chỉ';
  tournamentsCount: number;
  usersCount: number;
  joinedAt: string;
}

export interface ChartData {
  month: string;
  revenue: number;
}