import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Eye, MoreHorizontal, ShieldAlert, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrgTeamRecord, TeamPaymentStatus } from "@/types/orgTeamMgmt";

interface Props {
  team: OrgTeamRecord;
  onToggleFree: (id: string) => void;
  onPaymentStatusChange?: (id: string, paymentStatus: TeamPaymentStatus) => void;
  onReviewMemberFee?: (teamId: string, playerId: string, decision: "approve" | "reject") => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onUnapprove?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewPublic?: (team: OrgTeamRecord) => void;
}

const statusStyle = (team: OrgTeamRecord, isFree: boolean) => {
  if (isFree) return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (team.status === "Approved") return "bg-green-50 text-green-700 border-green-200";
  if (team.status === "Pending") return "bg-orange-50 text-orange-700 border-orange-200";
  if (team.status === "Rejected") return "bg-red-50 text-red-700 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
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

const statusLabel = (team: OrgTeamRecord, isFree: boolean) => {
  if (isFree) return "Miễn phí";
  if (team.status === "Approved") return "Đã duyệt";
  if (team.status === "Pending") return "Chờ duyệt";
  if (team.status === "Rejected") return "Từ chối";
  return "Tạm dừng";
};

const isImageAvatar = (value: string) =>
  /^(https?:\/\/|data:image\/|blob:|\/?uploads\/)/i.test(value.trim());

const TeamMgmtCard = ({ team, onToggleFree, onPaymentStatusChange, onReviewMemberFee, onApprove, onReject, onUnapprove, onDelete, onViewPublic }: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isFree = team.isFree || team.paymentStatus === "exempted";
  const visibleAvatars = team.avatars.filter(Boolean).slice(0, 5);
  const receiptFees = (team.memberFees || []).filter((fee) => fee.receiptImage);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setPayment = (paymentStatus: TeamPaymentStatus) => {
    onPaymentStatusChange?.(team.id, paymentStatus);
    setMenuOpen(false);
  };

  return (
    <div className={`relative flex min-w-0 flex-col rounded-xl border border-border border-t-4 bg-card shadow-sm transition-shadow hover:shadow-md ${topBorder(team, isFree)}`}>
      <div className="absolute right-3 top-3 z-10" ref={menuRef}>
        <button type="button" onClick={() => setMenuOpen((value) => !value)} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted" aria-label="Mở menu đội">
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-border bg-card py-1 text-sm shadow-xl">
            <button type="button" onClick={() => { onToggleFree(team.id); setMenuOpen(false); }} className="w-full px-4 py-2 text-left font-medium text-foreground hover:bg-muted">
              {isFree ? "Bỏ miễn phí" : "Được miễn phí"}
            </button>
            <button type="button" onClick={() => setPayment("paid")} className="w-full px-4 py-2 text-left font-medium text-foreground hover:bg-muted">
              Đánh dấu đã đóng phí
            </button>
            <button type="button" onClick={() => setPayment("unpaid")} className="w-full px-4 py-2 text-left font-medium text-foreground hover:bg-muted">
              Đánh dấu chưa đóng phí
            </button>
            {team.status === "Approved" && (
              <button type="button" onClick={() => { onUnapprove?.(team.id); setMenuOpen(false); }} className="w-full px-4 py-2 text-left font-medium text-foreground hover:bg-muted">
                Bỏ duyệt
              </button>
            )}
            <button type="button" onClick={() => { onDelete?.(team.id); setMenuOpen(false); }} className="w-full px-4 py-2 text-left font-medium text-accent hover:bg-red-50">
              Xóa đội
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
              {isFree && <span className="rounded-sm bg-indigo-100 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-indigo-700">Miễn phí</span>}
            </h4>
            <p className="mt-1 break-words text-xs leading-4 text-muted-foreground">{team.tournamentName}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="rounded-md bg-muted px-2 py-1 text-primary">{team.sport}</span>
          <span className="flex items-center gap-1 whitespace-nowrap rounded-md bg-muted px-2 py-1">
            <User className="h-3 w-3" /> {team.playersCount} VĐV
          </span>
          <span className={`rounded-md px-2 py-1 ${team.paymentStatus === "paid" ? "bg-green-50 text-green-700" : isFree ? "bg-indigo-50 text-indigo-700" : "bg-orange-50 text-orange-700"}`}>
            {paymentLabel(team)}
          </span>
        </div>

        {receiptFees.length ? (
          <div className="mb-3 rounded-lg border border-border bg-muted/30 p-2">
            <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">Ảnh chuyển khoản</p>
            <div className="space-y-2">
              {receiptFees.slice(0, 4).map((fee) => (
                <div key={`${fee.playerId}-${fee.receiptImage}`} className="flex items-center gap-2 rounded-lg bg-card p-2">
                  <a href={fee.receiptImage} target="_blank" rel="noreferrer" className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-card" title="Xem ảnh bằng chứng">
                    <img src={fee.receiptImage} alt={`Ảnh chuyển khoản của ${fee.playerName}`} className="h-full w-full object-cover transition group-hover:scale-105" />
                  </a>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">{fee.playerName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {fee.status === "pending" ? "Chờ duyệt" : fee.status === "paid" ? "Đã xác nhận" : fee.status === "rejected" ? "Bị từ chối" : "Chưa xác nhận"}
                    </p>
                    {fee.rejectReason ? <p className="truncate text-[10px] text-red-600">{fee.rejectReason}</p> : null}
                  </div>
                  {fee.status === "pending" ? (
                    <div className="flex shrink-0 gap-1">
                      <Button size="icon-sm" variant="ghost" className="text-green-700" onClick={() => onReviewMemberFee?.(team.id, fee.playerId, "approve")} title="Xác nhận đã đóng" aria-label="Xác nhận đã đóng">
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" className="text-red-600" onClick={() => onReviewMemberFee?.(team.id, fee.playerId, "reject")} title="Từ chối" aria-label="Từ chối">
                        <ShieldAlert className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {team.status === "Pending" && !isFree && (
          <p className="mb-2 rounded-md bg-orange-50 p-1.5 text-[10px] font-medium text-orange-700">
            Đã nộp {team.submittedAt} · Đang chờ duyệt
          </p>
        )}

        {isFree && (
          <p className="mb-2 flex items-center gap-1 rounded-md bg-indigo-50 p-1.5 text-[10px] font-medium text-indigo-700">
            <CheckCircle2 className="h-3 w-3 shrink-0" /> Miễn phí - tự động duyệt
          </p>
        )}

        {(team.status === "Rejected" || team.status === "Suspended") && (
          <p className="mb-2 flex items-center gap-1 rounded-md bg-red-50 p-1.5 text-[10px] font-medium text-red-700">
            <ShieldAlert className="h-3 w-3 shrink-0" /> {team.issueText || "Cần kiểm tra lại hồ sơ đội."}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-border bg-muted/30 p-3">
        <div className="flex min-w-0 -space-x-2">
          {visibleAvatars.map((avatar, index) => (
            <MemberAvatar key={`${avatar}-${index}`} avatar={avatar} index={index} />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {team.status === "Pending" && !isFree ? (
            <>
              <Button size="sm" variant="outline" onClick={() => onApprove?.(team.id)} className="h-7 whitespace-nowrap border-green-200 px-2 text-xs text-green-700 hover:bg-green-50">
                Duyệt
              </Button>
              <Button size="sm" variant="outline" onClick={() => onReject?.(team.id)} className="h-7 whitespace-nowrap border-red-200 px-2 text-xs text-red-700 hover:bg-red-50">
                Từ chối
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => onViewPublic?.(team)} className="h-7 whitespace-nowrap px-2 text-xs text-primary hover:bg-primary/10">
              <Eye className="mr-1 h-3 w-3" /> Xem
            </Button>
          )}
        </div>
      </div>

      <div className="absolute left-3 top-3">
        <span className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase ${statusStyle(team, isFree)}`}>
          {statusLabel(team, isFree)}
        </span>
      </div>
    </div>
  );
};

const MemberAvatar = ({ avatar, index }: { avatar: string; index: number }) => {
  const [failed, setFailed] = useState(false);
  const fallback = avatar.trim().slice(0, 2).toUpperCase() || `${index + 1}`;
  const isImage = isImageAvatar(avatar);

  if (!isImage || failed) {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-card bg-primary/20 text-[10px] font-bold text-primary">
        {isImage ? `${index + 1}` : fallback}
      </div>
    );
  }

  return (
    <div className="flex h-7 w-7 shrink-0 overflow-hidden rounded-full border-2 border-card bg-primary/10">
      <img
        src={avatar}
        alt={`Ảnh vận động viên ${index + 1}`}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
};

export default TeamMgmtCard;
