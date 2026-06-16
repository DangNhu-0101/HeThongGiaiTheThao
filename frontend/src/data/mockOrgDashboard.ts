import type { OrgDashboardData } from "@/types/orgDashboard";

export const mockOrgDashboardData: OrgDashboardData = {
  stats: [
    { id: "s1", title: "Tổng giải đấu", value: "8", trend: "+2", isPositive: true, subtext: "3 Đang chạy - 5 Hoàn tất", iconType: "trophy" },
    { id: "s2", title: "Đội đăng ký", value: "124", trend: "+8", isPositive: true, subtext: "Trên 5 môn thi đấu", iconType: "shield" },
    { id: "s3", title: "Tổng VĐV", value: "1,847", trend: "+43", isPositive: true, subtext: "Hoạt động mùa này", iconType: "users" },
    { id: "s4", title: "Tổng số trận", value: "342", trend: "Ổn định", isPositive: true, subtext: "4 Trực tiếp - 48 Sắp tới", iconType: "activity" },
    { id: "s5", title: "Tổng doanh thu", value: "1.84 Tỷ", trend: "+12%", isPositive: true, subtext: "Mùa giải này", iconType: "dollar" },
    { id: "s6", title: "Địa điểm", value: "18", trend: "Mới", isPositive: true, subtext: "Bao phủ 6 thành phố", iconType: "map" },
  ],
  revenueData: [
    { name: "Pickleball Vũng Tàu", value: 400 },
    { name: "Giải Pickleball Miền Nam", value: 300 },
    { name: "Giải Trẻ Mở Rộng", value: 200 },
    { name: "Giải CLB Bãi Biển", value: 150 },
    { name: "Khác", value: 50 },
  ],
  sportDistribution: [
    { name: "Pickleball Đơn", value: 48, color: "#005AA7" }, // primary/hero color
    { name: "Pickleball Đôi", value: 32, color: "#FFC857" }, // accent
    { name: "Pickleball Hỗn hợp", value: 24, color: "#22C55E" }, // success
    { name: "Giao hữu", value: 20, color: "#D6001C" }, // destructive/primary red
  ],
  tournaments: [
    { id: "t1", name: "Giải Pickleball Vũng Tàu 2026", sport: "Pickleball", teamsCount: 32, season: "Mùa giải 2026", status: "Live", progress: 62, detail1: "48 trận đã đấu", detail2: "Chung kết: 25 Thg 5" },
    { id: "t2", name: "Giải Vô Địch CLB Miền Nam", sport: "Pickleball", teamsCount: 16, season: "Xuân 2026", status: "Live", progress: 78, detail1: "24 trận đã đấu", detail2: "Chung kết: 18 Thg 5" },
    { id: "t3", name: "Giải Trẻ Mở Rộng Hè 2026", sport: "Pickleball", teamsCount: 12, season: "Hè 2026", status: "Reg. Open", progress: 83, detail1: "Bắt đầu: 1 Thg 6", detail2: "Còn 2 suất" },
    { id: "t4", name: "Giải Các CLB Bãi Biển", sport: "Pickleball", teamsCount: 24, season: "Thu 2026", status: "Draft", progress: 35, detail1: "Đang thiết lập", detail2: "Dự kiến: Thg 9 2026" },
  ]
};