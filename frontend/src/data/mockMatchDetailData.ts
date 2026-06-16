import type { MatchDetailData } from "@/types/matchDetail";

export const mockMatchDetail: MatchDetailData = {
  id: "m_live_1",
  tournamentName: "Giải Pickleball Vũng Tàu Mở Rộng 2026",
  status: "live",
  liveMinute: "Set 3 - 15'",
  teamA: {
    id: "t1",
    name: "Vũng Tàu Club",
    logo: "VT",
    country: "Việt Nam",
    group: "Bảng A",
    form: [
      { result: 'W', color: 'bg-green-500' },
      { result: 'W', color: 'bg-green-500' },
      { result: 'W', color: 'bg-green-500' },
      { result: 'D', color: 'bg-gray-400' },
      { result: 'L', color: 'bg-red-500' }
    ],
    score: 2
  },
  teamB: {
    id: "t2",
    name: "Saigon Masters",
    logo: "SG",
    country: "Việt Nam",
    group: "Bảng A",
    form: [
      { result: 'W', color: 'bg-green-500' },
      { result: 'L', color: 'bg-red-500' },
      { result: 'W', color: 'bg-green-500' },
      { result: 'W', color: 'bg-green-500' },
      { result: 'D', color: 'bg-gray-400' }
    ],
    score: 1
  },
  info: {
    venue: "Sân Trung Tâm, Vũng Tàu",
    date: "29 Tháng 4, 2026",
    time: "19:45 VN",
    round: "Tứ kết - Lượt đi",
    sport: "Pickleball (Đôi nam)"
  },
  events: [
    { id: "e1", minute: 67, type: "goal", teamId: "t1", title: "Ghi điểm Match Point!", description: "T. Anh Khoa (Kiến tạo: H. Yến)", isLive: true },
    { id: "e2", minute: 55, type: "card-yellow", teamId: "t2", title: "Cảnh cáo", description: "Lỗi phản ứng trọng tài - David Trần" },
    { id: "e3", minute: 45, type: "substitution", teamId: "t1", title: "Thay người", description: "Vào: M. Tuấn - Ra: G. Bảo" },
    { id: "e4", minute: 30, type: "goal", teamId: "t2", title: "Ghi điểm", description: "Cú smash tuyệt đẹp từ Saigon Masters" },
    { id: "e5", minute: 12, type: "goal", teamId: "t1", title: "Ghi điểm", description: "T. Anh Khoa ghi điểm đầu tiên" }
  ],
  keyPlayers: [
    { id: "p1", name: "T. Anh Khoa", teamId: "t1", minute: "12', 67'" },
    { id: "p2", name: "David Trần", teamId: "t2", minute: "30'" }
  ]
};