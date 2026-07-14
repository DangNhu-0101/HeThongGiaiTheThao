import { useState } from "react";
import { Check, Edit, Eye, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminUserRecord, AdminUserRole } from "@/types/adminUserMgmt";

interface Props {
  records: AdminUserRecord[];
  isMobile: boolean;
  onUpdateStatus: (id: string, status: AdminUserRecord["status"]) => void;
}

const tabs: Array<"Tất cả" | AdminUserRole> = ["Tất cả", "Tổ chức", "Trọng tài", "Vận động viên"];

const UserMgmtList = ({ records, isMobile, onUpdateStatus }: Props) => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Tất cả");
  const filteredRecords = records.filter((record) => activeTab === "Tất cả" || record.role === activeTab);

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
      <button className="rounded p-1.5 text-muted-foreground hover:text-amber-500" title="Chỉnh sửa"><Edit className="h-4 w-4" /></button>
      {user.status === "Hoạt động" && (
        <button className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => onUpdateStatus(user.id, "Đang khóa")} title="Khóa">
          <ShieldAlert className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-600">{user.avatar}</div>
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
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-sm font-bold text-amber-600">{user.avatar}</div>
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
