import { useEffect } from "react";
import { AlertTriangle, Table2 } from "lucide-react";
import GroupStandingsTable from "./GroupStandingsTable";
import { useStandingsStore } from "@/stores/useStandingsStore";

const StandingsTab = ({ tournamentId }: { tournamentId: string }) => {
  const { groups, loading, error, fetchStandings } = useStandingsStore();

  useEffect(() => {
    void fetchStandings(tournamentId);
  }, [tournamentId, fetchStandings]);

  useEffect(() => {
    const refresh = (event: Event) => {
      const syncedTournamentId = (event as CustomEvent<{ tournamentItemId?: string }>).detail?.tournamentItemId;
      if (!syncedTournamentId || syncedTournamentId === tournamentId) void fetchStandings(tournamentId);
    };
    window.addEventListener("tournament-result-synced", refresh);
    return () => window.removeEventListener("tournament-result-synced", refresh);
  }, [fetchStandings, tournamentId]);

  if (loading) {
    return <div className="py-20 text-center font-medium text-muted-foreground animate-pulse">Đang tải bảng xếp hạng...</div>;
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <AlertTriangle className="mx-auto h-8 w-8" />
          <p className="mt-3 font-bold">{error}</p>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="py-8">
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Table2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-bold text-foreground">Chưa có bảng xếp hạng</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Khi cấu hình vòng bảng đã có đội hoặc bảng xếp hạng được công bố, dữ liệu sẽ hiển thị tại đây.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-black uppercase text-foreground">Bảng xếp hạng</h2>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          Hiển thị standings đã công bố; nếu chưa có điểm số, hệ thống dùng danh sách đội đã gán vào bảng trong cấu hình thể thức.
        </p>
      </div>
      <div>
        {groups.map((group) => (
          <GroupStandingsTable key={group.groupId} group={group} />
        ))}
      </div>
    </div>
  );
};

export default StandingsTab;

