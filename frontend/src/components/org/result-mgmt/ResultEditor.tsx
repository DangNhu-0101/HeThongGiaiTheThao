import { Clock, Info, CheckCircle2, Save, RefreshCw, AlertCircle, Play, Pause, Square } from "lucide-react";
import type { ResultMatchRecord } from "@/types/orgResultMgmt";
import { Button } from "@/components/ui/button";

interface Props {
  match: ResultMatchRecord;
  onUpdateScore: (matchId: string, team: 'teamA'|'teamB', delta: number) => void;
}

const ResultEditor = ({ match, onUpdateScore }: Props) => {
  return (
    // Bỏ h-full để cho phép nội dung tự do giãn nở theo chiều dọc (scroll) trên Mobile
    <div className="flex flex-col space-y-4 pb-8">
      
      {/* KHỐI TRÊN: CẬP NHẬT TỶ SỐ */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-4 md:p-6 flex flex-col items-center relative overflow-hidden shrink-0">
        
        {/* Info Header */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8 border-b border-border pb-4">
          <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground w-full sm:w-auto">
            <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">PB</div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm flex items-center flex-wrap gap-1">
                <span className="truncate">{match.tournamentName}</span> 
                <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] shrink-0">{match.round}</span>
              </p>
              <p className="mt-0.5 truncate">{match.time} • {match.venue} • TT: {match.referee}</p>
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
             {match.status === 'Live' ? (
               <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 border border-red-100 shrink-0">
                 <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span> Đang diễn ra
               </span>
             ) : (
               <span className="text-muted-foreground bg-muted px-2 py-1 rounded text-[10px] font-black uppercase border border-border shrink-0">Chờ cập nhật</span>
             )}
             <span className="text-primary font-bold text-sm flex items-center gap-1"><Clock className="w-3 h-3"/> {match.minute || "0'"}</span>
          </div>
        </div>

        {/* Score Board (Đã responsive size cho Mobile) */}
        <div className="flex justify-center items-center w-full gap-2 sm:gap-8 md:gap-16 mb-6 md:mb-8">
          {/* Team A */}
          <div className="flex flex-col items-center w-28 sm:w-32 md:w-48">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary flex items-center justify-center font-black text-secondary-foreground text-lg md:text-xl shadow-sm mb-2 md:mb-3 border border-border shrink-0">
              {match.teamA.logo}
            </div>
            <h3 className="font-bold text-xs md:text-sm text-center mb-3 md:mb-4 line-clamp-2 h-8">{match.teamA.name}</h3>
            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={() => onUpdateScore(match.id, 'teamA', -1)} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-600 flex items-center justify-center font-bold transition-colors shrink-0">-</button>
              <div className="w-14 h-16 md:w-20 md:h-24 bg-background border-2 border-border rounded-xl flex items-center justify-center text-4xl md:text-6xl font-black text-primary shadow-inner shrink-0">
                {match.teamA.score}
              </div>
              <button onClick={() => onUpdateScore(match.id, 'teamA', 1)} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white flex items-center justify-center font-bold transition-colors shrink-0">+</button>
            </div>
          </div>

          <div className="text-lg md:text-2xl font-black text-muted-foreground shrink-0">VS</div>

          {/* Team B */}
          <div className="flex flex-col items-center w-28 sm:w-32 md:w-48">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary flex items-center justify-center font-black text-secondary-foreground text-lg md:text-xl shadow-sm mb-2 md:mb-3 border border-border shrink-0">
              {match.teamB.logo}
            </div>
            <h3 className="font-bold text-xs md:text-sm text-center mb-3 md:mb-4 line-clamp-2 h-8">{match.teamB.name}</h3>
            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={() => onUpdateScore(match.id, 'teamB', -1)} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-600 flex items-center justify-center font-bold transition-colors shrink-0">-</button>
              <div className="w-14 h-16 md:w-20 md:h-24 bg-background border-2 border-border rounded-xl flex items-center justify-center text-4xl md:text-6xl font-black text-primary shadow-inner shrink-0">
                {match.teamB.score}
              </div>
              <button onClick={() => onUpdateScore(match.id, 'teamB', 1)} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white flex items-center justify-center font-bold transition-colors shrink-0">+</button>
            </div>
          </div>
        </div>

        {/* Trạng thái trận controls */}
        <div className="w-full border-t border-border pt-4 flex flex-wrap items-center justify-center md:justify-start gap-2">
          <span className="text-[10px] font-bold text-primary uppercase mr-2 hidden md:flex items-center gap-1"><Info className="w-3 h-3"/> Trạng thái:</span>
          <Button size="sm" variant="outline" className="h-8 text-xs bg-red-50 text-red-600 border-red-200 hover:bg-red-100 px-3 flex-1 sm:flex-none"><Play className="w-3 h-3 mr-1"/> Đang diễn ra</Button>
          <Button size="sm" variant="outline" className="h-8 text-xs bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 px-3 flex-1 sm:flex-none"><Pause className="w-3 h-3 mr-1"/> Tạm dừng</Button>
          <Button size="sm" variant="outline" className="h-8 text-xs bg-green-50 text-green-600 border-green-200 hover:bg-green-100 px-3 flex-1 sm:flex-none"><CheckCircle2 className="w-3 h-3 mr-1"/> Kết thúc</Button>
          <Button size="sm" variant="outline" className="h-8 text-xs text-muted-foreground px-3 flex-1 sm:flex-none"><Square className="w-3 h-3 mr-1"/> Hoãn trận</Button>
        </div>
      </div>

      {/* KHỐI DƯỚI: PANEL ĐỒNG BỘ BXH */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-4 md:p-6 shrink-0">
        <div className="flex items-start sm:items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded bg-green-100 text-green-600 flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5"/></div>
          <div>
            <h4 className="font-bold text-foreground text-sm">Xác nhận hoàn tất & đồng bộ BXH</h4>
            <p className="text-[10px] sm:text-xs text-primary mt-0.5">Sau khi xác nhận, kết quả sẽ được cập nhật vào BXH và thông báo đến các đội</p>
          </div>
        </div>

        {/* Checklist */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Tỷ số đã nhập</span>
          <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Không có cảnh cáo</span>
          <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Ghi chú chưa lưu</span>
          <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> TT xác nhận</span>
        </div>

        {/* Impact Panel */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
          <span className="text-[10px] sm:text-xs font-bold text-primary flex items-center gap-1 w-full sm:w-auto mb-1 sm:mb-0"><RefreshCw className="w-3 h-3"/> Tác động BXH:</span>
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] sm:text-xs font-semibold truncate max-w-full">⚙ {match.teamA.name} +3 điểm</span>
          <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-[10px] sm:text-xs font-semibold truncate max-w-full">⚙ {match.teamB.name} +0 điểm</span>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] sm:text-xs font-semibold truncate max-w-full">↑ {match.teamA.name} lên #1</span>
        </div>

        {/* Action Buttons (Đã sửa layout cho Mobile: Nút Xác nhận sẽ chiếm full chiều ngang) */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 sm:flex-none text-xs sm:text-sm font-semibold h-10"><Save className="w-4 h-4 mr-1 sm:mr-2"/> Lưu nháp</Button>
            <Button variant="outline" className="flex-1 sm:flex-none text-xs sm:text-sm font-semibold h-10 text-muted-foreground"><RefreshCw className="w-4 h-4 mr-1 sm:mr-2"/> Đặt lại</Button>
          </div>
          <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold h-10 px-4 sm:px-6 shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 mr-2 shrink-0"/> Xác nhận & Đồng bộ BXH
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ResultEditor;