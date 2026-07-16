import { useEffect, useMemo, useState } from "react";
import { Award, Check, CreditCard, Search, Send, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TeamHero from "@/components/team-detail/TeamHero";
import MemberCard from "@/components/team-detail/MemberCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { useTeamStore } from "@/stores/useTeamStore";
import { useTeamCollaborationStore } from "@/stores/useTeamCollaborationStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { MemberFee, PlayerProfileSummary } from "@/types/teamCollaboration";

type Tab = "members" | "achievements" | "invite" | "requests" | "fees";

const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0);

const dateText = (value?: string) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
};

const avatarNode = (avatar: string, name: string) =>
  /^(https?:\/\/|data:image\/|blob:|\/?uploads\/)/i.test(avatar)
    ? <img src={avatar} alt={name} className="h-full w-full object-cover" />
    : avatar || name.slice(0, 1).toUpperCase();

const ProfilePreview = ({ player }: { player: PlayerProfileSummary }) => (
  <div className="grid gap-3 rounded-lg bg-muted/30 p-4 text-sm sm:grid-cols-2">
    <Info label="Email" value={player.email || "Chưa cập nhật"} />
    <Info label="Số điện thoại" value={player.phone || "Chưa cập nhật"} />
    <Info label="Ngày sinh" value={dateText(player.birthDate)} />
    <Info label="Giới tính" value={player.gender || "Chưa cập nhật"} />
    <Info label="Môn" value={player.sport} />
    <Info label="Trình độ" value={player.level} />
    <Info label="Kỹ năng" value={`${player.skill || 0}/5`} />
    <Info label="Vị trí" value={player.position || "Chưa cập nhật"} />
  </div>
);

const TeamDetailPage = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { info, members, achievements, loading, fetchTeamDetail, removeMember } = useTeamStore();
  const {
    players,
    invitations,
    joinRequests,
    sentJoinRequests,
    fees,
    reviewingRequestIds,
    searchPlayers,
    fetchInvitations,
    fetchJoinRequests,
    fetchMyJoinRequests,
    fetchFees,
    invitePlayer,
    requestJoin,
    reviewJoinRequest,
    submitFee,
    reviewFee,
    cancelFee,
  } = useTeamCollaborationStore();
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<Tab>("members");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<PlayerProfileSummary | null>(null);
  const [feeForm, setFeeForm] = useState<{ open: boolean; playerId: string; receiptImage: string; amountPaid: string; transferDate: string; method: string; transactionCode: string; note: string }>({
    open: false,
    playerId: "",
    receiptImage: "",
    amountPaid: "",
    transferDate: new Date().toISOString().slice(0, 10),
    method: "",
    transactionCode: "",
    note: "",
  });
  const [rejectingRequestId, setRejectingRequestId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingFee, setRejectingFee] = useState<MemberFee | null>(null);
  const [feeRejectReason, setFeeRejectReason] = useState("");

  const tournamentId = info?.tournamentItemId || "";
  const currentUserId = user?.id || "";
  const captain = members[0];
  const isPlayer = Boolean(user?.roles.includes("player"));
  const isAdminOrOrg = Boolean(user?.roles.some((role) => ["admin", "org", "organization"].includes(role)));
  const isCaptain = isPlayer && Boolean(captain?.userId && captain.userId === currentUserId);
  const isParticipant = isPlayer && members.some((member) => member.userId === currentUserId);
  const canManageTeam = isCaptain || isAdminOrOrg;
  const canViewFees = isParticipant || canManageTeam;
  const feeApplies = Boolean((info?.feeAmount || 0) > 0 || info?.paymentQR);
  const displayedFees = useMemo<MemberFee[]>(() => {
    if (fees.length) return fees;
    if (!feeApplies) return [];
    return members.map((member) => ({
      playerId: member.id,
      playerName: member.name,
      playerAvatar: member.avatar,
      playerEmail: "",
      amount: info?.feeAmount || 0,
      amountPaid: 0,
      status: "unpaid",
    }));
  }, [feeApplies, fees, info?.feeAmount, members]);
  const hasPendingJoinRequest = sentJoinRequests.some((item) => item.teamId === info?.id && item.status === "pending");
  const canRequestJoin = Boolean(user && isPlayer && info?.canRequestJoin && !isParticipant && !hasPendingJoinRequest);

  const filteredMembers = useMemo(
    () => members.filter((member) => member.name.toLowerCase().includes(search.toLowerCase())),
    [members, search],
  );

  useEffect(() => { if (id) void fetchTeamDetail(id); }, [fetchTeamDetail, id]);
  useEffect(() => { if (id && tab === "invite" && canManageTeam) void fetchInvitations(info?.id || id); }, [canManageTeam, fetchInvitations, id, info?.id, tab]);
  useEffect(() => { if (id && tab === "requests" && canManageTeam) void fetchJoinRequests(info?.id || id); }, [canManageTeam, fetchJoinRequests, id, info?.id, tab]);
  useEffect(() => { if (id && tab === "fees" && canViewFees) void fetchFees(info?.id || id); }, [canViewFees, fetchFees, id, info?.id, tab]);
  useEffect(() => { if (user) void fetchMyJoinRequests(); }, [fetchMyJoinRequests, user]);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);
  useEffect(() => {
    if (tab === "invite" && tournamentId) void searchPlayers(tournamentId, debouncedSearch);
  }, [debouncedSearch, searchPlayers, tab, tournamentId]);

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Xóa ${memberName} khỏi đội?`)) return;
    try {
      await removeMember(info?.id || id, memberId);
    } catch (error) {
      console.error("Không thể xóa thành viên:", error);
      toast.error("Không thể xóa thành viên khỏi đội.");
    }
  };

  const handleRequestJoin = async () => {
    if (!info) return;
    if (info.isFull) {
      toast.error("Đội đã đủ thành viên.");
      return;
    }
    await requestJoin(info.id, tournamentId, {} as PlayerProfileSummary);
  };

  const handleSubmitFee = async () => {
    if (!info || !feeForm.receiptImage) {
      toast.error("Vui lòng tải ảnh chuyển khoản.");
      return;
    }
    await submitFee(info.id, feeForm.playerId, {
      receiptImage: feeForm.receiptImage,
      amountPaid: Number(feeForm.amountPaid || 0),
      transferDate: feeForm.transferDate,
      method: feeForm.method,
      transactionCode: feeForm.transactionCode,
      note: feeForm.note,
    });
    setFeeForm({ open: false, playerId: "", receiptImage: "", amountPaid: "", transferDate: new Date().toISOString().slice(0, 10), method: "", transactionCode: "", note: "" });
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center">Đang tải đội...</div>;
  if (!info) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Không tìm thấy đội.</div>;

  const tabs: Array<{ id: Tab; label: string; icon: typeof Users; visible: boolean; badge?: number }> = [
    { id: "members", label: "Thành viên", icon: Users, visible: true },
    { id: "achievements", label: "Thành tích", icon: Award, visible: true, badge: achievements.length },
    { id: "invite", label: "Mời thành viên", icon: UserPlus, visible: canManageTeam },
    { id: "requests", label: "Yêu cầu tham gia", icon: Send, visible: canManageTeam, badge: joinRequests.filter((item) => item.status === "pending").length },
    { id: "fees", label: "Lệ phí", icon: CreditCard, visible: canViewFees },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <TeamHero info={info} />
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <div className="mb-4 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{info.tournamentName || "Chưa có giải đấu"}</p>
                <p className="mt-1 text-sm text-foreground">
                  {info.isFull ? "Đội đã đủ thành viên" : info.registrationOpen ? "Đội còn trong thời gian đăng ký." : "Thời gian đăng ký đã đóng."}
                </p>
              </div>
              {!user ? (
                <Button variant="outline" disabled>Đăng nhập để yêu cầu tham gia</Button>
              ) : canRequestJoin ? (
                <Button onClick={() => void handleRequestJoin()}>Yêu cầu tham gia</Button>
              ) : hasPendingJoinRequest ? (
                <Button variant="outline" disabled>Đã gửi yêu cầu</Button>
              ) : info.isFull ? (
                <Button variant="outline" disabled>Đội đã đủ thành viên</Button>
              ) : null}
            </div>
          </div>

          <div className="mb-6 flex gap-2 overflow-x-auto rounded-xl border border-border bg-card p-2">
            {tabs.filter((item) => item.visible).map((item) => (
              <button key={item.id} type="button" onClick={() => { setTab(item.id); setSearch(""); }} className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold ${tab === item.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>
                <item.icon className="h-4 w-4" />{item.label}
                {item.badge ? <span className="rounded-full bg-red-500 px-1.5 text-[10px] text-white">{item.badge}</span> : null}
              </button>
            ))}
          </div>

          {tab === "members" && (
            <section>
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div><h2 className="text-2xl font-black">Danh sách thành viên</h2><p className="text-sm text-muted-foreground">Đội hình chính thức tham gia giải.</p></div>
                <div className="relative w-full md:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Tìm thành viên..." /></div>
              </div>
              {filteredMembers.length ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredMembers.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      canRemove={canManageTeam && member.id !== captain?.id}
                      onRemove={() => void handleRemoveMember(member.id, member.name)}
                    />
                  ))}
                </div>
              ) : <EmptyState text="Chưa có thành viên phù hợp." />}
            </section>
          )}

          {tab === "achievements" && (
            <section className="space-y-5">
              <div><h2 className="text-2xl font-black">Thành tích</h2><p className="text-sm text-muted-foreground">Danh hiệu được đồng bộ từ kết quả đã xác nhận.</p></div>
              {achievements.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {achievements.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {item.badgeImage ? <img src={item.badgeImage} alt={item.title} className="h-full w-full rounded-xl object-cover" /> : <Award className="h-6 w-6" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-foreground">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.tournamentName}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2 text-sm">
                        <Info label="Môn thể thao" value={item.sport || "Chưa cập nhật"} />
                        <Info label="Mùa giải" value={String(item.year)} />
                        <Info label="Ngày đạt" value={dateText(item.achievedAt)} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState text="Đội chưa có thành tích được ghi nhận." />}
            </section>
          )}

          {tab === "invite" && canManageTeam && (
            <section className="space-y-5">
              <div><h2 className="text-2xl font-black">Mời thành viên</h2><p className="text-sm text-muted-foreground">Chỉ hiển thị người có hồ sơ vận động viên hợp lệ và chưa thuộc đội trong giải.</p></div>
              <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Tìm theo tên vận động viên..." /></div>
              <div className="grid gap-4 md:grid-cols-2">
                {players.map((player) => {
                  const invited = invitations.some((item) => item.receiverId === player.userId && item.status === "pending");
                  return (
                    <div key={player.id} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-start gap-4"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-primary/10 font-black text-primary">{avatarNode(player.avatar, player.name)}</div><div className="flex-1"><h3 className="font-black">{player.name}</h3><p className="text-xs text-muted-foreground">{player.sport} · trình {player.level}</p></div></div>
                      <div className="mt-4 flex gap-2"><Button variant="outline" onClick={() => setSelectedProfile(player)}>Xem hồ sơ</Button><Button disabled={invited || info.isFull} onClick={() => void invitePlayer(info.id, tournamentId, player)}>{info.isFull ? "Đội đã đủ thành viên" : invited ? "Đã mời" : "Gửi lời mời"}</Button></div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {tab === "requests" && canManageTeam && (
            <section className="space-y-5">
              <div><h2 className="text-2xl font-black">Yêu cầu tham gia đội</h2><p className="text-sm text-muted-foreground">Duyệt các yêu cầu đang chờ của đội.</p></div>
              {joinRequests.length ? joinRequests.map((request) => (
                <div key={request.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <div className="flex flex-1 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 font-black text-primary">{avatarNode(request.player.avatar, request.player.name)}</div>
                      <div className="space-y-2">
                        <h3 className="font-black">{request.player.name}</h3>
                        <p className="text-sm text-muted-foreground">{request.message || "Không có lời nhắn."}</p>
                        <ProfilePreview player={request.player} />
                        <p className="text-xs text-muted-foreground">Ngày gửi: {dateText(request.createdAt)} · Trạng thái: {request.status}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => setSelectedProfile(request.player)}>Xem hồ sơ</Button>
                      {request.status === "pending" ? (
                        <>
                          <Button disabled={info.isFull || reviewingRequestIds[request.id]} onClick={() => void reviewJoinRequest(request.id, "accept").then(() => fetchTeamDetail(id))}><Check className="mr-1 h-4 w-4" />Chấp nhận</Button>
                          <Button variant="outline" className="text-red-600" onClick={() => setRejectingRequestId(request.id)}><X className="mr-1 h-4 w-4" />Từ chối</Button>
                        </>
                      ) : <span className="rounded-full bg-muted px-3 py-2 text-xs font-bold">{request.status}</span>}
                    </div>
                  </div>
                </div>
              )) : <EmptyState text="Chưa có yêu cầu tham gia nào." />}
            </section>
          )}

          {tab === "fees" && canViewFees && (
            <section className="space-y-5">
              <div><h2 className="text-2xl font-black">Lệ phí thành viên</h2><p className="text-sm text-muted-foreground">Theo dõi trạng thái lệ phí theo từng vận động viên.</p></div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-black">Thông tin thanh toán của giải</h3>
                {info.paymentQR ? (
                  <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
                    <img src={info.paymentQR} alt="QR lệ phí giải" className="h-52 w-52 rounded-xl border border-border object-contain" />
                    <div className="text-sm text-muted-foreground">
                      {info.feeAmount ? <p className="font-bold text-foreground">Số tiền: {money(info.feeAmount)}/người</p> : null}
                      <p className="mt-2">Sau khi chuyển khoản, tải ảnh chuyển khoản bên dưới để gửi xác nhận.</p>
                    </div>
                  </div>
                ) : <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Chưa có QR lệ phí trong dữ liệu giải.</p>}
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {!feeApplies ? (
                  <EmptyState text="Giải này không áp dụng lệ phí." />
                ) : !members.length ? (
                  <EmptyState text="Đội chưa có thành viên để theo dõi lệ phí." />
                ) : displayedFees.map((fee) => (
                  <FeeRow
                    key={fee.playerId}
                    fee={fee}
                    canManage={canManageTeam}
                    canSubmit={isParticipant && members.some((member) => member.id === fee.playerId && member.userId === currentUserId)}
                    onSubmit={() => setFeeForm({ open: true, playerId: fee.playerId, receiptImage: "", amountPaid: String(fee.amount || info.feeAmount || ""), transferDate: new Date().toISOString().slice(0, 10), method: "", transactionCode: "", note: "" })}
                    onCancel={() => {
                      if (window.confirm("Hủy bằng chứng lệ phí hiện tại?")) void cancelFee(info.id, fee.playerId);
                    }}
                    onApprove={() => void reviewFee(info.id, fee.playerId, "approve")}
                    onReject={() => { setRejectingFee(fee); setFeeRejectReason(""); }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />

      {selectedProfile && (
        <Dialog onClose={() => setSelectedProfile(null)}>
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-xl font-black text-primary">{avatarNode(selectedProfile.avatar, selectedProfile.name)}</div>
            <div className="flex-1"><h2 className="text-xl font-black">{selectedProfile.name}</h2><p className="text-sm text-muted-foreground">Hồ sơ vận động viên</p></div>
            <Button size="icon" variant="ghost" onClick={() => setSelectedProfile(null)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="mt-5"><ProfilePreview player={selectedProfile} /></div>
        </Dialog>
      )}

      {rejectingRequestId && (
        <Dialog onClose={() => setRejectingRequestId("")}>
          <h2 className="text-xl font-black">Từ chối yêu cầu tham gia</h2>
          <Input className="mt-4" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Lý do từ chối" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectingRequestId("")}>Hủy</Button>
            <Button variant="destructive" onClick={() => void reviewJoinRequest(rejectingRequestId, "reject", rejectReason).then(() => { setRejectingRequestId(""); setRejectReason(""); })}>Từ chối</Button>
          </div>
        </Dialog>
      )}

      {feeForm.open && (
        <Dialog onClose={() => setFeeForm((current) => ({ ...current, open: false }))}>
          <h2 className="text-xl font-black">Xác nhận đã đóng</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input type="number" value={feeForm.amountPaid} onChange={(event) => setFeeForm((current) => ({ ...current, amountPaid: event.target.value }))} placeholder="Số tiền đã chuyển" />
            <Input type="date" value={feeForm.transferDate} onChange={(event) => setFeeForm((current) => ({ ...current, transferDate: event.target.value }))} />
            <Input value={feeForm.method} onChange={(event) => setFeeForm((current) => ({ ...current, method: event.target.value }))} placeholder="Ngân hàng / phương thức" />
            <Input value={feeForm.transactionCode} onChange={(event) => setFeeForm((current) => ({ ...current, transactionCode: event.target.value }))} placeholder="Mã giao dịch" />
            <div className="sm:col-span-2"><Input value={feeForm.note} onChange={(event) => setFeeForm((current) => ({ ...current, note: event.target.value }))} placeholder="Ghi chú" /></div>
            <div className="sm:col-span-2"><ImageUploadField label="Ảnh chuyển khoản" value={feeForm.receiptImage} onChange={(value) => setFeeForm((current) => ({ ...current, receiptImage: value }))} /></div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFeeForm((current) => ({ ...current, open: false }))}>Hủy</Button>
            <Button onClick={() => void handleSubmitFee()}>Gửi xác nhận</Button>
          </div>
        </Dialog>
      )}

      {rejectingFee && (
        <Dialog onClose={() => setRejectingFee(null)}>
          <h2 className="text-xl font-black">Từ chối xác nhận lệ phí</h2>
          <Input className="mt-4" value={feeRejectReason} onChange={(event) => setFeeRejectReason(event.target.value)} placeholder="Lý do từ chối" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectingFee(null)}>Hủy</Button>
            <Button variant="destructive" onClick={() => void reviewFee(info.id, rejectingFee.playerId, "reject", feeRejectReason).then(() => setRejectingFee(null))}>Từ chối</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div><span className="block text-xs text-muted-foreground">{label}</span><strong className="break-words">{value}</strong></div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">{text}</div>
);

const Dialog = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
      {children}
    </div>
  </div>
);

const statusText: Record<MemberFee["status"], string> = {
  unpaid: "Chưa xác nhận",
  pending: "Chờ duyệt",
  paid: "Đã xác nhận",
  rejected: "Bị từ chối",
  exempted: "Miễn lệ phí",
};

const statusClass: Record<MemberFee["status"], string> = {
  unpaid: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  exempted: "bg-indigo-100 text-indigo-700",
};

const FeeRow = ({ fee, canManage, canSubmit, onSubmit, onCancel, onApprove, onReject }: {
  fee: MemberFee;
  canManage: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onApprove: () => void;
  onReject: () => void;
}) => (
  <div className="grid gap-4 border-b border-border p-4 last:border-0 lg:grid-cols-[minmax(220px,1fr)_minmax(240px,1fr)_auto] lg:items-center">
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 font-black text-primary">
        {fee.playerAvatar ? <img src={fee.playerAvatar} alt={fee.playerName} className="h-full w-full object-cover" /> : fee.playerName.slice(0, 1)}
      </div>
      <div className="min-w-0">
        <p className="font-bold">{fee.playerName}</p>
        <p className="truncate text-sm text-muted-foreground">{fee.playerEmail || fee.playerPhone || "Chưa có thông tin định danh"}</p>
      </div>
    </div>
    <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
      <span>Cần đóng: <strong className="text-foreground">{money(fee.amount)}</strong></span>
      <span>Đã xác nhận: <strong className="text-foreground">{fee.status === "paid" ? money(fee.amountPaid || fee.amount) : money(0)}</strong></span>
      <span>Ngày gửi: {dateText(fee.submittedAt)}</span>
      <span>Ngày duyệt: {dateText(fee.reviewedAt)}</span>
      {fee.transactionCode ? <span>Mã giao dịch: {fee.transactionCode}</span> : null}
      {fee.note ? <span>Ghi chú: {fee.note}</span> : null}
      {fee.rejectReason ? <span className="text-red-600">Lý do từ chối: {fee.rejectReason}</span> : null}
    </div>
    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
      {fee.receiptImage ? (
        <a href={fee.receiptImage} target="_blank" rel="noreferrer" className="h-14 w-14 overflow-hidden rounded-lg border border-border" title="Xem ảnh bằng chứng">
          <img src={fee.receiptImage} alt={`Ảnh chuyển khoản của ${fee.playerName}`} className="h-full w-full object-cover" />
        </a>
      ) : null}
      <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusClass[fee.status]}`}>
        {fee.status === "pending" && canSubmit ? "Đã gửi xác nhận" : statusText[fee.status]}
      </span>
      {canSubmit && ["pending", "rejected"].includes(fee.status) ? (
        <Button type="button" size="icon-sm" variant="ghost" className="text-red-600" onClick={onCancel} title="Hủy bằng chứng" aria-label="Hủy bằng chứng">
          <X className="h-4 w-4" />
        </Button>
      ) : null}
      {canSubmit && fee.status === "unpaid" ? <Button onClick={onSubmit}>Xác nhận đã đóng</Button> : null}
      {canManage && fee.status === "pending" ? (
        <>
          <Button onClick={onApprove}>Xác nhận đã đóng</Button>
          <Button variant="outline" className="text-red-600" onClick={onReject}>Từ chối</Button>
        </>
      ) : null}
    </div>
  </div>
);

export default TeamDetailPage;
