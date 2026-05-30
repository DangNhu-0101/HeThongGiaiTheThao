// src/components/tournament/rules-form/MatchPanel.tsx
import React, { useState } from 'react';
import type { IStage } from '@/types/rules';

interface MatchPanelProps {
  stage: IStage;
  onUpdate: (stageId: string, field: keyof IStage, value: unknown) => void;
}

export const MatchPanel: React.FC<MatchPanelProps> = ({ stage, onUpdate }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-xs">
      <div className={`flex items-center justify-between px-4 py-3 bg-slate-50/50 cursor-pointer select-none border-b transition-colors hover:bg-slate-50 ${open ? 'border-slate-200' : 'border-transparent'}`} onClick={() => setOpen(o => !o)}>
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">⚙️ Luật thi đấu trận</span>
        <span className="text-xs text-slate-400 font-bold">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 animate-in fade-in duration-150">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Loại trận</label>
            <select className="p-2 border rounded-lg text-xs bg-white outline-none focus:border-sky-500" value={stage.matchFormat} onChange={e => onUpdate(stage.id, 'matchFormat', e.target.value)}>
              <option value="1_SET">1 Set</option>
              <option value="BO3">BO3</option>
              <option value="BO5">BO5</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Điểm chạm</label>
            <input type="number" className="p-2 border rounded-lg text-xs outline-none focus:border-sky-500" value={stage.touchPoint} onChange={e => onUpdate(stage.id, 'touchPoint', parseInt(e.target.value) || 0)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cách biệt</label>
            <input type="number" className="p-2 border rounded-lg text-xs outline-none focus:border-sky-500" value={stage.winByGap} onChange={e => onUpdate(stage.id, 'winByGap', parseInt(e.target.value) || 0)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Giới hạn điểm</label>
            <input type="number" className="p-2 border rounded-lg text-xs outline-none focus:border-sky-500" value={stage.maxPoints || ''} placeholder="Không giới hạn" onChange={e => onUpdate(stage.id, 'maxPoints', e.target.value ? parseInt(e.target.value) : null)} />
          </div>
          <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Đổi sân tại</label>
            <input type="number" className="p-2 border rounded-lg text-xs outline-none focus:border-sky-500" value={stage.changeSideAt} onChange={e => onUpdate(stage.id, 'changeSideAt', parseInt(e.target.value) || 0)} />
          </div>
        </div>
      )}
    </div>
  );
};