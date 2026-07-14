import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Mail, Send, ShieldCheck, Users } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/useAuthStore";
import { useParticipantStore } from "@/stores/useParticipantStore";
import { useTeamCollaborationStore } from "@/stores/useTeamCollaborationStore";

type Tab = "teams" | "sentRequests" | "receivedInvitations" | "sentInvitations";

const getRequestStatusLabel = (status: string) => {
  if (status === "pending") return "Đang chờ duyệt";
  if (status === "accepted") return "Đã chấp nhận";
  if (status === "rejected") return "Đã từ chối";
  if (status === "cancelled") return "Đã rút yêu cầu";
  return "Không xác định";
};

const getTournamentLabel = (value: unknown) => {
  if (value && typeof value === "object") {
    const item = value as { name?: string; sportType?: string };
    return [item.name, item.sportType].filter(Boolean).join(" · ") || "Giải đấu";
  }
  return "Giải đấu";
};

const MyTeamsPage = () => {
  const { accessToken, user, initialized } = useAuthStore();
  const { participants, loading, fetchMyParticipants } = useParticipantStore();
  const {
    sentJoinRequests,
    invitations,
    sentInvitations,
    fetchMyJoinRequests,
    fetchMyInvitations,
    fetchSentInvitations,
    cancelJoinRequest,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
  } = useTeamCollaborationStore();
  const [tab, setTab] = useState<Tab>("teams");
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);

  const selectedCancelRequest = sentJoinRequests.find((request) => request.id === cancelRequestId);

  const confirmCancelJoinRequest = async () => {
    if (!cancelRequestId) return;
    await cancelJoinRequest(cancelRequestId);
    setCancelRequestId(null);
  };

  useEffect(() => {
    if (!accessToken) return;
    void fetchMyParticipants();
    void fetchMyJoinRequests();
    void fetchMyInvitations();
    void fetchSentInvitations();
  }, [accessToken, fetchMyParticipants, fetchMyJoinRequests, fetchMyInvitations, fetchSentInvitations]);

  if (!initialized) return <div className="flex min-h-screen items-center justify-center">Đang xác thực...</div>;
  if (!accessToken || !user) return <Navigate to="/login" replace state={{ from: "/my-teams" }} />;

  const tabs = [
    { id: "teams" as const, label: "Đội của tôi", icon: Users, count: participants.length },
    { id: "sentRequests" as const, label: "Yêu cầu đã gửi", icon: Send, count: sentJoinRequests.filter((item) => item.status === "pending").length },
    { id: "receivedInvitations" as const, label: "Lời mời nhận được", icon: Mail, count: invitations.filter((item) => item.status === "pending").length },
    { id: "sentInvitations" as const, label: "Lời mời đã gửi", icon: Send, count: sentInvitations.filter((item) => item.status === "pending").length },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <p className="text-xs font-black uppercase tracking-wider text-primary">Tài khoản</p>
          <h1 className="mt-2 text-3xl font-black">Đội của tôi</h1>
          <p className="mt-2 text-sm text-muted-foreground">Quản lý đội đang tham gia, yêu cầu gia nhập và lời mời đội.</p>

          <div className="mt-6 flex flex-wrap gap-2 rounded-xl border border-border bg-background p-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${tab === item.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.count > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] text-white">{item.count}</span>}
              </button>
            ))}
          </div>

          {tab === "teams" && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {participants.map((team) => (
                <div key={team._id} className="rounded-xl border border-border bg-background p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {team.type === "team" ? <Users className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-black">{team.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">{getTournamentLabel(team.tournamentItemId)}</p>
                      <p className="mt-2 text-xs font-bold text-primary">{team.type === "team" ? `${team.lineup.length} thành viên` : "Đăng ký cá nhân"}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-muted/40 p-3 text-sm">
                    <p className="font-bold">Thành viên</p>
                    <p className="mt-1 text-muted-foreground">
                      {team.lineup.map((item, index) => {
                        const player = typeof item.Player === "string" ? undefined : item.Player;
                        return player?.name || `Thành viên ${index + 1}`;
                      }).join(", ")}
                    </p>
                  </div>
                  <Button className="mt-4 w-full" render={<Link to={`/teams/${team._id}`} />}>Xem chi tiết đội và lệ phí</Button>
                </div>
              ))}
              {!loading && participants.length === 0 && <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Bạn chưa tham gia đội nào.</div>}
              {loading && <div className="col-span-full p-10 text-center text-sm text-muted-foreground">Đang tải đội của tôi...</div>}
            </div>
          )}

          {tab === "sentRequests" && (
            <div className="mt-6 space-y-3">
              {sentJoinRequests.map((request) => (
                <div key={request.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5 md:flex-row md:items-center">
                  <div className="flex-1">
                    <h3 className="font-black">{request.player.teamName || "Đội thi đấu"}</h3>
                    <p className="text-sm text-muted-foreground">Trạng thái: {getRequestStatusLabel(request.status)}</p>
                  </div>
                  {request.status === "pending" && (
                    <Button variant="outline" onClick={() => setCancelRequestId(request.id)}>
                      Rút yêu cầu
                    </Button>
                  )}
                </div>
              ))}
              {sentJoinRequests.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Chưa có yêu cầu đã gửi.</div>}
            </div>
          )}

          {tab === "receivedInvitations" && (
            <div className="mt-6 space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5 md:flex-row md:items-center">
                  <div className="flex-1">
                    <h3 className="font-black">{invitation.teamName}</h3>
                    <p className="text-sm text-muted-foreground">{invitation.message || "Bạn được mời tham gia đội."}</p>
                  </div>
                  {invitation.status === "pending" && (
                    <div className="flex gap-2">
                      <Button onClick={() => void acceptInvitation(invitation.id)}>Chấp nhận</Button>
                      <Button variant="outline" onClick={() => void rejectInvitation(invitation.id)}>Từ chối</Button>
                    </div>
                  )}
                </div>
              ))}
              {invitations.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Chưa có lời mời nhận được.</div>}
            </div>
          )}

          {tab === "sentInvitations" && (
            <div className="mt-6 space-y-3">
              {sentInvitations.map((invitation) => (
                <div key={invitation.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5 md:flex-row md:items-center">
                  <div className="flex-1">
                    <h3 className="font-black">{invitation.receiver.name}</h3>
                    <p className="text-sm text-muted-foreground">{invitation.teamName} · {invitation.status === "pending" ? "Đang chờ" : invitation.status}</p>
                  </div>
                  {invitation.status === "pending" && <Button variant="outline" onClick={() => void cancelInvitation(invitation.id)}>Thu hồi lời mời</Button>}
                </div>
              ))}
              {sentInvitations.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Chưa có lời mời đã gửi.</div>}
            </div>
          )}
        </div>
      </main>
      <Dialog open={Boolean(cancelRequestId)} onOpenChange={(open) => !open && setCancelRequestId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rút yêu cầu gia nhập đội?</DialogTitle>
            <DialogDescription>
              Yêu cầu vào đội {selectedCancelRequest?.player.teamName || "đội thi đấu"} sẽ được chuyển sang trạng thái đã rút.
              Bạn có thể gửi lại yêu cầu mới nếu đội vẫn còn mở đăng ký.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Giữ lại</DialogClose>
            <Button variant="destructive" onClick={() => void confirmCancelJoinRequest()}>
              Rút yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default MyTeamsPage;
