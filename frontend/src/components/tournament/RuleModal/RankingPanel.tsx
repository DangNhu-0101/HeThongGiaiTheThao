// src/components/tournament/rules-form/RankingPanel.tsx
import React, { useState } from 'react';
import type { IStage } from '@/types/rules';

const RANKING_CRITERIA_LIST = [
  { id: 'points',       label: 'Điểm số' },
  { id: 'pointDiff',    label: 'Hiệu số điểm' },
  { id: 'headToHead',   label: 'Đối đầu trực tiếp' },
  { id: 'totalScore',   label: 'Tổng điểm ghi được' },
  { id: 'random',       label: 'Bốc thăm ngẫu nhiên' },
];

interface RankingPanelProps {
  stage: IStage;
  onUpdate: (stageId: string, field: keyof IStage, value: unknown) => void;
  onToggleCriteria: (stageId: string, type: 'ranking' | 'wildcard', criteriaId: string) => void;
  onMovePriority: (stageId: string, type: 'ranking' | 'wildcard', index: number, dir: number) => void;
}

export const RankingPanel: React.FC<RankingPanelProps> = ({ stage, onUpdate, onToggleCriteria, onMovePriority }) => {
  const [open, setOpen] = useState(false);
  const filtered = stage.rankingPriorityOrder.filter(id => stage.rankingCriteria?.includes(id));

  return (
    <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-xs">
      <div className={`flex items-center justify-between px-4 py-3 bg-slate-50/50 cursor-pointer select-none border-b transition-colors hover:bg-slate-50 ${open ? 'border-slate-200' : 'border-transparent'}`} onClick={() => setOpen(o => !o)}>
        <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">📊 Luật xếp hạng bảng đấu</span>
        <span className="text-xs text-slate-400 font-bold">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="p-4 flex flex-col gap-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Điểm trận thắng</label>
              <input type="number" className="p-2 border rounded-lg text-xs outline-none" value={stage.winPoints} onChange={e => onUpdate(stage.id, 'winPoints', parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Điểm trận thua</label>
              <input type="number" className="p-2 border rounded-lg text-xs outline-none" value={stage.lossPoints} onChange={e => onUpdate(stage.id, 'lossPoints', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Các tiêu chí áp dụng</label>
            <div className="flex flex-wrap gap-1.5">
              {RANKING_CRITERIA_LIST.map(c => {
                const isSel = stage.rankingCriteria?.includes(c.id);
                return (
                  <button key={c.id} type="button" onClick={() => onToggleCriteria(stage.id, 'ranking', c.id)} className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${isSel ? 'bg-sky-600 border-sky-600 text-white shadow-xs' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t pt-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Thứ tự ưu tiên xét từ trên xuống</label>
              <div className="flex flex-col gap-1.5 max-w-md">
                {filtered.map((cid, idx) => {
                  const c = RANKING_CRITERIA_LIST.find(x => x.id === cid);
                  return (
                    <div key={cid} className="flex items-center gap-2 bg-slate-50 border p-2 rounded-lg text-xs">
                      <button type="button" className="w-5 h-5 border rounded bg-white font-bold disabled:opacity-20" disabled={idx === 0} onClick={() => onMovePriority(stage.id, 'ranking', idx, -1)}>▲</button>
                      <button type="button" className="w-5 h-5 border rounded bg-white font-bold disabled:opacity-20" disabled={idx === filtered.length - 1} onClick={() => onMovePriority(stage.id, 'ranking', idx, 1)}>▼</button>
                      <span className="font-bold text-sky-600 min-w-[16px]">{idx + 1}.</span>
                      <span className="font-medium text-slate-700">{c?.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};