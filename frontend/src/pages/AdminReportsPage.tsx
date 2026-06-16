import { useEffect } from "react";
import { Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

import ReportsStats from "@/components/admin/reports/ReportsStats";
import ReportsCharts from "@/components/admin/reports/ReportsCharts";
import ExportCenter from "@/components/admin/reports/ExportCenter";

import { useAdminReportsStore } from "@/stores/useAdminReportsStore";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminReportsPage = () => {
  const isMobile = useIsMobile();
  const { stats, trendData, distributionData, exportFiles, loading, fetchData } = useAdminReportsStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || stats.length === 0) return <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">Đang chuẩn bị báo cáo...</div>;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 flex flex-col pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-header text-white p-6 rounded-2xl shadow-lg relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[10px] text-white/70 font-bold uppercase mb-2">
            <span>Quản trị Hệ thống</span> <span className="text-amber-500">&gt;</span> <span>Báo cáo & Thống kê</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-1">Thống kê & Báo cáo</h1>
          <p className="text-sm text-white/70">Phân tích toàn hệ thống, tóm tắt và trung tâm xuất dữ liệu.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border p-3 rounded-xl shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase px-2 shrink-0">
          <Filter className="w-4 h-4"/> Lọc dữ liệu:
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1">
          <select className="border border-border rounded-lg px-3 py-2 text-sm bg-background"><option>Mùa giải 2026</option></select>
          <select className="border border-border rounded-lg px-3 py-2 text-sm bg-background"><option>Tất cả Khu vực</option></select>
          <select className="border border-border rounded-lg px-3 py-2 text-sm bg-background"><option>Tất cả Môn</option></select>
          <div className="relative">
             <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
             <input type="text" placeholder="Khoảng thời gian" className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background" />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button className="bg-primary hover:bg-primary-hover text-white flex-1 md:flex-none">Áp dụng</Button>
          <Button variant="outline" className="flex-1 md:flex-none">Đặt lại</Button>
        </div>
      </div>

      {/* Stats */}
      <ReportsStats stats={stats} />

      {/* Charts */}
      <ReportsCharts trendData={trendData} distributionData={distributionData} />

      {/* Bottom Section - Lưới 2 cột, nhưng ExportCenter đã lược bỏ các panel bên cạnh nên nó chiếm 1 phần hoặc full */}
      <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-2'} gap-6`}>
        <div className="lg:col-span-1">
          <ExportCenter files={exportFiles} />
        </div>
      </div>

    </div>
  );
};

export default AdminReportsPage;