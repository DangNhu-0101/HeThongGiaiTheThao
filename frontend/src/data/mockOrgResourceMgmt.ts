import type { ResourceStat, OrgVenueRecord, OrgRefereeRecord } from "@/types/orgResourceMgmt";

// THỐNG KÊ SÂN BÃI (Đã bỏ thẻ thứ 4 theo yêu cầu)
export const mockVenueStats: ResourceStat[] = [
  { id: "vs1", label: "Tổng số sân", value: 24, subtext: "Trên 4 cụm", iconType: "total", color: "text-blue-600 bg-blue-100" },
  { id: "vs2", label: "Sẵn sàng", value: 18, subtext: "Có thể đặt ngay", iconType: "available", color: "text-green-600 bg-green-100" },
  { id: "vs3", label: "Đang bảo trì", value: 4, subtext: "Cần kiểm tra", iconType: "maintenance", color: "text-orange-600 bg-orange-100" }
];

// THỐNG KÊ TRỌNG TÀI
export const mockRefereeStats: ResourceStat[] = [
  { id: "rs1", label: "Tổng trọng tài", value: 48, subtext: "↑ 3 mới tháng này", iconType: "total", color: "text-blue-600 bg-blue-100" },
  { id: "rs2", label: "Đang làm nhiệm vụ", value: 32, subtext: "Tuần này: 12 trận", iconType: "activity", color: "text-green-600 bg-green-100" },
  { id: "rs3", label: "Trận chưa có TT", value: 7, subtext: "Cần chú ý", iconType: "warning", color: "text-orange-600 bg-orange-100" },
  { id: "rs4", label: "Tải TB / Người", value: "4.2", subtext: "Trận mỗi trọng tài", iconType: "activity", color: "text-purple-600 bg-purple-100" }
];

export const mockVenueRecords: OrgVenueRecord[] = [
  { id: "v1", name: "Sân Trung Tâm", location: "Quận 1", type: "Sân trong nhà", sports: ["Pickleball", "Tennis"], status: "Available", nextBooking: "14 Thg 6, 2026" },
  { id: "v2", name: "Cụm Sân Biển", location: "Bãi Sau", type: "Sân ngoài trời", sports: ["Pickleball"], status: "Booked", nextBooking: "10 Thg 6, 2026" },
  { id: "v3", name: "Sân Đông Thể Thao", location: "Khu Đông", type: "Cụm thể thao", sports: ["Pickleball", "Bóng rổ"], status: "Maintenance", nextBooking: "22 Thg 6, 2026" },
  { id: "v4", name: "Sân Phía Tây", location: "Khu Tây", type: "Sân trong nhà", sports: ["Pickleball"], status: "Available", nextBooking: "17 Thg 6, 2026" },
  { id: "v5", name: "Trung tâm Thủy Lực", location: "Khu Phức hợp", type: "Hồ bơi & Sân tập", sports: ["Bơi lội", "Pickleball"], status: "Closed", nextBooking: "--" },
];

export const mockRefereeRecords: OrgRefereeRecord[] = [
  { id: "r1", name: "Trần Trọng Tài", avatar: "TT", refId: "REF-001", qualification: "Cấp Quốc gia", experience: 12, matchesAssigned: 6, workload: "High", status: "Available" },
  { id: "r2", name: "Lê Công Bằng", avatar: "LB", refId: "REF-002", qualification: "Cấp Khu vực", experience: 8, matchesAssigned: 3, workload: "Low", status: "Available" },
  { id: "r3", name: "Nguyễn Thị Quyết", avatar: "NQ", refId: "REF-003", qualification: "Cấp Quốc gia", experience: 15, matchesAssigned: 5, workload: "Med", status: "Assigned" },
  { id: "r4", name: "Phạm Tinh Anh", avatar: "PA", refId: "REF-004", qualification: "Nghiệp dư", experience: 4, matchesAssigned: 2, workload: "Low", status: "Unavailable" },
  { id: "r5", name: "Hoàng Minh Phán", avatar: "HP", refId: "REF-005", qualification: "Cấp Quốc gia", experience: 9, matchesAssigned: 8, workload: "Over", status: "Assigned" },
];