import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { orgReportsService, type OrgReportData, type OrgReportFilters } from "@/services/orgReportsService";
import { useAuthStore } from "@/stores/useAuthStore";

const COLORS = ["#325978", "#A7CADF", "#730F1A", "#22C55E", "#F59E0B"];
const money = (value: number) => value.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

const OrgReportsPage = () => {
  const user = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState<OrgReportFilters>({ groupBy: "month" });
  const [data, setData] = useState<OrgReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await orgReportsService.getReports(filters));
    } catch (requestError) {
      console.error(requestError);
      setError("Không thể tải báo cáo. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  const sports = useMemo(() => Array.from(new Set(data?.tournaments.map((item) => item.sport).filter(Boolean) || [])), [data]);
  const tournaments = data?.tournaments || [];

  const exportPdf = async () => {
    if (!data || data.summary.totalTournaments === 0) return;
    setExportingPdf(true);
    try {
      const organizationName = user?.organizationProfile?.name || user?.organization?.name || user?.username || "Ban tổ chức";
      const blob = await orgReportsService.exportPdf(data, filters, organizationName);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bao-cao-giai-dau-${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 print:bg-white">
      <div className="rounded-2xl bg-header p-6 text-white shadow-lg md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-white/75">Báo cáo Ban tổ chức</p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-white">Báo cáo giải đấu</h1>
            <p className="mt-2 text-sm text-white/78">Dữ liệu chỉ lấy trong phạm vi giải đấu của ban tổ chức đang đăng nhập.</p>
          </div>
          <Button onClick={exportPdf} disabled={!data || data.summary.totalTournaments === 0 || exportingPdf} className="bg-accent text-white hover:bg-accent/90 print:hidden">
            <Download className="h-4 w-4" /> {exportingPdf ? "Đang xuất PDF..." : "Xuất báo cáo PDF"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm print:hidden lg:grid-cols-6">
        <input type="date" value={filters.from || ""} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} className="h-10 rounded-lg border border-input bg-background px-3 text-sm" />
        <input type="date" value={filters.to || ""} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} className="h-10 rounded-lg border border-input bg-background px-3 text-sm" />
        <select value={filters.tournamentId || ""} onChange={(event) => setFilters((current) => ({ ...current, tournamentId: event.target.value || undefined }))} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="">Tất cả giải</option>
          {tournaments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select value={filters.sport || ""} onChange={(event) => setFilters((current) => ({ ...current, sport: event.target.value || undefined }))} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="">Tất cả môn</option>
          {sports.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={filters.status || ""} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value || undefined }))} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="Registration Open">Mở đăng ký</option>
          <option value="Live">Đang diễn ra</option>
          <option value="Completed">Hoàn tất</option>
        </select>
        <select value={filters.kind || ""} onChange={(event) => setFilters((current) => ({ ...current, kind: event.target.value || undefined }))} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="">Tất cả hình thức</option>
          <option value="multi">Hội thao</option>
          <option value="single">Giải đơn</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">Đang tải báo cáo...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-10 text-center text-red-700">{error}</div>
      ) : !data || data.summary.totalTournaments === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 font-heading text-xl font-bold">Chưa có dữ liệu báo cáo</h2>
          <p className="mt-2 text-sm text-muted-foreground">Hãy đổi bộ lọc hoặc tạo giải mới để có dữ liệu thống kê.</p>
        </div>
      ) : (
        <div id="org-report-print" className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-heading text-xl font-bold">Thông tin báo cáo</h2>
            <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
              <p><strong>Ban tổ chức:</strong> {user?.organizationProfile?.name || user?.organization?.name || user?.username || "Ban tổ chức"}</p>
              <p><strong>Khoảng thời gian:</strong> {filters.from || "Từ đầu"} - {filters.to || "Hiện tại"}</p>
              <p><strong>Bộ lọc:</strong> {filters.sport || "Tất cả môn"} · {filters.status || "Tất cả trạng thái"} · {filters.kind || "Tất cả hình thức"}</p>
              <p><strong>Thời gian xuất:</strong> {new Date().toLocaleString("vi-VN")}</p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <Metric label="Tổng giải" value={data.summary.totalTournaments} />
            <Metric label="Tổng đội" value={data.summary.totalTeams} />
            <Metric label="Tổng VĐV" value={data.summary.totalPlayers} />
            <Metric label="Đã thu" value={money(data.summary.collectedAmount)} />
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <ChartCard title="Số giải theo thời gian"><BarChartBox data={data.charts.tournamentsByTime} /></ChartCard>
            <ChartCard title="Số giải theo trạng thái"><PieChartBox data={data.charts.tournamentsByStatus} /></ChartCard>
            <ChartCard title="Số giải theo môn thể thao"><BarChartBox data={data.charts.tournamentsBySport} /></ChartCard>
            <ChartCard title="Số giải theo hình thức"><PieChartBox data={data.charts.tournamentsByKind} /></ChartCard>
            <ChartCard title="Số đội đăng ký theo thời gian"><BarChartBox data={data.charts.teamsByTime} /></ChartCard>
            <ChartCard title="Số vận động viên theo thời gian"><BarChartBox data={data.charts.playersByTime} /></ChartCard>
            <ChartCard title="Tỷ lệ đội được duyệt"><PieChartBox data={data.charts.teamApproval} /></ChartCard>
            <ChartCard title="Lệ phí dự kiến so với thực tế"><RevenueChart data={data.charts.revenueByTime} /></ChartCard>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-heading text-xl font-bold">Bảng dữ liệu tóm tắt</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted text-left text-foreground">
                  <tr><th className="p-3">Giải đấu</th><th className="p-3">Môn</th><th className="p-3">Hình thức</th><th className="p-3">Trạng thái</th><th className="p-3">Đội</th><th className="p-3">Lệ phí/VĐV</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.tournaments.map((item) => (
                    <tr key={item.id}><td className="p-3 font-semibold">{item.name}</td><td className="p-3">{item.sport}</td><td className="p-3">{item.competitionType}</td><td className="p-3">{item.status}</td><td className="p-3">{item.teamsCount}</td><td className="p-3">{money(item.feeEntry || 0)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
    <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
    <p className="mt-2 font-highlight text-3xl font-semibold text-primary">{value}</p>
  </div>
);

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="break-inside-avoid rounded-xl border border-border bg-card p-5 shadow-sm">
    <h3 className="mb-4 font-heading text-lg font-bold">{title}</h3>
    {children}
  </div>
);

const BarChartBox = ({ data }: { data: Array<{ name: string; value: number }> }) => data.length ? (
  <div className="h-72 min-w-0"><ResponsiveContainer width="100%" height={288} minWidth={0}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" name="Số lượng" fill="#325978" /></BarChart></ResponsiveContainer></div>
) : <EmptyChart />;

const PieChartBox = ({ data }: { data: Array<{ name: string; value: number }> }) => data.length ? (
  <div className="h-72 min-w-0"><ResponsiveContainer width="100%" height={288} minWidth={0}><PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>{data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
) : <EmptyChart />;

const RevenueChart = ({ data }: { data: Array<{ name: string; expected: number; collected: number }> }) => data.length ? (
  <div className="h-72 min-w-0"><ResponsiveContainer width="100%" height={288} minWidth={0}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis tickFormatter={(value) => `${Number(value) / 1000000}tr`} /><Tooltip formatter={(value) => money(Number(value))} /><Legend /><Bar dataKey="expected" name="Dự kiến" fill="#A7CADF" /><Bar dataKey="collected" name="Thực tế" fill="#325978" /></BarChart></ResponsiveContainer></div>
) : <EmptyChart />;

const EmptyChart = () => <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">Không có dữ liệu đủ để hiển thị biểu đồ.</div>;

export default OrgReportsPage;

