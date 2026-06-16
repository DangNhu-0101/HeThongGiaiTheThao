import type { TeamMgmtStat, OrgTeamRecord } from "@/types/orgTeamMgmt";

export const mockTeamStats: TeamMgmtStat[] = [
  { id: "s1", label: "Tổng Đội", value: 48, iconType: "total", color: "text-blue-600 bg-blue-100" },
  { id: "s2", label: "Đã duyệt", value: 36, iconType: "approved", color: "text-green-600 bg-green-100" },
  { id: "s3", label: "Chờ duyệt", value: 7, iconType: "pending", color: "text-orange-600 bg-orange-100" },
  { id: "s4", label: "Từ chối", value: 5, iconType: "rejected", color: "text-red-600 bg-red-100" },
  { id: "s5", label: "Tổng VĐV", value: 612, iconType: "athletes", color: "text-purple-600 bg-purple-100" },
  { id: "s6", label: "Môn thi", value: 6, iconType: "sports", color: "text-gray-600 bg-gray-100" },
  { id: "s7", label: "Đội miễn phí", value: 3, iconType: "free", color: "text-indigo-600 bg-indigo-100" }, // Thêm theo yêu cầu
];

export const mockTeamRecords: OrgTeamRecord[] = [
  {
    id: "tm1", name: "FC Alpha United", tournamentName: "Champions League Cup 2026", sport: "Pickleball", 
    playersCount: 18, status: "Approved", isFree: false, avatars: ["A", "B", "C"]
  },
  {
    id: "tm2", name: "Thunder Hawks", tournamentName: "Regional Basketball League", sport: "Pickleball", 
    playersCount: 12, status: "Approved", isFree: true, avatars: ["T", "H"]
  },
  {
    id: "tm3", name: "FC Dynamo", tournamentName: "Champions League Cup 2026", sport: "Pickleball", 
    playersCount: 16, status: "Pending", submittedAt: "3 ngày trước", isFree: false, avatars: ["D", "Y", "N"]
  },
  {
    id: "tm4", name: "Blue Eagles", tournamentName: "Summer Volleyball Open 2026", sport: "Pickleball", 
    playersCount: 10, status: "Pending", submittedAt: "1 ngày trước", isFree: false, avatars: ["B", "E"]
  },
  {
    id: "tm5", name: "Sprint Masters", tournamentName: "National Athletics Championship", sport: "Pickleball", 
    playersCount: 8, status: "Approved", isFree: false, avatars: ["S", "M"]
  },
  {
    id: "tm6", name: "FC Phantom", tournamentName: "Champions League Cup 2026", sport: "Pickleball", 
    playersCount: 20, status: "Rejected", issueText: "Hồ sơ không hợp lệ", isFree: false, avatars: ["P", "H", "A"]
  },
  {
    id: "tm7", name: "City Wolves", tournamentName: "Champions League Cup 2026", sport: "Pickleball", 
    playersCount: 22, status: "Approved", isFree: true, avatars: ["C", "W"]
  },
  {
    id: "tm8", name: "Iron Lions", tournamentName: "Champions League Cup 2026", sport: "Pickleball", 
    playersCount: 17, status: "Suspended", issueText: "Vi phạm fair-play", isFree: false, avatars: ["I", "L"]
  },
];