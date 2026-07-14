import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RankingCriterion, StageBracketConfig } from "@/types/competitionFormat";
import BranchEditor from "./BranchEditor";
import type { StageEditorProps } from "./flowTypes";

const defaultSelection = (slots = 2) => ({
  mode: "WINNER" as const,
  slots,
  ranks: [],
  manualTeamIds: [],
});

const criteriaLabels: Record<RankingCriterion, string> = {
  points: "Điểm",
  pointDiff: "Hiệu số",
  headToHead: "Đối đầu trực tiếp",
  draw: "Bốc thăm",
};

const criteriaOptions = Object.keys(criteriaLabels) as RankingCriterion[];

const defaultGroups = (totalTeams: number, count = 2) =>
  Array.from({ length: Math.max(1, count) }, (_, index) => ({
    name: `Bảng ${String.fromCharCode(65 + index)}`,
    numberOfTeams: Math.max(1, Math.ceil(totalTeams / Math.max(1, count))),
  }));

const evenMatchSlotCount = (value: number) => {
  const safe = Math.max(2, Number(value) || 2);
  return safe % 2 === 0 ? safe : safe + 1;
};

const normalizeBranchSlots = (branch: StageBracketConfig): StageBracketConfig => {
  if (branch.type !== "knockout") return branch;
  const totalTeamsIn = evenMatchSlotCount(branch.totalTeamsIn);
  return {
    ...branch,
    totalTeamsIn,
    flowSlots: branch.flowSlots?.length
      ? Array.from({ length: totalTeamsIn }, (_, index) => branch.flowSlots?.[index] || {
        id: `${branch.id}-slot-${index + 1}`,
        label: `Slot ${index + 1}`,
      })
      : branch.flowSlots,
    flowStandaloneMatches: branch.flowStandaloneMatches?.map((match) => ({
      ...match,
      seedSlots: Array.from({ length: 2 }, (_, index) => match.seedSlots?.[index] || {
        id: `${match.id}:slot-${index + 1}`,
        label: `Slot ${index + 1}`,
      }),
    })),
    selection: {
      ...branch.selection,
      slots: Math.max(1, branch.selection?.slots || Math.ceil(totalTeamsIn / 2)),
    },
  };
};

const moveItem = <T,>(items: T[], from: number, to: number) => {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const CriteriaOrder = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: RankingCriterion[];
  onChange: (value: RankingCriterion[]) => void;
}) => {
  const active: RankingCriterion[] = value.length ? value : ["points", "pointDiff", "headToHead", "draw"];
  const toggle = (criterion: RankingCriterion) => {
    onChange(active.includes(criterion)
      ? active.filter((item) => item !== criterion)
      : [...active, criterion]);
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <Label>{label}</Label>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">Chọn nhìều tiêu chí. Thứ tự trái sang phải là thứ tự ưu tiên xét.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {criteriaOptions.map((criterion) => (
          <button
            key={criterion}
            type="button"
            onClick={() => toggle(criterion)}
            className={`rounded-md border px-3 py-2 text-xs font-black ${active.includes(criterion) ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground"}`}
          >
            {criteriaLabels[criterion]}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {active.map((criterion, index) => (
          <span
            key={criterion}
            draggable
            onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const from = Number(event.dataTransfer.getData("text/plain"));
              if (Number.isNaN(from) || from === index) return;
              onChange(moveItem(active, from, index));
            }}
            className="inline-flex cursor-grab items-center gap-1 rounded-md border border-ring/30 bg-card px-3 py-2 text-xs font-black text-foreground shadow-sm active:cursor-grabbing"
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            {index + 1}. {criteriaLabels[criterion]}
          </span>
        ))}
      </div>
    </div>
  );
};

const StageEditor = ({
  stage,
  focusedBranchId,
  onFocusBranch,
  onChange,
  onDelete,
  canDelete,
}: StageEditorProps) => {
  const updateStage = <K extends keyof typeof stage>(key: K, value: (typeof stage)[K]) => {
    onChange({ ...stage, [key]: value });
  };
  const updateScoring = (patch: Partial<typeof stage.scoring>) => updateStage("scoring", { ...stage.scoring, ...patch });
  const updateBranch = (branchId: string, patch: Partial<StageBracketConfig>) => {
    const brackets = stage.brackets.map((branch) => branch.id === branchId ? normalizeBranchSlots({ ...branch, ...patch }) : branch);
    const groupBranch = brackets.find((branch) => branch.type === "group");
    if (stage.order === 1 && groupBranch) {
      const groups = Math.max(1, groupBranch.groups?.length || stage.input.groups || 1);
      const teamsPerGroup = Math.max(1, groupBranch.groups?.[0]?.numberOfTeams || stage.input.teamsPerGroup || 1);
      onChange({
        ...stage,
        input: { ...stage.input, groups, teamsPerGroup, teams: Math.max(1, groupBranch.totalTeamsIn) },
        brackets,
      });
      return;
    }
    updateStage("brackets", brackets);
  };
  const addBranch = () => {
    const branchIndex = stage.brackets.length + 1;
    const source = stage.brackets.find((branch) => branch.id === focusedBranchId) || stage.brackets[stage.brackets.length - 1];
    const totalTeamsIn = stage.order === 1 ? Math.max(2, stage.input.teams) : 2;
    const branch: StageBracketConfig = normalizeBranchSlots(source
      ? {
        ...JSON.parse(JSON.stringify(source)) as StageBracketConfig,
        id: `${stage.id}-branch-${Date.now()}`,
        name: `${source.name || "Nhánh"} copy`,
        flowNodePositions: undefined,
        flowConnections: undefined,
        flowStandaloneMatches: undefined,
      }
      : {
        id: `${stage.id}-branch-${Date.now()}`,
        name: `Nhánh ${branchIndex}`,
        type: stage.order === 1 ? "group" : "knockout",
        totalTeamsIn,
        groups: stage.order === 1 ? defaultGroups(totalTeamsIn, stage.input.groups || 2) : [],
        groupIds: [],
        selection: defaultSelection(1),
      });
    updateStage("brackets", [...stage.brackets, branch]);
    onFocusBranch(branch.id);
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-primary">Stage {stage.order}</p>
          <h3 className="text-lg font-black text-foreground">{stage.name || `Stage ${stage.order}`}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {stage.order === 1 ? "Vòng bảng luôn đấu Round Robin 1 lượt, tự sinh key A1, A2..." : "Knockout chỉ nhận seed bằng kéo thả trên canvas."}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" className="text-destructive" onClick={onDelete} disabled={!canDelete} title="Xóa stage">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Tên Stage</Label>
          <Input value={stage.name} onChange={(event) => updateStage("name", event.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Điểm chạm</Label>
          <Input type="number" min={1} value={stage.scoring.targetScore} onChange={(event) => updateScoring({ targetScore: Number(event.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <Label>Đổi sân tại</Label>
          <Input type="number" min={0} value={stage.scoring.changeSideAt} onChange={(event) => updateScoring({ changeSideAt: Number(event.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <Label>Đấu bao nhìêu set</Label>
          <Input type="number" min={1} value={stage.scoring.setsToWin || 1} onChange={(event) => updateScoring({ setsToWin: Number(event.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <Label>Thắng cách điểm</Label>
          <Input type="number" min={1} value={stage.scoring.winBy || 2} onChange={(event) => updateScoring({ winBy: Number(event.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <Label>Điểm thắng</Label>
          <Input type="number" value={stage.scoring.winPoints} onChange={(event) => updateScoring({ winPoints: Number(event.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <Label>Điểm thua</Label>
          <Input type="number" value={stage.scoring.lossPoints} onChange={(event) => updateScoring({ lossPoints: Number(event.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <Label>Điểm hòa</Label>
          <Input type="number" value={stage.scoring.drawPoints} onChange={(event) => updateScoring({ drawPoints: Number(event.target.value) })} />
        </div>
      </div>

      {stage.order === 1 && (
        <div className="mt-4">
          <CriteriaOrder
            label="Tiêu chí tính điểm xếp hạng vòng bảng"
            value={stage.rankingCriteria || ["points", "pointDiff", "headToHead", "draw"]}
            onChange={(rankingCriteria) => updateStage("rankingCriteria", rankingCriteria)}
          />
        </div>
      )}

      <div className="mt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Label>Nhánh / cây đấu</Label>
          <Button type="button" variant="outline" size="sm" onClick={addBranch}>
            <Plus className="h-4 w-4" /> Thêm nhánh
          </Button>
        </div>
        <div className="space-y-6">
          {stage.brackets.map((branch, index) => (
            <BranchEditor
              key={branch.id}
              branch={branch}
              index={index}
              focused={focusedBranchId === branch.id}
              onFocus={() => onFocusBranch(branch.id)}
              onChange={(patch) => updateBranch(branch.id, patch)}
              onDelete={() => updateStage("brackets", stage.brackets.filter((item) => item.id !== branch.id))}
              canDelete={stage.brackets.length > 1}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            className="mt-1"
            type="checkbox"
            checked={stage.wildcard.enabled}
            onChange={(event) => updateStage("wildcard", {
              ...stage.wildcard,
              enabled: event.target.checked,
              selection: event.target.checked && stage.wildcard.selection.slots === 0
                ? { mode: "MANUAL", slots: 2, ranks: [], manualTeamIds: [] }
                : stage.wildcard.selection,
            })}
          />
          <span>
            <span className="block text-sm font-black text-amber-950">Vé vớt</span>
            <span className="block text-xs font-semibold leading-5 text-amber-800">Bật để sinh Lucky1, Lucky2... trong sidebar kéo thả. Tiêu chí bên dưới cũng sắp theo thứ tự trái sang phải.</span>
          </span>
        </label>
        {stage.wildcard.enabled && (
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label>Số đội vé vớt</Label>
              <Input
                type="number"
                min={1}
                value={stage.wildcard.selection.slots}
                onChange={(event) => updateStage("wildcard", {
                  ...stage.wildcard,
                  selection: { ...stage.wildcard.selection, slots: Number(event.target.value) },
                })}
              />
            </div>
            <CriteriaOrder
              label="Tiêu chí lấy vé vớt"
              value={stage.luckyCriteria || ["points", "pointDiff", "draw"]}
              onChange={(luckyCriteria) => updateStage("luckyCriteria", luckyCriteria)}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default StageEditor;
