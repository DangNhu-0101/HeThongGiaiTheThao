import type { ScheduleMatch } from "@/types/schedule";

export const mockScheduleMatches: ScheduleMatch[] = [
  // Thứ 2 (19/05)
  { id: "sm1", date: "2026-05-19", time: "10:00", venue: "Cụm Sân Biển", teamA: { id: "t1", name: "Vũng Tàu Club" }, teamB: { id: "t2", name: "Bà Rịa Đỏ" }, status: "scheduled", roundInfo: "Tứ kết - Trận 1" },
  { id: "sm2", date: "2026-05-19", time: "14:00", venue: "Sân Trung Tâm", teamA: { id: "t3", name: "Sài Gòn Pro" }, teamB: { id: "t4", name: "Đồng Nai Xanh" }, status: "completed", score: "2-0", roundInfo: "Tứ kết - Trận 2" },
  
  // Thứ 3 (20/05)
  { id: "sm3", date: "2026-05-20", time: "11:00", venue: "Cụm Sân Biển", teamA: { id: "t5", name: "Đà Nẵng Waves" }, teamB: { id: "t6", name: "Nha Trang Net" }, status: "scheduled", roundInfo: "Tứ kết - Trận 3" },
  { id: "sm4", date: "2026-05-20", time: "16:30", venue: "Sân Số 2", teamA: { id: "t7", name: "Cần Thơ PK" }, teamB: { id: "t8", name: "Hải Phòng 36" }, status: "scheduled", roundInfo: "Tứ kết - Trận 4" },

  // Thứ 4 (21/05)
  { id: "sm5", date: "2026-05-21", time: "09:00", venue: "Sân Trung Tâm", teamA: { id: "t9", name: "Bình Dương FC" }, teamB: { id: "t10", name: "Vinh City" }, status: "completed", score: "2-1", roundInfo: "Bán kết 1 - Lượt đi" },
  { id: "sm6", date: "2026-05-21", time: "15:00", venue: "Cụm Sân Biển", teamA: { id: "t1", name: "Vũng Tàu Club" }, teamB: { id: "t3", name: "Sài Gòn Pro" }, status: "scheduled", roundInfo: "Bán kết 2 - Lượt đi" },

  // Thứ 5 (22/05) - Trùng lịch (Conflict)
  { id: "sm7", date: "2026-05-22", time: "14:00", venue: "Sân Trung Tâm", teamA: { id: "t5", name: "Đà Nẵng Waves" }, teamB: { id: "t7", name: "Cần Thơ PK" }, status: "conflict", roundInfo: "Giao hữu", conflictReason: "Trùng sân thi đấu" },
  { id: "sm8", date: "2026-05-22", time: "15:30", venue: "Sân Trung Tâm", teamA: { id: "t2", name: "Bà Rịa Đỏ" }, teamB: { id: "t4", name: "Đồng Nai Xanh" }, status: "conflict", roundInfo: "Giao hữu", conflictReason: "Trùng sân thi đấu" },

  // Thứ 6 (23/05) - Đang trực tiếp (Live)
  { id: "sm9", date: "2026-05-23", time: "08:00", venue: "Sân Trung Tâm", teamA: { id: "t9", name: "Bình Dương FC" }, teamB: { id: "t1", name: "Vũng Tàu Club" }, status: "live", score: "1-0", roundInfo: "Bán kết 1 - Lượt về" },
  { id: "sm10", date: "2026-05-23", time: "19:00", venue: "Cụm Sân Biển", teamA: { id: "t10", name: "Vinh City" }, teamB: { id: "t3", name: "Sài Gòn Pro" }, status: "scheduled", roundInfo: "Bán kết 2 - Lượt về" },

  // Thứ 7 (24/05)
  { id: "sm11", date: "2026-05-24", time: "12:00", venue: "Sân Số 2", teamA: { id: "t5", name: "Đà Nẵng Waves" }, teamB: { id: "t7", name: "Cần Thơ PK" }, status: "scheduled", roundInfo: "Tranh Hạng 3" },

  // Chủ Nhật (25/05) - Chung kết
  { id: "sm12", date: "2026-05-25", time: "17:00", venue: "Sân Trung Tâm", teamA: { id: "t9", name: "Bình Dương FC" }, teamB: { id: "t1", name: "Vũng Tàu Club" }, status: "final", roundInfo: "CHUNG KẾT TỔNG" },
];