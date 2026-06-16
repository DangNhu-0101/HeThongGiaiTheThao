import type { SportStat, SportRecord, ChartData } from "@/types/adminSportsConfig";

export const mockSportStats: SportStat[] = [
  { id: "st1", label: "Môn đang hoạt động", value: 12, trend: "↑ +1", iconType: "sports", color: "text-blue-600 bg-blue-100" },
  { id: "st2", label: "Mẫu thể thức", value: 34, trend: "Ổn định", iconType: "formats", color: "text-amber-600 bg-amber-100" },
  { id: "st3", label: "Luật tính điểm", value: 156, trend: "↑ +8", iconType: "rules", color: "text-emerald-600 bg-emerald-100" },
  { id: "st4", label: "Giải đang sử dụng", value: 187, trend: "↑ +12", iconType: "tournaments", color: "text-purple-600 bg-purple-100" },
  { id: "st5", label: "Chờ phê duyệt", value: 2, trend: "Cần xem xét", iconType: "pending", color: "text-orange-600 bg-orange-100" },
];

export const mockSports: SportRecord[] = [
  {
    id: "sp1", name: "Bóng đá (Football)", icon: "⚽", status: "Hoạt động", tournamentsCount: 42, formatsCount: 4, rulesCount: 12, orgsCount: 18,
    formats: [
      { id: "f1", name: "Đấu vòng tròn (Round Robin)", type: "Tất cả đấu với nhau", minTeams: 4, maxTeams: 32, description: "Tính điểm: Thắng 3 / Hòa 1 / Thua 0. Tiêu chí phụ: Hiệu số.", isDefault: true },
      { id: "f2", name: "Loại trực tiếp (Single Elimination)", type: "Nhánh đấu loại", minTeams: 4, maxTeams: 64, description: "Thời gian thi đấu: 90 phút. Hiệp phụ: 30 phút + Luân lưu." },
      { id: "f3", name: "Loại kép (Double Elimination)", type: "Nhánh thắng + Nhánh thua", minTeams: 4, maxTeams: 32, description: "Đội thua 2 trận mới bị loại hoàn toàn." },
      { id: "f4", name: "Vòng bảng + Knockout", type: "Hỗn hợp", minTeams: 8, maxTeams: 64, description: "Chia 4-16 bảng. Lấy 2 đội đứng đầu mỗi bảng vào vòng trong." }
    ]
  },
  { id: "sp2", name: "Bóng rổ (Basketball)", icon: "🏀", status: "Hoạt động", tournamentsCount: 31, formatsCount: 3, rulesCount: 9, orgsCount: 12, formats: [] },
  { id: "sp3", name: "Quần vợt (Tennis)", icon: "🎾", status: "Hoạt động", tournamentsCount: 28, formatsCount: 2, rulesCount: 14, orgsCount: 10, formats: [] },
  { id: "sp4", name: "Bóng chuyền (Volleyball)", icon: "🏐", status: "Hoạt động", tournamentsCount: 19, formatsCount: 3, rulesCount: 8, orgsCount: 8, formats: [] },
  { id: "sp5", name: "Bơi lội (Swimming)", icon: "🏊", status: "Hoạt động", tournamentsCount: 14, formatsCount: 2, rulesCount: 6, orgsCount: 5, formats: [] },
  { id: "sp6", name: "Pickleball", icon: "🏓", status: "Bản nháp", tournamentsCount: 0, formatsCount: 1, rulesCount: 3, orgsCount: 0, formats: [] },
];

export const mockUsageDistribution: ChartData[] = [
  { name: "Bóng đá", value: 42 }, { name: "Bóng rổ", value: 31 }, { name: "Quần vợt", value: 28 },
  { name: "Bóng chuyền", value: 19 }, { name: "Bơi lội", value: 14 }, { name: "Điền kinh", value: 12 },
  { name: "Cầu lông", value: 8 }, { name: "Pickleball", value: 0 }
];

export const mockFormatPopularity: ChartData[] = [
  { name: "Vòng bảng + KO", value: 45 }, { name: "Đấu vòng tròn", value: 30 },
  { name: "Loại trực tiếp", value: 15 }, { name: "Loại kép", value: 10 }
];