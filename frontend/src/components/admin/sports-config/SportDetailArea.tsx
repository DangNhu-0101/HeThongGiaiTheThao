import { Copy, Edit, Plus, Save, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SportRecord } from "@/types/adminSportsConfig";
import { useAdminSportsConfigStore } from "@/stores/useAdminSportsConfigStore";
import CreateFormatModal from "./CreateFormatModal";

const SportDetailArea = ({ sport }: { sport: SportRecord }) => {
  const fetchData = useAdminSportsConfigStore((state) => state.fetchData);

  return (
    <div className="flex flex-col h-full bg-background rounded-xl">
      <div className="bg-blue-600 text-white p-6 rounded-xl shadow-md mb-6 shrink-0 relative overflow-hidden">
        <Trophy className="pointer-events-none absolute right-0 top-0 h-32 w-32 -translate-y-4 translate-x-4 text-white/10" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-white/30">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black uppercase tracking-wide">{sport.name}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase bg-green-500/20 text-green-300 border border-green-400/50">{sport.status}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button size="sm" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 flex-1 sm:flex-none"><Copy className="w-3.5 h-3.5 mr-1.5" /> Nhan ban</Button>
            <Button size="sm" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 flex-1 sm:flex-none"><Edit className="w-3.5 h-3.5 mr-1.5" /> Sua mon</Button>
            <Button size="sm" className="bg-white text-blue-700 hover:bg-white/90 flex-1 sm:flex-none font-bold"><Save className="w-3.5 h-3.5 mr-1.5" /> Lưu</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          <div className="bg-black/10 border border-white/10 rounded-lg p-3"><p className="text-[10px] text-white/70 font-bold uppercase mb-1">Mau thể thức</p><p className="text-xl font-black">{sport.formatsCount}</p></div>
          <div className="bg-black/10 border border-white/10 rounded-lg p-3"><p className="text-[10px] text-white/70 font-bold uppercase mb-1">Luat tinh điểm</p><p className="text-xl font-black">{sport.rulesCount}</p></div>
          <div className="bg-black/10 border border-white/10 rounded-lg p-3"><p className="text-[10px] text-white/70 font-bold uppercase mb-1">Giải đấu</p><p className="text-xl font-black">{sport.tournamentsCount}</p></div>
          <div className="bg-black/10 border border-white/10 rounded-lg p-3"><p className="text-[10px] text-white/70 font-bold uppercase mb-1">Tổ chức</p><p className="text-xl font-black">{sport.orgsCount}</p></div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border mb-6 overflow-x-auto beautiful-scrollbar pb-1">
        <button className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-t-lg shrink-0">Thể thức thi dau</button>
        <button className="text-muted-foreground hover:bg-muted text-xs font-bold px-4 py-2 rounded-t-lg shrink-0 transition-colors">Luat tinh điểm</button>
        <button className="text-muted-foreground hover:bg-muted text-xs font-bold px-4 py-2 rounded-t-lg shrink-0 transition-colors">Cai dat chung</button>
        <button className="text-muted-foreground hover:bg-muted text-xs font-bold px-4 py-2 rounded-t-lg shrink-0 transition-colors">Templates mau</button>
      </div>

      <div className="flex justify-between items-end mb-4 shrink-0">
        <div>
          <h3 className="text-sm font-black text-foreground uppercase">Mau thể thức thi dau</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Quan ly cau truc va cach van hanh giải đấu cho mon nay.</p>
        </div>
        <CreateFormatModal sportName={sport.name} onSuccess={fetchData}>
          <Button size="sm" variant="outline" className="text-primary border-primary/30 hover:bg-primary/5 h-8 text-xs shrink-0">
            <Plus className="w-3.5 h-3.5 mr-1" /> Them thể thức
          </Button>
        </CreateFormatModal>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto beautiful-scrollbar pb-4 pr-2">
        {sport.formats?.map((format) => (
          <div key={format.id} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  {format.name} {format.isDefault && <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded uppercase">Mac dinh</span>}
                </h4>
                <p className="text-[10px] text-muted-foreground">{format.type}</p>
              </div>
              <button className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"><Edit className="w-3.5 h-3.5" /></button>
            </div>
            <div className="space-y-2 text-xs mb-4 flex-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Sơ đồi toi thieu</span><span className="font-bold">{format.minTeams}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sơ đồi toi da</span><span className="font-bold">{format.maxTeams}</span></div>
              <div className="bg-muted/50 p-2 rounded border border-border/50 text-[10px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{format.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SportDetailArea;
