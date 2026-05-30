// src/components/tournament/rules-form/StageTreeForm.tsx
import React, { useState } from 'react';
import type { IStage, IBranch } from '@/types/rules';
import { MatchPanel } from './MatchPanel';
import { RankingPanel } from './RankingPanel';
import { WildcardPanel } from './WildcardPanel';

const KNOCKOUT_ROUNDS = ['Round of 128', 'Round of 64', 'Round of 32', 'Round of 16', 'Round of 8', 'Quarter Final', 'Semi Final', 'Final'];

interface StageTreeFormProps {
  stage: IStage;
  depth: number;
  stageIndex: number;
  onUpdate: (stageId: string, field: keyof IStage, value: unknown) => void;
  onUpdateBranch: (stageId: string, branchId: string, field: keyof IBranch, value: unknown) => void;
  onToggleRank: (stageId: string, branchId: string, rank: number) => void;
  onAddBranch: (stageId: string) => void;
  onRemoveBranch: (stageId: string, branchId: string) => void;
  onAddSubstage: (parentId: string, branchName?: string) => void;
  onRemoveSubstage: (parentId: string, subId: string) => void;
  onToggleCriteria: (stageId: string, type: 'ranking' | 'wildcard', criteriaId: string) => void;
  onMovePriority: (stageId: string, type: 'ranking' | 'wildcard', index: number, dir: number) => void;
}

export const StageTreeForm: React.FC<StageTreeFormProps> = ({
  stage, depth, onUpdate, onUpdateBranch, onToggleRank, onAddBranch,
  onRemoveBranch, onAddSubstage, onRemoveSubstage, onToggleCriteria, onMovePriority
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const isGroup = stage.type === 'GROUP_STAGE';

  const totalTeams = isGroup
    ? stage.branches.reduce((sum, b) => sum + (b.numberOfGroups * b.playersPerGroup), 0)
    : stage.totalTeamsIn;
  const advancing = isGroup
    ? stage.branches.reduce((sum, b) => sum + (b.numberOfGroups * b.selectedRanks.length), 0)
    : Math.floor(totalTeams / 2);

  // Thụt lề động dựa theo cấp độ nhánh lồng nhau trên UI
  const paddingLeft = depth > 0 ? `${Math.min(depth * 16, 48)}px` : '0px';

  return (
    <div className="w-full mb-3" style={{ paddingLeft }}>
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        
        {/* BAR TIÊU ĐỀ KHỐI VÒNG ĐẤU */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-slate-50 border-b cursor-pointer select-none" onClick={() => setCollapsed(c => !c)}>
          <div className="text-xs text-slate-400 font-bold w-4">{collapsed ? '▶' : '▼'}</div>
          <span className="text-xs font-extrabold text-slate-800 flex-1">{stage.stageName}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isGroup ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {isGroup ? 'Vòng bảng' : stage.knockoutRound || 'Knockout'}
          </span>
          <div className="flex gap-1.5 text-[11px] font-semibold" onClick={e => e.stopPropagation()}>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-600">Vào: {totalTeams}</span>
            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-md">{isGroup ? 'Đi tiếp' : 'Thắng'}: {advancing}</span>
          </div>
        </div>

        {/* NỘI DUNG CHỈNH SỬA CHI TIẾT BÊN TRONG CỦA VÒNG */}
        {!collapsed && (
          <div className="p-4 flex flex-col gap-4 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tên vòng đấu</label>
                <input className="p-2 border rounded-lg text-xs outline-none focus:border-sky-500" value={stage.stageName} onChange={e => onUpdate(stage.id, 'stageName', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Loại hình tổ chức</label>
                <select className="p-2 border rounded-lg text-xs bg-white outline-none focus:border-sky-500" value={stage.type} onChange={e => onUpdate(stage.id, 'type', e.target.value)}>
                  <option value="GROUP_STAGE">Vòng bảng (Tính điểm)</option>
                  <option value="KNOCKOUT">Loại trực tiếp (Knockout)</option>
                </select>
              </div>

              {!isGroup && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tên nhánh Knockout</label>
                    <select className="p-2 border rounded-lg text-xs bg-white outline-none focus:border-sky-500" value={stage.knockoutRound} onChange={e => onUpdate(stage.id, 'knockoutRound', e.target.value)}>
                      <option value="">Chọn quy mô...</option>
                      {KNOCKOUT_ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 max-w-[120px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tổng số đội tham gia</label>
                    <input type="number" min="2" className="p-2 border rounded-lg text-xs outline-none" value={stage.totalTeamsIn} onChange={e => onUpdate(stage.id, 'totalTeamsIn', parseInt(e.target.value) || 0)} />
                  </div>
                </>
              )}
            </div>

            {/* NHÚNG CÁC PANEL ĐÃ CHIA NHỎ */}
            <MatchPanel stage={stage} onUpdate={onUpdate} />
            {isGroup && <RankingPanel stage={stage} onUpdate={onUpdate} onToggleCriteria={onToggleCriteria} onMovePriority={onMovePriority} />}
            {!isGroup && <WildcardPanel stage={stage} onUpdate={onUpdate} onToggleCriteria={onToggleCriteria} onMovePriority={onMovePriority} />}

            {/* CHIA NHÁNH KHU VỰC ĐỐI VỚI VÒNG BẢNG */}
            {isGroup && (
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input type="checkbox" className="sr-only peer" checked={stage.hasBranches} onChange={e => onUpdate(stage.id, 'hasBranches', e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-sky-600 after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all" />
                  </label>
                  <span className="text-xs font-bold text-slate-700">Phân chia thành nhiều nhánh thi đấu độc lập (Ví dụ: Nhánh miền Bắc / miền Nam)</span>
                </div>

                <div className="flex flex-col gap-3 pl-2">
                  {stage.branches.map(branch => (
                    <div key={branch.id} className="bg-white border border-slate-200/60 p-3 rounded-xl shadow-xs">
                      <div className="flex items-center gap-2 mb-3">
                        <input className="p-1 border-b text-xs font-bold text-slate-800 outline-none focus:border-sky-500 flex-1" value={branch.name} onChange={e => onUpdateBranch(stage.id, branch.id, 'name', e.target.value)} />
                        <button type="button" className="text-[11px] font-bold text-sky-600 border border-dashed border-sky-300 px-2 py-1 rounded hover:bg-sky-50" onClick={() => onAddSubstage(stage.id, branch.name)}>+ Vòng kế tiếp</button>
                        {stage.hasBranches && stage.branches.length > 1 && (
                          <button type="button" className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded hover:bg-red-100" onClick={() => onRemoveBranch(stage.id, branch.id)}>Xóa nhánh</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 max-w-xs mb-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Số bảng đấu</label>
                          <input type="number" min="1" className="p-1.5 border rounded text-xs outline-none" value={branch.numberOfGroups} onChange={e => onUpdateBranch(stage.id, branch.id, 'numberOfGroups', parseInt(e.target.value) || 1)} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Số đội / 1 bảng</label>
                          <input type="number" min="2" className="p-1.5 border rounded text-xs outline-none" value={branch.playersPerGroup} onChange={e => onUpdateBranch(stage.id, branch.id, 'playersPerGroup', parseInt(e.target.value) || 2)} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Các thứ hạng được quyền đi tiếp vào vòng trong</label>
                        <div className="flex flex-wrap gap-1">
                          {Array.from({ length: branch.playersPerGroup }, (_, i) => i + 1).map(rank => {
                            const isSelected = branch.selectedRanks.includes(rank);
                            return (
                              <button key={rank} type="button" onClick={() => onToggleRank(stage.id, branch.id, rank)} className={`px-2.5 py-1 border rounded-lg text-[11px] font-semibold transition-colors ${isSelected ? 'bg-green-600 border-green-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                                Hạng {rank}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {stage.hasBranches && (
                    <button type="button" className="text-xs font-bold text-sky-600 border border-dashed border-sky-300 p-2 rounded-xl bg-white hover:bg-slate-50 w-full" onClick={() => onAddBranch(stage.id)}>+ Thêm phân nhánh khu vực mới</button>
                  )}
                </div>
              </div>
            )}

            {!isGroup && (
              <button type="button" className="text-xs font-bold text-slate-600 border border-dashed p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 w-full" onClick={() => onAddSubstage(stage.id)}>+ Thiết lập Vòng đấu loại tiếp theo (Vòng sau)</button>
            )}

            {/* ĐỆ QUY TỰ ĐỘNG GỌI LẠI CHÍNH NÓ KHI CÓ SUBSTAGES */}
            {stage.substages?.length > 0 && (
              <div className="mt-3 border-l-2 border-slate-200 pl-3 flex flex-col gap-3">
                {stage.substages.map((sub, sIdx) => (
                  <div key={sub.id} className="relative w-full">
                    <button type="button" className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-white border border-red-300 text-red-600 font-bold text-xs flex items-center justify-center shadow-xs hover:bg-red-50" onClick={() => onRemoveSubstage(stage.id, sub.id)}>✕</button>
                    <StageTreeForm stage={sub} depth={depth + 1} stageIndex={sIdx} onUpdate={onUpdate} onUpdateBranch={onUpdateBranch} onToggleRank={onToggleRank} onAddBranch={onAddBranch} onRemoveBranch={onRemoveBranch} onAddSubstage={onAddSubstage} onRemoveSubstage={onRemoveSubstage} onToggleCriteria={onToggleCriteria} onMovePriority={onMovePriority} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};