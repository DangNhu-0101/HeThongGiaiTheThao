import type { TeamDetailInfo, TeamMember, Achievement } from "@/types/Team";
import { mockTournaments } from "./mockHomeData"; // Tái sử dụng dữ liệu giải đấu

export const mockTeamInfo: TeamDetailInfo = {
  id: "team_vt",
  name: "VŨNG TÀU SEAGULLS",
  logo: "VT",
  sport: "Pickleball",
  status: "Đang hoạt động",
  division: "Hạng Chuyên Nghiệp",
  location: "Bà Rịa - Vũng Tàu, VN",
  founded: 2023,
  coach: "Nguyễn Văn Hùng",
  overallStats: {
    players: 12,
    wins: 45,
    titles: 3,
    ranking: 2
  }
};

export const mockTeamMembers: TeamMember[] = [
  { id: "m1", name: "Trần Anh Khoa", role: "Đội trưởng", avatar: "AK", stats: { matches: 50, wins: 38, rating: "A+" }, country: "Việt Nam" },
  { id: "m2", name: "Lê Hoàng Yến", role: "Thành viên", avatar: "HY", stats: { matches: 42, wins: 30, rating: "A" }, country: "Việt Nam" },
  { id: "m3", name: "Phạm Minh Tuấn", role: "Thành viên", avatar: "MT", stats: { matches: 20, wins: 12, rating: "B+" }, country: "Việt Nam" },
  { id: "m4", name: "David Trần", role: "Thành viên", avatar: "DT", stats: { matches: 15, wins: 10, rating: "A-" }, country: "Hoa Kỳ" },
  { id: "m5", name: "Nguyễn Thị Mai", role: "Thành viên", avatar: "NM", stats: { matches: 30, wins: 18, rating: "B" }, country: "Việt Nam" },
  { id: "m6", name: "Hoàng Gia Bảo", role: "Thành viên", avatar: "GB", stats: { matches: 5, wins: 2, rating: "C" }, country: "Việt Nam" },
];

export const mockAchievements: Achievement[] = [
  { id: "a1", year: 2025, title: "Vô địch Pickleball Quốc gia", description: "Huy chương vàng thể thức Đôi Nam Nữ", type: "champion" },
  { id: "a2", year: 2024, title: "Á quân Giải Vũng Tàu Mở Rộng", description: "Hạng 2 toàn đoàn giải các CLB phía Nam", type: "runner-up" },
  { id: "a3", year: 2024, title: "Đội thi đấu Triển vọng", description: "Giải thưởng do Liên đoàn bình chọn", type: "other" },
];

export const mockTeamTournaments = mockTournaments; // Tái sử dụng danh sách giải đấu có sẵn