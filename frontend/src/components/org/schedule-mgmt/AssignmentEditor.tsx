import { Calendar as CalIcon, Clock, MapPin, User, Save, RotateCcw, Edit, CheckCircle2 } from "lucide-react";
import type { ScheduleMatchRecord, VenueColumn } from "@/types/orgScheduleMgmt";
import { Button } from "@/components/ui/button";

interface Props {
  match: ScheduleMatchRecord;
  venues: VenueColumn[];
  onSave: (id: string, updates: Partial<ScheduleMatchRecord>) => void;
}

const AssignmentEditor = ({ match, venues, onSave }: Props) => {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-4 shrink-0">
      <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Edit className="w-4 h-4 text-primary" /> Chi tiết trận đấu</h3>
        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase">{match.code}</span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-center flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{match.teamA.name}</p>
          <p className="text-[10px] text-muted-foreground">Đội A</p>
        </div>
        <div className="text-xs font-black text-muted-foreground px-2 shrink-0">VS</div>
        <div className="text-center flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{match.teamB.name}</p>
          <p className="text-[10px] text-muted-foreground">Đội B</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Ngày & Giờ</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <CalIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" defaultValue={match.date || "06/10/2026"} className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-background focus:outline-none focus:border-primary" />
            </div>
            <div className="relative flex-1">
              <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" defaultValue={match.time || "08:00"} className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-background focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Sân thi đấu</label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select 
              defaultValue={match.venue || ""} 
              className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-background focus:outline-none focus:border-primary appearance-none cursor-pointer"
            >
              <option value="">Chọn sân...</option>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1 font-medium"><CheckCircle2 className="w-3 h-3" /> Sân trống trong khung giờ này</p>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Trọng tài chính</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-background focus:outline-none focus:border-primary appearance-none cursor-pointer">
              <option>Nguyễn Văn A</option>
              <option>Trần B</option>
            </select>
          </div>
          <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1 font-medium"><CheckCircle2 className="w-3 h-3" /> Trọng tài rảnh lịch</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => onSave(match.id, { status: 'Scheduled' })} className="flex-1 bg-primary hover:bg-primary-hover text-white text-xs h-9 shadow-md">
          <Save className="w-3.5 h-3.5 mr-1.5" /> Lưu phân công
        </Button>
        <Button variant="outline" className="w-9 h-9 p-0 border-border text-muted-foreground hover:text-foreground">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AssignmentEditor;