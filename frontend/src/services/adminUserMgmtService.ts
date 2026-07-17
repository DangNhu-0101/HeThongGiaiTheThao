import api, { normalizeUploadUrl } from '@/libs/axios';
import type { AdminUserRecord, AdminUserRole, AdminUserStatus, UserStatItem } from '@/types/adminUserMgmt';

interface ApiUser {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  roles: string[];
  status: 'actived' | 'inactive' | 'banned';
  requestedRole?: 'org' | 'referee' | null;
  roleRequestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  requestedProfile?: Record<string, unknown>;
  createdAt?: string;
}

const roleLabel = (user: ApiUser): AdminUserRole => {
  if (user.roleRequestStatus === 'pending' && user.requestedRole === 'org') return 'Tổ chức';
  if (user.roleRequestStatus === 'pending' && user.requestedRole === 'referee') return 'Trọng tài';
  if (user.roles.includes('admin')) return 'Quản trị viên';
  if (user.roles.includes('organization') || user.roles.includes('org')) return 'Tổ chức';
  if (user.roles.includes('referee')) return 'Trọng tài';
  return 'Vận động viên';
};

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';

const profileText = (value: unknown, fallback = 'Chưa cập nhật') => {
  if (!value) return fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value !== 'object') return fallback;
  const record = value as Record<string, unknown>;
  return [record.detail, record.district, record.city, record.province, record.country]
    .filter(Boolean)
    .map(String)
    .join(', ') || fallback;
};

const mapUser = (user: ApiUser): AdminUserRecord => {
  const name = String(user.requestedProfile?.orgName || user.requestedProfile?.name || user.username);
  const avatar = normalizeUploadUrl(user.avatar) || initials(name);
  return {
    id: user._id,
    name,
    email: user.email,
    avatar,
    role: roleLabel(user),
    status: user.roleRequestStatus === 'pending' ? 'Chờ duyệt' : user.status === 'actived' ? 'Hoạt động' : 'Đang khóa',
    accessLevel: user.roles.includes('admin') ? 'Toàn quyền' : 'Giới hạn',
    lastLogin: user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Chưa có',
    region: profileText(user.requestedProfile?.address),
    requestedRole: user.requestedRole,
  };
};

const buildStats = (records: AdminUserRecord[]): UserStatItem[] => [
  { id: 'total', label: 'Tổng người dùng', value: records.length, iconType: 'total', color: 'text-blue-600 bg-blue-100' },
  { id: 'org', label: 'Tổ chức', value: records.filter((user) => user.role === 'Tổ chức').length, iconType: 'organization', color: 'text-violet-600 bg-violet-100' },
  { id: 'referee', label: 'Trọng tài', value: records.filter((user) => user.role === 'Trọng tài').length, iconType: 'referee', color: 'text-amber-600 bg-amber-100' },
  { id: 'player', label: 'Vận động viên', value: records.filter((user) => user.role === 'Vận động viên').length, iconType: 'athlete', color: 'text-green-600 bg-green-100' },
];

export const adminUserMgmtService = {
  async getUserMgmtData(): Promise<{ stats: UserStatItem[]; records: AdminUserRecord[] }> {
    const response = await api.get<{ data: ApiUser[] }>('/admin/users');
    const records = response.data.data.map(mapUser);
    return { stats: buildStats(records), records };
  },

  async approveRoleRequest(userId: string, requestedRole?: 'org' | 'referee' | null): Promise<void> {
    if (!requestedRole) throw new Error('Không tìm thấy loại yêu cầu cần duyệt.');
    const pending = await api.get<{ data: Array<{ _id: string; profileType: 'org' | 'referee'; ownerId?: { _id?: string } | string; userId?: { _id?: string } | string }> }>('/admin/requests/pending', {
      params: { type: requestedRole },
    });
    const request = pending.data.data.find((item) => {
      const owner = item.profileType === 'org' ? item.ownerId : item.userId;
      const ownerId = typeof owner === 'string' ? owner : owner?._id;
      return ownerId === userId;
    });
    if (!request) throw new Error('Yêu cầu này không còn ở trạng thái chờ duyệt.');
    await api.patch(`/admin/requests/${requestedRole}/${request._id}/approve`);
  },

  async updateUserStatus(userId: string, status: AdminUserStatus): Promise<void> {
    const value = status === 'Hoạt động' ? 'actived' : 'inactive';
    await api.put(`/admin/users/${userId}`, { status: value });
  },
};
