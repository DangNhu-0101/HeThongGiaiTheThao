import { useState } from 'react';
import type { IStage } from '@/types/rules';

interface Props { stage: IStage; onUpdate: (id: string, f: keyof IStage, v: IStage[keyof IStage]) => void; }

export const MatchPanel = ({ stage, onUpdate }: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      <div className={`flex items-center justify-between px-4 py-3 bg-muted/50 cursor-pointer border-b hover:bg-muted ${open ? 'border-border' : 'border-transparent'}`} onClick={() => setOpen(!open)}>
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">Bộ luật thi đấu trận</span>
        <span className="text-xs text-muted-foreground font-bold">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-muted-foreground uppercase">Loại trận</label><select className="p-2 border border-border rounded-lg text-xs bg-background" value={stage.matchFormat} onChange={e => onUpdate(stage.id, 'matchFormat', e.target.value)}><option value="1_SET">1 Set</option><option value="BO3">BO3</option></select></div>
          <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-muted-foreground uppercase">Điểm chạm</label><input type="number" className="p-2 border border-border rounded-lg text-xs bg-background" value={stage.touchPoint} onChange={e => onUpdate(stage.id, 'touchPoint', Number(e.target.value))} /></div>
          <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-muted-foreground uppercase">Cách biệt</label><input type="number" className="p-2 border border-border rounded-lg text-xs bg-background" value={stage.winByGap} onChange={e => onUpdate(stage.id, 'winByGap', Number(e.target.value))} /></div>
          <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-muted-foreground uppercase">Giới hạn điểm</label><input type="number" className="p-2 border border-border rounded-lg text-xs bg-background" value={stage.maxPoints || ''} placeholder="KGH" onChange={e => onUpdate(stage.id, 'maxPoints', Number(e.target.value))} /></div>
          <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-muted-foreground uppercase">Đổi sân tại</label><input type="number" className="p-2 border border-border rounded-lg text-xs bg-background" value={stage.changeSideAt} onChange={e => onUpdate(stage.id, 'changeSideAt', Number(e.target.value))} /></div>
        </div>
      )}
    </div>
  );
};
