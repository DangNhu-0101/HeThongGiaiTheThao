import { ArrowDown, GitBranch, Plus, TicketCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  BracketType,
  CompetitionStageConfig,
  StageBracketConfig,
  StageTeamSelection,
  TeamSelectionMode,
} from "@/types/competitionFormat";

interface Props {
  stage: CompetitionStageConfig;
  allStages: CompetitionStageConfig[];
  sportType: string;
  onChange: (stage: CompetitionStageConfig) => void;
}

const selectionLabels: Record<TeamSelectionMode, string> = {
  WINNER: "Đội thắng",
  LOSER: "Đội thua",
  TOP_RANKS: "Theo thứ hạng top 1, 2, 3...",
  MANUAL: "Ban tổ chức tự chọn đội",
};

const bracketTypeLabels: Record<BracketType, string> = {
  group: "Vòng bảng / bảng đấu",
  knockout: "Loại trực tiếp / nhánh đấu",
  swiss: "Swiss",
  custom: "Tuỳ chỉnh",
};

const defaultSelection = (mode: TeamSelectionMode = "WINNER", slots = 2): StageTeamSelection => ({
  mode,
  slots,
  ranks: mode === "TOP_RANKS" ? [1, 2] : [],
  manualTeamIds: [],
});

const defaultGroups = (totalTeamsIn: number, count = 2) =>
  Array.from({ length: Math.max(1, count) }, (_, index) => ({
    name: `Bảng ${String.fromCharCode(65 + index)}`,
    numberOfTeams: Math.max(2, Math.ceil(totalTeamsIn / Math.max(1, count))),
  }));

const SelectionEditor = ({
  value,
  onChange,
  label,
  candidateCount,
  candidateLabel,
}: {
  value: StageTeamSelection;
  onChange: (value: StageTeamSelection) => void;
  label: string;
  candidateCount: number;
  candidateLabel: string;
}) => {
  const set = (patch: Partial<StageTeamSelection>) => onChange({ ...value, ...patch });
  const modes: TeamSelectionMode[] = ["WINNER", "LOSER", "TOP_RANKS", "MANUAL"];

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_130px]">
        <div className="space-y-2">
          <Label>{label}</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={value.mode}
            onChange={(event) => {
              const mode = event.target.value as TeamSelectionMode;
              set({ mode, ranks: mode === "TOP_RANKS" ? (value.ranks.length ? value.ranks : [1, 2]) : [] });
            }}
          >
            {modes.map((mode) => <option key={mode} value={mode}>{selectionLabels[mode]}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Số suất</Label>
          <Input type="number" min={0} value={value.slots} onChange={(event) => set({ slots: Number(event.target.value) })} />
        </div>
      </div>

      {value.mode === "TOP_RANKS" && (
        <div>
          <Label>Thứ hạng được lấy</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.from({ length: Math.max(8, value.slots) }, (_, index) => index + 1).map((rank) => (
              <label key={rank} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-bold ${value.ranks.includes(rank) ? "border-primary bg-primary/5 text-primary" : "border-border"}`}>
                <input
                  type="checkbox"
                  checked={value.ranks.includes(rank)}
                  onChange={(event) => set({
                    ranks: event.target.checked
                      ? [...value.ranks, rank].sort((a, b) => a - b)
                      : value.ranks.filter((item) => item !== rank),
                  })}
                />
                Top {rank}
              </label>
            ))}
          </div>
        </div>
      )}

      {value.mode === "MANUAL" && (
        <div className="space-y-2">
          <Label>Hiện danh sách để người dùng tự chọn</Label>
          <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-md border border-border p-3 md:grid-cols-4">
            {Array.from({ length: Math.min(Math.max(candidateCount, 1), 32) }, (_, index) => {
              const id = `slot-${index + 1}`;
              return (
                <label key={id} className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-2 text-xs ${value.manualTeamIds.includes(id) ? "border-primary bg-primary/5 text-primary" : "border-border"}`}>
                  <input
                    type="checkbox"
                    checked={value.manualTeamIds.includes(id)}
                    onChange={(event) => set({
                      manualTeamIds: event.target.checked
                        ? [...value.manualTeamIds, id]
                        : value.manualTeamIds.filter((item) => item !== id),
                    })}
                  />
                  {candidateLabel} {index + 1}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const RoundConfigCard = ({ stage, allStages, sportType, onChange }: Props) => {
  const set = <K extends keyof CompetitionStageConfig>(key: K, value: CompetitionStageConfig[K]) =>
    onChange({ ...stage, [key]: value });
  const setInput = (patch: Partial<CompetitionStageConfig["input"]>) =>
    set("input", { ...stage.input, ...patch });
  const setScoring = (key: keyof CompetitionStageConfig["scoring"], value: number) =>
    set("scoring", { ...stage.scoring, [key]: value });
  const setBracket = (index: number, patch: Partial<StageBracketConfig>) => {
    set("brackets", stage.brackets.map((branch, current) =>
      current === index ? { ...branch, ...patch } : branch));
  };

  const previousStage = allStages.find((item) => item.order === stage.order - 1);
  const nextStage = allStages.find((item) => item.order === stage.order + 1);
  const previousAvailableSlots = previousStage
    ? previousStage.brackets.reduce((sum, branch) => sum + branch.selection.slots, 0)
      + (previousStage.wildcard.enabled ? previousStage.wildcard.selection.slots : 0)
    : stage.input.teams;
  const bracketSlots = stage.brackets.reduce((sum, branch) => sum + branch.selection.slots, 0);
  const totalAdvance = bracketSlots + (stage.wildcard.enabled ? stage.wildcard.selection.slots : 0);

  const addBracket = () => {
    const index = stage.brackets.length;
    set("brackets", [...stage.brackets, {
      id: `stage-${stage.order}-bracket-${Date.now()}`,
      name: `Nhánh ${index + 1}`,
      type: index === 0 ? "group" : "knockout",
      totalTeamsIn: Math.max(2, stage.input.teams),
      groups: index === 0 ? defaultGroups(Math.max(2, stage.input.teams), stage.input.groups || 2) : [],
      groupIds: [],
      selection: defaultSelection("WINNER", 2),
    }]);
  };

  return (
    <Card className="border-border p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-black text-primary">{stage.order}</div>
          <div>
            <p className="text-xs font-black uppercase text-primary">Chặng thi đấu {stage.order}</p>
            <h3 className="mt-1 text-lg font-black text-foreground">{stage.name || `Chặng ${stage.order}`}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{sportType} · mặc định mỗi chặng có ít nhất 1 nhánh.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground md:min-w-80">
          <div className="rounded-md bg-muted px-3 py-2">Đầu vào: <span className="font-bold text-foreground">{stage.input.teams} đội</span></div>
          <div className="rounded-md bg-muted px-3 py-2">Sang chặng sau: <span className="font-bold text-foreground">{totalAdvance} suất</span></div>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
        <h4 className="text-sm font-black uppercase text-blue-900">Đầu vào chặng</h4>
        {stage.order === 1 ? (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-white p-3 text-sm"><span className="block text-xs text-muted-foreground">Nguồn</span><strong>Danh sách đội đăng ký</strong></div>
            <div className="space-y-2"><Label>Số đội đầu vào</Label><Input type="number" min={2} value={stage.input.teams} onChange={(event) => setInput({ teams: Number(event.target.value), selection: { ...stage.input.selection, slots: Number(event.target.value) } })} /></div>
            <div className="space-y-2"><Label>Số bảng/nhóm dự kiến</Label><Input type="number" min={0} value={stage.input.groups || 0} onChange={(event) => setInput({ groups: Number(event.target.value) })} /></div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-white p-3">
              <span className="rounded-md bg-primary/10 px-3 py-2 text-sm font-bold text-primary">{previousStage?.name || `Chặng ${stage.order - 1}`}</span>
              <ArrowDown className="h-4 w-4 -rotate-90 text-muted-foreground" />
              <span className="text-sm font-bold">{stage.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">Nguồn luôn lấy từ chặng liền trước</span>
            </div>
            <SelectionEditor
              label="Lấy đội từ chặng trước theo"
              value={stage.input.selection}
              candidateCount={previousAvailableSlots}
              candidateLabel="Suất"
              onChange={(selection) => setInput({ selection, teams: selection.slots, sourceStageId: previousStage?.id || "" })}
            />
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="space-y-2"><Label>Chạm điểm</Label><Input type="number" min={1} value={stage.scoring.targetScore} onChange={(event) => setScoring("targetScore", Number(event.target.value))} /></div>
          <div className="space-y-2"><Label>Đổi sân tại</Label><Input type="number" min={0} value={stage.scoring.changeSideAt} onChange={(event) => setScoring("changeSideAt", Number(event.target.value))} /></div>
          <div className="space-y-2"><Label>Điểm thắng</Label><Input type="number" value={stage.scoring.winPoints} onChange={(event) => setScoring("winPoints", Number(event.target.value))} /></div>
          <div className="space-y-2"><Label>Điểm thua</Label><Input type="number" value={stage.scoring.lossPoints} onChange={(event) => setScoring("lossPoints", Number(event.target.value))} /></div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-black uppercase text-foreground"><GitBranch className="h-4 w-4 text-primary" /> Nhánh trong chặng</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Field map theo Bracket BE: TournamentItem, stageId, type, name, totalTeamsIn, group.
              {nextStage ? ` Kết quả nhánh là nguồn cho ${nextStage.name}.` : " Đây là chặng cuối."}
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addBracket}>
            <Plus className="mr-1 h-4 w-4" /> Thêm nhánh
          </Button>
        </div>

        <div className="space-y-3">
          {stage.brackets.map((branch, index) => (
            <div key={branch.id} className="rounded-lg bg-muted/25 p-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_150px_auto]">
                <div className="space-y-2">
                  <Label>Tên nhánh</Label>
                  <Input value={branch.name} onChange={(event) => setBracket(index, { name: event.target.value })} placeholder="VD: Bảng A / Nhánh thắng" />
                </div>
                <div className="space-y-2">
                  <Label>Loại nhánh</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={branch.type}
                    onChange={(event) => {
                      const type = event.target.value as BracketType;
                      setBracket(index, {
                        type,
                        groups: type === "group" && (!branch.groups || branch.groups.length === 0)
                          ? defaultGroups(branch.totalTeamsIn, stage.input.groups || 2)
                          : branch.groups,
                      });
                    }}
                  >
                    {Object.entries(bracketTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Số đội trong nhánh</Label>
                  <Input type="number" min={2} value={branch.totalTeamsIn} onChange={(event) => setBracket(index, { totalTeamsIn: Number(event.target.value) })} />
                </div>
                <Button type="button" size="icon" variant="ghost" className="self-end text-red-600" onClick={() => set("brackets", stage.brackets.filter((_, current) => current !== index))} disabled={stage.brackets.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {branch.type === "group" && (
                <div className="mt-3 rounded-lg border border-border bg-background p-3">
                  <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <Label>Groups gửi lên BE</Label>
                      <p className="mt-1 text-xs text-muted-foreground">BE yêu cầu groups gồm name và numberOfTeams khi type là group.</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => setBracket(index, { groups: defaultGroups(branch.totalTeamsIn, stage.input.groups || 2) })}>
                      Tạo lại bảng
                    </Button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {(branch.groups || []).map((group, groupIndex) => (
                      <div key={`${branch.id}-group-${groupIndex}`} className="grid grid-cols-[1fr_120px] gap-2">
                        <Input
                          value={group.name}
                          onChange={(event) => setBracket(index, {
                            groups: (branch.groups || []).map((item, current) => current === groupIndex ? { ...item, name: event.target.value } : item),
                          })}
                        />
                        <Input
                          type="number"
                          min={2}
                          value={group.numberOfTeams}
                          onChange={(event) => setBracket(index, {
                            groups: (branch.groups || []).map((item, current) => current === groupIndex ? { ...item, numberOfTeams: Number(event.target.value) } : item),
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-3">
                <SelectionEditor
                  label="Đội đi tiếp từ nhánh này theo"
                  value={branch.selection}
                  candidateCount={branch.totalTeamsIn}
                  candidateLabel="Đội"
                  onChange={(selection) => setBracket(index, { selection })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={stage.wildcard.enabled}
            onChange={(event) => set("wildcard", {
              ...stage.wildcard,
              enabled: event.target.checked,
              selection: event.target.checked && stage.wildcard.selection.slots === 0
                ? defaultSelection("LOSER", 1)
                : stage.wildcard.selection,
            })}
          />
          <TicketCheck className="h-5 w-5 text-amber-700" />
          <span>
            <span className="block text-sm font-black text-amber-950">Dùng vé vớt</span>
            <span className="block text-xs text-amber-800">Nếu bật, vé vớt được cộng vào nguồn cho chặng sau.</span>
          </span>
        </label>
        {stage.wildcard.enabled && (
          <div className="mt-4">
            <SelectionEditor
              label="Lấy vé vớt theo"
              value={stage.wildcard.selection}
              candidateCount={stage.input.teams}
              candidateLabel="Đội"
              onChange={(selection) => set("wildcard", { enabled: true, selection })}
            />
          </div>
        )}
      </div>

      <div className="mt-5 space-y-2">
        <Label>Ghi chú chặng</Label>
        <Input value={stage.note || ""} onChange={(event) => set("note", event.target.value)} placeholder="Quy tắc riêng của chặng" />
      </div>
    </Card>
  );
};

export default RoundConfigCard;
