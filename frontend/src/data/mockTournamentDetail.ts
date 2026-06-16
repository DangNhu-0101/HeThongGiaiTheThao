import type { Team, MatchResult, Tournament } from "@/types/tournament";

export const mockTournamentDetailData: Partial<Omit<Tournament, "prizes">> & { 
  registeredTeams: number;
  maxTeams: number;
  about: string;
  format: { name: string; description: string }[];
  prizes: { rank: string; amount: string; color: string }[];
} = {
  _id: "t1_detail",
  name: "Giải Pickleball Vũng Tàu Mở Rộng 2026",
  description: "Giải đấu Pickleball quy mô quốc tế hội tụ 32 câu lạc bộ mạnh nhất.",
  banner: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1200&q=80",
  sportType: ["Pickleball"],
  timeLine: {
    registrationStart: new Date("2026-02-01"),
    registrationEnd: new Date("2026-03-10"),
    tournamentStart: new Date("2026-03-15"),
    tournamentEnd: new Date("2026-04-20"),
  },
  location: { city: "Bà Rịa - Vũng Tàu", district: "Vũng Tàu - 8 Cụm sân" },
  organizer: "Liên đoàn Pickleball VN",
  status: 'ongoing',
  registeredTeams: 28,
  maxTeams: 32,
  about: "Giải Pickleball Vũng Tàu Mở Rộng 2026 là đỉnh cao của bộ môn Pickleball tại Việt Nam. Trải qua nhiều vòng đấu loại căng thẳng, vòng chung kết sẽ diễn ra tại cụm sân tiêu chuẩn quốc tế ven biển Vũng Tàu, mang đến trải nghiệm tuyệt vời cho cả vận động viên và khán giả.",
  format: [
    { name: "Vòng bảng", description: "8 bảng đấu, mỗi bảng 4 đội. Đấu vòng tròn tính điểm. 2 đội đứng đầu mỗi bảng đi tiếp." },
    { name: "Vòng loại trực tiếp", description: "Loại trực tiếp từ vòng 16 đội đến chung kết." }
  ],
  prizes: [
    { rank: "Vô địch", amount: "300.000.000đ", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
    { rank: "Á quân", amount: "120.000.000đ", color: "bg-gray-100 text-gray-700 border-gray-300" },
    { rank: "Hạng ba", amount: "50.000.000đ", color: "bg-orange-100 text-orange-700 border-orange-300" }
  ]
};

export const mockTeams: Team[] = [
  { _id: "team1", name: "Vũng Tàu Seagulls", logo: "VT", sport: "Pickleball", location: "Vũng Tàu", stats: { athletes: 12, wins: 18, winRate: "75%" }, status: "active" },
  { _id: "team2", name: "Saigon Smashers", logo: "SG", sport: "Pickleball", location: "Hồ Chí Minh", stats: { athletes: 16, wins: 22, winRate: "82%" }, status: "active" },
  { _id: "team3", name: "Đà Nẵng Waves", logo: "DN", sport: "Pickleball", location: "Đà Nẵng", stats: { athletes: 10, wins: 5, winRate: "45%" }, status: "pending" },
];

export const mockRecentResults: MatchResult[] = [
  { _id: "r1", date: "28 Thg 4", teamA: { name: "Vũng Tàu Seagulls", score: 2 }, teamB: { name: "Saigon Smashers", score: 1 }, stadium: "Sân Trung Tâm" },
  { _id: "r2", date: "27 Thg 4", teamA: { name: "Hà Nội Capital", score: 0 }, teamB: { name: "Đà Nẵng Waves", score: 2 }, stadium: "Sân Số 2" },
];
