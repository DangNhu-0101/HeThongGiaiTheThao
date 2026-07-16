import { CalendarClock, Layers3, Power, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { SportRecord } from "@/types/adminSportsConfig";
import { useAdminSportsConfigStore } from "@/stores/useAdminSportsConfigStore";

const SportDetailArea = ({ sport }: { sport: SportRecord }) => {
  const setSportActive = useAdminSportsConfigStore((state) => state.setSportActive);
  const isActive = sport.status === "Hoạt động";

  const toggleStatus = async () => {
    try {
      await setSportActive(sport.name, !isActive);
      toast.success(!isActive ? "Đã bật môn thể thao." : "Đã tắt môn thể thao.");
    } catch (error) {
      console.error(error);
      toast.error("Không thể cập nhật trạng thái môn thể thao.");
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl bg-background">
      <div className="relative mb-6 shrink-0 overflow-hidden rounded-xl bg-primary-dark p-6 text-white shadow-md">
        <Trophy className="pointer-events-none absolute right-0 top-0 h-32 w-32 -translate-y-4 translate-x-4 text-white/10" />
        <div className="relative z-10 mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/30 bg-white/20 text-2xl shadow-sm">
              {sport.imageUrl ? <img src={sport.imageUrl} alt={sport.name} className="h-full w-full object-cover" /> : <Trophy className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold uppercase tracking-normal text-white">{sport.name}</h2>
                <span className={`rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase ${isActive ? "border-green-400/50 bg-green-500/20 text-green-100" : "border-white/30 bg-white/10 text-white/80"}`}>
                  {sport.status}
                </span>
              </div>
              {sport.englishName && <p className="mt-1 text-xs font-semibold text-white/70">{sport.englishName}</p>}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={toggleStatus} className="border-white/30 bg-white text-primary-dark hover:bg-white/90">
            <Power className="mr-1.5 h-3.5 w-3.5" /> {isActive ? "Tắt sử dụng" : "Bật sử dụng"}
          </Button>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="Mẫu thể thức" value={sport.formatsCount} />
          <Metric label="Hạng mục" value={sport.rulesCount} />
          <Metric label="Stage chuẩn" value={sport.stages?.length || 0} />
          <Metric label="Đã cập nhật" value={sport.updatedAt ? new Date(sport.updatedAt).toLocaleDateString("vi-VN") : "-"} />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto pb-4 pr-2 beautiful-scrollbar xl:grid-cols-[1.1fr_1fr]">
        <section className="space-y-4">
          <Panel title="Thể thức hỗ trợ" icon={<Layers3 className="h-4 w-4 text-primary" />}>
            {sport.formats.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {sport.formats.map((format) => (
                  <article key={format.id} className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="line-clamp-2 break-words text-sm font-bold text-foreground">{format.name}</h4>
                        <p className="truncate text-[10px] font-semibold uppercase text-muted-foreground" title={format.type}>{format.type}</p>
                      </div>
                      {format.isDefault && <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] uppercase text-green-700">Mặc định</span>}
                    </div>
                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{format.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold">
                      <Badge>{format.stageCount || 1} giai đoạn</Badge>
                      {format.hasGroups && <Badge>Có bảng</Badge>}
                      {format.hasKnockout && <Badge>Có knockout</Badge>}
                      {format.hasDoubleElimination && <Badge>Nhánh thắng/thua</Badge>}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty text="Chưa có thể thức mẫu cho môn này." />
            )}
          </Panel>
        </section>

        <section className="space-y-4">
          <Panel title="Hạng mục thi đấu" icon={<Trophy className="h-4 w-4 text-primary" />}>
            {sport.categories?.length ? (
              <div className="space-y-2">
                {sport.categories.map((category) => (
                  <div key={category.code} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm">
                    <div>
                      <p className="font-bold text-foreground">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {category.playerSlotsPerTeam?.min || 1}-{category.playerSlotsPerTeam?.max || 1} VĐV/đội
                      </p>
                    </div>
                    <span className="rounded bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">{category.status === "actived" ? "Hoạt động" : "Tắt"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="Chưa có hạng mục thi đấu." />
            )}
          </Panel>

          <Panel title="Stage tiêu chuẩn" icon={<CalendarClock className="h-4 w-4 text-primary" />}>
            {sport.stages?.length ? (
              <div className="space-y-2">
                {sport.stages.map((stage) => (
                  <div key={`${stage.name}-${stage.type}`} className="min-w-0 rounded-lg border border-border bg-card px-3 py-2">
                    <p className="line-clamp-2 break-words text-sm font-bold text-foreground">{stage.name}</p>
                    <p className="truncate text-xs text-muted-foreground" title={`${stage.type} · ${stage.format || "Chưa cấu hình"} · ${stage.scoring || "Chưa có scoring"}`}>
                      {stage.type} · {stage.format || "Chưa cấu hình"} · {stage.scoring || "Chưa có scoring"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="Chưa có stage tiêu chuẩn." />
            )}
          </Panel>
        </section>
      </div>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-lg border border-white/10 bg-white/10 p-3">
    <p className="mb-1 text-[10px] font-bold uppercase text-white/72">{label}</p>
    <p className="font-highlight text-xl font-semibold text-white">{value}</p>
  </div>
);

const Badge = ({ children }: { children: ReactNode }) => (
  <span className="rounded bg-primary-light/30 px-2 py-1 text-primary">{children}</span>
);

const Panel = ({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) => (
  <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
    <div className="mb-3 flex items-center gap-2">
      {icon}
      <h3 className="text-sm font-bold uppercase text-foreground">{title}</h3>
    </div>
    {children}
  </section>
);

const Empty = ({ text }: { text: string }) => (
  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">{text}</div>
);

export default SportDetailArea;
