import { useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrgStatCards from "@/components/org/OrgStatCards";
import { RevenueChart, SportDistributionChart } from "@/components/org/OrgCharts";
import OrgTournaments from "@/components/org/OrgTournaments";
import OrgQuickActions from "@/components/org/OrgQuickActions";
import { useOrgDashboardStore } from "@/stores/useOrgDashboardStore";

const OrgDashboardPage = () => {
  const { data, loading, fetchDashboard } = useOrgDashboardStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading || !data) {
    return <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse font-medium">Đang tải bảng điều khiển...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Header Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-header text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <span className="bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded-md uppercase mb-2 inline-block">Cổng Ban Tổ Chức</span>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-1">Bảng điều khiển</h1>
          <p className="text-sm text-white/70">Chào mừng trở lại! Dữ liệu được cập nhật mới nhất.</p>
        </div>
        <div className="flex gap-3 relative z-10 w-full md:w-auto">
          <Button variant="outline" className="border-white/20 text-foreground bg-white hover:bg-white/90 flex-1 md:flex-none">
            <Download className="w-4 h-4 mr-2" /> Xuất Báo Cáo
          </Button>

        </div>
      </div>

      {/* Thẻ Thống Kê */}
      <OrgStatCards stats={data.stats} />

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={data.revenueData} />
        </div>
        <div className="lg:col-span-1">
          <SportDistributionChart data={data.sportDistribution} />
        </div>
      </div>

      {/* Trạng thái & Thao tác (Đã bỏ Notification/Pending Tasks) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrgTournaments tournaments={data.tournaments} />
        </div>
        <div className="lg:col-span-1">
          <OrgQuickActions />
        </div>
      </div>

    </div>
  );
};
export default OrgDashboardPage;
