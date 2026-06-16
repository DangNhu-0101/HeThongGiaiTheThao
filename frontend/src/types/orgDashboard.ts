export interface OrgStat {
  id: string;
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  subtext: string;
  iconType: 'trophy' | 'shield' | 'users' | 'activity' | 'dollar' | 'map';
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface OrgTournament {
  id: string;
  name: string;
  sport: string;
  teamsCount: number;
  season: string;
  status: 'Live' | 'Reg. Open' | 'Draft';
  progress: number;
  detail1: string; // VD: "48 trận đã đấu"
  detail2: string; // VD: "Chung kết: 25 Thg 5"
}

export interface OrgDashboardData {
  stats: OrgStat[];
  revenueData: ChartData[];
  sportDistribution: ChartData[];
  tournaments: OrgTournament[];
}