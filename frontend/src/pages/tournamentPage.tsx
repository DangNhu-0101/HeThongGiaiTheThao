import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TournamentListingHero from "@/components/tournament/TournamentListingHero";
import SportsCarousel from "@/components/home/SportsCarousel";
import TournamentFilters, { type TournamentListFilters } from "@/components/tournament/TournamentFilters";
import AllTournaments from "@/components/home/AllTournaments";
import CTASection from "@/components/tournament/CTASection";
import { Button } from "@/components/ui/button";
import { useTournamentStore } from "@/stores/useTournamentStore";
import type { Tournament } from "@/types/tournament";
import { slugifySport } from "@/services/backendAdapters";

const emptyFilters: TournamentListFilters = {
  search: "",
  sport: "",
  status: "",
  location: "",
  time: "",
};

const getTournamentPhase = (tournament: Tournament, now = Date.now()) => {
  if (tournament.status === "completed") {
    return { openRegistration: false, active: false, closedBeforeStart: false, playing: false, completed: true };
  }

  const registrationStart = tournament.timeLine.registrationStart?.getTime?.() || 0;
  const registrationEnd = tournament.timeLine.registrationEnd?.getTime?.() || 0;
  const tournamentStart = tournament.timeLine.tournamentStart?.getTime?.() || 0;
  const tournamentEnd = tournament.timeLine.tournamentEnd?.getTime?.() || 0;
  const registeredTeams = Number(tournament.registeredTeams || 0);
  const maxTeams = Number(tournament.maxTeams || 0);
  const hasSlots = maxTeams <= 0 || registeredTeams < maxTeams;
  const openRegistration = registrationStart <= now && now <= registrationEnd && now < tournamentStart && hasSlots;
  const active = tournament.status === "ongoing" || (registrationStart <= now && (!tournamentEnd || now <= tournamentEnd));
  const closedBeforeStart = registrationEnd < now && now < tournamentStart;
  const playing = tournamentStart <= now && (!tournamentEnd || now <= tournamentEnd);
  const completed = Boolean(tournamentEnd) && tournamentEnd < now;

  return { openRegistration, active, closedBeforeStart, playing, completed };
};

const isSameMonthOffset = (date: Date, offset: number) => {
  const target = new Date();
  target.setMonth(target.getMonth() + offset);
  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth();
};

const TournamentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sport = searchParams.get("sport") || "";
  const [filters, setFilters] = useState<TournamentListFilters>({ ...emptyFilters, sport });
  const [currentTimestamp] = useState(() => Date.now());
  const { tournaments, sports, loading, error, fetchAllTournaments } = useTournamentStore();
  const selectedSport = sports.find((item) => item.slug === sport || item.name === sport);

  useEffect(() => {
    queueMicrotask(() => setFilters((current) => ({ ...current, sport })));
  }, [sport]);

  useEffect(() => {
    void fetchAllTournaments({ includeCompleted: true });
  }, [fetchAllTournaments]);

  const locations = useMemo(() => {
    const values = new Set<string>();
    tournaments.forEach((tournament) => {
      [tournament.location?.district, tournament.location?.city, tournament.location?.detail]
        .filter(Boolean)
        .forEach((value) => values.add(String(value)));
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "vi"));
  }, [tournaments]);

  const filteredTournaments = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const sportKey = filters.sport ? slugifySport(filters.sport) : "";
    const locationKey = filters.location.trim().toLowerCase();

    return tournaments.filter((tournament) => {
      const phase = getTournamentPhase(tournament, currentTimestamp);
      const searchable = [
        tournament.name,
        tournament.description,
        tournament.organizer,
        tournament.sportType.join(" "),
        tournament.location?.city,
        tournament.location?.district,
        tournament.location?.detail,
      ].join(" ").toLowerCase();

      if (query && !searchable.includes(query)) return false;
      if (sportKey && !tournament.sportType.some((name) => slugifySport(name) === sportKey)) return false;
      if (locationKey) {
        const locationText = [tournament.location?.city, tournament.location?.district, tournament.location?.detail].join(" ").toLowerCase();
        if (!locationText.includes(locationKey)) return false;
      }
      if (filters.status === "open" && !phase.openRegistration) return false;
      if (filters.status === "active" && !phase.active) return false;
      if (filters.status === "closed" && !phase.closedBeforeStart) return false;
      if (filters.status === "completed" && !phase.completed) return false;
      if (filters.time === "this-month" && !isSameMonthOffset(tournament.timeLine.tournamentStart, 0)) return false;
      if (filters.time === "next-month" && !isSameMonthOffset(tournament.timeLine.tournamentStart, 1)) return false;
      if (filters.time === "upcoming" && tournament.timeLine.tournamentStart.getTime() < currentTimestamp) return false;
      return true;
    });
  }, [currentTimestamp, filters, tournaments]);

  const stats = useMemo(() => {
    return tournaments.reduce(
      (current, tournament) => {
        const phase = getTournamentPhase(tournament, currentTimestamp);
        return {
          total: current.total + 1,
          active: current.active + (phase.active ? 1 : 0),
          open: current.open + (phase.openRegistration ? 1 : 0),
        };
      },
      { total: 0, active: 0, open: 0 },
    );
  }, [currentTimestamp, tournaments]);

  const updateFilters = (patch: Partial<TournamentListFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    if (patch.sport !== undefined) {
      const next = new URLSearchParams(searchParams);
      if (patch.sport) next.set("sport", patch.sport);
      else next.delete("sport");
      setSearchParams(next, { replace: true });
    }
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    const next = new URLSearchParams(searchParams);
    next.delete("sport");
    setSearchParams(next, { replace: true });
  };

  const clearSportFilter = () => updateFilters({ sport: "" });

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <Header />

      <main className="flex-1 page-fade">
        <TournamentListingHero
          total={stats.total}
          active={stats.active}
          open={stats.open}
          sportCount={sports.length}
        />

        <div className="border-b border-border bg-white/76 shadow-sm">
          <SportsCarousel sports={sports} loading={loading} error={error} onRetry={() => fetchAllTournaments({ includeCompleted: true })} />
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

        <TournamentFilters
          filters={filters}
          sports={sports}
          locations={locations}
          resultCount={filteredTournaments.length}
          onChange={updateFilters}
          onClear={clearFilters}
        />

        <div className="-mt-8">
          <AllTournaments tournaments={filteredTournaments} loading={loading} error={error} onRetry={() => fetchAllTournaments({ includeCompleted: true })} />
        </div>

        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default TournamentsPage;
