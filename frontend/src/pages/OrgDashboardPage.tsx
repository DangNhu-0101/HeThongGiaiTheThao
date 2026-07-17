import { useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrgStatCards from "@/components/org/OrgStatCards";
import OrgTournaments from "@/components/org/OrgTournaments";
import OrgQuickActions from "@/components/org/OrgQuickActions";
import { useOrgDashboardStore } from "@/stores/useOrgDashboardStore";

const OrgDashboardPage = () => {
  const { data, loading, fetchDashboard } = useOrgDashboardStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading || !data) {
    return <div className="flex h-full items-center justify-center font-medium text-muted-foreground animate-pulse">Đang tải bảng điều khiển...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-header p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary-dark/92 to-primary/75" />
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="mb-2 inline-block rounded-md bg-accent px-2 py-1 text-[10px] font-bold uppercase text-accent-foreground">Cổng Ban tổ chức</span>
            <h1 className="mb-1 text-3xl font-bold uppercase tracking-normal text-white">Bảng điều khiển</h1>
            <p className="text-sm text-white/78">Chào mừng trở lại! Dữ liệu được cập nhật mới nhất.</p>
          </div>
          <div className="flex w-full gap-3 md:w-auto">
            <Button variant="outline" className="flex-1 border-white/25 bg-white/10 text-white hover:bg-white hover:text-header md:flex-none">
              <Download className="mr-2 h-4 w-4" /> Xuất báo cáo
            </Button>
          </div>
        </div>
      </div>

      <OrgStatCards stats={data.stats} />

  

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
