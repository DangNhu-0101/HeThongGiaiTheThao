import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TeamMember } from "@/types/Team";

const isImage = (value?: string) =>
  Boolean(value && /^(https?:\/\/|data:image\/|blob:|\/?uploads\/)/i.test(value));

const MemberCard = ({
  member,
  canRemove = false,
  onRemove,
}: {
  member: TeamMember;
  canRemove?: boolean;
  onRemove?: () => void;
}) => {
  const isCaptain = member.role === "Đội trưởng";
  const avatar = member.avatar || member.name.slice(0, 1).toUpperCase();

  return (
    <div className="group flex min-w-0 flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg">
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-xl font-black text-secondary-foreground shadow-inner transition-transform group-hover:scale-105">
          {isImage(avatar) ? <img src={avatar} alt={member.name} className="h-full w-full object-cover" /> : avatar}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="break-words text-lg font-bold leading-tight text-foreground">{member.name}</h4>
          <p className="mt-1 truncate text-xs text-muted-foreground">{member.country}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
              isCaptain ? "border border-primary/20 bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              {member.role}
            </span>
            {member.position ? <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{member.position}</span> : null}
            {canRemove && (
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={onRemove}
                aria-label="Xóa thành viên"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border py-3">
        <Metric label="Trận" value={String(member.stats.matches)} />
        <Metric label="Thắng" value={String(member.stats.wins)} />
        <Metric label="Kỹ năng" value={member.stats.rating} accent />
      </div>
    </div>
  );
};

const Metric = ({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) => (
  <div className={`rounded-lg py-2 text-center ${accent ? "border border-accent/20 bg-accent/10" : "bg-muted/30"}`}>
    <div className={`text-lg font-bold ${accent ? "text-accent-foreground" : "text-foreground"}`}>{value}</div>
    <div className={`text-[10px] font-semibold uppercase ${accent ? "text-accent-foreground" : "text-muted-foreground"}`}>{label}</div>
  </div>
);

export default MemberCard;
