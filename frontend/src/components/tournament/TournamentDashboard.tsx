// src/pages/TournamentDashboard.tsx
import { useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import CreateTournamentModal from "@/components/tournament/CreateTournamentModal/CreateTournamentModal";
import { StatsCards } from "@/components/tournament/GeneralDashboard/GeneralStatsCards";
import { RecentTournamentsTable } from "@/components/tournament/GeneralDashboard/TournamentsTable";
import { SidebarTabs } from "@/components/tournament/GeneralDashboard/GeneralSidebarTabs";

import { useTournamentStore } from "@/stores/useTournamentStore";
import type { Tournament } from "@/types/tournament"; // 🆕 Dùng type chuẩn của dự án, bỏ ITournamentItem
import type { IRefereeItem, ICourtItem } from "@/types/dashboard";

const MOCK_REFEREES: IRefereeItem[] = [
  { id: "ref-1", name: "Trọng tài Nguyễn Văn Vũ", email: "vu.nguyen@ref.com", phone: "0901234561", level: "Trọng tài cấp Quốc Gia" },
  { id: "ref-2", name: "Trọng tài Trần Minh Tuyền", email: "tuyen.tran@ref.com", phone: "0901234562", level: "Trọng tài cấp Tỉnh" },
  { id: "ref-3", name: "Trọng tài Lê Hoàng Phong", email: "phong.le@ref.com", phone: "0901234563", level: "Trọng tài cấp Quốc Gia" },
];

const MOCK_COURTS: ICourtItem[] = [
  { id: "court-1", name: "Sân Pickleball Trung tâm A", location: "Khu A - Sân chính thức", status: "available" },
  { id: "court-2", name: "Sân Pickleball Trung tâm B", location: "Khu B - Sân phụ", status: "available" },
  { id: "court-3", name: "Sân C - Đang bảo trì đèn", location: "Khu C", status: "maintenance" },
];

export default function TournamentDashboard() {
  const { tournamentList, fetchTournaments, loading } = useTournamentStore() as unknown as {
    tournamentList: Tournament[];
    fetchTournaments: () => Promise<void>;
    loading: boolean;
  };

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  // Các hàm helper an toàn chống lỗi length
  const getTournamentCount = (list: Tournament[] | undefined): number => list?.length || 0;
  
  const getOngoingCount = (list: Tournament[] | undefined): number => {
    if (!list) return 0;
    return list.filter((t) => t?.status === "ongoing").length || 0;
  };

  const totalTournaments = getTournamentCount(tournamentList);
  const ongoingTournaments = getOngoingCount(tournamentList);

  return (
    <div className="flex min-h-screen w-full flex-col gap-8 p-4 md:p-8 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Hệ thống Quản lý</h1>
          <p className="text-sm text-muted-foreground">
            Thiết lập vòng đấu, điều phối trọng tài và theo dõi hiệu suất cụm sân real-time.
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
        totalReferees={MOCK_REFEREES.length}
        totalCourts={MOCK_COURTS.length}
        loading={loading}
      />

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        {/* Truyền đúng chuẩn Tournament[] xuống bảng */}
        <RecentTournamentsTable 
          tournamentList={tournamentList || []} 
          loading={loading}
          onRefresh={fetchTournaments}
        />
        <SidebarTabs referees={MOCK_REFEREES} courts={MOCK_COURTS} />
      </div>
    </div>
  );
}