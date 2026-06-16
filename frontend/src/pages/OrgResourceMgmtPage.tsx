import { useEffect, useState } from "react";
import { Plus, Search, LayoutGrid, List, MapPin, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResourceStats from "@/components/org/resource-mgmt/ResourceStats";
import VenueMgmtTable from "@/components/org/resource-mgmt/VenueMgmtTable";
import RefereeMgmtTable from "@/components/org/resource-mgmt/RefereeMgmtTable";
import { useOrgResourceMgmtStore } from "@/stores/useOrgResourceMgmtStore";
import { useIsMobile } from "@/hooks/use-mobile";

const OrgResourceMgmtPage = () => {
  const [activeTab, setActiveTab] = useState<'venues' | 'referees'>('venues');
  const isMobile = useIsMobile();
  const { venueStats, refereeStats, venues, referees, loading, fetchData } = useOrgResourceMgmtStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu tài nguyên...</div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      
      {/* Header/Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-header text-white p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[10px] text-white/70 font-bold uppercase mb-2">
            <span>Cổng Tổ Chức</span> <span className="text-accent">&gt;</span> <span>Tài nguyên</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-1">Quản lý Tài nguyên</h1>
          <p className="text-sm text-white/70">Quản lý cơ sở vật chất sân bãi và phân công trọng tài điều hành.</p>
        </div>
        
        <div className="flex gap-3 relative z-10 w-full md:w-auto">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground flex-1 md:flex-none">
            <Plus className="w-4 h-4 mr-2" /> Thêm {activeTab === 'venues' ? 'Sân mới' : 'Trọng tài'}
          </Button>
        </div>
      </div>

      {/* Thống kê Tổng quan (Render theo Tab) */}
      <ResourceStats stats={activeTab === 'venues' ? venueStats : refereeStats} />

      {/* Bộ Điều hướng Tabs & Lọc */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        
        <div className="flex bg-muted p-1 rounded-lg w-full sm:w-auto">
           <button 
             onClick={() => setActiveTab('venues')}
             className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === 'venues' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
           >
             <MapPin className="w-3.5 h-3.5" /> Sân thi đấu <span className={`${activeTab === 'venues' ? 'bg-primary/10' : 'bg-black/5'} px-1.5 py-0.5 rounded-full`}>{venues.length}</span>
           </button>
           <button 
             onClick={() => setActiveTab('referees')}
             className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === 'referees' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
           >
             <Flag className="w-3.5 h-3.5" /> Trọng tài <span className={`${activeTab === 'referees' ? 'bg-primary/10' : 'bg-black/5'} px-1.5 py-0.5 rounded-full`}>{referees.length}</span>
           </button>
        </div>

        <div className={`flex gap-3 w-full xl:w-auto ${isMobile ? 'flex-col' : 'flex-row items-center'}`}>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder={`Tìm ${activeTab === 'venues' ? 'sân thi đấu' : 'trọng tài'}...`} className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="flex-1 sm:flex-none border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none">
              <option>Tất cả Trạng thái</option>
            </select>
          </div>
          <div className="hidden sm:flex bg-muted p-1 rounded-lg shrink-0 ml-auto xl:ml-0">
            <button className="p-1.5 bg-background shadow-sm rounded-md text-foreground"><List className="w-4 h-4" /></button>
            <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><LayoutGrid className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Nội dung Tab */}
      <div className="mt-4">
        {activeTab === 'venues' ? (
          <VenueMgmtTable records={venues} isMobile={isMobile} />
        ) : (
          <RefereeMgmtTable records={referees} isMobile={isMobile} />
        )}
      </div>

    </div>
  );
};
export default OrgResourceMgmtPage;