import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { participantService } from "@/services/participantService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTeamCollaborationStore } from "@/stores/useTeamCollaborationStore";
import type { Participant } from "@/types/participant";

const TeamsTab = ({ tournamentItemId }: { tournamentItemId: string }) => {
  const navigate = useNavigate();
  const { accessToken, user } = useAuthStore();
  const requestJoin = useTeamCollaborationStore((state) => state.requestJoin);
  const [teams, setTeams] = useState<Participant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true);
      participantService.getPublicByTournament(tournamentItemId)
        .then((items) => setTeams(items.filter((item) => item.type === "team")))
        .catch(() => setTeams([]))
        .finally(() => setLoading(false));
    });
  }, [tournamentItemId]);

  const filteredTeams = useMemo(
    () => teams.filter((team) => team.name.toLowerCase().includes(search.toLowerCase())),
    [search, teams],
  );

  const joinTeam = async (teamId: string) => {
    if (!accessToken || !user?.roles.includes("player")) {
      navigate("/login", {
        state: {
          from: `/tournaments/${tournamentItemId}`,
          requiredRoles: ["player"],
        },
      });
      return;
    }
    await requestJoin(teamId, tournamentItemId, {
      id: user.id,
      userId: user.id,
      name: user.username,
      avatar: user.avatar || user.username.slice(0, 2).toUpperCase(),
      skill: 0,
      sport: "Đang cập nhật",
      level: "Đang cập nhật",
      experience: "Đang cập nhật",
    });
  };

  const createTeam = () => {
    if (!accessToken || !user) {
      navigate("/login", { state: { from: `/teams/create?tournament=${tournamentItemId}` } });
      return;
    }
    navigate(`/teams/create?tournament=${tournamentItemId}`);
  };

  return (
    <section className="space-y-5 py-8">
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-black">Đội đang tham gia</h2>
          <p className="text-sm text-muted-foreground">Xem thông tin đội hoặc gửi yêu cầu gia nhập.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Tìm tên đội..." />
          </div>
          <Button onClick={createTeam}>Tạo đội</Button>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Đang tải danh sách đội...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => (
            <article key={team._id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 font-black text-primary">
                  {team.logo?.startsWith("data:image")
                    ? <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
                    : team.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-black">{team.name}</h3>
                  <p className="text-xs text-muted-foreground">{team.lineup.length} thành viên</p>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" className="flex-1" render={<Link to={`/teams/${team._id}`} />}>Xem đội</Button>
                <Button className="flex-1" onClick={() => void joinTeam(team._id)}>Xin gia nhập</Button>
              </div>
            </article>
          ))}
          {filteredTeams.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-bold">Chưa có đội nào</p>
              <p className="text-sm text-muted-foreground">Hãy trở thành đội trưởng đầu tiên của giải.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default TeamsTab;
