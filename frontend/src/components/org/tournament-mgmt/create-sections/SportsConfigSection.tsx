import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trophy, Check } from "lucide-react";
import { cn } from "@/libs/utils";

export interface SportItemConfig {
  selected: boolean; feePerAthlete: string | number; maxTeams: string | number; categories: string[];
}
export type SportsConfigData = Record<string, SportItemConfig>;

interface Props {
  sportsConfig: SportsConfigData;
  SPORTS_LIST: string[];
  CATEGORIES_LIST: { id: string; label: string; }[];
  toggleSport: (sport: string) => void;
  handleSportFieldChange: (sport: string, field: string, val: string) => void;
  toggleCategory: (sport: string, catId: string) => void;
}

const SportsConfigSection = ({ sportsConfig, SPORTS_LIST, CATEGORIES_LIST, toggleSport, handleSportFieldChange, toggleCategory }: Props) => {
  return (
    <div className="border border-border rounded-xl p-6 bg-card shadow-sm space-y-5">
      <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 mb-4">
        <span className="w-1.5 h-5 bg-primary rounded-full"></span> Môn thi đấu & Nội dung
      </h3>
      <div className="flex flex-wrap gap-2.5 mb-6">
        {SPORTS_LIST.map((s) => {
          const isSelected = sportsConfig[s]?.selected;
          return (
            <button key={s} type="button" onClick={() => toggleSport(s)} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all duration-200 outline-none", isSelected ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-background text-muted-foreground hover:border-primary/50")}>
              {isSelected ? <Check className="w-4 h-4" /> : <Trophy className="w-4 h-4 opacity-50" />} {s}
            </button>
          );
        })}
      </div>
      <div className="space-y-4">
        {SPORTS_LIST.filter(s => sportsConfig[s]?.selected).map(s => (
          <div key={s} className="border border-primary/20 bg-muted/20 rounded-xl p-5 animate-in fade-in zoom-in-95">
            <div className="font-extrabold text-primary mb-4 text-sm uppercase flex items-center gap-2"><Trophy className="w-4 h-4" /> MÔN {s}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Lệ phí / 1 VĐV (VNĐ)</Label><Input type="number" placeholder="VD: 500000" value={sportsConfig[s].feePerAthlete} onChange={e => handleSportFieldChange(s, 'feePerAthlete', e.target.value)} className="bg-background"/></div>
              <div className="space-y-2"><Label>Giới hạn số đội (KGH = để trống)</Label><Input type="number" placeholder="VD: 32" value={sportsConfig[s].maxTeams} onChange={e => handleSportFieldChange(s, 'maxTeams', e.target.value)} className="bg-background"/></div>
            </div>
            <div className="mt-5 space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">Nội dung tổ chức:</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES_LIST.map(cat => {
                  const isSel = sportsConfig[s].categories.includes(cat.id);
                  return (
                    <button type="button" key={cat.id} onClick={() => toggleCategory(s, cat.id)} className={cn("px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors", isSel ? "bg-primary border-primary text-primary-foreground" : "bg-background text-muted-foreground hover:border-primary/40")}>
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default SportsConfigSection;