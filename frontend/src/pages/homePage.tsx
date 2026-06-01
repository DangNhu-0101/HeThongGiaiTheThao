import { useEffect, useState } from "react";
import {  Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

import CreateTournamentModal from "@/components/tournament/CreateTournamentModal/CreateTournamentModal";
import { TournamentCard } from "@/components/tournament/List/TournamentCard";
import { TournamentFilter } from "@/components/tournament/List/TournamentFilter";

import { useTournamentStore } from "@/stores/useTournamentStore";
import type { Tournament } from "@/types/tournament";

export function HomePage() {
  const { tournamentList, fetchTournaments, loading } = useTournamentStore() as unknown as {
    tournamentList: Tournament[];
    fetchTournaments: () => Promise<void>;
    loading: boolean;
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  // Xử lý logic Lọc & Tìm kiếm an toàn
  const safeList = tournamentList || [];
  const filteredTournaments = safeList.filter((tour) => {
    const matchesSearch = tour.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || tour.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div> 
     
      {/* 1. Header & Nút tạo giải */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Quản lý Giải đấu
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng hợp và quản trị toàn bộ các giải đấu thuộc hệ thống của bạn.
          </p>
        </div>
        
 
      </div>

      {/* 2. Thanh tìm kiếm và phân loại */}
      <TournamentFilter 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* 3. Grid hiển thị danh sách Thẻ giải đấu */}
      {loading ? (
        // Skeleton Loading
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 xl:gap-8 gap-6 mt-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 xl:gap-8 gap-6 mt-4">
          {filteredTournaments.map((tour) => {
            const tourId = (tour._id || "").toString();
            return <TournamentCard key={tourId} tournament={tour} />;
          })}
        </div>
      ) : (
        // Trạng thái trống (Empty State)
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-xl border border-dashed border-slate-300 mt-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Không tìm thấy giải đấu</h3>
          <p className="text-sm text-slate-500 text-center max-w-sm mb-6">
            {searchTerm || statusFilter !== "all" 
              ? "Không có giải đấu nào phù hợp với bộ lọc hiện tại của bạn. Vui lòng thử tìm kiếm bằng từ khóa khác." 
              : "Bạn chưa tạo giải đấu nào. Hãy nhấn nút 'Tạo giải đấu mới' để bắt đầu."}
          </p>
          {searchTerm || statusFilter !== "all" ? (
            <Button variant="outline" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}>
              Xóa bộ lọc
            </Button>
          ) : (
            <CreateTournamentModal onSuccess={fetchTournaments}>
              <Button className="font-bold">Tạo giải đấu đầu tiên</Button>
            </CreateTournamentModal>
          )}
        </div>
      )}
    </div>
  );
}
export default HomePage;