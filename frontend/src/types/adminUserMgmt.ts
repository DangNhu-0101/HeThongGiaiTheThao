export interface UserStatItem {
  id: string;
  label: string;
  value: number;
  iconType: 'total' | 'organization' | 'referee' | 'athlete';
  color: string;
}

export type AdminRoleName = 'player' | 'coach' | 'referee' | 'org' | 'admin';

export type AdminUserRole = 'Tổ chức' | 'Trọng tài' | 'Vận động viên' | 'Quản trị viên';
export type AdminUserStatus = 'Hoạt động' | 'Chờ duyệt' | 'Đang khóa';

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: AdminUserRole;
  roles: AdminRoleName[];
  status: AdminUserStatus;
  accessLevel: 'Toàn quyền' | 'Giới hạn';
  lastLogin: string;
  region: string;
  requestedRole?: 'org' | 'referee' | null;
}
