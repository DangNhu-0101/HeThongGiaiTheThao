import { useEffect } from "react";
import GroupStandingsTable from "./GroupStandingsTable";
import TopPerformers from "./TopPerformers";
import { useStandingsStore } from "@/stores/useStandingsStore";

const StandingsTab = ({ tournamentId }: { tournamentId: string }) => {
  const { groups, topScorers, topAssists, loading, fetchStandings } = useStandingsStore();

  useEffect(() => {
    fetchStandings(tournamentId);
  }, [tournamentId, fetchStandings]);

  if (loading) return <div className="py-20 text-center text-muted-foreground">Đang tải bảng xếp hạng...</div>;

  return (
    <div className="py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      {/* Cột trái (Bảng xếp hạng) - Chiếm 2 phần */}
      <div className="lg:col-span-2">
        {groups.map((group) => (
          <GroupStandingsTable key={group.groupId} group={group} />
        ))}
      </div>

      {/* Cột phải (VĐV Xuất sắc) - Chiếm 1 phần */}
      <div className="lg:col-span-1 space-y-8">
        <TopPerformers scorers={topScorers} assists={topAssists} />
      </div>

    </div>
  );
};

export default StandingsTab;