export interface UserStatItem {
  id: string;
  label: string;
  value: number;
  iconType: 'total' | 'organization' | 'referee' | 'athlete';
  color: string;
}

export type AdminUserRole = 'Tổ chức' | 'Trọng tài' | 'Vận động viên';
export type AdminUserStatus = 'Hoạt động' | 'Chờ duyệt' | 'Đang khóa';

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  accessLevel: 'Toàn quyền' | 'Giới hạn';
  lastLogin: string;
  region: string;
}