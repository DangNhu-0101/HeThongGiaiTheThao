// src/components/tournament/rules-form/WildcardPanel.tsx
import React, { useState } from 'react';
import type { IStage } from '@/types/rules';

const WILDCARD_CRITERIA_LIST = [
  { id: 'pointDiff',   label: 'Hiệu số điểm' },
  { id: 'totalScore',  label: 'Tổng điểm ghi được' },
  { id: 'headToHead',  label: 'Đối đầu trực tiếp' },
  { id: 'random',      label: 'Bốc thăm may rủi' },
];

interface WildcardPanelProps {
  stage: IStage;
  onUpdate: (stageId: string, field: keyof IStage, value: unknown) => void;
  onToggleCriteria: (stageId: string, type: 'ranking' | 'wildcard', criteriaId: string) => void;
  onMovePriority: (stageId: string, type: 'ranking' | 'wildcard', index: number, dir: number) => void;
}

export const WildcardPanel: React.FC<WildcardPanelProps> = ({ stage, onUpdate, onToggleCriteria, onMovePriority }) => {
  const [open, setOpen] = useState(false);
  const filtered = stage.wildcardPriorityOrder.filter(id => stage.wildcardCriteria?.includes(id));

  return (
    <div className="border border-orange-200 rounded-xl overflow-hidden bg-white shadow-xs">
      <div className={`flex items-center justify-between px-4 py-3 bg-orange-50/30 cursor-pointer select-none border-b transition-colors hover:bg-orange-50/50 ${open ? 'border-orange-200' : 'border-transparent'}`} onClick={() => setOpen(o => !o)}>
        <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">🔥 Vé vớt vòng loại trực tiếp (Lucky Losers)</span>
        <span className="text-xs text-slate-400 font-bold">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="p-4 flex flex-col gap-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input type="checkbox" className="sr-only peer" checked={stage.hasWildcards} onChange={e => onUpdate(stage.id, 'hasWildcards', e.target.checked)} />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-orange-600" />
            </label>
            <span className="text-xs font-bold text-slate-700">Áp dụng cơ chế chọn vé vớt cho các đội thua có thành tích tốt</span>
          </div>

          {stage.hasWildcards && (
            <>
              <div className="flex flex-col gap-1 max-w-[120px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Số lượng suất vớt</label>
                <input type="number" min="0" className="p-2 border rounded-lg text-xs outline-none" value={stage.wildcardsCount} onChange={e => onUpdate(stage.id, 'wildcardsCount', parseInt(e.target.value) || 0)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tiêu chí xét vớt</label>
                <div className="flex flex-wrap gap-1.5">
                  {WILDCARD_CRITERIA_LIST.map(c => (
                    <button key={c.id} type="button" onClick={() => onToggleCriteria(stage.id, 'wildcard', c.id)} className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${stage.wildcardCriteria?.includes(c.id) ? 'bg-orange-600 border-orange-600 text-white shadow-xs' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              {filtered.length > 0 && (
                <div className="flex flex-col gap-1.5 border-t pt-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Thứ tự ưu tiên xét vớt</label>
                  <div className="flex flex-col gap-1.5 max-w-md">
                    {filtered.map((cid, idx) => {
                      const c = WILDCARD_CRITERIA_LIST.find(x => x.id === cid);
                      return (
                        <div key={cid} className="flex items-center gap-2 bg-slate-50 border p-2 rounded-lg text-xs">
                          <button type="button" className="w-5 h-5 border rounded bg-white font-bold disabled:opacity-20" disabled={idx === 0} onClick={() => onMovePriority(stage.id, 'wildcard', idx, -1)}>▲</button>
                          <button type="button" className="w-5 h-5 border rounded bg-white font-bold disabled:opacity-20" disabled={idx === filtered.length - 1} onClick={() => onMovePriority(stage.id, 'wildcard', idx, 1)}>▼</button>
                          <span className="font-bold text-orange-600 min-w-[16px]">{idx + 1}.</span>
                          <span className="font-medium text-slate-700">{c?.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};