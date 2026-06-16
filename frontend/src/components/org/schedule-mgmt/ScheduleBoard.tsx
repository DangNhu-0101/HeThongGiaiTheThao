import { AlertTriangle, Clock } from "lucide-react";
import type { ScheduleMatchRecord, VenueColumn } from "@/types/orgScheduleMgmt";

interface Props {
  venues: VenueColumn[];
  matches: ScheduleMatchRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ScheduleBoard = ({ venues, matches, selectedId, onSelect }: Props) => {
  return (
    <div className="flex gap-4 overflow-x-auto beautiful-scrollbar pb-4 min-h-[500px]">
      {venues.map(venue => {
        const venueMatches = matches.filter(m => m.venue === venue.id && m.status !== 'Unscheduled');
        return (
          <div key={venue.id} className="min-w-[280px] w-[280px] flex-shrink-0 flex flex-col bg-muted/20 rounded-xl border border-border/50 p-2">
            
            {/* Cột Header (Tên Sân) */}
            <div className={`p-3 rounded-lg mb-3 flex justify-between items-center border ${venue.isConflict ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
               <h3 className={`font-bold text-sm ${venue.isConflict ? 'text-red-700' : 'text-green-700'} flex items-center gap-2`}>
                 <span className={`w-2 h-2 rounded-full ${venue.isConflict ? 'bg-red-500' : 'bg-green-500'}`}></span>
                 {venue.name}
               </h3>
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${venue.isConflict ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                 {venue.statusText}
               </span>
            </div>

            {/* Danh sách thẻ trận */}
            <div className="flex-1 space-y-3 overflow-y-auto beautiful-scrollbar px-1">
               {venueMatches.map(match => (
                 <div 
                   key={match.id} 
                   onClick={() => onSelect(match.id)}
                   className={`bg-card rounded-xl p-3 border shadow-sm cursor-pointer transition-all hover:shadow-md ${match.status === 'Conflict' ? 'border-red-300 bg-red-50/30' : selectedId === match.id ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                 >
                   <div className="flex justify-between items-start mb-2">
                     <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">{match.code}</span>
                     {match.status === 'Conflict' && <span className="bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {match.conflictReason}</span>}
                   </div>
                   <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
                     <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[8px] text-secondary-foreground">{match.teamA.logo}</span>
                     <span className="truncate max-w-[80px]">{match.teamA.name}</span>
                     <span className="text-[10px] text-muted-foreground">vs</span>
                     <span className="truncate max-w-[80px]">{match.teamB.name}</span>
                   </div>
                   <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground mt-3">
                     <span className="bg-accent/10 text-accent-foreground px-1.5 py-0.5 rounded flex items-center gap-1"><Clock className="w-3 h-3"/> {match.time?.split(' - ')[0]}</span>
                     <span className="bg-muted px-1.5 py-0.5 rounded truncate max-w-[90px]">TT: {match.referee}</span>
                   </div>
                 </div>
               ))}
               <button className="w-full py-3 border-2 border-dashed border-border rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-2">
                 + Thêm trận
               </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default ScheduleBoard;