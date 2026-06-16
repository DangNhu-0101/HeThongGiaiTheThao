import type { BracketTreeNode, TieBreakRule } from "@/types/bracketTree";

export const mockBracketTreeData: BracketTreeNode = {
  id: "f1",
  round: "Chung Kết",
  status: "upcoming",
  time: "25 Thg 5 - 19:00",
  info: "Sân Trung Tâm",
  teamA: { id: "t1", name: "Vũng Tàu Club", logo: "VT" },
  teamB: null,
  children: [
    {
      id: "sf1", round: "Bán Kết 1", status: "live", time: "24 Thg 5 - 15:00", info: "Sân 1",
      teamA: { id: "t1", name: "Vũng Tàu Club", logo: "VT", score: 2, isWinner: true },
      teamB: { id: "t2", name: "Saigon Masters", logo: "SG", score: 1 },
      children: [
        {
          id: "qf1", round: "Tứ Kết 1", status: "completed", time: "23 Thg 5", info: "Kết thúc",
          teamA: { id: "t1", name: "Vũng Tàu Club", logo: "VT", score: 2, isWinner: true },
          teamB: { id: "t8", name: "Đà Lạt Wave", logo: "DL", score: 0 }
        },
        {
          id: "qf2", round: "Tứ Kết 2", status: "completed", time: "23 Thg 5", info: "Kết thúc",
          teamA: { id: "t3", name: "Cần Thơ PK", logo: "CT", score: 0 },
          teamB: { id: "t2", name: "Saigon Masters", logo: "SG", score: 2, isWinner: true }
        }
      ]
    },
    {
      id: "sf2", round: "Bán Kết 2", status: "upcoming", time: "24 Thg 5 - 17:00", info: "Sân 2",
      teamA: { id: "t4", name: "Bình Dương FC", logo: "BD" },
      teamB: { id: "t5", name: "Hà Nội Pro", logo: "HN" },
      children: [
        {
          id: "qf3", round: "Tứ Kết 3", status: "completed", time: "23 Thg 5", info: "Kết thúc",
          teamA: { id: "t4", name: "Bình Dương FC", logo: "BD", score: 2, isWinner: true },
          teamB: { id: "t7", name: "Nha Trang Net", logo: "NT", score: 1 }
        },
        {
          id: "qf4", round: "Tứ Kết 4", status: "completed", time: "23 Thg 5", info: "Kết thúc",
          teamA: { id: "t6", name: "Đà Nẵng Waves", logo: "DN", score: 1 },
          teamB: { id: "t5", name: "Hà Nội Pro", logo: "HN", score: 2, isWinner: true }
        }
      ]
    }
  ]
};

// Thêm data chỉ số phụ vào cuối file
export const mockTieBreakRules: TieBreakRule[] = [
  { id: 1, title: "Đối đầu trực tiếp (Head-to-Head)", description: "Kết quả đối đầu trực tiếp giữa các đội bằng điểm sẽ được ưu tiên xem xét trước tiên." },
  { id: 2, title: "Hiệu số ván thắng/thua", description: "Nếu đối đầu trực tiếp hòa, hiệu số ván thắng trừ ván thua trong toàn bộ giải đấu sẽ được tính." },
  { id: 3, title: "Tổng điểm ghi được", description: "Đội có tổng số điểm ghi được nhiều hơn trong tất cả các trận đấu sẽ xếp trên." },
  { id: 4, title: "Rút thăm may mắn", description: "Nếu tất cả các chỉ số trên đều bằng nhau, ban tổ chức sẽ tiến hành rút thăm ngẫu nhiên." }
];