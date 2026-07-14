import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminDashboardService } from "@/services/adminDashboardService";
import type { AdminOrgRecord } from "@/types/adminDashboard";

const AdminOrganizationsPage = () => {
  const [orgs, setOrgs] = useState<AdminOrgRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminDashboardService.getDashboardData();
      setOrgs(data.orgs);
    } catch (requestError) {
      console.error("Không thể tải tổ chức:", requestError);
      setError("Không thể tải danh sách tổ chức. Vui lòng thử lại.");
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return orgs;
    return orgs.filter((org) => `${org.name} ${org.email} ${org.status}`.toLowerCase().includes(keyword));
  }, [orgs, search]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12">
      <section className="rounded-2xl bg-header p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-white/60">Quản trị hệ thống</p>
            <h1 className="mt-1 text-3xl font-extrabold uppercase tracking-normal">Tổ chức</h1>
            <p className="mt-2 text-sm text-white/70">Theo dõi các đơn vị tổ chức đang hoạt động trên hệ thống.</p>
          </div>
          <Button variant="outline" className="bg-white text-foreground hover:bg-white/90" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Tải lại
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, email, trạng thái" className="pl-10" />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-muted-foreground"><Loader2 className="mx-auto mb-3 size-6 animate-spin text-primary" />Đang tải tổ chức...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-700">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground"><Building2 className="mx-auto mb-3 size-10 text-primary" />Chưa có tổ chức phù hợp.</div>
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((org) => (
              <article key={org.id} className="rounded-2xl border border-border bg-background p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"><Building2 className="size-5" /></div>
                  <div className="min-w-0">
                    <h2 className="truncate font-bold">{org.name}</h2>
                    <p className="truncate text-sm text-muted-foreground">{org.email || "Chưa có email"}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-xs text-muted-foreground">Gói</p><p className="font-bold">{org.plan}</p></div>
                  <div><p className="text-xs text-muted-foreground">Giải</p><p className="font-bold">{org.tournamentsCount}</p></div>
                  <div><p className="text-xs text-muted-foreground">Người dùng</p><p className="font-bold">{org.usersCount}</p></div>
                </div>
                <p className="mt-4 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">{org.status}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminOrganizationsPage;
