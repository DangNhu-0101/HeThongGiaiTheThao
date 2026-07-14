import { GitBranch, MoveRight } from "lucide-react";
import type { CompetitionStageConfig, StageBracketConfig } from "@/types/competitionFormat";

interface FlowToken {
  id: string;
  label: string;
  stageId: string;
  groupName?: string;
  rank?: number;
}

interface Props {
  stages: CompetitionStageConfig[];
  onChangeStage: (stage: CompetitionStageConfig) => void;
}

const rankLabel = (rank: number) => rank === 1 ? "Nhất" : rank === 2 ? "Nhì" : rank === 3 ? "Ba" : `Hạng ${rank}`;

const sourceTokensFromStage = (stage: CompetitionStageConfig): FlowToken[] => {
  const tokens: FlowToken[] = [];
  stage.brackets.forEach((branch) => {
    if (branch.type === "group" && branch.groups?.length) {
      const ranks = branch.selection.ranks.length ? branch.selection.ranks : Array.from({ length: Math.max(1, branch.selection.slots) }, (_, index) => index + 1);
      branch.groups.forEach((group) => {
        ranks.forEach((rank) => tokens.push({
          id: `${stage.id}:${branch.id}:${group.name}:${rank}`,
          label: `${rankLabel(rank)} ${group.name}`,
          stageId: stage.id,
          groupName: group.name,
          rank,
        }));
      });
    } else {
      Array.from({ length: Math.max(1, branch.selection.slots) }, (_, index) => {
        const rank = index + 1;
        tokens.push({
          id: `${stage.id}:${branch.id}:slot:${rank}`,
          label: `${branch.name} - suất ${rank}`,
          stageId: stage.id,
          rank,
        });
      });
    }
  });
  if (stage.wildcard.enabled) {
    Array.from({ length: Math.max(1, stage.wildcard.selection.slots) }, (_, index) => tokens.push({
      id: `${stage.id}:wildcard:${index + 1}`,
      label: `Vé vớt ${index + 1}`,
      stageId: stage.id,
      rank: index + 1,
    }));
  }
  return tokens;
};

const ensureSlots = (branch: StageBracketConfig) => {
  const count = Math.max(2, branch.totalTeamsIn || 2);
  const current = branch.flowSlots || [];
  return Array.from({ length: count }, (_, index) => current[index] || {
    id: `${branch.id}-slot-${index + 1}`,
    label: `Slot ${index + 1}`,
  });
};

const CompetitionFlowBoard = ({ stages, onChangeStage }: Props) => {
  const setSlot = (stage: CompetitionStageConfig, branch: StageBracketConfig, slotIndex: number, token?: FlowToken) => {
    const slots = ensureSlots(branch).map((slot, index) => index === slotIndex
      ? {
        ...slot,
        sourceLabel: token?.label,
        sourceStageId: token?.stageId,
        sourceGroupName: token?.groupName,
        sourceRank: token?.rank,
      }
      : slot);
    onChangeStage({
      ...stage,
      brackets: stage.brackets.map((item) => item.id === branch.id ? { ...item, flowSlots: slots } : item),
    });
  };

  if (stages.length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
        Lưu đồ kéo-thả sẽ xuất hiện khi có từ 2 chặng trở lên.
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><GitBranch className="h-4 w-4" /></div>
        <div>
          <h2 className="text-sm font-black uppercase text-foreground">Lưu đồ kéo-thả vị trí đi tiếp</h2>
          <p className="mt-1 text-xs text-muted-foreground">Kéo các nhãn như “Nhất bảng A”, “Nhì bảng B” vào slot của vòng/nhánh tiếp theo. Khi đội đấu xong, đội giữ vị trí đó sẽ đi theo luồng đã xếp.</p>
        </div>
      </div>

      <div className="space-y-5 overflow-x-auto pb-2">
        {stages.slice(1).map((stage) => {
          const previous = stages.find((item) => item.order === stage.order - 1);
          const tokens = previous ? sourceTokensFromStage(previous) : [];
          return (
            <div key={stage.id} className="grid min-w-[900px] grid-cols-[260px_60px_1fr] gap-4 rounded-xl border border-border bg-muted/20 p-4">
              <div>
                <p className="mb-2 text-xs font-black uppercase text-muted-foreground">Nguồn từ {previous?.name}</p>
                <div className="space-y-2">
                  {tokens.map((token) => (
                    <div
                      key={token.id}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData("application/json", JSON.stringify(token))}
                      className="cursor-grab rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-bold text-primary active:cursor-grabbing"
                    >
                      {token.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center text-muted-foreground"><MoveRight className="h-6 w-6" /></div>
              <div>
                <p className="mb-2 text-xs font-black uppercase text-muted-foreground">Sắp xếp vào {stage.name}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {stage.brackets.map((branch) => (
                    <div key={branch.id} className="rounded-xl border border-border bg-background p-3">
                      <div className="mb-3">
                        <p className="font-black text-foreground">{branch.name}</p>
                        <p className="text-xs text-muted-foreground">{branch.type === "group" ? "Bảng/nhóm" : "Nhánh đấu"} · {branch.totalTeamsIn} slot</p>
                      </div>
                      <div className="space-y-2">
                        {ensureSlots(branch).map((slot, index) => (
                          <div
                            key={slot.id}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              const raw = event.dataTransfer.getData("application/json");
                              if (!raw) return;
                              setSlot(stage, branch, index, JSON.parse(raw) as FlowToken);
                            }}
                            className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-sm"
                          >
                            <span className="font-bold text-muted-foreground">{slot.label}</span>
                            <span className={slot.sourceLabel ? "font-black text-foreground" : "text-muted-foreground"}>
                              {slot.sourceLabel || "Kéo vị trí vào đây"}
                            </span>
                            {slot.sourceLabel && (
                              <button type="button" className="text-xs font-bold text-red-600" onClick={() => setSlot(stage, branch, index)}>
                                Xóa
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CompetitionFlowBoard;
