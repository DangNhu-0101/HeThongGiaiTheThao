import type { Tournament, Match, Sport } from "@/types/tournament";

export const mockSports: Sport[] = [
  { _id: "s1", name: "Pickleball", iconUrl: "🎾", eventCount: 45 },
  { _id: "s2", name: "Bóng đá", iconUrl: "⚽", eventCount: 32 },
  { _id: "s3", name: "Cầu lông", iconUrl: "🏸", eventCount: 28 },
  { _id: "s4", name: "Tennis", iconUrl: "🎾", eventCount: 20 },
];

export const mockTournaments: Tournament[] = [
  {
    _id: "t1",
    name: "Pickleball Championship Mở Rộng 2026",
    description: "Giải đấu Pickleball quy mô lớn nhất khu vực với nhiều tay vợt chuyên nghiệp.",
    logo: "https://example.com/logo.png",
    banner: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80",
    sportType: ["Pickleball"],
    timeLine: {
      registrationStart: new Date("2026-06-01"),
      registrationEnd: new Date("2026-07-10"),
      tournamentStart: new Date("2026-07-15"),
      tournamentEnd: new Date("2026-07-20"),
    },
    paymentQR: "https://example.com/qr.png",
    prizes: "150.000.000đ",
    galaConfig: {
      hasGala: true,
      time: new Date("2026-07-20T19:00:00Z"),
      venue: "Khách sạn Imperial",
      description: "Gala trao giải và ăn tối",
    },
    location: { city: "Bà Rịa - Vũng Tàu", district: "Vũng Tàu" },
    baseRule: [],
    budget: { totalSponsor: 200000000, totalExpense: 150000000 },
    organizer: "Liên đoàn Pickleball VN",
    sponsors: [],
    status: "upcoming",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "t2",
    name: "Cúp Vô Địch Thể Thao Sinh Viên",
    description: "Giải đấu giao lưu các trường đại học.",
    logo: "https://example.com/logo2.png",
    banner: "https://images.unsplash.com/photo-1518605368461-1ee12522bdcc?w=800&q=80",
    sportType: ["Bóng đá", "Cầu lông"],
    timeLine: {
      registrationStart: new Date("2026-05-01"),
      registrationEnd: new Date("2026-05-30"),
      tournamentStart: new Date("2026-06-10"),
      tournamentEnd: new Date("2026-06-30"),
    },
    paymentQR: "https://example.com/qr2.png",
    prizes: "50.000.000đ",
    galaConfig: { hasGala: false, time: null, venue: "", description: "" },
    location: { city: "Hồ Chí Minh", district: "Quận 1" },
    baseRule: [],
    budget: { totalSponsor: 50000000, totalExpense: 40000000 },
    organizer: "Hội sinh viên",
    sponsors: [],
    status: "ongoing",
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const mockMatches: Match[] = [
  {
    _id: "m1",
    tournamentId: "t1",
    tournamentName: "Pickleball Championship",
    teamA: { name: "Vũng Tàu Club", score: 2 },
    teamB: { name: "Saigon Masters", score: 1 },
    startTime: "2026-06-09T08:00:00Z",
    status: "live",
    round: "Tứ kết",
  },
  {
    _id: "m2",
    tournamentId: "t2",
    tournamentName: "Cúp Vô Địch Thể Thao",
    teamA: { name: "IT Uni" },
    teamB: { name: "Kinh Tế Uni" },
    startTime: "2026-06-10T15:00:00Z",
    status: "scheduled",
    round: "Vòng bảng",
  }
];