import { useEffect } from "react";
import { Search, Send, AlertTriangle, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScheduleStats from "@/components/org/schedule-mgmt/ScheduleStats";
import ResourceCapacity from "@/components/org/schedule-mgmt/ResourceCapacity";
import AssignmentEditor from "@/components/org/schedule-mgmt/AssignmentEditor";
import ScheduleBoard from "@/components/org/schedule-mgmt/ScheduleBoard";
import { useOrgScheduleMgmtStore } from "@/stores/useOrgScheduleMgmtStore";
import { useIsMobile } from "@/hooks/use-mobile";

const OrgScheduleMgmtPage = () => {
  const isMobile = useIsMobile();
  const { stats, capacity, venues, matches, selectedMatchId, loading, fetchData, setSelectedMatchId, updateMatchAssignment } = useOrgScheduleMgmtStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || matches.length === 0) {
    return <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu xếp lịch...</div>;
  }

  const unscheduled = matches.filter(m => m.status === 'Unscheduled');
  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  // Gói danh sách trận chưa xếp vào một biến để dùng chung cho cả Mobile và Desktop
  const renderUnscheduled = () => {
    if (unscheduled.length === 0) return null;
    return (
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded bg-orange-100 text-orange-600 flex items-center justify-center"><Clock className="w-3.5 h-3.5" /></div>
          <h4 className="font-bold text-sm text-foreground">Trận chưa xếp lịch</h4>
          <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{unscheduled.length} trận</span>
        </div>
        <div className="flex gap-3 overflow-x-auto beautiful-scrollbar pb-2">
          {unscheduled.map(m => (
            <div key={m.id} onClick={() => setSelectedMatchId(m.id)} className={`flex items-center gap-2 px-3 py-2 border rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-colors ${selectedMatchId === m.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'}`}>
              <span className="w-4 h-4 rounded-full bg-background flex items-center justify-center shadow-sm text-[8px]">{m.teamA.logo}</span>
              {m.code}: {m.teamA.name} vs {m.teamB.name}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // KỊCH BẢN MOBILE: Thả trôi cuộn tự nhiên (min-h-screen)
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen -m-4 md:-m-8 p-4 bg-muted/10 pb-20">
        {!selectedMatch ? (
          <div className="space-y-6">
             <div className="space-y-4 shrink-0">
               <h1 className="text-xl font-black uppercase text-foreground">Lịch thi đấu & Phân công</h1>
               <ScheduleStats stats={stats} />
             </div>
             
             {/* ĐÃ FIX: Hiển thị trận chưa xếp lịch trên Mobile */}
             {renderUnscheduled()}

             {/* Cố định chiều cao 600px cho bảng để nội dung bên trong tự cuộn */}
             <div className="bg-background rounded-xl h-[600px] overflow-hidden border border-border shadow-sm">
                <ScheduleBoard venues={venues} matches={matches} selectedId={selectedMatchId} onSelect={setSelectedMatchId} />
             </div>

             {capacity && <ResourceCapacity data={capacity} />}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <Button variant="ghost" className="self-start mb-4 text-muted-foreground pl-0" onClick={() => setSelectedMatchId(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
            </Button>
            <AssignmentEditor match={selectedMatch} venues={venues} onSave={updateMatchAssignment} />
          </div>
        )}
      </div>
    );
  }

  // KỊCH BẢN DESKTOP
  return (
    // ĐÃ FIX: Xóa h-[calc...] để tránh bị ép xẹp layout, cho phép trang tự cuộn (pb-12 để cách đáy)
    <div className="max-w-[1600px] mx-auto space-y-6 flex flex-col pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-header text-white p-6 rounded-2xl shadow-lg relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[10px] text-white/70 font-bold uppercase mb-2">
            <span>Cổng Tổ Chức</span> <span className="text-accent">&gt;</span> <span>Quản lý Trận đấu</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-1">Lịch thi đấu & Phân công</h1>
          <p className="text-sm text-white/70">Sắp xếp lịch, phân công sân và trọng tài • <span className="text-red-400 font-bold">3 xung đột cần xử lý</span></p>
        </div>
        <div className="flex gap-3 relative z-10 w-full md:w-auto mt-4 md:mt-0">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Tìm kiếm nhanh..." className="w-full pl-9 pr-4 py-2 text-sm border border-white/20 rounded-lg bg-white/10 text-white placeholder:text-white/50 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all" />
          </div>
        </div>
      </div>

      {/* Banner & Stats */}
      <div className="shrink-0 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
           <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600"><AlertTriangle className="w-4 h-4" /></div>
           <p className="text-xs text-amber-800 font-bold">Mùa giải hè 2026 đang diễn ra <span className="font-medium text-amber-700 ml-2">— Cúp Hà Nội 2026 • Ngày thi đấu 06/10/2026 • Còn 14 ngày đến khai mạc</span></p>
        </div>
        <ScheduleStats stats={stats} />
        
        {/* Cảnh báo đỏ */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex justify-between items-center shadow-sm">
           <p className="text-xs text-red-600 font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> 3 xung đột thời gian được phát hiện <span className="font-medium text-red-500 hidden md:inline">— Trọng tài Nguyễn Văn A bị trùng lịch tại 2 trận (14:00), Sân 2 bị đặt chồng</span></p>
           <Button size="sm" variant="outline" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200 h-8 text-xs">Xử lý ngay</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border p-3 rounded-xl shadow-sm flex flex-wrap gap-3 shrink-0">
        <select className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none flex-1 min-w-[150px]"><option>Cúp Hà Nội 2026</option></select>
        <select className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none flex-1 min-w-[150px]"><option>Tất cả vòng</option></select>
        <select className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none flex-1 min-w-[150px]"><option>Tất cả sân</option></select>
        <input type="date" defaultValue="2026-10-06" className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none flex-1 min-w-[150px]" />
        
        <div className="flex gap-2 ml-auto">
          <Button className="bg-primary hover:bg-primary-hover text-white text-sm"><Send className="w-4 h-4 mr-2"/> Công bố lịch</Button>
        </div>
      </div>

      {/* Danh sách trận chờ xếp (Pills) */}
      {renderUnscheduled()}

      {/* MAIN WORKSPACE: Ép chiều cao cố định h-[750px] để Bảng không bao giờ bị xẹp */}
      <div className="flex flex-col lg:flex-row gap-6 h-[750px]">
        
        {/* VÙNG BÊN TRÁI: Bảng lịch thi đấu */}
        <div className="flex-1 min-w-0 h-full overflow-hidden bg-background rounded-xl border border-border shadow-sm">
          <ScheduleBoard venues={venues} matches={matches} selectedId={selectedMatchId} onSelect={setSelectedMatchId} />
        </div>
        
        {/* VÙNG BÊN PHẢI: Khóa cứng bằng flex-none và w-[320px] */}
        <div className="flex-none w-full lg:w-[320px] h-full flex flex-col gap-6 overflow-y-auto beautiful-scrollbar lg:pr-2 pb-6">
          {capacity && <ResourceCapacity data={capacity} />}
          
          {selectedMatch ? (
             <AssignmentEditor match={selectedMatch} venues={venues} onSave={updateMatchAssignment} />
          ) : (
             <div className="bg-card border-2 border-dashed border-border rounded-xl p-6 text-center text-muted-foreground text-sm font-medium shrink-0">
               Chọn một trận đấu để xếp lịch hoặc điều chỉnh phân công.
             </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default OrgScheduleMgmtPage;