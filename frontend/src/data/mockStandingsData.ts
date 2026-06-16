import type { GroupStanding, TopPerformer } from "@/types/standing";

export const mockGroupStandings: GroupStanding[] = [
  {
    groupId: "gA",
    groupName: "BẢNG A",
    teams: [
      { id: "t1", rank: 1, teamName: "Vũng Tàu Club", logo: "VT", played: 4, won: 3, drawn: 1, lost: 0, goalsFor: 10, goalsAgainst: 2, goalDifference: 8, points: 10, status: 'advance' },
      { id: "t2", rank: 2, teamName: "Saigon Masters", logo: "SG", played: 4, won: 2, drawn: 1, lost: 1, goalsFor: 7, goalsAgainst: 5, goalDifference: 2, points: 7, status: 'advance' },
      { id: "t3", rank: 3, teamName: "Đà Nẵng Waves", logo: "DN", played: 4, won: 1, drawn: 2, lost: 1, goalsFor: 6, goalsAgainst: 7, goalDifference: -1, points: 5, status: 'neutral' },
      { id: "t4", rank: 4, teamName: "Hà Nội Pro", logo: "HN", played: 4, won: 0, drawn: 2, lost: 2, goalsFor: 3, goalsAgainst: 12, goalDifference: -9, points: 2, status: 'eliminated' },
    ]
  },
  {
    groupId: "gB",
    groupName: "BẢNG B",
    teams: [
      { id: "t5", rank: 1, teamName: "Bình Dương FC", logo: "BD", played: 4, won: 3, drawn: 1, lost: 0, goalsFor: 10, goalsAgainst: 2, goalDifference: 8, points: 10, status: 'advance' },
      { id: "t6", rank: 2, teamName: "Phan Thiết Pick", logo: "PT", played: 4, won: 2, drawn: 1, lost: 1, goalsFor: 7, goalsAgainst: 5, goalDifference: 2, points: 7, status: 'advance' },
      { id: "t7", rank: 3, teamName: "Cần Thơ PK", logo: "CT", played: 4, won: 1, drawn: 2, lost: 1, goalsFor: 6, goalsAgainst: 7, goalDifference: -1, points: 5, status: 'neutral' },
      { id: "t8", rank: 4, teamName: "Vinh City", logo: "VI", played: 4, won: 0, drawn: 2, lost: 2, goalsFor: 3, goalsAgainst: 12, goalDifference: -9, points: 2, status: 'eliminated' },
    ]
  }
];

export const mockTopScorers: TopPerformer[] = [
  { id: "p1", rank: 1, playerName: "Nguyễn Văn A", avatar: "A", teamName: "Vũng Tàu Club", teamLogo: "VT", score: 15 },
  { id: "p2", rank: 2, playerName: "Trần Thị B", avatar: "B", teamName: "Saigon Masters", teamLogo: "SG", score: 12 },
  { id: "p3", rank: 3, playerName: "Lê Hoàng C", avatar: "C", teamName: "Bình Dương FC", teamLogo: "BD", score: 10 },
  { id: "p4", rank: 4, playerName: "Phạm Văn D", avatar: "D", teamName: "Đà Nẵng Waves", teamLogo: "DN", score: 8 },
  { id: "p5", rank: 5, playerName: "Hoàng Tuấn E", avatar: "E", teamName: "Phan Thiết Pick", teamLogo: "PT", score: 7 },
];

export const mockTopAssists: TopPerformer[] = [
  { id: "p6", rank: 1, playerName: "Lê Hoàng C", avatar: "C", teamName: "Bình Dương FC", teamLogo: "BD", score: 8 },
  { id: "p1", rank: 2, playerName: "Nguyễn Văn A", avatar: "A", teamName: "Vũng Tàu Club", teamLogo: "VT", score: 6 },
  { id: "p7", rank: 3, playerName: "Đỗ Hữu F", avatar: "F", teamName: "Saigon Masters", teamLogo: "SG", score: 5 },
];