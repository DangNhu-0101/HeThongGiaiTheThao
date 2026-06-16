import { useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TournamentListingHero from "@/components/tournament/TournamentListingHero";
import SportsCarousel from "@/components/home/SportsCarousel";
import TournamentFilters from "@/components/tournament/TournamentFilters";
import AllTournaments from "@/components/home/AllTournaments";
import CTASection from "@/components/tournament/CTASection";
import { useTournamentStore } from "@/stores/useTournamentStore";

const TournamentsPage = () => {
  const { tournaments, sports, loading, fetchAllTournaments } = useTournamentStore();

  useEffect(() => {
    fetchAllTournaments();
  }, [fetchAllTournaments]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Đang tải danh sách giải đấu...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Header />
      
      <main className="flex-1">
        <TournamentListingHero />
        
        {/* Tái sử dụng Component phân loại môn thể thao */}
        <div className="bg-white border-b border-border shadow-sm">
          <SportsCarousel sports={sports} />
        </div>

        <TournamentFilters />
        
        {/* Tái sử dụng danh sách giải đấu (Bỏ phần tiêu đề bên trong AllTournaments nếu cần) */}
        <div className="-mt-8"> 
          <AllTournaments tournaments={tournaments} />
        </div>

        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default TournamentsPage;