import { useEffect } from "react";
import { Activity, Search, Plus, Filter, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SportDetailArea from "@/components/admin/sports-config/SportDetailArea";
import SportsCharts from "@/components/admin/sports-config/SportsCharts";
import { useAdminSportsConfigStore } from "@/stores/useAdminSportsConfigStore";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminSportsConfigPage = () => {
  const isMobile = useIsMobile();
  const { stats, sports, usageData, formatData, selectedSportId, loading, fetchData, setSelectedSportId } = useAdminSportsConfigStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tự động chọn môn đầu tiên trên Desktop
  useEffect(() => {
    if (!isMobile && sports.length > 0 && !selectedSportId) {
      setSelectedSportId(sports[0].id);
    }
  }, [isMobile, sports, selectedSportId, setSelectedSportId]);

  if (loading || sports.length === 0) return <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">Đang tải cấu hình môn thi...</div>;

  const selectedSport = sports.find(s => s.id === selectedSportId);

  const renderStats = () => (
    <div className="flex gap-4 overflow-x-auto beautiful-scrollbar pb-2 shrink-0 mb-6">
      {stats.map((stat) => (
        <div key={stat.id} className="bg-card p-4 rounded-xl border border-border flex flex-col justify-center min-w-[160px] flex-1 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}><Activity className="w-4 h-4" /></div>
            <span className={`text-[10px] font-bold ${stat.iconType === 'pending' ? 'text-orange-500' : 'text-green-500'}`}>{stat.trend}</span>
          </div>
          <h3 className="text-2xl font-black text-foreground">{stat.value}</h3>
          <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">{stat.label}</p>
        </div>
      ))}
    </div>
  );

  const renderSportList = () => (
    <div className="flex flex-col bg-card border border-border rounded-xl shadow-sm h-full overflow-hidden">
      <div className="p-4 border-b border-border space-y-4 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Tìm kiếm môn thi..." className="w-full pl-9 pr-9 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-amber-500" />
          <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer" />
        </div>
        <div className="flex gap-2 overflow-x-auto beautiful-scrollbar pb-1">
          <button className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1.5 rounded-full shrink-0">Tất cả</button>
          <button className="bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold px-3 py-1.5 rounded-full shrink-0">Hoạt động</button>
          <button className="bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold px-3 py-1.5 rounded-full shrink-0">Bản nháp</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto beautiful-scrollbar p-2 space-y-1">
        {sports.map(s => (
          <div key={s.id} onClick={() => setSelectedSportId(s.id)} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedSportId === s.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted border border-transparent'}`}>
            <div className="w-10 h-10 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center text-lg shrink-0 shadow-sm border border-border">{s.icon}</div>
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold text-sm truncate ${selectedSportId === s.id ? 'text-primary' : 'text-foreground'}`}>{s.name} <span className={`text-[8px] px-1.5 py-0.5 rounded ml-1 uppercase ${s.status === 'Hoạt động' ? 'text-green-600 bg-green-100' : 'text-orange-600 bg-orange-100'}`}>● {s.status}</span></h4>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{s.formatsCount} thể thức • {s.tournamentsCount} giải</p>
            </div>
          </div>
        ))}
        <button className="w-full mt-2 py-3 border-2 border-dashed border-border rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
           <Plus className="w-4 h-4"/> Thêm môn mới
        </button>
      </div>
    </div>
  );

  // KỊCH BẢN MOBILE
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen -m-4 md:-m-8 p-4 bg-muted/10 pb-20">
        {!selectedSport ? (
          <div className="space-y-6">
             <div className="space-y-4 shrink-0">
               <h1 className="text-xl font-black uppercase text-foreground">Cấu hình Môn thi đấu</h1>
               {renderStats()}
             </div>
             {/* Box danh sách môn cao 500px để cuộn mượt mà */}
             <div className="h-[500px]">
               {renderSportList()}
             </div>
             <SportsCharts usageData={usageData} formatData={formatData} />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <Button variant="ghost" className="self-start mb-4 text-muted-foreground pl-0" onClick={() => setSelectedSportId(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
            </Button>
            <SportDetailArea sport={selectedSport} />
          </div>
        )}
      </div>
    );
  }

  // KỊCH BẢN DESKTOP
  return (
    <div className="max-w-[1600px] mx-auto space-y-6 flex flex-col pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-header text-white p-6 rounded-2xl shadow-lg relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[10px] text-white/70 font-bold uppercase mb-2">
            <span>Quản trị Hệ thống</span> <span className="text-amber-500">&gt;</span> <span>Cấu hình môn thi</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-1">Cấu hình Môn thi đấu</h1>
          <p className="text-sm text-white/70">Quản lý các môn thể thao, mẫu thể thức, luật tính điểm và template giải đấu.</p>
        </div>
        <div className="flex gap-3 relative z-10 w-full md:w-auto">
          <Button variant="outline" className="border-white/20 text-foreground bg-white hover:bg-white/90">
            Import Cấu hình
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white border-none">
            <Plus className="w-4 h-4 mr-2" /> Thêm Môn mới
          </Button>
        </div>
      </div>

      {renderStats()}

      {/* Main Workspace: Khóa cứng Flexbox */}
      <div className="flex flex-col lg:flex-row gap-6 h-[700px] overflow-hidden">
        
        {/* Left List: Cố định độ rộng 320px */}
        <div className="flex-none w-[320px] h-full">
          {renderSportList()}
        </div>
        
        {/* Right Detail: Tự động lấp đầy phần còn lại */}
        <div className="flex-1 min-w-0 h-full">
          {selectedSport ? (
            <SportDetailArea sport={selectedSport} />
          ) : (
            <div className="h-full bg-card border-2 border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground text-sm font-medium">
              Vui lòng chọn một môn thể thao bên trái để xem chi tiết.
            </div>
          )}
        </div>

      </div>

      <SportsCharts usageData={usageData} formatData={formatData} />

    </div>
  );
};

export default AdminSportsConfigPage;