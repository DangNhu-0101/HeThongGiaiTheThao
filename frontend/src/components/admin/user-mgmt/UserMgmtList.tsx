import { useState } from "react";
import { Check, Edit, Eye, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AdminRoleName, AdminUserRecord, AdminUserRole } from "@/types/adminUserMgmt";

interface Props {
  records: AdminUserRecord[];
  isMobile: boolean;
  onUpdateStatus: (id: string, status: AdminUserRecord["status"]) => void;
  onUpdateRoles: (id: string, roles: AdminRoleName[]) => Promise<void>;
}

const availableRoles: Array<{ value: AdminRoleName; label: string; description: string }> = [
  { value: "player", label: "Vận động viên", description: "Tham gia đội và giải đấu" },
  { value: "coach", label: "Huấn luyện viên", description: "Quản lý chuyên môn của đội" },
  { value: "referee", label: "Trọng tài", description: "Điều hành và nhập kết quả trận đấu" },
  { value: "org", label: "Tổ chức", description: "Tạo và quản lý giải đấu" },
  { value: "admin", label: "Quản trị viên", description: "Toàn quyền quản trị hệ thống" },
];

const tabs: Array<"Tất cả" | AdminUserRole> = ["Tất cả", "Tổ chức", "Trọng tài", "Vận động viên"];

const isImageSource = (value: string) =>
  /^(https?:\/\/|data:image\/|blob:|\/?uploads\/)/i.test(value.trim());

const UserAvatar = ({ user, size = "default" }: { user: AdminUserRecord; size?: "default" | "sm" }) => {
  const className = size === "sm" ? "h-9 w-9 text-sm" : "h-10 w-10";
  const fallback = user.avatar?.trim().slice(0, 2).toUpperCase() || user.name.slice(0, 1).toUpperCase();

  return (
    <div className={`flex ${className} shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-100 bg-amber-50 font-bold text-amber-600`}>
      {isImageSource(user.avatar)
        ? <img src={user.avatar} alt={`Ảnh đại diện của ${user.name}`} className="h-full w-full object-cover" />
        : fallback}
    </div>
  );
};

const UserMgmtList = ({ records, isMobile, onUpdateStatus, onUpdateRoles }: Props) => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Tất cả");
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<AdminRoleName[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);
  const [roleError, setRoleError] = useState("");
  const filteredRecords = records.filter((record) => activeTab === "Tất cả" || record.role === activeTab);

  const openRoleEditor = (user: AdminUserRecord) => {
    setEditingUser(user);
    setSelectedRoles(user.roles);
    setRoleError("");
  };

  const toggleRole = (role: AdminRoleName) => {
    setSelectedRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
  };

  const saveRoles = async () => {
    if (!editingUser || selectedRoles.length === 0) {
      setRoleError("Hãy chọn ít nhất một vai trò.");
      return;
    }
    setSavingRoles(true);
    setRoleError("");
    try {
      await onUpdateRoles(editingUser.id, selectedRoles);
      setEditingUser(null);
    } catch (error) {
      setRoleError(error instanceof Error ? error.message : "Không thể cập nhật vai trò.");
    } finally {
      setSavingRoles(false);
    }
  };

  const renderActions = (user: AdminUserRecord, compact = false) => (
    <div className="flex items-center justify-end gap-1">
      {user.status === "Chờ duyệt" && user.role !== "Vận động viên" && (
        compact ? (
          <Button size="sm" className="h-7 bg-green-500 px-2 text-xs text-white" onClick={() => onUpdateStatus(user.id, "Hoạt động")}>
            <Check className="mr-1 h-3 w-3" /> Duyệt
          </Button>
        ) : (
          <button className="rounded p-1.5 text-green-600 hover:bg-green-50" onClick={() => onUpdateStatus(user.id, "Hoạt động")} title="Duyệt">
            <Check className="h-4 w-4" />
          </button>
        )
      )}
      <button className="rounded p-1.5 text-muted-foreground hover:text-primary" title="Xem chi tiết"><Eye className="h-4 w-4" /></button>
      <button className="rounded p-1.5 text-muted-foreground hover:text-amber-500" onClick={() => openRoleEditor(user)} title="Cấp vai trò"><Edit className="h-4 w-4" /></button>
      {user.status === "Hoạt động" && (
        <button className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => onUpdateStatus(user.id, "Đang khóa")} title="Khóa">
          <ShieldAlert className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && !savingRoles && setEditingUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cấp vai trò người dùng</DialogTitle>
            <DialogDescription>
              Chọn các vai trò cho {editingUser?.name}. Thay đổi có hiệu lực ở lần kiểm tra quyền tiếp theo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {availableRoles.map((role) => {
              const checked = selectedRoles.includes(role.value);
              return (
                <label key={role.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${checked ? "border-amber-400 bg-amber-50/70" : "border-border hover:bg-muted/40"}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleRole(role.value)} className="mt-1 h-4 w-4 accent-amber-500" />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{role.label}</span>
                    <span className="block text-xs text-muted-foreground">{role.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {roleError && <p role="alert" className="text-sm font-medium text-red-600">{roleError}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={savingRoles} onClick={() => setEditingUser(null)}>Hủy</Button>
            <Button disabled={savingRoles || selectedRoles.length === 0} onClick={saveRoles}>
              {savingRoles ? "Đang lưu..." : "Lưu vai trò"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="beautiful-scrollbar flex overflow-x-auto border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 border-b-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === tab ? "border-amber-500 text-amber-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-col justify-between gap-3 md:flex-row">
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Tìm kiếm tên, email..." className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-amber-500 focus:outline-none" />
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <select className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm md:flex-none"><option>Tất cả trạng thái</option></select>
            <select className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm md:flex-none"><option>Tất cả khu vực</option></select>
          </div>
        </div>
      </div>

      {isMobile ? (
        <div className="space-y-4">
          {filteredRecords.map((user) => (
            <div key={user.id} className="relative rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <UserAvatar user={user} />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-bold text-foreground">{user.name}</h4>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="my-3 grid grid-cols-2 gap-2 border-y border-border/50 py-3 text-xs">
                <div><span className="block text-[10px] uppercase text-muted-foreground">Vai trò</span><span className="font-bold text-foreground">{user.role}</span></div>
                <div><span className="block text-[10px] uppercase text-muted-foreground">Trạng thái</span><span className={`font-bold ${user.status === "Hoạt động" ? "text-green-600" : user.status === "Chờ duyệt" ? "text-amber-600" : "text-red-500"}`}>{user.status}</span></div>
                <div><span className="block text-[10px] uppercase text-muted-foreground">Khu vực</span><span className="font-semibold">{user.region}</span></div>
                <div><span className="block text-[10px] uppercase text-muted-foreground">Đăng nhập</span><span className="text-muted-foreground">{user.lastLogin}</span></div>
              </div>
              {renderActions(user, true)}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="beautiful-scrollbar overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="p-4">Người dùng</th>
                  <th className="p-4">Vai trò</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Quyền truy cập</th>
                  <th className="p-4">Đăng nhập cuối</th>
                  <th className="p-4">Khu vực</th>
                  <th className="p-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {filteredRecords.map((user) => (
                  <tr key={user.id} className="group transition-colors hover:bg-muted/10">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} size="sm" />
                        <div><p className="text-sm font-bold leading-tight">{user.name}</p><p className="text-[10px] text-muted-foreground">{user.email}</p></div>
                      </div>
                    </td>
                    <td className="p-4"><span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{user.role}</span></td>
                    <td className="p-4"><span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${user.status === "Hoạt động" ? "border-green-200 bg-green-50 text-green-600" : user.status === "Chờ duyệt" ? "border-amber-200 bg-amber-50 text-amber-600" : "border-red-200 bg-red-50 text-red-600"}`}>{user.status}</span></td>
                    <td className="p-4 text-xs font-semibold text-muted-foreground">{user.accessLevel}</td>
                    <td className="p-4 text-xs font-medium">{user.lastLogin}</td>
                    <td className="p-4 text-xs font-bold text-muted-foreground">{user.region}</td>
                    <td className="p-4 text-center"><div className="opacity-70 transition-opacity group-hover:opacity-100">{renderActions(user)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMgmtList;
