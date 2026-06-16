import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Eye, Check, X, ShieldAlert, User } from "lucide-react";
import type { OrgTeamRecord } from "@/types/orgTeamMgmt";
import { Button } from "@/components/ui/button";


interface Props {
  team: OrgTeamRecord;
  onToggleFree: (id: string) => void;
}

const TeamMgmtCard = ({ team, onToggleFree }: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside để đóng menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusStyle = () => {
    switch(team.status) {
      case 'Approved': return 'bg-green-50 text-green-600 border-green-200';
      case 'Pending': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-200';
      case 'Suspended': return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getTopBorderColor = () => {
    switch(team.status) {
      case 'Approved': return 'border-t-green-500';
      case 'Pending': return 'border-t-orange-400';
      case 'Rejected': return 'border-t-red-500';
      case 'Suspended': return 'border-t-gray-400';
    }
  };

  return (
    <div className={`bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col relative border-t-4 ${getTopBorderColor()}`}>
      
      {/* Nút 3 chấm & Dropdown (Yêu cầu của bạn) */}
      <div className="absolute top-3 right-3 z-10" ref={menuRef}>
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1 text-muted-foreground hover:bg-muted rounded-md transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-36 bg-card border border-border rounded-lg shadow-xl overflow-hidden py-1 text-sm z-20">
            <button 
              onClick={() => { onToggleFree(team.id); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2 hover:bg-muted text-foreground font-medium flex items-center gap-2"
            >
              {team.isFree ? 'Bỏ miễn phí' : 'Được miễn phí'}
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-muted text-foreground font-medium">Chỉnh sửa</button>
          </div>
        )}
      </div>

      <div className="p-5 flex-1">
        <div className="flex items-start gap-3 mb-4 pr-6">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-bold text-secondary-foreground shrink-0 border border-border">
            {team.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-foreground text-base leading-tight flex items-center gap-2">
              {team.name}
              {/* Nhãn Miễn phí nếu được bật */}
              {team.isFree && <span className="bg-indigo-100 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Free</span>}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{team.tournamentName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-4">
          <span className="bg-muted px-2 py-1 rounded-md text-primary">{team.sport}</span>
          <span className="bg-muted px-2 py-1 rounded-md flex items-center gap-1">
            <User className="w-3 h-3" /> {team.playersCount} VĐV
          </span>
        </div>

        {team.status === 'Pending' && (
          <p className="text-[10px] text-orange-600/80 font-medium mb-2 bg-orange-50 p-1.5 rounded-md">
            Đã nộp {team.submittedAt} • Đang chờ duyệt
          </p>
        )}

        {(team.status === 'Rejected' || team.status === 'Suspended') && (
          <p className="text-[10px] text-red-600/80 font-medium mb-2 bg-red-50 p-1.5 rounded-md flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> {team.issueText}
          </p>
        )}
      </div>

      <div className="bg-muted/30 border-t border-border p-3 flex justify-between items-center rounded-b-xl">
        <div className="flex -space-x-2">
          {team.avatars.map((av, i) => (
            <div key={i} className="w-7 h-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-[10px] font-bold text-primary">
              {av}
            </div>
          ))}
          <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground">
            +{team.playersCount - team.avatars.length}
          </div>
        </div>

        <div className="flex gap-2">
          {team.status === 'Pending' ? (
            <>
               <Button size="sm" variant="outline" className="h-7 text-xs border-green-200 text-green-600 hover:bg-green-50 px-2"><Check className="w-3 h-3 mr-1"/> Duyệt</Button>
               <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 px-2"><X className="w-3 h-3 mr-1"/> Từ chối</Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-primary hover:bg-primary/10 px-2">
              <Eye className="w-3 h-3 mr-1" /> Xem
            </Button>
          )}
        </div>
      </div>
      
      {/* Badge Trạng thái nhỏ góc trên bên phải (bên dưới nút 3 chấm) */}
      <div className="absolute top-3 left-3">
         <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${getStatusStyle()}`}>
            {team.status}
          </span>
      </div>
    </div>
  );
};
export default TeamMgmtCard;