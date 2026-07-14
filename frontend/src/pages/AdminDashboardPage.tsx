import { useEffect, useMemo, useState } from "react";
import { Building2, Check, Clock, Edit, Eye, MoreVertical, RefreshCw, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminDashboardStats from "@/components/admin/dashboard/AdminDashboardStats";
import AdminDashboardCharts from "@/components/admin/dashboard/AdminDashboardCharts";
import { useAdminDashboardStore } from "@/stores/useAdminDashboardStore";
import type { AdminOrgRecord } from "@/types/adminDashboard";

const statusClass = (status: string) =>
  status === "Hoạt động"
    ? "bg-green-50 text-green-700 border-green-200"
    : status === "Chờ duyệt"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-muted text-muted-foreground border-border";

const StatusIcon = ({ status }: { status: string }) =>
  status === "Hoạt động" ? <Check className="h-3 w-3" /> : status === "Chờ duyệt" ? <Clock className="h-3 w-3" /> : <XCircle className="h-3 w-3" />;

const OrgCard = ({ org }: { org: AdminOrgRecord }) => (
  <article className="rounded-xl border border-border bg-background p-4">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h4 className="truncate text-sm font-bold text-foreground">{org.name}</h4>
        <p className="truncate text-xs font-semibold text-muted-foreground">{org.email || "Chưa có email"}</p>
      </div>
      <span className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClass(org.status)}`}>
        <StatusIcon status={org.status} /> {org.status}
      </span>
    </div>
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div><span className="block text-muted-foreground">Gói</span><span className="font-bold">{org.plan}</span></div>
      <div><span className="block text-muted-foreground">Giải</span><span className="font-bold">{org.tournamentsCount}</span></div>
      <div><span className="block text-muted-foreground">Người dùng</span><span className="font-bold">{org.usersCount}</span></div>
    </div>
  </article>
);

const AdminDashboardPage = () => {
  const { stats, orgs, revenueData, pieData, loading, error, fetchData } = useAdminDashboardStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredOrgs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return orgs;
    return orgs.filter((org) => `${org.name} ${org.email} ${org.status}`.toLowerCase().includes(keyword));
  }, [orgs, search]);

  if (loading && stats.length === 0) {
    return <div className="p-6 text-sm font-bold text-muted-foreground">Đang tải dashboard admin...</div>;
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 pb-10">
      <div className="flex flex-col gap-3 rounded-2xl bg-header p-5 text-white shadow-lg sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase text-white/60">Admin</p>
          <h1 className="text-2xl font-extrabold uppercase">Tổng quan hệ thống</h1>
          <p className="mt-1 text-sm font-semibold text-white/70">Dữ liệu tổng hợp từ database, không dùng mock.</p>
        </div>
        <Button variant="secondary" onClick={() => void fetchData()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Tải lại
        </Button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

      <AdminDashboardStats stats={stats} />
      <AdminDashboardCharts revenueData={revenueData} pieData={pieData} />

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold uppercase text-foreground">Tổ chức gần đây</h2>
            <p className="text-xs font-semibold text-muted-foreground">{filteredOrgs.length} bản ghi theo bộ lọc hiện tại</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, email, trạng thái" className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm font-semibold outline-none focus:border-primary" />
          </div>
        </div>

        <div className="grid gap-3 p-4 md:hidden">
          {filteredOrgs.map((org) => <OrgCard key={org.id} org={org} />)}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-4">Tổ chức</th>
                <th className="p-4">Gói</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-center">Giải đấu</th>
                <th className="p-4 text-center">Người dùng</th>
                <th className="p-4">Tham gia</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-muted/10">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><Building2 className="h-4 w-4" /></div>
                      <div className="min-w-0"><p className="font-bold">{org.name}</p><p className="truncate text-xs text-muted-foreground">{org.email || "Chưa có email"}</p></div>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-bold">{org.plan}</td>
                  <td className="p-4"><span className={`flex w-max items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(org.status)}`}><StatusIcon status={org.status} /> {org.status}</span></td>
                  <td className="p-4 text-center font-bold">{org.tournamentsCount}</td>
                  <td className="p-4 text-center font-bold">{org.usersCount}</td>
                  <td className="p-4 text-xs font-semibold text-muted-foreground">{org.joinedAt}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-1 text-muted-foreground">
                      <button type="button" className="rounded p-1.5 hover:bg-muted" aria-label="Xem"><Eye className="h-4 w-4" /></button>
                      <button type="button" className="rounded p-1.5 hover:bg-muted" aria-label="Sửa"><Edit className="h-4 w-4" /></button>
                      <button type="button" className="rounded p-1.5 hover:bg-muted" aria-label="Thêm thao tác"><MoreVertical className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrgs.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-sm font-bold text-muted-foreground">Không có tổ chức nào theo bộ lọc.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
