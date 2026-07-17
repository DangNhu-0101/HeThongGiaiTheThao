import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Eye, MoreHorizontal, ShieldAlert, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrgTeamRecord } from "@/types/orgTeamMgmt";

interface Props {
  team: OrgTeamRecord;
  onToggleFree: (id: string) => void;
  onReviewMemberFee?: (teamId: string, playerId: string, decision: "approve" | "reject") => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onUnapprove?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewPublic?: (team: OrgTeamRecord) => void;
}

type MemberFeeRecord = NonNullable<OrgTeamRecord["memberFees"]>[number];

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

const feeStatusLabel = (status: MemberFeeRecord["status"]) => {
  if (status === "paid") return "Đã xác nhận";
  if (status === "pending") return "Chờ duyệt";
  if (status === "rejected") return "Bị từ chối";
  if (status === "exempted") return "Miễn lệ phí";
  return "Chưa xác nhận";
};

const feeStatusClass = (status: MemberFeeRecord["status"]) => {
  if (status === "paid") return "border-green-200 bg-green-50 text-green-700";
  if (status === "pending") return "border-orange-200 bg-orange-50 text-orange-700";
  if (status === "rejected") return "border-red-200 bg-red-50 text-red-700";
  if (status === "exempted") return "border-indigo-200 bg-indigo-50 text-indigo-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
};

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0);

const formatDateTime = (value?: string) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
};

const isImageAvatar = (value: string) =>
  /^(https?:\/\/|data:image\/|blob:|\/?uploads\/)/i.test(value.trim());

const TeamMgmtCard = ({ team, onToggleFree, onReviewMemberFee, onApprove, onReject, onUnapprove, onDelete, onViewPublic }: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
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

  const openFeeDialog = () => {
    setFeeDialogOpen(true);
    setMenuOpen(false);
  };

  return (
    <div className={`relative flex min-w-0 flex-col rounded-xl border border-border border-t-4 bg-card shadow-sm transition-shadow hover:shadow-md ${topBorder(team, isFree)}`}>
      <div className="absolute right-3 top-3 z-10" ref={menuRef}>
        <button type="button" onClick={() => setMenuOpen((value) => !value)} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted" aria-label="Mở menu đội">
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-card py-1 text-sm shadow-xl">
            <button type="button" onClick={openFeeDialog} className="w-full px-4 py-2 text-left font-medium text-foreground hover:bg-muted">
              Xem trạng thái lệ phí
            </button>
            <button type="button" onClick={() => { onToggleFree(team.id); setMenuOpen(false); }} className="w-full px-4 py-2 text-left font-medium text-foreground hover:bg-muted">
              {isFree ? "Bỏ miễn phí" : "Được miễn phí"}
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
          <button type="button" onClick={openFeeDialog} className={`rounded-md px-2 py-1 text-left transition hover:ring-2 hover:ring-primary/20 ${team.paymentStatus === "paid" ? "bg-green-50 text-green-700" : isFree ? "bg-indigo-50 text-indigo-700" : "bg-orange-50 text-orange-700"}`} title="Xem trạng thái lệ phí">
            {paymentLabel(team)}
          </button>
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
                    <p className="text-[10px] text-muted-foreground">{feeStatusLabel(fee.status)}</p>
                    {fee.rejectReason ? <p className="truncate text-[10px] text-red-600">{fee.rejectReason}</p> : null}
                  </div>
                  {fee.status === "pending" ? (
                    <div className="flex shrink-0 gap-1">
                      <Button size="icon-sm" variant="ghost" className="text-green-700" onClick={() => onReviewMemberFee?.(team.id, fee.playerId, "approve")} title="Duyệt bằng chứng" aria-label="Duyệt bằng chứng">
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" className="text-red-600" onClick={() => onReviewMemberFee?.(team.id, fee.playerId, "reject")} title="Từ chối bằng chứng" aria-label="Từ chối bằng chứng">
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

      {feeDialogOpen && (
        <FeeStatusDialog
          team={team}
          onClose={() => setFeeDialogOpen(false)}
          onReviewMemberFee={onReviewMemberFee}
        />
      )}
    </div>
  );
};

const FeeStatusDialog = ({
  team,
  onClose,
  onReviewMemberFee,
}: {
  team: OrgTeamRecord;
  onClose: () => void;
  onReviewMemberFee?: (teamId: string, playerId: string, decision: "approve" | "reject") => void;
}) => {
  const fees = team.memberFees || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3" role="dialog" aria-modal="true" aria-label="Trạng thái lệ phí">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-muted-foreground">Trạng thái lệ phí</p>
            <h3 className="truncate text-lg font-black text-foreground">{team.name}</h3>
            <p className="truncate text-sm text-muted-foreground">{team.tournamentName}</p>
          </div>
          <Button type="button" size="icon-sm" variant="ghost" onClick={onClose} aria-label="Đóng">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!fees.length ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
              Chưa có dữ liệu thành viên để hiển thị lệ phí.
            </div>
          ) : (
            <div className="space-y-3">
              {fees.map((fee) => (
                <div key={fee.playerId} className="grid gap-3 rounded-xl border border-border bg-background p-3 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="min-w-0 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {fee.playerName.trim().slice(0, 2).toUpperCase() || "VD"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 break-words font-bold text-foreground">{fee.playerName}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${feeStatusClass(fee.status)}`}>
                            {feeStatusLabel(fee.status)}
                          </span>
                        </div>
                        <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                          <span>Cần đóng: <strong className="text-foreground">{formatCurrency(fee.amount)}</strong></span>
                          <span>Đã xác nhận: <strong className="text-foreground">{formatCurrency(fee.amountPaid)}</strong></span>
                          <span>Ngày gửi: <strong className="text-foreground">{formatDateTime(fee.submittedAt)}</strong></span>
                          <span>Ngày duyệt: <strong className="text-foreground">{formatDateTime(fee.reviewedAt)}</strong></span>
                        </div>
                        {fee.rejectReason ? (
                          <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                            Lý do từ chối: {fee.rejectReason}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {fee.status === "pending" ? (
                      <div className="flex flex-wrap gap-2 pl-0 md:pl-[52px]">
                        <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50" onClick={() => onReviewMemberFee?.(team.id, fee.playerId, "approve")}>
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Duyệt bằng chứng
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => onReviewMemberFee?.(team.id, fee.playerId, "reject")}>
                          <ShieldAlert className="mr-1 h-4 w-4" /> Từ chối
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-border bg-muted/25 p-2">
                    {fee.status === "paid" ? (
                      <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-md border border-green-200 bg-green-50 text-center text-xs font-bold text-green-700">
                        <CheckCircle2 className="h-5 w-5" />
                        Đã xác nhận
                      </div>
                    ) : fee.receiptImage ? (
                      <a href={fee.receiptImage} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-md border border-border bg-card" title="Xem ảnh bằng chứng">
                        <img src={fee.receiptImage} alt={`Ảnh bằng chứng lệ phí của ${fee.playerName}`} className="h-36 w-full object-cover transition group-hover:scale-[1.02]" />
                      </a>
                    ) : (
                      <div className="flex h-36 items-center justify-center rounded-md border border-dashed border-border text-center text-xs text-muted-foreground">
                        Chưa có bằng chứng
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-border p-4">
          <Button type="button" variant="outline" onClick={onClose}>Đóng</Button>
        </div>
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
