// src/components/tournament/RuleModal/TournamentRulesModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import api from '@/api/axiosConfig';
import type { IStage, IBranch } from '@/types/rules';
import { StageTreeForm } from './StageTreeForm';

// Định nghĩa Interface nhận dữ liệu từ API để xóa bỏ 'implicitly any' của axios
interface TournamentApiResponse {
  success: boolean;
  data: {
    displayName?: string;
    name?: string;
    sportsConfig?: Array<{ sport: string }>;
  };
}

const generateId = () => crypto.randomUUID();

const createBranch = (name = 'Nhánh chính'): IBranch => ({
  id: generateId(), 
  name, 
  numberOfGroups: 2, 
  playersPerGroup: 4, 
  selectedRanks: [1, 2],
});

const createStage = (stageNumber: number, parentId: string | null = null, branchName = ''): IStage => ({
  id: generateId(), 
  parentId, 
  stageNumber,
  stageName: branchName ? `${branchName} — Vòng ${stageNumber}` : `Vòng ${stageNumber}`,
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
  totalTeamsIn: 0,
});

// 🛡️ ĐÃ TRẢ LẠI NGUYÊN VẸN INTERFACE CHUẨN CỦA BẠN (Hỗ trợ cả hàm đồng bộ lẫn bất đồng bộ)
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

  useEffect(() => {
    if (!isOpen || !tournamentId) return;

    const fetchTournamentData = async () => {
      setLoading(true);
      try {
        const res = await api.get<TournamentApiResponse>(`/tournaments/${tournamentId}`);
        if (res.data?.success) {
          const tour = res.data.data;
          if (tour.sportsConfig && tour.sportsConfig.length > 0) {
            setSelectedSport(tour.sportsConfig[0].sport);
          }
          setStageTree([createStage(1)]);
        }
      } catch {
        toast.error("Không thể tải thông tin giải đấu");
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
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
          if (s.id === stageId && s.type === 'GROUP_STAGE') {
            s.branches.push(createBranch(`Nhánh ${s.branches.length + 1}`));
            s.hasBranches = true; return true;
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
            if (s.branches.length <= 1) s.hasBranches = false; return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const addSubstage = useCallback((parentId: string, branchName = '') => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as IStage[];
      const walk = (stages: IStage[]): boolean => {
        for (const s of stages) {
          if (s.id === parentId) {
            const n = (s.substages?.length || 0) + 1;
            s.substages = [...(s.substages || []), createStage(n, s.id, branchName)]; return true;
          }
          if (s.substages?.length && walk(s.substages)) return true;
        }
        return false;
      };
      walk(updated); return updated;
    });
  }, []);

  const removeSubstage = useCallback((parentId: string, subId: string) => {
    setStageTree(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as IStage[];
      const walk = (stages: IStage[]): boolean => {
        for (const s of stages) {
          if (s.id === parentId) {
            s.substages = (s.substages || []).filter(x => x.id !== subId); return true;
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
            if (idx > -1) arr.splice(idx, 1); else arr.push(criteriaId); return true;
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

        <ScrollArea className="h-full flex-1 px-6 py-6 min-h-0">
          {loading ? (
            <div className="text-center py-12 text-sm text-slate-400 font-bold">Đang tải dữ liệu cấu hình...</div>
          ) : (
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
                  <StageTreeForm key={stage.id} stage={stage} depth={0} stageIndex={idx} onUpdate={updateStage} onUpdateBranch={updateBranch} onToggleRank={toggleRank} onAddBranch={addBranch} onRemoveBranch={removeBranch} onAddSubstage={addSubstage} onRemoveSubstage={removeSubstage} onToggleCriteria={toggleCriteria} onMovePriority={movePriority} />
                ))}
              </div>
            </form>
          )}
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-white flex justify-end gap-3 shrink-0">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={saving}>Hủy bỏ</Button>
          <Button type="submit" form="rules-form" disabled={saving || loading} className="font-bold min-w-[180px]" style={{ backgroundColor: "oklch(0.68 0.12 230)" }}>
            {saving ? 'Đang lưu...' : '💾 LƯU CẤU HÌNH LUẬT'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentRulesModal;