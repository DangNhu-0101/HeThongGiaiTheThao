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
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        Đang tải danh sách giải đấu...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <Header />

      <main className="flex-1 page-fade">
        <TournamentListingHero
          total={tournaments.length}
          active={tournaments.filter((tournament) => tournament.status === "ongoing").length}
          open={tournaments.filter((tournament) => tournament.status === "upcoming").length}
          sportCount={sports.length}
        />

        <div className="border-b border-border bg-white/76 shadow-sm">
          <SportsCarousel sports={sports} />
        </div>

        <TournamentFilters />

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
