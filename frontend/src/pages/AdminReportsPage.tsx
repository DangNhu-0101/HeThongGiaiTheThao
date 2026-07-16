import { useEffect, useState } from "react";
import { Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReportsStats from "@/components/admin/reports/ReportsStats";
import ReportsCharts from "@/components/admin/reports/ReportsCharts";
import ExportCenter from "@/components/admin/reports/ExportCenter";
import { useAdminReportsStore } from "@/stores/useAdminReportsStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { adminReportsService } from "@/services/adminReportsService";

const AdminReportsPage = () => {
  const isMobile = useIsMobile();
  const { stats, trendData, distributionData, loading, fetchData } = useAdminReportsStore();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const downloadGeneralReport = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      const blob = await adminReportsService.exportPdf();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `bao-cao-quan-tri-${new Date().toISOString().slice(0, 10)}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
    return;

    const quote = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const lines = [
      ["Báo cáo tổng quát"].join(","),
      ["Ngày xuất", new Date().toLocaleString("vi-VN")].map(quote).join(","),
      "",
      ["Chỉ số", "Giá trị", "Xu hướng"].map(quote).join(","),
      ...stats.map((item) => [item.label, item.value, item.trend].map(quote).join(",")),
      "",
      ["Xu hướng đăng ký VĐV"].join(","),
      ["Tháng", "VĐV"].map(quote).join(","),
      ...trendData.map((item) => [item.month, item.athletes].map(quote).join(",")),
      "",
      ["Phân bổ trạng thái trận đấu"].join(","),
      ["Trạng thái", "Số lượng"].map(quote).join(","),
      ...distributionData.map((item) => [item.name, item.value].map(quote).join(",")),
    ];
    const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bao-cao-tong-quat-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading || stats.length === 0) {
    return <div className="flex h-full items-center justify-center text-muted-foreground animate-pulse">Đang chuẩn bị báo cáo...</div>;
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col space-y-6 pb-12">
      <div className="relative flex shrink-0 flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl bg-header p-6 text-white shadow-lg md:flex-row md:items-end">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/2 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-white/70">
            <span>Quản trị hệ thống</span>
            <span className="text-amber-500">&gt;</span>
            <span>Báo cáo & Thống kê</span>
          </div>
          <h1 className="mb-1 text-3xl font-black uppercase tracking-wider">Thống kê & Báo cáo</h1>
          <p className="text-sm text-white/70">Phân tích toàn hệ thống và xuất báo cáo tổng quát.</p>
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-3 rounded-xl border border-border bg-card p-3 shadow-sm md:flex-row md:items-center">
        <div className="flex shrink-0 items-center gap-2 px-2 text-xs font-bold uppercase text-muted-foreground">
          <Filter className="h-4 w-4" />
          Lọc dữ liệu:
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 md:grid-cols-4">
          <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option>Mùa giải 2026</option></select>
          <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option>Tất cả khu vực</option></select>
          <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option>Tất cả môn</option></select>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Khoảng thời gian" className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm" />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button className="flex-1 bg-primary text-white hover:bg-primary-hover md:flex-none">Áp dụng</Button>
          <Button variant="outline" className="flex-1 md:flex-none">Đặt lại</Button>
        </div>
      </div>

      <ReportsStats stats={stats} />
      <ReportsCharts trendData={trendData} distributionData={distributionData} />

      <div className={`grid grid-cols-1 ${isMobile ? "" : "lg:grid-cols-2"} gap-6`}>
        <div className="lg:col-span-1">
          <ExportCenter onDownload={downloadGeneralReport} loading={exporting} />
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
