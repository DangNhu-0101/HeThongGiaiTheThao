import type { AdminStat, AdminOrgRecord, ChartData } from "@/types/adminDashboard";

export const mockAdminStats: AdminStat[] = [
  { id: "s1", label: "Tổ chức", value: 24, trend: "+3", isPositive: true, type: "orgs" },
  { id: "s2", label: "Tổng giải đấu", value: 187, trend: "+12", isPositive: true, type: "tournaments" },
  { id: "s3", label: "Người dùng", value: "14.2k", trend: "+247", isPositive: true, type: "users" },
  { id: "s4", label: "Môn thể thao", value: 12, trend: "Ổn định", type: "sports" },
  { id: "s5", label: "Chờ phê duyệt", value: 5, trend: "Cần xem xét", type: "pending" },
];

export const mockRevenueData: ChartData[] = [
  { month: "Thg 1", revenue: 52000 }, { month: "Thg 2", revenue: 58000 },
  { month: "Thg 3", revenue: 64000 }, { month: "Thg 4", revenue: 70000 },
  { month: "Thg 5", revenue: 78000 }, { month: "Thg 6", revenue: 84200 },
];

export const mockOrgRecords: AdminOrgRecord[] = [
  { id: "o1", name: "SportsPro Global", email: "admin@sportspro.com", plan: "Doanh nghiệp", status: "Hoạt động", tournamentsCount: 42, usersCount: 1840, joinedAt: "Thg 1 2025" },
  { id: "o2", name: "Metro Athletics Club", email: "ops@metroathletics.org", plan: "Chuyên nghiệp", status: "Hoạt động", tournamentsCount: 18, usersCount: 612, joinedAt: "Thg 3 2025" },
  { id: "o3", name: "Regional Basketball Fed.", email: "info@rbf.sport", plan: "Cơ bản", status: "Chờ duyệt", tournamentsCount: 3, usersCount: 84, joinedAt: "Thg 5 2026" },
  { id: "o4", name: "National Football League", email: "admin@nfl-platform.com", plan: "Doanh nghiệp", status: "Hoạt động", tournamentsCount: 31, usersCount: 4210, joinedAt: "Thg 9 2024" },
  { id: "o5", name: "City Volleyball Assoc.", email: "contact@cityvolley.net", plan: "Chuyên nghiệp", status: "Đình chỉ", tournamentsCount: 7, usersCount: 290, joinedAt: "Thg 7 2025" },
];