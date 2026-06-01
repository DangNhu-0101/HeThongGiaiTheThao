// src/components/tournament/rules-form/StageTreeForm.tsx
import React, { useState } from 'react';
import type { IStage, IBranch } from '@/types/rules';
import { MatchPanel } from '@/components/tournament/RuleModal/MatchPanel';
import { RankingPanel } from '@/components/tournament/RuleModal/RankingPanel';
import { WildcardPanel } from '@/components/tournament/RuleModal/WildcardPanel';

const KNOCKOUT_ROUNDS = [ 'Round of 8', 'Quarter Final', 'Semi Final', 'Final'];

interface StageTreeFormProps {
  stage: IStage;
  depth: number;
  stageIndex: number;
  parentStage?: IStage;
  onUpdate: (stageId: string, field: keyof IStage, value: unknown) => void;
  onUpdateBranch: (stageId: string, branchId: string, field: keyof IBranch, value: unknown) => void;
  onToggleRank: (stageId: string, branchId: string, rank: number) => void;
  onAddBranch: (stageId: string) => void;
  onRemoveBranch: (stageId: string, branchId: string) => void;
  onAddSubstage: (parentId: string, branchName?: string, branchId?: string) => void;
  onRemoveSubstage: (parentId: string, subId: string) => void;
  onToggleCriteria: (stageId: string, type: 'ranking' | 'wildcard', criteriaId: string) => void;
  onMovePriority: (stageId: string, type: 'ranking' | 'wildcard', index: number, dir: number) => void;
  onToggleSourceRank?: (stageId: string, branchId: string, rank: number) => void;
  onUpdateSourceType?: (stageId: string, branchId: string, sourceType: 'top' | 'win' | 'lose') => void;
}

interface SourceSelectorProps {
  branch: IBranch;
  parentStage?: IStage;
  depth: number;
  stage: IStage;
  allInheritedRanks: number[];
  occupiedRanks: number[];
  onUpdateSourceType?: StageTreeFormProps['onUpdateSourceType'];
  onToggleSourceRank?: StageTreeFormProps['onToggleSourceRank'];
}

const SourceSelector: React.FC<SourceSelectorProps> = ({
  branch,
  parentStage,
  depth,
  stage,
  allInheritedRanks,
  occupiedRanks,
  onUpdateSourceType,
  onToggleSourceRank,
}) => {
  if (!parentStage || depth === 0) return null;

  const isTopSource = parentStage.type === 'GROUP_STAGE' && (branch.sourceType === 'top' || !branch.sourceType);
  const parentBranchName = stage.branchName || parentStage.branches[0]?.name || 'chính';

  return (
    <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3 mb-3">
      <label className="text-[10px] font-bold text-amber-700 uppercase block mb-2">
        📥 Nguồn từ {parentStage.stageName} → {parentBranchName} ({allInheritedRanks.length} nguồn)
      </label>

      <div className="flex items-center gap-2 mb-2">
        <select
          className="p-1.5 border rounded text-xs bg-white outline-none"
          value={branch.sourceType || (parentStage.type === 'GROUP_STAGE' ? 'top' : 'win')}
          onChange={(e) => onUpdateSourceType?.(stage.id, branch.id, e.target.value as 'top' | 'win' | 'lose')}
        >
          {parentStage.type === 'GROUP_STAGE' ? (
            <option value="top">Theo Top</option>
          ) : (
            <>
              <option value="win">Đội thắng</option>
              <option value="lose">Đội thua</option>
            </>
          )}
        </select>

        {isTopSource && (
          <span className="text-[10px] text-slate-400">
            Đã chọn: {branch.sourceRanks?.length || 0}/{allInheritedRanks.length}
          </span>
        )}
      </div>

      {isTopSource && (
        <div className="flex flex-wrap gap-1">
          {allInheritedRanks.map((rank) => {
            const isSelected = branch.sourceRanks?.includes(rank);
            const isOccupied = occupiedRanks.includes(rank);
            const isDisabled = isOccupied && !isSelected;

            return (
              <button
                key={rank}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled || isSelected) {
                    onToggleSourceRank?.(stage.id, branch.id, rank);
                  }
                }}
                title={isDisabled ? `Top ${rank} đã được nhánh khác chọn` : ''}
                className={`px-2.5 py-1 border rounded-lg text-[11px] font-semibold transition-all ${
                  isSelected
                    ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                    : isDisabled
                    ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through'
                    : 'bg-white text-slate-600 hover:bg-amber-50 hover:border-amber-300'
                }`}
              >
                Top {rank}
              </button>
            );
          })}
        </div>
      )}

      {parentStage.type === 'KNOCKOUT' && (
        <div className="text-[11px] text-slate-500 font-medium mt-1">
          {branch.sourceType === 'win' || !branch.sourceType
            ? '✅ Lấy các đội THẮNG từ vòng trước'
            : '❌ Lấy các đội THUA từ vòng trước'}
        </div>
      )}
    </div>
  );
};

export const StageTreeForm: React.FC<StageTreeFormProps> = ({
  stage, depth, parentStage, onUpdate, onUpdateBranch, onToggleRank, onAddBranch,
  onRemoveBranch, onAddSubstage, onRemoveSubstage, onToggleCriteria, onMovePriority,
  onToggleSourceRank, onUpdateSourceType
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const isGroup = stage.type === 'GROUP_STAGE';

  const totalTeams = isGroup
    ? stage.branches.reduce((sum, b) => sum + (b.numberOfGroups * b.playersPerGroup), 0)
    : stage.totalTeamsIn;
    //số đội đi tiếp 
  const advancing = isGroup
    ? stage.branches.reduce((sum, b) => sum + (b.numberOfGroups * b.selectedRanks.length), 0)
    : Math.floor(totalTeams / 2) + (stage.hasWildcards ? (stage.wildcardsCount || 0) : 0);

  const paddingLeft = depth > 0 ? `${Math.min(depth * 16, 48)}px` : '0px';

  // Lấy ranks khả dụng từ nhánh cha tương ứng
  const getInheritedRanks = (): number[] => {
    if (!parentStage) return Array.from({ length: 8 }, (_, i) => i + 1);
    
    const parentBranchName = stage.branchName;
    
    const parentBranch = parentBranchName
      ? parentStage.branches.find(b => b.name === parentBranchName)
      : parentStage.branches[0];
    
    if (!parentBranch) return Array.from({ length: 8 }, (_, i) => i + 1);
    
    if (parentStage.type === 'GROUP_STAGE') {
      return parentBranch.selectedRanks.length > 0 
        ? [...parentBranch.selectedRanks].sort((a, b) => a - b)
        : Array.from({ length: parentBranch.playersPerGroup }, (_, i) => i + 1);
    }
    
    if (parentStage.type === 'KNOCKOUT') {
      const totalIn = parentStage.totalTeamsIn || 0;
      const winCount = Math.floor(totalIn / 2);
      return Array.from({ length: winCount }, (_, i) => i + 1);
    }
    
    return Array.from({ length: 8 }, (_, i) => i + 1);
  };

  // Lấy danh sách rank đã bị các nhánh khác chọn
  const getOccupiedRanks = (currentBranchId: string): number[] => {
    const allBranches = stage.branches;
    const occupied: number[] = [];
    
    allBranches.forEach(branch => {
      if (branch.id !== currentBranchId && branch.sourceRanks) {
        branch.sourceRanks.forEach(rank => {
          if (!occupied.includes(rank)) {
            occupied.push(rank);
          }
        });
      }
    });
    
    return occupied;
  };

  const allInheritedRanks = getInheritedRanks();
  const mainBranch = stage.branches[0];
  const extraBranches = stage.branches.slice(1);

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
            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-md">Đi tiếp: {advancing}</span> 
          </div>
        </div>

        {/* NỘI DUNG CHỈNH SỬA CHI TIẾT */}
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
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Thời lượng mỗi trận (phút)</label>
                <input
                  type="number"
                  min="1"
                  className="p-2 border rounded-lg text-xs outline-none focus:border-sky-500"
                  value={stage.matchDuration || 60}
                  onChange={e => onUpdate(stage.id, 'matchDuration', parseInt(e.target.value) || 60)}
                />
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

            {/* NHÚNG CÁC PANEL */}
            <MatchPanel stage={stage} onUpdate={onUpdate} />
            {isGroup && <RankingPanel stage={stage} onUpdate={onUpdate} onToggleCriteria={onToggleCriteria} onMovePriority={onMovePriority} />}
            {!isGroup && <WildcardPanel stage={stage} onUpdate={onUpdate} onToggleCriteria={onToggleCriteria} onMovePriority={onMovePriority} />}

            {/* ===== NHÁNH CHÍNH (LUÔN HIỂN THỊ) ===== */}
            {mainBranch && (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <input 
                    className="p-1 border-b text-xs font-bold text-slate-800 outline-none focus:border-sky-500 flex-1" 
                    value={mainBranch.name} 
                    onChange={e => onUpdateBranch(stage.id, mainBranch.id, 'name', e.target.value)} 
                  />
                  <button 
                    type="button" 
                    className="text-[11px] font-bold text-sky-600 border border-dashed border-sky-300 px-2 py-1 rounded hover:bg-sky-50" 
                    onClick={() => onAddSubstage(stage.id, mainBranch.name, mainBranch.id)}
                  >
                    + Vòng kế tiếp
                  </button>
                </div>

                {/* NGUỒN KẾ THỪA TỪ VÒNG TRƯỚC */}
                <SourceSelector
                  branch={mainBranch}
                  parentStage={parentStage}
                  depth={depth}
                  stage={stage}
                  allInheritedRanks={allInheritedRanks}
                  occupiedRanks={getOccupiedRanks(mainBranch.id)}
                  onUpdateSourceType={onUpdateSourceType}
                  onToggleSourceRank={onToggleSourceRank}
                />

                {/* Cấu hình vòng bảng */}
                {isGroup && (
                  <>
                    <div className="grid grid-cols-2 gap-3 max-w-xs mb-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Số bảng đấu</label>
                        <input type="number" min="1" className="p-1.5 border rounded text-xs outline-none" value={mainBranch.numberOfGroups} onChange={e => onUpdateBranch(stage.id, mainBranch.id, 'numberOfGroups', parseInt(e.target.value) || 1)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Số đội / 1 bảng</label>
                        <input type="number" min="2" className="p-1.5 border rounded text-xs outline-none" value={mainBranch.playersPerGroup} onChange={e => onUpdateBranch(stage.id, mainBranch.id, 'playersPerGroup', parseInt(e.target.value) || 2)} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Các thứ hạng được quyền đi tiếp vào vòng trong</label>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: mainBranch.playersPerGroup }, (_, i) => i + 1).map(rank => {
                          const isSelected = mainBranch.selectedRanks.includes(rank);
                          return (
                            <button key={rank} type="button" onClick={() => onToggleRank(stage.id, mainBranch.id, rank)} className={`px-2.5 py-1 border rounded-lg text-[11px] font-semibold transition-colors ${isSelected ? 'bg-green-600 border-green-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                              Hạng {rank}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ===== TOGGLE THÊM NHÁNH PHỤ ===== */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-3">
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input type="checkbox" className="sr-only peer" checked={stage.hasBranches} onChange={e => onUpdate(stage.id, 'hasBranches', e.target.checked)} />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-sky-600 after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all" />
                </label>
                <span className="text-xs font-bold text-slate-700">Thêm nhánh phụ (chia nguồn đội từ vòng trước)</span>
              </div>

              {stage.hasBranches && extraBranches.map(branch => (
                <div key={branch.id} className="bg-white border border-slate-200/60 p-3 rounded-xl shadow-xs mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input 
                      className="p-1 border-b text-xs font-bold text-slate-800 outline-none focus:border-sky-500 flex-1" 
                      value={branch.name} 
                      onChange={e => onUpdateBranch(stage.id, branch.id, 'name', e.target.value)} 
                    />
                    <button 
                      type="button" 
                      className="text-[11px] font-bold text-sky-600 border border-dashed border-sky-300 px-2 py-1 rounded hover:bg-sky-50" 
                      onClick={() => onAddSubstage(stage.id, branch.name, branch.id)}
                    >
                      + Vòng kế tiếp
                    </button>
                    <button 
                      type="button" 
                      className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded hover:bg-red-100" 
                      onClick={() => onRemoveBranch(stage.id, branch.id)}
                    >
                      Xóa
                    </button>
                  </div>

                  {/* NGUỒN CHO NHÁNH PHỤ */}
                  <SourceSelector
                    branch={branch}
                    parentStage={parentStage}
                    depth={depth}
                    stage={stage}
                    allInheritedRanks={allInheritedRanks}
                    occupiedRanks={getOccupiedRanks(branch.id)}
                    onUpdateSourceType={onUpdateSourceType}
                    onToggleSourceRank={onToggleSourceRank}
                  />

                  {isGroup && (
                    <>
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
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Các thứ hạng được quyền đi tiếp</label>
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
                    </>
                  )}
                </div>
              ))}

              {stage.hasBranches && (
                <button type="button" className="text-xs font-bold text-sky-600 border border-dashed border-sky-300 p-2 rounded-xl bg-white hover:bg-slate-50 w-full" onClick={() => onAddBranch(stage.id)}>
                  + Thêm nhánh phụ
                </button>
              )}
            </div>

            {/* ĐỆ QUY TỰ ĐỘNG GỌI LẠI CHÍNH NÓ KHI CÓ SUBSTAGES */}
            {stage.substages?.length > 0 && (
              <div className="mt-3 border-l-2 border-slate-200 pl-3 flex flex-col gap-3">
                {stage.substages.map((sub, sIdx) => (
                  <div key={sub.id} className="relative w-full">
                    <button 
                      type="button" 
                      className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-white border border-red-300 text-red-600 font-bold text-xs flex items-center justify-center shadow-xs hover:bg-red-50" 
                      onClick={() => onRemoveSubstage(stage.id, sub.id)}
                    >
                      ✕
                    </button>
                    <StageTreeForm 
                      stage={sub} 
                      depth={depth + 1} 
                      stageIndex={sIdx} 
                      parentStage={stage}
                      onUpdate={onUpdate} 
                      onUpdateBranch={onUpdateBranch} 
                      onToggleRank={onToggleRank} 
                      onAddBranch={onAddBranch} 
                      onRemoveBranch={onRemoveBranch} 
                      onAddSubstage={onAddSubstage} 
                      onRemoveSubstage={onRemoveSubstage} 
                      onToggleCriteria={onToggleCriteria} 
                      onMovePriority={onMovePriority}
                      onToggleSourceRank={onToggleSourceRank}
                      onUpdateSourceType={onUpdateSourceType}
                    />
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
