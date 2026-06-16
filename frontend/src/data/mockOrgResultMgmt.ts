import type { ResultStat, ResultMatchRecord } from "@/types/orgResultMgmt";

export const mockResultStats: ResultStat[] = [
  { id: "rs1", label: "Tổng trận", value: 48, iconType: "total", color: "text-blue-600 bg-blue-100" },
  { id: "rs2", label: "Đang diễn ra", value: 2, iconType: "live", color: "text-red-600 bg-red-100" },
  { id: "rs3", label: "Hoàn tất", value: 21, iconType: "completed", color: "text-green-600 bg-green-100" },
  { id: "rs4", label: "Chờ cập nhật", value: 7, iconType: "pending", color: "text-orange-600 bg-orange-100" },
  { id: "rs5", label: "Đã đồng bộ BXH", value: 18, iconType: "synced", color: "text-teal-600 bg-teal-100" },
];

export const mockResultMatches: ResultMatchRecord[] = [
  {
    id: "m1", tournamentName: "Giải Pickleball Vũng Tàu 2026", round: "Vòng bảng A", matchCode: "VB-A01", 
    time: "08:00 - 09:30", venue: "Sân 1", referee: "Nguyễn Trọng Tài",
    teamA: { id: "t1", name: "Vũng Tàu Club", logo: "VT", score: 2 },
    teamB: { id: "t2", name: "Bà Rịa Đỏ", logo: "BR", score: 1 },
    status: "Live", minute: "Set 3 - 10'"
  },
  {
    id: "m2", tournamentName: "Giải Pickleball Vũng Tàu 2026", round: "Vòng bảng B", matchCode: "VB-B01", 
    time: "09:00 - 10:30", venue: "Sân 2", referee: "Trần Công Bằng",
    teamA: { id: "t3", name: "Saigon Masters", logo: "SG", score: 1 },
    teamB: { id: "t4", name: "Đồng Nai Xanh", logo: "DN", score: 1 },
    status: "Live", minute: "Set 2 - 5'"
  },
  {
    id: "m3", tournamentName: "Giải Trẻ Mở Rộng Hè", round: "Tứ Kết 1", matchCode: "TK-01", 
    time: "08:30 - 10:00", venue: "Sân 3", referee: "Lê Quyết",
    teamA: { id: "t5", name: "Cần Thơ PK", logo: "CT", score: 0 },
    teamB: { id: "t6", name: "Hải Phòng 36", logo: "HP", score: 0 },
    status: "Pending"
  },
  {
    id: "m4", tournamentName: "Giải Trẻ Mở Rộng Hè", round: "Tứ Kết 2", matchCode: "TK-02", 
    time: "10:00 - 11:30", venue: "Sân 1", referee: "Nguyễn Trọng Tài",
    teamA: { id: "t7", name: "Đà Nẵng Waves", logo: "DN", score: 2 },
    teamB: { id: "t8", name: "Nha Trang Net", logo: "NT", score: 0 },
    status: "Completed"
  }
];