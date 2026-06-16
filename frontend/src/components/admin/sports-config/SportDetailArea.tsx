import { Copy, Edit, Save, Plus } from "lucide-react";
import type { SportRecord } from "@/types/adminSportsConfig";
import { Button } from "@/components/ui/button";
import CreateFormatModal from "./CreateFormatModal";

const SportDetailArea = ({ sport }: { sport: SportRecord }) => {
  return (
    <div className="flex flex-col h-full bg-background rounded-xl">
      
      {/* Banner thông tin môn thi */}
      <div className="bg-blue-600 text-white p-6 rounded-xl shadow-md mb-6 shrink-0 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 text-9xl -translate-y-4 translate-x-4 pointer-events-none">{sport.icon}</div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-white/30">{sport.icon}</div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black uppercase tracking-wide">{sport.name}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${sport.status === 'Hoạt động' ? 'bg-green-500/20 text-green-300 border border-green-400/50' : 'bg-white/20 text-white border border-white/30'}`}>{sport.status}</span>
              </div>
              <p className="text-xs text-white/70 mt-1">ID: {sport.id.toUpperCase()} • Cập nhật: 3 ngày trước</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button size="sm" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 flex-1 sm:flex-none"><Copy className="w-3.5 h-3.5 mr-1.5"/> Nhân bản</Button>
            <Button size="sm" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 flex-1 sm:flex-none"><Edit className="w-3.5 h-3.5 mr-1.5"/> Sửa môn</Button>
            <Button size="sm" className="bg-white text-blue-700 hover:bg-white/90 flex-1 sm:flex-none font-bold"><Save className="w-3.5 h-3.5 mr-1.5"/> Lưu</Button>
          </div>
        </div>

        {/* Khối thống kê nhỏ bên trong Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          <div className="bg-black/10 border border-white/10 rounded-lg p-3"><p className="text-[10px] text-white/70 font-bold uppercase mb-1">Mẫu thể thức</p><p className="text-xl font-black">{sport.formatsCount}</p></div>
          <div className="bg-black/10 border border-white/10 rounded-lg p-3"><p className="text-[10px] text-white/70 font-bold uppercase mb-1">Luật tính điểm</p><p className="text-xl font-black">{sport.rulesCount}</p></div>
          <div className="bg-black/10 border border-white/10 rounded-lg p-3"><p className="text-[10px] text-white/70 font-bold uppercase mb-1">Giải đấu</p><p className="text-xl font-black">{sport.tournamentsCount}</p></div>
          <div className="bg-black/10 border border-white/10 rounded-lg p-3"><p className="text-[10px] text-white/70 font-bold uppercase mb-1">Tổ chức</p><p className="text-xl font-black">{sport.orgsCount}</p></div>
        </div>
      </div>

      {/* Điều hướng Tabs */}
      <div className="flex gap-2 border-b border-border mb-6 overflow-x-auto beautiful-scrollbar pb-1">
        <button className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-t-lg shrink-0">Thể thức thi đấu</button>
        <button className="text-muted-foreground hover:bg-muted text-xs font-bold px-4 py-2 rounded-t-lg shrink-0 transition-colors">Luật tính điểm</button>
        <button className="text-muted-foreground hover:bg-muted text-xs font-bold px-4 py-2 rounded-t-lg shrink-0 transition-colors">Cài đặt chung</button>
        <button className="text-muted-foreground hover:bg-muted text-xs font-bold px-4 py-2 rounded-t-lg shrink-0 transition-colors">Templates mẫu</button>
      </div>

      {/* Danh sách thẻ Thể thức thi đấu */}
      <div className="flex justify-between items-end mb-4 shrink-0">
        <div>
           <h3 className="text-sm font-black text-foreground uppercase">Mẫu Thể thức thi đấu</h3>
           <p className="text-xs text-muted-foreground mt-0.5">Xác định cấu trúc và cách vận hành giải đấu cho môn này</p>
        </div>
            <CreateFormatModal sportName={sport.name} onSuccess={() => {
                // Load lại data nếu cần
            }}>
                <Button size="sm" variant="outline" className="text-primary border-primary/30 hover:bg-primary/5 h-8 text-xs shrink-0">
                <Plus className="w-3.5 h-3.5 mr-1"/> Thêm thể thức
                </Button>
            </CreateFormatModal>      
            </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto beautiful-scrollbar pb-4 pr-2">
        {sport.formats?.map(format => (
          <div key={format.id} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    {format.name} {format.isDefault && <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded uppercase">Mặc định</span>}
                  </h4>
                  <p className="text-[10px] text-muted-foreground">{format.type}</p>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"><Edit className="w-3.5 h-3.5"/></button>
            </div>

            <div className="space-y-2 text-xs mb-4 flex-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Số đội tối thiểu</span><span className="font-bold">{format.minTeams}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Số đội tối đa</span><span className="font-bold">{format.maxTeams}</span></div>
              <div className="bg-muted/50 p-2 rounded border border-border/50 text-[10px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                 {format.description}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-border mt-auto">
              <span className="text-[10px] text-muted-foreground">Dùng trong {Math.floor(Math.random() * 30)} giải đấu</span>
              <div className="w-8 h-4 bg-primary/20 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-primary rounded-full absolute right-0"></div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default SportDetailArea;