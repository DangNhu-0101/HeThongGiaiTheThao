import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/libs/utils";
import type { BracketType } from "@/types/competitionFormat";
import type { BranchEditorProps } from "./flowTypes";

const branchTypes: Array<{ value: BracketType; label: string }> = [
  { value: "group", label: "Vòng bảng" },
  { value: "knockout", label: "Knockout tree" },
  { value: "swiss", label: "Swiss" },
  { value: "custom", label: "Custom" },
];

const makeGroups = (totalTeams: number, count: number) =>
  Array.from({ length: Math.max(1, count) }, (_, index) => ({
    name: `Bảng ${String.fromCharCode(65 + index)}`,
    numberOfTeams: Math.max(1, Math.ceil(totalTeams / Math.max(1, count))),
  }));

const BranchEditor = ({ branch, index, focused, onFocus, onChange, onDelete, canDelete }: BranchEditorProps) => {
  const groupCount = branch.groups?.length || 0;
  const teamsPerGroup = Math.max(1, branch.groups?.[0]?.numberOfTeams || Math.ceil(branch.totalTeamsIn / Math.max(1, groupCount || 1)));
  const defaultMatchCount = Math.max(1, Math.ceil(Math.max(2, branch.totalTeamsIn || 2) / 2));
  const externalTeamsIn = Math.max(2, branch.totalTeamsIn || 2);
  const [teamsInInput, setTeamsInInput] = useState({ externalValue: externalTeamsIn, value: String(externalTeamsIn) });
  const teamsInDraft = teamsInInput.externalValue === externalTeamsIn ? teamsInInput.value : String(externalTeamsIn);

  const applyTeamsInDraft = (nextDraft: string, finalize = false) => {
    const parsed = Number(nextDraft);
    if (!Number.isFinite(parsed)) {
      setTeamsInInput({ externalValue: externalTeamsIn, value: nextDraft });
      return;
    }
    const rawTeamsIn = Math.max(2, Math.trunc(parsed));
    const totalTeamsIn = rawTeamsIn % 2 === 0 ? rawTeamsIn : rawTeamsIn + 1;
    setTeamsInInput({ externalValue: totalTeamsIn, value: finalize ? String(totalTeamsIn) : nextDraft });
    if (totalTeamsIn === branch.totalTeamsIn) return;
    onChange({
      totalTeamsIn,
      selection: {
        ...branch.selection,
        slots: Math.max(1, Math.ceil(totalTeamsIn / 2)),
      },
    });
  };

  const commitTeamsInDraft = () => {
    const parsed = Number(teamsInDraft);
    const rawTeamsIn = Number.isFinite(parsed) ? Math.max(2, Math.trunc(parsed)) : Math.max(2, branch.totalTeamsIn || 2);
    const totalTeamsIn = rawTeamsIn % 2 === 0 ? rawTeamsIn : rawTeamsIn + 1;
    setTeamsInInput({ externalValue: totalTeamsIn, value: String(totalTeamsIn) });
    if (totalTeamsIn === branch.totalTeamsIn) return;
    onChange({
      totalTeamsIn,
      selection: {
        ...branch.selection,
        slots: Math.max(1, Math.ceil(totalTeamsIn / 2)),
      },
    });
  };

  const setGroupShape = (groups: number, perGroup: number) => {
    const safeGroups = Math.max(1, groups);
    const safePerGroup = Math.max(1, perGroup);
    onChange({
      totalTeamsIn: safeGroups * safePerGroup,
      groups: makeGroups(safeGroups * safePerGroup, safeGroups).map((group) => ({ ...group, numberOfTeams: safePerGroup })),
    });
  };
  const addStandaloneMatch = () => {
    const index = (branch.flowStandaloneMatches || []).length + 1;
    const id = `${branch.id}:custom-${Date.now()}`;
    onChange({
      flowStandaloneMatches: [
        ...(branch.flowStandaloneMatches || []),
        {
          id,
          matchCode: `Custom ${index}`,
          seedSlots: [
            { id: `${id}:slot-1`, label: "Slot 1" },
            { id: `${id}:slot-2`, label: "Slot 2" },
          ],
        },
      ],
    });
  };
  const deleteStandaloneMatch = (matchId: string) => {
    const flowConnections = (branch.flowConnections || []).filter((connection) => connection.source !== matchId && connection.target !== matchId);
    const routeIds = new Set(flowConnections.map((connection) => connection.id));
    onChange({
      flowStandaloneMatches: (branch.flowStandaloneMatches || []).filter((match) => match.id !== matchId),
      flowConnections,
      flowConnectionRoutes: Object.fromEntries(
        Object.entries(branch.flowConnectionRoutes || {}).filter(([edgeId]) => routeIds.has(edgeId)),
      ),
      flowNodePositions: Object.fromEntries(
        Object.entries(branch.flowNodePositions || {}).filter(([nodeId]) => nodeId !== matchId),
      ),
    });
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm transition-all",
        focused ? "border-ring ring-4 ring-ring/10" : "border-border",
      )}
      onClick={onFocus}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-primary">Nhánh {index + 1}</p>
          <h4 className="text-sm font-black text-foreground">{branch.name || `Nhánh ${index + 1}`}</h4>
        </div>
        <Button type="button" variant="ghost" size="icon-xs" className="text-destructive" onClick={onDelete} disabled={!canDelete} title="Xóa nhánh">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Tên nhánh</Label>
          <Input value={branch.name} onChange={(event) => onChange({ name: event.target.value })} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Loại nhánh</Label>
          <select
            className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-sm"
            value={branch.type}
            onChange={(event) => {
              const type = event.target.value as BracketType;
              onChange({
                type,
                groups: type === "group" ? makeGroups(branch.totalTeamsIn, Math.max(1, groupCount || 2)) : branch.groups,
              });
            }}
          >
            {branchTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
      </div>

      {branch.type === "group" && (
        <div className="mt-3 rounded-lg border border-border bg-muted/25 p-3">
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Số bảng</Label>
              <Input
                type="number"
                min={1}
                value={groupCount || 1}
                onChange={(event) => setGroupShape(Number(event.target.value), teamsPerGroup)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Số đội mỗi bảng</Label>
              <Input
                type="number"
                min={1}
                value={teamsPerGroup}
                onChange={(event) => setGroupShape(groupCount || 1, Number(event.target.value))}
              />
            </div>
          </div>
          <Label>Danh sách bảng tự sinh</Label>
          <div className="grid gap-2">
            {(branch.groups || []).map((group, groupIndex) => (
              <div key={`${branch.id}-group-${groupIndex}`} className="grid grid-cols-[1fr_88px] gap-2">
                <Input
                  value={group.name}
                  onChange={(event) => onChange({
                    groups: (branch.groups || []).map((item, current) => current === groupIndex ? { ...item, name: event.target.value } : item),
                  })}
                />
                <Input
                  type="number"
                  min={1}
                  value={group.numberOfTeams}
                  onChange={(event) => onChange({
                    groups: (branch.groups || []).map((item, current) => current === groupIndex ? { ...item, numberOfTeams: Number(event.target.value) } : item),
                  })}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {branch.type === "knockout" && (
        <div className="mt-3 rounded-lg border border-border bg-muted/25 p-3">
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Số đội / Slot trong nhánh</Label>
              <Input
                type="number"
                min={2}
                step={1}
                inputMode="numeric"
                value={teamsInDraft}
                onChange={(event) => applyTeamsInDraft(event.target.value)}
                onBlur={commitTeamsInDraft}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
              />
            </div>
            <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground">
              <span className="block text-[11px] font-black uppercase text-foreground">Trận mặc định</span>
              <span className="mt-1 block">{defaultMatchCount} match - moi match 2 slot</span>
            </div>
          </div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <Label>Match thêm thủ công</Label>
            <Button type="button" variant="outline" size="sm" onClick={addStandaloneMatch}>
              <Plus className="h-4 w-4" /> Thêm match
            </Button>
          </div>
          <div className="space-y-2">
            {(branch.flowStandaloneMatches || []).map((match, matchIndex) => (
              <div key={match.id} className="grid grid-cols-[1fr_auto] gap-2">
                <Input
                  value={match.matchCode}
                  onChange={(event) => onChange({
                    flowStandaloneMatches: (branch.flowStandaloneMatches || []).map((item) => item.id === match.id
                      ? { ...item, matchCode: event.target.value || `Custom ${matchIndex + 1}` }
                      : item),
                  })}
                />
                <Button type="button" variant="ghost" size="icon-sm" className="text-destructive" onClick={() => deleteStandaloneMatch(match.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(branch.flowStandaloneMatches || []).length === 0 && (
              <p className="text-xs font-semibold text-muted-foreground">Chưa có match thủ công.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchEditor;
