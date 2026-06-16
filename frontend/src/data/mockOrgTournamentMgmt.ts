import type { TournamentMgmtStat, TournamentRecord } from "@/types/orgTournamentMgmt";

export const mockMgmtStats: TournamentMgmtStat[] = [
  { id: "st1", label: "Tổng giải đấu", value: 8, iconType: "total", color: "text-blue-600 bg-blue-100" },
  { id: "st2", label: "Trực tiếp / Hoạt động", value: 3, iconType: "live", color: "text-red-600 bg-red-100" },
  { id: "st3", label: "Mở đăng ký", value: 2, iconType: "open", color: "text-green-600 bg-green-100" },
  { id: "st4", label: "Bản nháp", value: 2, iconType: "draft", color: "text-gray-600 bg-gray-100" },
  { id: "st5", label: "Đã hoàn tất", value: 1, iconType: "completed", color: "text-emerald-600 bg-emerald-100" },
];

export const mockTournamentRecords: TournamentRecord[] = [
  {
    id: "tm1", name: "Giải Pickleball Vũng Tàu 2026", season: "Mùa giải 2026", format: "Vòng bảng + Loại trực tiếp", sport: "Pickleball", status: "Live",
    registration: { current: 32, max: 32, statusText: "Đã đóng", isOpen: false }, teamsCount: 32, startDate: "15 Thg 1", endDate: "25 Thg 5",
    revenue: { amount: "38.400.000đ", projectedText: "+12%", isUp: true }
  },
  {
    id: "tm2", name: "Giải Vô Địch CLB Miền Nam", season: "Xuân 2026", format: "Nhánh đấu kép", sport: "Pickleball", status: "Live",
    registration: { current: 16, max: 16, statusText: "Đã đóng", isOpen: false }, teamsCount: 16, startDate: "1 Thg 3", endDate: "18 Thg 5",
    revenue: { amount: "22.600.000đ", projectedText: "+5%", isUp: true }
  },
  {
    id: "tm3", name: "Giải Trẻ Mở Rộng Hè", season: "Hè 2026", format: "Vòng tròn tính điểm", sport: "Pickleball", status: "Registration Open",
    registration: { current: 10, max: 12, statusText: "Còn 2 suất", isOpen: true }, teamsCount: 10, startDate: "1 Thg 6", endDate: "15 Thg 7",
    revenue: { amount: "12.800.000đ", projectedText: "Dự kiến", isUp: true }
  },
  {
    id: "tm4", name: "Giải Các CLB Bãi Biển", season: "Hè 2026", format: "Đấu loại trực tiếp", sport: "Pickleball", status: "Registration Open",
    registration: { current: 8, max: 16, statusText: "Còn 8 suất", isOpen: true }, teamsCount: 8, startDate: "5 Thg 7", endDate: "20 Thg 8",
    revenue: { amount: "6.100.000đ", projectedText: "Dự kiến", isUp: true }
  },
  {
    id: "tm5", name: "Giải Vô Địch Thành Phố", season: "Thu 2026", format: "Loại trực tiếp", sport: "Pickleball", status: "Draft",
    registration: { current: 0, max: 24, statusText: "Chưa bắt đầu", isOpen: false }, teamsCount: 0, startDate: "1 Thg 9", endDate: "30 Thg 10",
    revenue: { amount: "--", projectedText: "Kế hoạch", isUp: false }
  },
];