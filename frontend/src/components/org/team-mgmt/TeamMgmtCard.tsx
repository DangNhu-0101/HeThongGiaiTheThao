import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Eye, MoreHorizontal, ShieldAlert, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrgTeamRecord } from "@/types/orgTeamMgmt";

interface Props {
  team: OrgTeamRecord;
  onToggleFree: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const statusStyle = (team: OrgTeamRecord, isFree: boolean) => {
  if (isFree) return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (team.status === "Approved") return "bg-green-50 text-green-600 border-green-200";
  if (team.status === "Pending") return "bg-orange-50 text-orange-600 border-orange-200";
  if (team.status === "Rejected") return "bg-red-50 text-red-600 border-red-200";
  return "bg-gray-100 text-gray-500 border-gray-200";
};

const topBorder = (team: OrgTeamRecord, isFree: boolean) => {
  if (isFree) return "border-t-indigo-500";
  if (team.status === "Approved") return "border-t-green-500";
  if (team.status === "Pending") return "border-t-orange-400";
  if (team.status === "Rejected") return "border-t-red-500";
  return "border-t-gray-400";
};

const paymentLabel = (team: OrgTeamRecord) => {
  if (team.paymentStatus === "paid") return "Đã đóng phí";
  if (team.paymentStatus === "exempted") return "Miễn phí";
  return "Chưa đóng phí";
};

const TeamMgmtCard = ({ team, onToggleFree, onApprove, onReject }: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isFree = team.isFree || team.paymentStatus === "exempted";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative flex min-w-0 flex-col rounded-xl border border-border border-t-4 bg-card shadow-sm transition-shadow hover:shadow-md ${topBorder(team, isFree)}`}>
      <div className="absolute right-3 top-3 z-10" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-card py-1 text-sm shadow-xl">
            <button
              type="button"
              onClick={() => {
                onToggleFree(team.id);
                setMenuOpen(false);
              }}
              className="w-full px-4 py-2 text-left font-medium text-foreground hover:bg-muted"
            >
              {isFree ? "Bỏ miễn phí" : "Được miễn phí"}
            </button>
            <button type="button" className="w-full px-4 py-2 text-left font-medium text-foreground hover:bg-muted">
              Chỉnh sửa
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 p-5">
        <div className="mb-4 flex items-start gap-3 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary font-bold text-secondary-foreground">
            {team.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="flex min-w-0 flex-wrap items-center gap-2 break-words text-base font-bold leading-tight text-foreground">
              <span className="min-w-0 break-words">{team.name}</span>
              {isFree && <span className="rounded-sm bg-indigo-100 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-indigo-700">Free</span>}
            </h4>
            <p className="mt-1 break-words text-xs leading-4 text-muted-foreground">{team.tournamentName}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="rounded-md bg-muted px-2 py-1 text-primary">{team.sport}</span>
          <span className="flex items-center gap-1 whitespace-nowrap rounded-md bg-muted px-2 py-1">
            <User className="h-3 w-3" /> {team.playersCount} V?V
          </span>
          <span className={`rounded-md px-2 py-1 ${team.paymentStatus === "paid" ? "bg-green-50 text-green-700" : isFree ? "bg-indigo-50 text-indigo-700" : "bg-orange-50 text-orange-700"}`}>
            {paymentLabel(team)}
          </span>
        </div>

        {team.status === "Pending" && !isFree && (
          <p className="mb-2 rounded-md bg-orange-50 p-1.5 text-[10px] font-medium text-orange-600/80">
            Đã nộp {team.submittedAt} · Đang chờ duyệt
          </p>
        )}

        {isFree && (
          <p className="mb-2 flex items-center gap-1 rounded-md bg-indigo-50 p-1.5 text-[10px] font-medium text-indigo-700">
            <CheckCircle2 className="h-3 w-3 shrink-0" /> Miễn phí - tự động duyệt
          </p>
        )}

        {(team.status === "Rejected" || team.status === "Suspended") && (
          <p className="mb-2 flex items-center gap-1 rounded-md bg-red-50 p-1.5 text-[10px] font-medium text-red-600/80">
            <ShieldAlert className="h-3 w-3 shrink-0" /> {team.issueText}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-border bg-muted/30 p-3">
        <div className="flex min-w-0 -space-x-2">
          {team.avatars.slice(0, 5).map((avatar, index) => (
            <div key={`${avatar}-${index}`} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-card bg-primary/20 text-[10px] font-bold text-primary">
              {avatar}
            </div>
          ))}
          {team.playersCount > team.avatars.length && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground">
              +{team.playersCount - team.avatars.length}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {team.status === "Pending" && !isFree ? (
            <>
              <Button size="sm" variant="outline" onClick={() => onApprove?.(team.id)} className="h-7 whitespace-nowrap px-2 text-xs border-green-200 text-green-600 hover:bg-green-50">
                Duyệt
              </Button>
              <Button size="sm" variant="outline" onClick={() => onReject?.(team.id)} className="h-7 whitespace-nowrap px-2 text-xs border-red-200 text-red-600 hover:bg-red-50">
                Từ chối
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" className="h-7 whitespace-nowrap px-2 text-xs text-primary hover:bg-primary/10">
              <Eye className="mr-1 h-3 w-3" /> Xem
            </Button>
          )}
        </div>
      </div>

      <div className="absolute left-3 top-3">
        <span className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase ${statusStyle(team, isFree)}`}>
          {isFree ? "Approved" : team.status}
        </span>
      </div>
    </div>
  );
};

export default TeamMgmtCard;
