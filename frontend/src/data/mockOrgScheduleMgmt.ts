import type { ScheduleStat, ScheduleMatchRecord, VenueColumn, CapacityData } from "@/types/orgScheduleMgmt";

export const mockScheduleStats: ScheduleStat[] = [
  { id: "s1", label: "Tổng trận đấu", value: 48, iconType: "total", color: "text-blue-600 bg-blue-100" },
  { id: "s2", label: "Đã lên lịch", value: 32, iconType: "scheduled", color: "text-green-600 bg-green-100" },
  { id: "s3", label: "Chưa xếp lịch", value: 16, iconType: "unscheduled", color: "text-orange-600 bg-orange-100" },
  { id: "s4", label: "Xung đột", value: 3, iconType: "conflict", color: "text-red-600 bg-red-100" },
  { id: "s5", label: "Trọng tài phân công", value: "9/12", iconType: "referee", color: "text-purple-600 bg-purple-100" },
];

export const mockCapacity: CapacityData = {
  referees: { used: 9, total: 12 },
  venues: { used: 2, total: 3 },
  schedule: { scheduled: 32, total: 48 }
};

export const mockVenues: VenueColumn[] = [
  { id: "v1", name: "Sân 1 - Mỹ Đình", statusText: "Sẵn sàng" },
  { id: "v2", name: "Sân 2 - Hàng Đẫy", statusText: "Xung đột", isConflict: true },
  { id: "v3", name: "Sân 3 - Thống Nhất", statusText: "Sẵn sàng" },
];

export const mockScheduleMatches: ScheduleMatchRecord[] = [
  // Trận ĐÃ XẾP LỊCH
  { id: "m1", code: "VB-A01", round: "Vòng bảng A", teamA: { name: "FC Hà Nội", logo: "HN" }, teamB: { name: "Thể Công", logo: "TC" }, date: "06/10/2026", time: "08:00 - 09:30", venue: "v1", referee: "Nguyễn Văn A", status: "Scheduled" },
  { id: "m2", code: "VB-A02", round: "Vòng bảng A", teamA: { name: "Viettel FC", logo: "VT" }, teamB: { name: "HAGL", logo: "HA" }, date: "06/10/2026", time: "10:00 - 11:30", venue: "v1", referee: "Trần B", status: "Scheduled" },
  { id: "m3", code: "VB-A03", round: "Vòng bảng A", teamA: { name: "Nam Định", logo: "ND" }, teamB: { name: "Đà Nẵng FC", logo: "DN" }, date: "06/10/2026", time: "14:00 - 15:30", venue: "v1", referee: "Nguyễn A", status: "Conflict", conflictReason: "Xung đột TT" },
  { id: "m4", code: "VB-B01", round: "Vòng bảng B", teamA: { name: "Saigon H...", logo: "SG" }, teamB: { name: "Hanoi Buf...", logo: "HB" }, date: "06/10/2026", time: "09:00 - 10:30", venue: "v2", referee: "Lê C", status: "Conflict", conflictReason: "Trùng sân" },
  { id: "m5", code: "VB-B02", round: "Vòng bảng B", teamA: { name: "Cantho C...", logo: "CT" }, teamB: { name: "Danang Dr...", logo: "DD" }, date: "06/10/2026", time: "09:30 - 11:00", venue: "v2", referee: "Phạm D", status: "Conflict", conflictReason: "Trùng sân" },
  { id: "m6", code: "CL-A01", round: "Tứ kết", teamA: { name: "Nguyễn Tiến...", logo: "NT" }, teamB: { name: "Lê Đức...", logo: "LD" }, date: "06/10/2026", time: "08:30 - 10:00", venue: "v3", referee: "Vũ F", status: "Scheduled" },
  
  // Trận CHƯA XẾP LỊCH
  { id: "u1", code: "VB-A04", round: "Vòng bảng A", teamA: { name: "Hải Phòng", logo: "HP" }, teamB: { name: "Bình Dương", logo: "BD" }, status: "Unscheduled" },
  { id: "u2", code: "VB-B04", round: "Vòng bảng B", teamA: { name: "Nha Trang", logo: "NT" }, teamB: { name: "Hà Nội", logo: "HN" }, status: "Unscheduled" },
  { id: "u3", code: "CL-A04", round: "Tứ kết", teamA: { name: "Trần C", logo: "TC" }, teamB: { name: "Hoàng D", logo: "HD" }, status: "Unscheduled" },
  { id: "u4", code: "BC-A02", round: "Bán kết", teamA: { name: "Hóa chất", logo: "HC" }, teamB: { name: "Tràng An", logo: "TA" }, status: "Unscheduled" },
];