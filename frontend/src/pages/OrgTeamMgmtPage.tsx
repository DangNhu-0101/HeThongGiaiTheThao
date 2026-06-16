import { useEffect, useState } from "react";
import { Download, Plus, BellRing, Search, LayoutGrid, List, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import TeamMgmtStats from "@/components/org/team-mgmt/TeamMgmtStats";
import TeamMgmtAlert from "@/components/org/team-mgmt/TeamMgmtAlert";
import TeamMgmtCard from "@/components/org/team-mgmt/TeamMgmtCard";
import AthleteMgmtTable from "@/components/org/team-mgmt/AthleteMgmtTable";
import { useOrgTeamMgmtStore } from "@/stores/useOrgTeamMgmtStore";
import { useOrgAthleteMgmtStore } from "@/stores/useOrgAthleteMgmtStore";
import { useIsMobile } from "@/hooks/use-mobile";

const OrgTeamMgmtPage = () => {
  const [activeTab, setActiveTab] = useState<'teams' | 'athletes'>('teams');
  const isMobile = useIsMobile();

  // Store Đội
  const { stats: teamStats, records: teamRecords, loading: teamLoading, fetchData: fetchTeams, toggleFeeExempt } = useOrgTeamMgmtStore();
  
  // Store VĐV
  const { records: athleteRecords, loading: athleteLoading, fetchData: fetchAthletes, toggleStatus: toggleAthleteStatus } = useOrgAthleteMgmtStore();

  useEffect(() => {
    fetchTeams();
    fetchAthletes();
  }, [fetchTeams, fetchAthletes]);

  if (teamLoading || athleteLoading) {
    return <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu...</div>;
  }

  // Lọc Đội
  const pendingTeams = teamRecords.filter(t => t.status === 'Pending');
  const approvedTeams = teamRecords.filter(t => t.status === 'Approved');
  const otherTeams = teamRecords.filter(t => t.status === 'Rejected' || t.status === 'Suspended');

  const gridLayoutClass = `grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      
      {/* Header/Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-header text-white p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[10px] text-white/70 font-bold uppercase mb-2">
            <span>Cổng Tổ Chức</span> <span className="text-accent">&gt;</span> <span>Quản lý Đội & VĐV</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-1">Quản lý {activeTab === 'teams' ? 'Đội thi' : 'Vận động viên'}</h1>
          <p className="text-sm text-white/70">Duyệt đăng ký, quản lý danh sách và xử lý các hành động trạng thái hàng loạt.</p>
        </div>
        
        <div className={`flex gap-3 relative z-10 w-full md:w-auto ${isMobile ? 'flex-col' : 'flex-row'}`}>
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="border-white/20 text-foreground bg-white hover:bg-white/90 flex-1 md:flex-none">
              <Download className="w-4 h-4 mr-2 hidden sm:inline" /> Xuất Danh sách
            </Button>
            <Button variant="outline" className="border-white/20 text-foreground bg-white hover:bg-white/90 flex-1 md:flex-none">
              <BellRing className="w-4 h-4 mr-2 hidden sm:inline" /> Thông báo
            </Button>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Thêm {activeTab === 'teams' ? 'Đội' : 'VĐV'}
          </Button>
        </div>
      </div>

      {/* Thống kê Tổng quan (Chỉ hiện ở Tab Đội) */}
      {activeTab === 'teams' && <TeamMgmtStats stats={teamStats} />}
      {activeTab === 'teams' && <TeamMgmtAlert />}

      {/* Bộ Điều hướng Tabs & Lọc */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        
        <div className="flex bg-muted p-1 rounded-lg w-full sm:w-auto">
           <button 
             onClick={() => setActiveTab('teams')}
             className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === 'teams' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
           >
             Đội thi <span className={`${activeTab === 'teams' ? 'bg-primary/10' : 'bg-black/5'} px-1.5 py-0.5 rounded-full`}>{teamRecords.length}</span>
           </button>
           <button 
             onClick={() => setActiveTab('athletes')}
             className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === 'athletes' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
           >
             VĐV <span className={`${activeTab === 'athletes' ? 'bg-primary/10' : 'bg-black/5'} px-1.5 py-0.5 rounded-full`}>{athleteRecords.length}</span>
           </button>
        </div>

        <div className={`flex gap-3 w-full xl:w-auto ${isMobile ? 'flex-col' : 'flex-row items-center'}`}>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder={`Tìm kiếm ${activeTab === 'teams' ? 'đội' : 'vận động viên'}...`} className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="flex-1 sm:flex-none border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none">
              <option>Tất cả Giải đấu</option>
            </select>
          </div>
          
          <div className="hidden sm:flex bg-muted p-1 rounded-lg shrink-0 ml-auto xl:ml-0">
            <button className="p-1.5 bg-background shadow-sm rounded-md text-foreground"><LayoutGrid className="w-4 h-4" /></button>
            <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><List className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* RENDERING TAB CONTENT */}
      {activeTab === 'teams' ? (
        <div className="space-y-8">
          {pendingTeams.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Clock className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-xl font-black uppercase text-foreground">Đang chờ duyệt</h2>
                </div>
              </div>
              <div className={gridLayoutClass}>
                {pendingTeams.map((team) => <TeamMgmtCard key={team.id} team={team} onToggleFree={toggleFeeExempt} />)}
              </div>
            </div>
          )}

          {approvedTeams.length > 0 && (
            <div className="pt-8 border-t border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle2 className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-xl font-black uppercase text-foreground">Đội chính thức</h2>
                </div>
              </div>
              <div className={gridLayoutClass}>
                {approvedTeams.map((team) => <TeamMgmtCard key={team.id} team={team} onToggleFree={toggleFeeExempt} />)}
              </div>
            </div>
          )}

          {otherTeams.length > 0 && (
            <div className="pt-8 border-t border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><ShieldAlert className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-xl font-black uppercase text-foreground">Trạng thái khác</h2>
                </div>
              </div>
              <div className={gridLayoutClass}>
                {otherTeams.map((team) => <TeamMgmtCard key={team.id} team={team} onToggleFree={toggleFeeExempt} />)}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CONTENT TAB VẬN ĐỘNG VIÊN */
        <div className="mt-6">
           <AthleteMgmtTable records={athleteRecords} isMobile={isMobile} onToggleStatus={toggleAthleteStatus} />
        </div>
      )}

    </div>
  );
};
export default OrgTeamMgmtPage;