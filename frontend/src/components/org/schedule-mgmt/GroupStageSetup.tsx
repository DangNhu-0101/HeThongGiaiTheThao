import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, GripVertical, RotateCcw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { competitionFormatService } from "@/services/competitionFormatService";
import { fetchPlanningTeams, type PlanningTeam } from "@/services/orgMatchPlanningService";
import type { CompetitionFormatRecord, CompetitionStageConfig } from "@/types/competitionFormat";
import type { ScheduleGroupGenerationPayload, VenueColumn } from "@/types/orgScheduleMgmt";
import { cn } from "@/libs/utils";

type SetupGroup = {
  id: string;
  name: string;
  slots: Array<PlanningTeam | null>;
};

interface Props {
  tournamentItemId: string;
  venues: VenueColumn[];
  onGenerate: (payload: ScheduleGroupGenerationPayload) => Promise<void>;
}

const teamMime = "application/x-schedule-team";

const defaultStartAt = () => {
  const date = new Date();
  date.setHours(8, 0, 0, 0);
  return date.toISOString().slice(0, 16);
};

const firstGroupStage = (format: CompetitionFormatRecord | null): CompetitionStageConfig | undefined =>
  format?.stages.find((stage) => stage.brackets.some((branch) => branch.type === "group")) || format?.stages[0];

const buildGroups = (stage: CompetitionStageConfig | undefined, teamCount: number): SetupGroup[] => {
  const groupBranch = stage?.brackets.find((branch) => branch.type === "group");
  const configuredGroups = groupBranch?.groups?.length
    ? groupBranch.groups
    : Array.from({ length: Math.max(1, stage?.input.groups || 1) }, (_, index) => ({
      name: `Bảng ${String.fromCharCode(65 + index)}`,
      numberOfTeams: Math.max(2, stage?.input.teamsPerGroup || Math.ceil(Math.max(teamCount, 2) / Math.max(1, stage?.input.groups || 1))),
    }));

  return configuredGroups.map((group, index) => ({
    id: `${stage?.id || "stage-1"}:group-${index + 1}`,
    name: group.name || `Bảng ${String.fromCharCode(65 + index)}`,
    slots: Array.from({ length: Math.max(1, Number(group.numberOfTeams) || 1) }, () => null),
  }));
};

const GroupStageSetup = ({ tournamentItemId, venues, onGenerate }: Props) => {
  const [format, setFormat] = useState<CompetitionFormatRecord | null>(null);
  const [teams, setTeams] = useState<PlanningTeam[]>([]);
  const [groups, setGroups] = useState<SetupGroup[]>([]);
  const [startAt, setStartAt] = useState(defaultStartAt);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stage = useMemo(() => firstGroupStage(format), [format]);
  const assignedIds = useMemo(
    () => new Set(groups.flatMap((group) => group.slots.map((team) => team?.id).filter(Boolean) as string[])),
    [groups],
  );
  const availableTeams = teams.filter((team) => !assignedIds.has(team.id));
  const assignedCount = assignedIds.size;
  const slotCount = groups.reduce((sum, group) => sum + group.slots.length, 0);
  const matchCount = groups.reduce((sum, group) => {
    const filled = group.slots.filter(Boolean).length;
    return sum + (filled * (filled - 1)) / 2;
  }, 0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      competitionFormatService.getTournamentFormat(tournamentItemId),
      fetchPlanningTeams(tournamentItemId),
    ])
      .then(([nextFormat, nextTeams]) => {
        if (!mounted) return;
        setFormat(nextFormat);
        setTeams(nextTeams);
        setGroups(buildGroups(firstGroupStage(nextFormat), nextTeams.length));
      })
      .catch((reason) => {
        if (!mounted) return;
        setError(reason instanceof Error ? reason.message : "Không thể tải dữ liệu xếp bảng.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [tournamentItemId]);

  const moveTeamToSlot = (teamId: string, groupIndex: number, slotIndex: number) => {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;
    setGroups((current) => current.map((group, currentGroupIndex) => ({
      ...group,
      slots: group.slots.map((slot, currentSlotIndex) => {
        if (slot?.id === teamId) return null;
        if (currentGroupIndex === groupIndex && currentSlotIndex === slotIndex) return team;
        return slot;
      }),
    })));
  };

  const clearSlot = (groupIndex: number, slotIndex: number) => {
    setGroups((current) => current.map((group, currentGroupIndex) => ({
      ...group,
      slots: currentGroupIndex === groupIndex
        ? group.slots.map((slot, currentSlotIndex) => currentSlotIndex === slotIndex ? null : slot)
        : group.slots,
    })));
  };

  const autoFill = () => {
    let cursor = 0;
    setGroups((current) => current.map((group) => ({
      ...group,
      slots: group.slots.map(() => teams[cursor++] || null),
    })));
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onGenerate({
        tournamentItemId,
        stageOrder: stage?.order || 1,
        stageName: stage?.name || "Vòng bảng",
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
        matchMinutes: 30,
        gapMinutes: 10,
        groups: groups.map((group) => ({
          name: group.name,
          teamIds: group.slots.map((team) => team?.id).filter(Boolean) as string[],
          sport: format?.sportType,
        })).filter((group) => group.teamIds.length >= 2),
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tạo trận.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm font-semibold text-muted-foreground shadow-sm">
        Đang tải thể thức và danh sách đội...
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-primary">Stage {stage?.order || 1}</p>
            <h2 className="text-xl font-black text-foreground">{stage?.name || "Vòng bảng"}</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              {format?.name || "Thể thức chưa lưu"} · {groups.length} bảng · {slotCount} slot · {venues.length || 1} sân
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
            <Button type="button" variant="outline" size="sm" onClick={autoFill} disabled={teams.length === 0}>
              <Users className="h-4 w-4" /> Chia nhanh
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setGroups(buildGroups(stage, teams.length))}>
              <RotateCcw className="h-4 w-4" /> Làm lại
            </Button>
            <Button type="button" size="sm" onClick={submit} disabled={saving || assignedCount < 2 || matchCount === 0}>
              <CalendarPlus className="h-4 w-4" /> {saving ? "Đang tạo..." : `Tạo ${matchCount} trận`}
            </Button>
          </div>
        </div>
        {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>}
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-foreground">Danh sách đội</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-black text-muted-foreground">{availableTeams.length}</span>
          </div>
          <div className="max-h-[560px] space-y-2 overflow-y-auto beautiful-scrollbar pr-1">
            {availableTeams.map((team) => (
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
                <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs text-primary">{team.logo}</span>
                <span className="min-w-0 truncate">{team.name}</span>
              </div>
            ))}
            {availableTeams.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs font-bold text-muted-foreground">
                Tất cả đội đã được xếp vào slot.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {groups.map((group, groupIndex) => (
            <div key={group.id} className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase text-foreground">{group.name}</h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">
                  {group.slots.filter(Boolean).length}/{group.slots.length}
                </span>
              </div>
              <div className="space-y-2">
                {group.slots.map((team, slotIndex) => (
                  <div
                    key={`${group.id}:slot-${slotIndex + 1}`}
                    onDragOver={(event) => {
                      if (event.dataTransfer.types.includes(teamMime)) event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      moveTeamToSlot(event.dataTransfer.getData(teamMime), groupIndex, slotIndex);
                    }}
                    className={cn(
                      "flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                      team ? "border-primary/30 bg-primary/5" : "border-dashed border-border bg-muted/20 text-muted-foreground",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-black shadow-sm">
                        {team?.logo || slotIndex + 1}
                      </span>
                      <span className="min-w-0 truncate font-bold">{team?.name || `Slot ${slotIndex + 1}`}</span>
                    </div>
                    {team && (
                      <button
                        type="button"
                        onClick={() => clearSlot(groupIndex, slotIndex)}
                        className="rounded-md px-2 py-1 text-xs font-black text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        Gỡ
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GroupStageSetup;
