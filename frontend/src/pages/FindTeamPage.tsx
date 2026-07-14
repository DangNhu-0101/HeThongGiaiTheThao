import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Search, Users } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { participantService } from "@/services/participantService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useParticipantStore } from "@/stores/useParticipantStore";
import { useTeamCollaborationStore } from "@/stores/useTeamCollaborationStore";
import type { TeamTournamentOption } from "@/types/participant";

const getTeamInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

const isImageSource = (value?: string) =>
  Boolean(value && (value.startsWith("data:image") || value.startsWith("http://") || value.startsWith("https://")));

const FindTeamPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTournamentId = searchParams.get("tournament") || "";
  const { accessToken, user, initialized } = useAuthStore();
  const { participants, fetchParticipants, loading } = useParticipantStore();
  const requestJoin = useTeamCollaborationStore((state) => state.requestJoin);
  const [tournaments, setTournaments] = useState<TeamTournamentOption[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [tournamentSearch, setTournamentSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");

  useEffect(() => {
    participantService.getTournamentOptions()
      .then(setTournaments)
      .catch(() => toast.error("Không thể tải danh sách giải."))
      .finally(() => setLoadingTournaments(false));
  }, []);

  useEffect(() => {
    if (selectedTournamentId) void fetchParticipants(selectedTournamentId);
  }, [fetchParticipants, selectedTournamentId]);

  const filteredTournaments = useMemo(
    () => tournaments.filter((item) => `${item.parentTournamentName || ""} ${item.name} ${item.sportType}`.toLowerCase().includes(tournamentSearch.toLowerCase())),
    [tournamentSearch, tournaments],
  );
  const teams = useMemo(
    () => participants.filter((team) => team.type === "team" && team.name.toLowerCase().includes(teamSearch.toLowerCase())),
    [participants, teamSearch],
  );
  const selectedTournament = tournaments.find((item) => item.id === selectedTournamentId);

  if (!initialized) return <div className="flex min-h-screen items-center justify-center">Đang xác thực...</div>;
  if (!accessToken || !user) return <Navigate to="/login" replace state={{ from: "/teams/find" }} />;

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <p className="text-xs font-black uppercase tracking-wider text-primary">Player</p>
          <h1 className="mt-2 text-3xl font-black">Tìm đội trong giải</h1>
          <p className="mt-2 text-sm text-muted-foreground">Chọn giải, xem danh sách đội và gửi yêu cầu gia nhập nếu bạn đã có hồ sơ player.</p>

          <section className="mt-6 space-y-3">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={tournamentSearch} onChange={(event) => setTournamentSearch(event.target.value)} placeholder="Tìm giải, hội thao hoặc môn..." />
            </div>
            <div className="grid max-h-72 gap-3 overflow-y-auto rounded-xl border border-border p-3 md:grid-cols-3">
              {filteredTournaments.map((item) => {
                const active = item.id === selectedTournamentId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSearchParams({ tournament: item.id })}
                    className={`rounded-xl border p-4 text-left transition-colors ${active ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted"}`}
                  >
                    <p className="font-black">{item.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.parentTournamentName ? `${item.parentTournamentName} · ` : ""}{item.sportType}</p>
                  </button>
                );
              })}
              {!loadingTournaments && filteredTournaments.length === 0 && <div className="col-span-full rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Không tìm thấy giải phù hợp.</div>}
              {loadingTournaments && <div className="col-span-full p-6 text-center text-sm text-muted-foreground">Đang tải danh sách giải...</div>}
            </div>
          </section>

          {selectedTournamentId && (
            <section className="mt-8 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-black">Danh sách đội {selectedTournament ? `· ${selectedTournament.name}` : ""}</h2>
                  <p className="text-sm text-muted-foreground">Dữ liệu lấy từ danh sách đăng ký của giải.</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" value={teamSearch} onChange={(event) => setTeamSearch(event.target.value)} placeholder="Tìm đội trong giải..." />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {teams.map((team) => (
                  <div key={team._id} className="min-w-0 rounded-xl border border-border bg-background p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 font-black text-primary">
                        {isImageSource(team.logo)
                          ? <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
                          : getTeamInitials(team.name) || <Users className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words font-black leading-tight">{team.name}</h3>
                        <p className="text-xs text-muted-foreground">{team.lineup.length} thành viên</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <Button variant="outline" render={<Link to={`/teams/${team._id}`} />}>Xem đội</Button>
                      <Button onClick={() => void requestJoin(team._id, selectedTournamentId, {
                        id: user.id,
                        userId: user.id,
                        name: user.username,
                        avatar: user.avatar || "P",
                        skill: 0,
                        sport: selectedTournament?.sportType || "Đang cập nhật",
                        level: "Đang cập nhật",
                        experience: "Đang cập nhật",
                      })}>Gửi yêu cầu gia nhập</Button>
                    </div>
                  </div>
                ))}
                {!loading && teams.length === 0 && <div className="col-span-full rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Chưa có đội phù hợp trong giải này.</div>}
                {loading && <div className="col-span-full p-8 text-center text-sm text-muted-foreground">Đang tải danh sách đội...</div>}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FindTeamPage;
