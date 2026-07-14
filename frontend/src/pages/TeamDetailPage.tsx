import { useEffect, useMemo, useState } from "react";
import { Check, CreditCard, Search, Send, UserPlus, Users, X } from "lucide-react";
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
import type { PlayerProfileSummary } from "@/types/teamCollaboration";

type Tab = "members" | "invite" | "requests" | "fees";

const ProfilePreview = ({ player }: { player: PlayerProfileSummary }) => (
  <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/30 p-4 text-sm">
    <div><span className="block text-xs text-muted-foreground">Trình độ</span><strong>{player.level}</strong></div>
    <div><span className="block text-xs text-muted-foreground">Kinh nghiệm</span><strong>{player.experience}</strong></div>
    <div><span className="block text-xs text-muted-foreground">Môn</span><strong>{player.sport}</strong></div>
    <div><span className="block text-xs text-muted-foreground">Điểm kỹ năng</span><strong>{player.skill}/5</strong></div>
  </div>
);

const TeamDetailPage = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { info, members, loading, fetchTeamDetail, removeMember } = useTeamStore();
  const {
    players,
    invitations,
    joinRequests,
    fees,
    searchPlayers,
    fetchInvitations,
    fetchJoinRequests,
    fetchFees,
    invitePlayer,
    reviewJoinRequest,
    submitFee,
  } = useTeamCollaborationStore();
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<Tab>("members");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<PlayerProfileSummary | null>(null);
  const [receipt, setReceipt] = useState("");
  const tournamentId = info?.tournamentItemId || "";
  const currentUserId = user?.id || "";
  const captain = members[0];
  const isPlayer = Boolean(user?.roles.includes("player"));
  const isCaptain = isPlayer && Boolean(captain?.userId && captain.userId === currentUserId);
  const isParticipant = isPlayer && members.some((member) => member.userId === currentUserId);

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Xoá ${memberName} khỏi đội?`)) return;
    try {
      await removeMember(id, memberId);
    } catch (error) {
      console.error("Không thể xoá thành viên:", error);
      toast.error("Không thể xoá thành viên khỏi đội.");
    }
  };

  useEffect(() => { if (id) void fetchTeamDetail(id); }, [fetchTeamDetail, id]);
  useEffect(() => { if (id && tab === "invite") void fetchInvitations(id); }, [fetchInvitations, id, tab]);
  useEffect(() => { if (id && tab === "requests") void fetchJoinRequests(id); }, [fetchJoinRequests, id, tab]);
  useEffect(() => { if (id && tab === "fees") void fetchFees(id); }, [fetchFees, id, tab]);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);
  useEffect(() => {
    if (tab === "invite" && tournamentId) void searchPlayers(tournamentId, debouncedSearch);
  }, [debouncedSearch, searchPlayers, tab, tournamentId]);

  const filteredMembers = useMemo(
    () => members.filter((member) => member.name.toLowerCase().includes(search.toLowerCase())),
    [members, search],
  );

  if (loading) return <div className="flex min-h-screen items-center justify-center">Đang tải đội...</div>;
  if (!info) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Không tìm thấy đội.</div>;

  const tabs: Array<{ id: Tab; label: string; icon: typeof Users; visible: boolean; badge?: number }> = [
    { id: "members", label: "Thành viên", icon: Users, visible: true },
    { id: "invite", label: "Mời thành viên", icon: UserPlus, visible: isCaptain },
    { id: "requests", label: "Yêu cầu gia nhập", icon: Send, visible: isCaptain, badge: joinRequests.filter((item) => item.status === "pending").length },
    { id: "fees", label: "Lệ phí", icon: CreditCard, visible: isParticipant },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <TeamHero info={info} />
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2">
            {tabs.filter((item) => item.visible).map((item) => (
              <button key={item.id} type="button" onClick={() => { setTab(item.id); setSearch(""); }} className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold ${tab === item.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>
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
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {filteredMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    canRemove={isCaptain && member.id !== captain?.id}
                    onRemove={() => void handleRemoveMember(member.id, member.name)}
                  />
                ))}
              </div>
            </section>
          )}

          {tab === "invite" && isCaptain && (
            <section className="space-y-5">
              <div><h2 className="text-2xl font-black">Mời thành viên</h2><p className="text-sm text-muted-foreground">Chỉ hiển thị người có Player profile hợp lệ và chưa thuộc đội trong giải.</p></div>
              <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Tìm theo tên vận động viên..." /></div>
              <div className="grid gap-4 md:grid-cols-2">
                {players.map((player) => {
                  const invited = invitations.some((item) => item.receiverId === player.userId && item.status === "pending");
                  return (
                    <div key={player.id} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-start gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-black text-primary">{player.avatar || player.name.slice(0, 1)}</div><div className="flex-1"><h3 className="font-black">{player.name}</h3><p className="text-xs text-muted-foreground">{player.sport} · trình {player.level}</p></div></div>
                      <div className="mt-4 flex gap-2"><Button variant="outline" onClick={() => setSelectedProfile(player)}>Xem hồ sơ</Button><Button disabled={invited} onClick={() => void invitePlayer(id, tournamentId, player)}>{invited ? "Đã mời" : "Gửi lời mời"}</Button></div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {tab === "requests" && isCaptain && (
            <section className="space-y-5">
              <div><h2 className="text-2xl font-black">Yêu cầu gia nhập đội</h2><p className="text-sm text-muted-foreground">Duyệt các yêu cầu đang chờ của đội.</p></div>
              {joinRequests.map((request) => (
                <div key={request.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex flex-1 items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-black text-primary">{request.player.avatar}</div><div><h3 className="font-black">{request.player.name}</h3><p className="text-sm text-muted-foreground">{request.message}</p></div></div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => setSelectedProfile(request.player)}>Xem hồ sơ</Button>
                      {request.status === "pending" ? <><Button onClick={() => void reviewJoinRequest(request.id, "accept")}><Check className="mr-1 h-4 w-4" />Chấp nhận</Button><Button variant="outline" className="text-red-600" onClick={() => void reviewJoinRequest(request.id, "reject")}><X className="mr-1 h-4 w-4" />Từ chối</Button></> : <span className="rounded-full bg-muted px-3 py-2 text-xs font-bold">{request.status}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {tab === "fees" && isParticipant && (
            <section className="space-y-5">
              <div><h2 className="text-2xl font-black">Lệ phí thành viên</h2><p className="text-sm text-muted-foreground">Theo dõi QR và trạng thái lệ phí của đội.</p></div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-black">QR lệ phí của giải</h3>
                {info.paymentQR ? (
                  <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
                    <img src={info.paymentQR} alt="QR lệ phí giải" className="h-52 w-52 rounded-xl border border-border object-contain" />
                    <div className="text-sm text-muted-foreground">
                      {info.feeAmount ? <p className="font-bold text-foreground">Số tiền: {info.feeAmount.toLocaleString("vi-VN")} VNĐ/người</p> : null}
                      <p className="mt-2">Sau khi chuyển khoản, tải biên lai bên dưới để gửi xác nhận.</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Chưa có QR lệ phí trong dữ liệu giải.</p>
                )}
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {fees.map((fee) => (
                  <div key={fee.playerId} className="flex flex-col gap-3 border-b border-border p-4 last:border-0 md:flex-row md:items-center">
                    <div className="flex-1"><p className="font-bold">{fee.playerName}</p><p className="text-sm text-muted-foreground">{fee.amount.toLocaleString("vi-VN")} VN?</p></div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${fee.status === "paid" || fee.status === "exempted" ? "bg-green-100 text-green-700" : fee.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{fee.status === "paid" ? "Đã đóng" : fee.status === "pending" ? "Chờ xác nhận" : fee.status === "exempted" ? "Miễn phí" : "Chưa đóng"}</span>
                    {fee.status === "unpaid" && <Button onClick={() => setReceipt("open")}>Đóng lệ phí</Button>}
                  </div>
                ))}
              </div>
              {receipt && (
                <div className="max-w-lg rounded-xl border border-border bg-card p-5">
                  <h3 className="font-black">Tải biên lai chuyển khoản</h3>
                  <div className="mt-4"><ImageUploadField label="Ảnh biên lai" value={receipt === "open" ? "" : receipt} onChange={setReceipt} /></div>
                  <Button className="mt-4" disabled={receipt === "open"} onClick={() => void submitFee(id, "current-player", receipt)}>Gửi xác nhận thanh toán</Button>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />

      {selectedProfile && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedProfile(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-xl font-black text-primary">{selectedProfile.avatar || selectedProfile.name.slice(0, 1)}</div><div className="flex-1"><h2 className="text-xl font-black">{selectedProfile.name}</h2><p className="text-sm text-muted-foreground">Hồ sơ vận động viên</p></div><Button size="icon" variant="ghost" onClick={() => setSelectedProfile(null)}><X className="h-4 w-4" /></Button></div>
            <div className="mt-5"><ProfilePreview player={selectedProfile} /></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetailPage;
