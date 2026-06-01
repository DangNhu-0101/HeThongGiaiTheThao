﻿// src/components/tournament/RuleModal/TournamentRulesModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle,  DialogTrigger, DialogFooter } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import api from '@/api/axiosConfig';
import type { IStage, IBranch } from '@/types/rules';
import { StageTreeForm } from '@/components/tournament/StageTreeForm';
import { TournamentBracketDisplay } from '@/components/tournament/StageBracketView';

interface TournamentApiResponse {
  success: boolean;
  data: {
    displayName?: string;
    name?: string;
    sportsConfig?: Array<{ sport: string }>;
  };
}

interface StageConfigResponse {
  success: boolean;
  data?: IStage[];
  rule?: {
    sportType?: string;
    formatDescription?: string;
    ruleDescription?: string;
    stageTree?: IStage[];
    stages?: IStage[];
  };
}

const generateId = () => {
  // Generates a 24-character hex string compatible with MongoDB ObjectId
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const randomPart = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => 
    Math.floor(Math.random() * 16).toString(16)
  );
  return timestamp + randomPart;
};

const createBranch = (name = 'Nhánh chính'): IBranch => ({
  id: generateId(), 
  name, 
  numberOfGroups: 6, 
  playersPerGroup: 4, 
  selectedRanks: [1, 2],
  sourceType: undefined,
  sourceRanks: [],
});

const createStage = (stageNumber: number, parentId: string | null = null, branchName = ''): IStage => ({
  id: generateId(), 
  parentId, 
  stageNumber,
  stageName: `Vòng ${stageNumber}`,
  type: 'GROUP_STAGE', 
  branchName, 
  hasBranches: false, 
  branches: [createBranch()],
  hasWildcards: false, 
  wildcardsCount: 0,
  wildcardCriteria: ['pointDiff', 'totalScore', 'headToHead'],
  wildcardPriorityOrder: ['pointDiff', 'totalScore', 'headToHead', 'random'],
  winPoints: 1, 
  lossPoints: 0,
  rankingCriteria: ['points', 'pointDiff', 'headToHead', 'totalScore'],
  rankingPriorityOrder: ['points', 'pointDiff', 'headToHead', 'totalScore', 'random'],
  matchFormat: '1_SET', 
  touchPoint: 11, 
  winByGap: 1, 
  maxPoints: null, 
  changeSideAt: 6,
  substages: [], 
  knockoutRound: '', 
  hasBronzeMatch: false, 
  matchDuration:15, // Thêm mặc định 15 phút cho mỗi trận
  totalTeamsIn: 0,
});

const normalizeBranch = (branch?: Partial<IBranch>, fallbackName = 'Nhánh chính'): IBranch => ({
  ...createBranch(branch?.name || fallbackName),
  ...branch,
  id: branch?.id || generateId(),
  name: branch?.name || fallbackName,
  numberOfGroups: Number(branch?.numberOfGroups || 1),
  playersPerGroup: Number(branch?.playersPerGroup || 2),
  selectedRanks: branch?.selectedRanks?.length ? branch.selectedRanks.map(Number) : [1],
  sourceRanks: branch?.sourceRanks?.map(Number) || [],
});

const normalizeStage = (stage: Partial<IStage>, index = 0, parentId: string | null = null): IStage => {
  const base = createStage(Number(stage.stageNumber || index + 1), parentId, stage.branchName || '');
  const normalized: IStage = {
    ...base,
    ...stage,
    id: stage.id || generateId(),
    parentId,
    stageNumber: Number(stage.stageNumber || index + 1),
    stageName: stage.stageName || `Vòng ${Number(stage.stageNumber || index + 1)}`,
    type: stage.type || 'GROUP_STAGE',
    branchName: stage.branchName || '',
    branches: stage.branches?.length
      ? stage.branches.map((branch, branchIndex) => normalizeBranch(branch, branchIndex === 0 ? 'Nhánh chính' : `Nhánh ${branchIndex + 1}`))
      : [createBranch()],
    hasBranches: Boolean(stage.hasBranches || (stage.branches && stage.branches.length > 1)),
    hasWildcards: Boolean(stage.hasWildcards),
    wildcardsCount: Number(stage.wildcardsCount || 0),
    wildcardCriteria: stage.wildcardCriteria?.length ? stage.wildcardCriteria : base.wildcardCriteria,
    wildcardPriorityOrder: stage.wildcardPriorityOrder?.length ? stage.wildcardPriorityOrder : base.wildcardPriorityOrder,
    winPoints: Number(stage.winPoints ?? base.winPoints),
    lossPoints: Number(stage.lossPoints ?? base.lossPoints),
    rankingCriteria: stage.rankingCriteria?.length ? stage.rankingCriteria : base.rankingCriteria,
    rankingPriorityOrder: stage.rankingPriorityOrder?.length ? stage.rankingPriorityOrder : base.rankingPriorityOrder,
    matchFormat: stage.matchFormat || base.matchFormat,
    matchDuration: Number(stage.matchDuration || base.matchDuration),
    touchPoint: Number(stage.touchPoint || base.touchPoint),
    winByGap: Number(stage.winByGap || base.winByGap),
    maxPoints: stage.maxPoints ?? base.maxPoints,
    changeSideAt: Number(stage.changeSideAt || base.changeSideAt),
    knockoutRound: stage.knockoutRound || '',
    hasBronzeMatch: Boolean(stage.hasBronzeMatch),
    totalTeamsIn: Number(stage.totalTeamsIn || 0),
    substages: [],
  };

  normalized.substages = (stage.substages || []).map((substage, subIndex) => normalizeStage(substage, subIndex, normalized.id));
  return normalized;
};

interface TournamentRulesModalProps {
  tournamentId: string;
  onSuccess?: () => void | Promise<void>;
  children: React.ReactNode;
}

export const TournamentRulesModal: React.FC<TournamentRulesModalProps> = ({ tournamentId, onSuccess, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSport, setSelectedSport] = useState('');
  const [stageTree, setStageTree] = useState<IStage[]>([]);
  const [formatDescription, setFormatDescription] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [activeTab, setActiveTab] = useState('configure');

  useEffect(() => {
    if (!isOpen || !tournamentId) return;

    const fetchTournamentData = async () => {
      setLoading(true);
      try {
        const [tournamentRes, stageRes] = await Promise.all([
          api.get<TournamentApiResponse>(`/tournaments/${tournamentId}`),
          api.get<StageConfigResponse>(`/stages/get-stages/${tournamentId}`).catch(() => null),
        ]);

        const tour = tournamentRes.data?.data;
        const savedRule = stageRes?.data?.rule;
        const savedTree = savedRule?.stageTree?.length
          ? savedRule.stageTree
          : stageRes?.data?.data?.length
            ? stageRes.data.data
            : [];

        const sportFromTournament = tour?.sportsConfig?.[0]?.sport || '';
        setSelectedSport(savedRule?.sportType || sportFromTournament);
        setFormatDescription(savedRule?.formatDescription || '');
        setRuleDescription(savedRule?.ruleDescription || '');
        setStageTree(savedTree.length ? savedTree.map((stage, index) => normalizeStage(stage, index)) : [createStage(1)]);
      } catch {
        toast.error("Không thể tải thông tin giải đấu");
      } finally {
        setLoading(false);
      }
    };

    void fetchTournamentData();
  }, [isOpen, tournamentId]);

  const updateStage = useCallback((stageId: string, field: keyof IStage, value: unknown) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as IStage[];
      const walk = (stages: IStage[]): boolean => {
        for (const s of stages) {
          if (s.id === stageId) {
            const targetStage = s as unknown as Record<string, unknown>;
            targetStage[field] = value;
            if (field === 'type' && value === 'KNOCKOUT') {
              s.hasBranches = false;
              s.branches = [createBranch('Nhánh chính')];
            }
            return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const updateBranch = useCallback((stageId: string, branchId: string, field: keyof IBranch, value: unknown) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as IStage[];
      const walk = (stages: IStage[]): boolean => {
        for (const s of stages) {
          if (s.id === stageId) {
            const b = s.branches.find(x => x.id === branchId);
            if (b) {
              const targetBranch = b as unknown as Record<string, unknown>;
              targetBranch[field] = value;
            }
            return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const toggleRank = useCallback((stageId: string, branchId: string, rank: number) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as IStage[];
      const walk = (stages: IStage[]): boolean => {
        for (const s of stages) {
          if (s.id === stageId) {
            const b = s.branches.find(x => x.id === branchId);
            if (b) {
              const idx = b.selectedRanks.indexOf(rank);
              if (idx > -1) {
                if (b.selectedRanks.length > 1) b.selectedRanks.splice(idx, 1);
              } else {
                b.selectedRanks.push(rank);
                b.selectedRanks.sort((a, b) => a - b);
              }
            }
            return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const addBranch = useCallback((stageId: string) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as IStage[];
      const walk = (stages: IStage[]): boolean => {
        for (const s of stages) {
          if (s.id === stageId) {
            s.branches.push(createBranch(`Nhánh ${s.branches.length + 1}`));
            s.hasBranches = true;
            return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const removeBranch = useCallback((stageId: string, branchId: string) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as IStage[];
      const walk = (stages: IStage[]): boolean => {
        for (const s of stages) {
          if (s.id === stageId) {
            if (s.branches.length > 1) s.branches = s.branches.filter(b => b.id !== branchId);
            if (s.branches.length <= 1) s.hasBranches = false;
            return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  // Hàm tính số đội đi tiếp từ 1 stage (bao gồm wildcard)
const getAdvancingTeams = useCallback((stage: IStage): number => {
  if (stage.type === 'GROUP_STAGE') {
    return stage.branches.reduce((sum, b) => sum + (b.numberOfGroups * b.selectedRanks.length), 0);
  }
  // Knockout: đi tiếp = (tổng số đội vào / 2) + wildcard
  const winAdvancing = Math.floor((stage.totalTeamsIn || 0) / 2);
  const wildcardAdvancing = stage.hasWildcards ? (stage.wildcardsCount || 0) : 0;
  return winAdvancing + wildcardAdvancing;
}, []);

  const addSubstage = useCallback((parentId: string, branchName = '', branchId?: string) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as IStage[];
      
      const walk = (stages: IStage[]): boolean => {
        for (const s of stages) {
          if (s.id === parentId) {
            // Đếm số vòng theo nhánh
            const relevantSubstages = branchId && branchName
              ? (s.substages || []).filter(sub => sub.branchName === branchName)
              : (s.substages || []);
            
            // Bắt đầu từ 2
            const maxNumber = relevantSubstages.length > 0
              ? Math.max(...relevantSubstages.map(sub => sub.stageNumber || 0))
              : 1;
            const nextNumber = maxNumber + 1;
            
            // Tạo stage mới
            const newStage = createStage(nextNumber, s.id, branchName);
            
            // Tự động điền totalTeamsIn từ số đội đi tiếp của vòng cha
            newStage.totalTeamsIn = getAdvancingTeams(s);
            
            // Giữ cùng loại với vòng cha
            newStage.type = s.type;
            
            // Nếu là knockout, tự động set knockoutRound dựa trên số đội
            if (s.type === 'KNOCKOUT') {
              const totalIn = newStage.totalTeamsIn;
              if (totalIn >= 8) newStage.knockoutRound = 'Round of 8';
              else if (totalIn >= 4) newStage.knockoutRound = 'Quarter Final';
              else if (totalIn >= 2) newStage.knockoutRound = 'Semi Final';
              else newStage.knockoutRound = 'Final';
            }
            
            s.substages = [...(s.substages || []), newStage];
            return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, [getAdvancingTeams]);

  const removeSubstage = useCallback((parentId: string, subId: string) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as IStage[];
      const walk = (stages: IStage[]): boolean => {
        for (const s of stages) {
          if (s.id === parentId) {
            s.substages = (s.substages || []).filter(x => x.id !== subId);
            return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const toggleCriteria = useCallback((stageId: string, type: 'ranking' | 'wildcard', criteriaId: string) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as IStage[];
      const field = type === 'ranking' ? 'rankingCriteria' : 'wildcardCriteria';
      const walk = (stages: IStage[]): boolean => {
        for (const s of stages) {
          if (s.id === stageId) {
            const arr = s[field] as string[];
            const idx = arr.indexOf(criteriaId);
            if (idx > -1) arr.splice(idx, 1); else arr.push(criteriaId);
            return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const movePriority = useCallback((stageId: string, type: 'ranking' | 'wildcard', index: number, dir: number) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as IStage[];
      const orderField = type === 'ranking' ? 'rankingPriorityOrder' : 'wildcardPriorityOrder';
      const criteriaField = type === 'ranking' ? 'rankingCriteria' : 'wildcardCriteria';
      const walk = (stages: IStage[]): boolean => {
        for (const s of stages) {
          if (s.id === stageId) {
            const targetOrder = s[orderField] as string[];
            const targetCriteria = s[criteriaField] as string[];
            const filtered = targetOrder.filter(id => targetCriteria?.includes(id));
            const ai = targetOrder.indexOf(filtered[index]);
            const ti = ai + dir;
            if (ti >= 0 && ti < targetOrder.length) {
              [targetOrder[ai], targetOrder[ti]] = [targetOrder[ti], targetOrder[ai]];
            }
            return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const toggleSourceRank = useCallback((stageId: string, branchId: string, rank: number) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as IStage[];
      const walk = (stages: IStage[]): boolean => {
        for (const s of stages) {
          if (s.id === stageId) {
            const b = s.branches.find(x => x.id === branchId);
            if (b) {
              if (!b.sourceRanks) b.sourceRanks = [];
              const idx = b.sourceRanks.indexOf(rank);
              if (idx > -1) {
                b.sourceRanks.splice(idx, 1);
              } else {
                b.sourceRanks.push(rank);
                b.sourceRanks.sort((a, b) => a - b);
              }
            }
            return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const updateSourceType = useCallback((stageId: string, branchId: string, sourceType: 'top' | 'win' | 'lose') => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as IStage[];
      const walk = (stages: IStage[]): boolean => {
        for (const s of stages) {
          if (s.id === stageId) {
            const b = s.branches.find(x => x.id === branchId);
            if (b) {
              b.sourceType = sourceType;
              if (sourceType !== 'top') {
                b.sourceRanks = [];
              }
            }
            return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/stages/save-stages/${tournamentId}`, {
        sportType: selectedSport,
        formatDescription,
        ruleDescription,
        stageTree
      });
      toast.success("Lưu cấu hình thành công!");
      if (onSuccess) await onSuccess();
      setIsOpen(false);
    } catch {
      toast.error("Không thể lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 bg-slate-50 gap-0 overflow-hidden outline-none">
        <DialogHeader className="px-6 py-4 border-b bg-white shrink-0">
          <DialogTitle className="text-xl font-extrabold uppercase flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            ⚙️ CẤU HÌNH VÒNG ĐẤU & LUẬT CHƠI
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4 bg-slate-50 shrink-0">
            <TabsList className="bg-white border">
              <TabsTrigger value="configure" className="text-xs font-bold">
                ⚙️ Cấu hình
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs font-bold">
                👁️ Xem sơ đồ
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-full flex-1 px-6 py-4 min-h-0">
            {loading ? (
              <div className="text-center py-12 text-sm text-slate-400 font-bold">Đang tải dữ liệu cấu hình...</div>
            ) : (
              <>
                <TabsContent value="configure" className="mt-0">
                  <form id="rules-form" onSubmit={handleSaveSubmit} className="flex flex-col gap-5 pb-8">
                    <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs grid grid-cols-1 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Mô tả thể thức tổng quan</label>
                        <textarea className="p-3 border rounded-xl text-xs bg-slate-50/50 outline-none focus:bg-white focus:border-sky-500 transition-colors" rows={2} value={formatDescription} onChange={e => setFormatDescription(e.target.value)} placeholder="Nhập thể thức..." />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Quy định luật thi đấu chi tiết</label>
                        <textarea className="p-3 border rounded-xl text-xs bg-slate-50/50 outline-none focus:bg-white focus:border-sky-500 transition-colors" rows={3} value={ruleDescription} onChange={e => setRuleDescription(e.target.value)} placeholder="Nhập luật đấu..." />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-2">Sơ đồ cây các vòng đấu diễn ra</div>
                      {stageTree.map((stage, idx) => (
                        <StageTreeForm 
                          key={stage.id} 
                          stage={stage} 
                          depth={0} 
                          stageIndex={idx}
                          onUpdate={updateStage} 
                          onUpdateBranch={updateBranch} 
                          onToggleRank={toggleRank} 
                          onAddBranch={addBranch} 
                          onRemoveBranch={removeBranch} 
                          onAddSubstage={addSubstage} 
                          onRemoveSubstage={removeSubstage} 
                          onToggleCriteria={toggleCriteria} 
                          onMovePriority={movePriority}
                          onToggleSourceRank={toggleSourceRank}
                          onUpdateSourceType={updateSourceType}
                        />
                      ))}
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="preview" className="mt-0">
                  <TournamentBracketDisplay stageTree={stageTree} />
                </TabsContent>
              </>
            )}
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t bg-white flex justify-end gap-3 shrink-0">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Hủy bỏ
            </Button>
            {activeTab === 'configure' && (
              <Button 
                type="submit" 
                form="rules-form" 
                disabled={saving || loading}
                className="font-bold min-w-[150px] bg-sky-600 hover:bg-sky-700 text-white"
              >
                {saving ? "ĐANG LƯU..." : "LƯU CẤU HÌNH"}
              </Button>
            )}
          </DialogFooter>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
export default TournamentRulesModal;
