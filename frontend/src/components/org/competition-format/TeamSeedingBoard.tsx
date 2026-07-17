import { useEffect, useMemo, useState } from "react";
import { GripVertical, RotateCcw, Users } from "lucide-react";
import { confirmAutoSeed, fetchPlanningTeams, previewAutoSeed, type AutoSeedCriterion, type PlanningTeam } from "@/services/orgMatchPlanningService";
import { mapStagesToFlow } from "@/components/org/competition-format/workflow/FlowMapper";
import type { CompetitionStageConfig, StageSeedAssignment } from "@/types/competitionFormat";
import { cn } from "@/libs/utils";
import { toast } from "sonner";

interface Props {
  tournamentItemId: string;
  stages: CompetitionStageConfig[];
  onChangeStage: (stage: CompetitionStageConfig) => void;
}

const teamMime = "application/x-format-seed-team";

const errorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object") {
    const response = "response" in error ? error.response : undefined;
    const data = response && typeof response === "object" && "data" in response ? response.data : undefined;
    if (data && typeof data === "object" && "message" in data) return String(data.message || fallback);
    if ("message" in error) return String(error.message || fallback);
  }
  return fallback;
};

const assignmentFor = (stage: CompetitionStageConfig, slotId: string) =>
  (stage.seedAssignments || []).find((assignment) => assignment.slotId === slotId);

const removeTeamEverywhere = (stage: CompetitionStageConfig, participantId: string): CompetitionStageConfig => ({
  ...stage,
  seedAssignments: (stage.seedAssignments || []).filter((assignment) => assignment.participantId !== participantId),
});

const setAssignment = (
  stage: CompetitionStageConfig,
  assignment: StageSeedAssignment,
): CompetitionStageConfig => ({
  ...stage,
  seedAssignments: [
    ...(stage.seedAssignments || []).filter((item) => item.slotId !== assignment.slotId && item.participantId !== assignment.participantId),
    assignment,
  ],
});

const clearAssignment = (stage: CompetitionStageConfig, slotId: string): CompetitionStageConfig => ({
  ...stage,
  seedAssignments: (stage.seedAssignments || []).filter((assignment) => assignment.slotId !== slotId),
});

const applyKnockoutSlotLabel = (
  stage: CompetitionStageConfig,
  branchId: string | undefined,
  nodeId: string | undefined,
  globalIndex: number | undefined,
  participantName: string | undefined,
) => {
  if (!branchId || !nodeId || globalIndex === undefined) return stage;
  return {
    ...stage,
    brackets: stage.brackets.map((branch) => {
      if (branch.id !== branchId) return branch;
      if (globalIndex < 0) {
        const slotIndex = Math.abs(globalIndex) - 1;
        return {
          ...branch,
          flowStandaloneMatches: (branch.flowStandaloneMatches || []).map((match) => {
            if (match.id !== nodeId) return match;
            const seedSlots = Array.from({ length: 2 }, (_, index) => match.seedSlots?.[index] || {
              id: `${match.id}:slot-${index + 1}`,
              label: `Slot ${index + 1}`,
            });
            seedSlots[slotIndex] = { ...seedSlots[slotIndex], sourceLabel: participantName };
            return { ...match, seedSlots };
          }),
        };
      }
      const total = Math.max(2, branch.totalTeamsIn || 2);
      const count = total % 2 === 0 ? total : total + 1;
      const flowSlots = Array.from({ length: count }, (_, index) => branch.flowSlots?.[index] || {
        id: `${branch.id}-slot-${index + 1}`,
        label: `Slot ${index + 1}`,
      });
      flowSlots[globalIndex] = { ...flowSlots[globalIndex], sourceLabel: participantName };
      return { ...branch, flowSlots };
    }),
  };
};

const TeamSeedingBoard = ({ tournamentItemId, stages, onChangeStage }: Props) => {
  const [teams, setTeams] = useState<PlanningTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState(stages[0]?.id || "");
  const [criterion, setCriterion] = useState<AutoSeedCriterion>("skill");
  const [previewAssignments, setPreviewAssignments] = useState<StageSeedAssignment[]>([]);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSelectedStageId((current) => current && stages.some((stage) => stage.id === current) ? current : stages[0]?.id || "");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [stages]);

  useEffect(() => {
    let mounted = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      fetchPlanningTeams(tournamentItemId)
        .then((items) => {
          if (mounted) setTeams(items);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }, 0);
    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [tournamentItemId]);

  const selectedStage = stages.find((stage) => stage.id === selectedStageId) || stages[0];
  const assignedIds = useMemo(
    () => new Set(stages.flatMap((stage) => stage.seedAssignments || []).map((assignment) => assignment.participantId)),
    [stages],
  );
  const availableTeams = teams.filter((team) => !assignedIds.has(team.id));
  const graph = useMemo(() => mapStagesToFlow(stages), [stages]);
  const isGroupStage = selectedStage?.brackets.some((branch) => branch.type === "group");
  const firstKnockoutMatches = graph.nodes.filter((node) => node.kind === "match" && node.stageId === selectedStage?.id);

  const dropTeam = (slot: Omit<StageSeedAssignment, "participantId" | "participantName" | "participantLogo" | "sourceType">, teamId: string, globalIndex?: number) => {
    if (!selectedStage) return;
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;
    let nextStage: CompetitionStageConfig = removeTeamEverywhere(selectedStage, team.id);
    nextStage = clearAssignment(nextStage, slot.slotId);
    nextStage = setAssignment(nextStage, {
      ...slot,
      participantId: team.id,
      participantName: team.name,
      participantLogo: team.logo,
      sourceType: "PARTICIPANT",
    });
    if (!isGroupStage) {
      nextStage = applyKnockoutSlotLabel(nextStage, slot.branchId, slot.nodeId, globalIndex, team.name);
    }
    onChangeStage(nextStage);
  };

  const clearSlot = (slotId: string, branchId?: string, nodeId?: string, globalIndex?: number) => {
    if (!selectedStage) return;
    let nextStage: CompetitionStageConfig = clearAssignment(selectedStage, slotId);
    if (!isGroupStage) nextStage = applyKnockoutSlotLabel(nextStage, branchId, nodeId, globalIndex, undefined);
    onChangeStage(nextStage);
  };

  const handlePreviewAutoSeed = async () => {
    if (!selectedStage) return;
    setPreviewing(true);
    try {
      const result = await previewAutoSeed(tournamentItemId, selectedStage, criterion);
      const assignments = (result.assignments || []) as StageSeedAssignment[];
      setPreviewAssignments(assignments);
      let nextStage: CompetitionStageConfig = { ...selectedStage, seedAssignments: assignments };
      if (!isGroupStage) {
        assignments.forEach((assignment) => {
          const globalIndex = Number(String(assignment.slotId).split(":seed-")[1]);
          nextStage = applyKnockoutSlotLabel(nextStage, assignment.branchId, assignment.nodeId, Number.isFinite(globalIndex) ? globalIndex : undefined, assignment.participantName);
        });
      }
      onChangeStage(nextStage);
      toast.success(`Đã xem trước ${assignments.length} vị trí xếp đội.`);
      if (result.notes?.length) toast.info(result.notes.join("\n"));
    } catch (error) {
      console.error(error);
      toast.error(errorMessage(error, "Không thể xem trước phương án xếp đội."));
    } finally {
      setPreviewing(false);
    }
  };

  const applyPreview = () => {
    if (!selectedStage || !previewAssignments.length) return;
    confirmAutoSeed(tournamentItemId, selectedStage.id, criterion)
      .then(() => {
        setPreviewAssignments([]);
        toast.success("Đã lưu phương án xếp đội.");
      })
      .catch((error) => {
        console.error(error);
        toast.error(errorMessage(error, "Chưa thể lưu phương án xếp đội."));
      });
  };

  if (!selectedStage) {
    return <div className="rounded-lg border border-dashed border-border bg-card p-8 text-sm font-bold text-muted-foreground">Chưa có stage để gán đội.</div>;
  }

  return (
    <section className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-4">
      <aside className="rounded-lg border border-border bg-card p-3 shadow-sm xl:p-4">
        <div className="mb-3 xl:mb-4">
          <h2 className="text-sm font-bold uppercase text-foreground">Danh sách đội</h2>
          <p className="mt-1 hidden text-xs font-semibold text-muted-foreground sm:block">Kéo đội thật vào slot đầu vào. Slot kết quả như A1/M1/L1 sẽ bị khóa logic.</p>
        </div>
        <select
          value={selectedStage.id}
          onChange={(event) => setSelectedStageId(event.target.value)}
          className="mb-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-bold xl:mb-3"
        >
          {stages.map((stage) => <option key={stage.id} value={stage.id}>Stage {stage.order} - {stage.name}</option>)}
        </select>
        <div className="mb-2 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs font-bold text-muted-foreground xl:mb-3">
          <span>Chưa gán</span>
          <span>{availableTeams.length}/{teams.length}</span>
        </div>
        <div className="mb-3 rounded-lg border border-border bg-muted/20 p-2.5 xl:mb-4 xl:p-3">
          <label className="mb-2 block text-[11px] font-black uppercase text-muted-foreground">Tự động xếp đội</label>
          <select
            value={criterion}
            onChange={(event) => setCriterion(event.target.value as AutoSeedCriterion)}
            className="mb-2 h-9 w-full rounded-md border border-border bg-background px-2 text-xs font-bold text-foreground"
          >
            <option value="skill">Skill tương đồng</option>
            <option value="seed">Theo hạt giống</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void handlePreviewAutoSeed()}
              disabled={previewing}
              className="rounded-md border border-primary/30 bg-white px-2 py-2 text-xs font-black text-primary hover:bg-primary-light/20 disabled:opacity-60"
            >
              {previewing ? "Đang tính..." : "Xem trước"}
            </button>
            <button
              type="button"
              onClick={applyPreview}
              disabled={!previewAssignments.length}
              className="rounded-md bg-primary px-2 py-2 text-xs font-black text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
            >
              Áp dụng
            </button>
          </div>
          {previewAssignments.length > 0 && (
            <p className="mt-2 text-[11px] font-semibold text-muted-foreground">Đã tự đặt {previewAssignments.length} đội vào bản nháp. Có thể kéo tay để sửa, bấm Áp dụng để lưu thật.</p>
          )}
        </div>
        <div className="max-h-36 space-y-2 overflow-y-auto beautiful-scrollbar pr-1 sm:max-h-44 xl:max-h-[620px]">
          {loading ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs font-bold text-muted-foreground">Đang tải đội...</div>
          ) : availableTeams.length ? availableTeams.map((team) => (
            <div
              key={team.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData(teamMime, team.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              className="flex cursor-grab items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-foreground shadow-sm active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">{team.logo}</span>
              <span className="min-w-0 truncate">{team.name}</span>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs font-bold text-muted-foreground">Tất cả đội đã được gán.</div>
          )}
        </div>
      </aside>

      <main className="min-h-[58vh] overflow-y-auto rounded-lg border border-border bg-muted/20 p-3 beautiful-scrollbar xl:min-h-0 xl:p-4">
        {isGroupStage ? (
          <GroupSeeding stage={selectedStage} onDropTeam={dropTeam} onClear={clearSlot} />
        ) : (
          <KnockoutSeeding stage={selectedStage} matches={firstKnockoutMatches} onDropTeam={dropTeam} onClear={clearSlot} />
        )}
      </main>
    </section>
  );
};

const GroupSeeding = ({
  stage,
  onDropTeam,
  onClear,
}: {
  stage: CompetitionStageConfig;
  onDropTeam: (slot: Omit<StageSeedAssignment, "participantId" | "participantName" | "participantLogo" | "sourceType">, teamId: string) => void;
  onClear: (slotId: string) => void;
}) => {
  const branches = stage.brackets.filter((branch) => branch.type === "group");
  return (
    <div className="space-y-4">
      <Header title="Gán đội vào vòng bảng" subtitle="A1, A2... là thứ hạng sau khi đấu xong bảng, không phải slot kéo đội trực tiếp." />
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {branches.flatMap((branch) => (branch.groups?.length ? branch.groups : [{ name: branch.name, numberOfTeams: branch.totalTeamsIn }]).map((group, groupIndex) => (
          <div key={`${branch.id}-${groupIndex}`} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-foreground">{group.name}</h3>
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-black text-green-700">Group</span>
            </div>
            <div className="space-y-2">
              {Array.from({ length: Math.max(1, group.numberOfTeams) }, (_, slotIndex) => {
                const slotId = `${stage.id}:${branch.id}:group-${groupIndex + 1}:slot-${slotIndex + 1}`;
                const assigned = assignmentFor(stage, slotId);
                return (
                  <DropSlot
                    key={slotId}
                    label={`Seed ${slotIndex + 1}`}
                    assigned={assigned}
                    onDrop={(teamId) => onDropTeam({
                      slotId,
                      stageId: stage.id,
                      branchId: branch.id,
                      groupName: group.name,
                      slotLabel: `Seed ${slotIndex + 1}`,
                    }, teamId)}
                    onClear={() => onClear(slotId)}
                  />
                );
              })}
            </div>
          </div>
        )))}
      </div>
    </div>
  );
};

const KnockoutSeeding = ({
  stage,
  matches,
  onDropTeam,
  onClear,
}: {
  stage: CompetitionStageConfig;
  matches: ReturnType<typeof mapStagesToFlow>["nodes"];
  onDropTeam: (slot: Omit<StageSeedAssignment, "participantId" | "participantName" | "participantLogo" | "sourceType">, teamId: string, globalIndex?: number) => void;
  onClear: (slotId: string, branchId?: string, nodeId?: string, globalIndex?: number) => void;
}) => (
  <div className="space-y-4">
    <Header title="Gán đội vào knockout trực tiếp" subtitle="Chỉ gán đội vào các slot mở của vòng đầu. Các slot M.../L... là kết quả từ match trước và bị khóa." />
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {matches.map((match) => (
        <div key={match.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-foreground">{match.matchCode || match.title}</h3>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">Key thắng: {match.matchCode || match.title}</span>
          </div>
          <div className="space-y-2">
            {match.seedSlots.map((slot, slotIndex) => {
              const slotId = `${match.id}:seed-${slot.globalIndex ?? slotIndex}`;
              const assigned = assignmentFor(stage, slotId);
              const locked = Boolean(slot.locked);
              return (
                <DropSlot
                  key={slotId}
                  label={slot.sourceLabel || slot.label}
                  assigned={assigned}
                  locked={locked}
                  lockedText={slot.sourceLabel || "Kết quả từ match trước"}
                  onDrop={(teamId) => onDropTeam({
                    slotId,
                    stageId: stage.id,
                    branchId: match.branchId,
                    nodeId: match.id,
                    slotLabel: slot.label,
                  }, teamId, slot.globalIndex)}
                  onClear={() => onClear(slotId, match.branchId, match.id, slot.globalIndex)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DropSlot = ({
  label,
  assigned,
  locked,
  lockedText,
  onDrop,
  onClear,
}: {
  label: string;
  assigned?: StageSeedAssignment;
  locked?: boolean;
  lockedText?: string;
  onDrop: (teamId: string) => void;
  onClear: () => void;
}) => (
  <div
    onDragOver={(event) => {
      if (!locked && event.dataTransfer.types.includes(teamMime)) event.preventDefault();
    }}
    onDrop={(event) => {
      if (locked) return;
      event.preventDefault();
      const teamId = event.dataTransfer.getData(teamMime);
      if (teamId) onDrop(teamId);
    }}
    className={cn(
      "flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
      locked ? "border-border bg-muted text-muted-foreground" : assigned ? "border-primary/30 bg-primary/5" : "border-dashed border-border bg-background text-muted-foreground",
    )}
  >
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-card text-[10px] font-black shadow-sm">
        {assigned?.participantLogo || label.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate font-bold text-foreground">{assigned?.participantName || lockedText || "Kéo đội vào đây"}</p>
        <p className="truncate text-[10px] font-semibold text-muted-foreground">{label}</p>
      </div>
    </div>
    {assigned && !locked && (
      <button type="button" onClick={onClear} className="rounded-md px-2 py-1 text-xs font-black text-muted-foreground hover:bg-muted hover:text-foreground">
        Gỡ
      </button>
    )}
  </div>
);

const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <div className="flex items-center gap-2 text-sm font-black text-foreground">
      <Users className="h-4 w-4 text-primary" />
      {title}
    </div>
    <p className="mt-1 text-xs font-semibold text-muted-foreground">{subtitle}</p>
    <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
      <RotateCcw className="h-4 w-4" />
      Sau khi lưu, trang Trận & Lịch sẽ chỉ sinh/xếp lịch theo các slot đã gán, không kéo đội ở trang lịch nữa.
    </div>
  </div>
);

export default TeamSeedingBoard;
