import type { UserStatItem, AdminUserRecord } from "@/types/adminUserMgmt";

export const mockUserStats: UserStatItem[] = [
  { id: "us1", label: "Tổng người dùng", value: 1284, iconType: "total", color: "text-blue-600 bg-blue-100" },
  { id: "us2", label: "Ban Tổ chức", value: 143, iconType: "organization", color: "text-amber-600 bg-amber-100" },
  { id: "us3", label: "Trọng tài", value: 250, iconType: "referee", color: "text-purple-600 bg-purple-100" },
  { id: "us4", label: "Vận động viên", value: 891, iconType: "athlete", color: "text-green-600 bg-green-100" },
];

export const mockUserRecords: AdminUserRecord[] = [
  { id: "u1", name: "SportsPro Global", email: "admin@sportspro.com", avatar: "SP", role: "Tổ chức", status: "Hoạt động", accessLevel: "Toàn quyền", lastLogin: "10 phút trước", region: "Hồ Chí Minh" },
  { id: "u2", name: "Robert Chen", email: "robert.chen@gmail.com", avatar: "RC", role: "Trọng tài", status: "Hoạt động", accessLevel: "Giới hạn", lastLogin: "2 giờ trước", region: "Vũng Tàu" },
  { id: "u3", name: "Sofia Reyes", email: "sofia.r@outlook.com", avatar: "SR", role: "Trọng tài", status: "Chờ duyệt", accessLevel: "Giới hạn", lastLogin: "Hôm qua", region: "Hà Nội" },
  { id: "u4", name: "David Okafor", email: "david.ok@sportorg.vn", avatar: "DO", role: "Vận động viên", status: "Đang khóa", accessLevel: "Giới hạn", lastLogin: "3 ngày trước", region: "Đà Nẵng" },
  { id: "u5", name: "Trần Anh Khoa", email: "khoata@gmail.com", avatar: "AK", role: "Vận động viên", status: "Hoạt động", accessLevel: "Giới hạn", lastLogin: "Vừa xong", region: "Vũng Tàu" },
];