// src/pages/TournamentDashboard.tsx
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateTournamentModal from "@/components/tournament/CreateTournamentModal/CreateTournamentModal";
import { StatsCards } from "@/components/tournament/GeneralDashboard/GeneralStatsCards";
import { RecentTournamentsTable } from "@/components/tournament/GeneralDashboard/TournamentsTable";
import { SidebarTabs } from "@/components/tournament/GeneralDashboard/GeneralSidebarTabs";
import { useTournamentStore } from "@/stores/useTournamentStore";
import { resourceService } from "@/services/resourceService";
import type { Tournament } from "@/types/tournament";
import type { IRefereeItem, ICourtItem } from "@/types/dashboard";

export default function TournamentDashboard() {
  const { tournamentList, fetchTournaments, loading } = useTournamentStore() as unknown as {
    tournamentList: Tournament[];
    fetchTournaments: () => Promise<void>;
    loading: boolean;
  };
  const [referees, setReferees] = useState<IRefereeItem[]>([]);
  const [courts, setCourts] = useState<ICourtItem[]>([]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  useEffect(() => {
    let isMounted = true;

    const loadResources = async () => {
      const [refereeData, courtData] = await Promise.all([
        resourceService.getReferees().catch(() => []),
        resourceService.getCourts().catch(() => []),
      ]);

      if (!isMounted) return;

      setReferees(refereeData.map((referee) => ({
        id: referee._id,
        name: referee.name,
        email: referee.email || "",
        phone: referee.phoneNumber || referee.phone || "",
        level: `${Math.max(...(referee.sports || []).map((sport) => sport.yearsOfExperience || 0), 0)} năm kinh nghiệm`,
      })));
      setCourts(courtData.map((court) => ({
        id: court._id,
        name: court.name,
        location: court.location || "Chưa cập nhật",
        status: court.status === "maintenance" || court.status === "inActive" ? "maintenance" : "available",
      })));
    };

    void loadResources();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalTournaments = tournamentList?.length || 0;
  const ongoingTournaments = (tournamentList || []).filter((t) => ["ongoing", "playing", "Actived"].includes(t?.status || "")).length;

  return (
    <div className="flex min-h-screen w-full flex-col gap-8 p-4 md:p-8 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Hệ thống quản lý</h1>
          <p className="text-sm text-muted-foreground">
            Thiết lập vòng đấu, điều phối trọng tài và theo dõi hiệu suất cụm sân theo dữ liệu thật.
          </p>
        </div>

        <CreateTournamentModal onSuccess={fetchTournaments}>
          <Button className="gap-2 font-bold shadow-xs">
            <Plus className="h-4 w-4" />
            Tạo giải đấu mới
          </Button>
        </CreateTournamentModal>
      </div>

      <StatsCards
        totalTournaments={totalTournaments}
        ongoingTournaments={ongoingTournaments}
        totalReferees={referees.length}
        totalCourts={courts.length}
        loading={loading}
      />

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <RecentTournamentsTable
          tournamentList={tournamentList || []}
          loading={loading}
          onRefresh={fetchTournaments}
        />
        <SidebarTabs referees={referees} courts={courts} />
      </div>
    </div>
  );
}
