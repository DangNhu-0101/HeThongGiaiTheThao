import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TournamentListingHero from "@/components/tournament/TournamentListingHero";
import SportsCarousel from "@/components/home/SportsCarousel";
import TournamentFilters from "@/components/tournament/TournamentFilters";
import AllTournaments from "@/components/home/AllTournaments";
import CTASection from "@/components/tournament/CTASection";
import { Button } from "@/components/ui/button";
import { useTournamentStore } from "@/stores/useTournamentStore";

const TournamentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sport = searchParams.get("sport") || "";
  const { tournaments, sports, loading, error, fetchAllTournaments } = useTournamentStore();
  const selectedSport = sports.find((item) => item.slug === sport || item.name === sport);

  useEffect(() => {
    void fetchAllTournaments(sport ? { sport } : {});
  }, [fetchAllTournaments, sport]);

  const clearSportFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("sport");
    setSearchParams(next, { replace: true });
  };

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
          <SportsCarousel sports={sports} loading={loading} error={error} onRetry={() => fetchAllTournaments(sport ? { sport } : {})} />
        </div>

        {sport && (
          <div className="page-shell pt-8">
            <div className="flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-primary-dark">
                Đang lọc theo môn: <span className="font-bold">{selectedSport?.name || sport}</span>
              </p>
              <Button type="button" variant="outline" onClick={clearSportFilter}>Bỏ bộ lọc môn</Button>
            </div>
          </div>
        )}

        <TournamentFilters />

        <div className="-mt-8">
          <AllTournaments tournaments={tournaments} loading={loading} error={error} onRetry={() => fetchAllTournaments(sport ? { sport } : {})} />
        </div>

        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default TournamentsPage;
