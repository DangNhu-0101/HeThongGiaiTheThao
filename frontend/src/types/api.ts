import type { Tournament, Match, Sport } from "./tournament";

export interface HomeDataResponse {
  tournaments: Tournament[];
  matches: Match[];
  sports: Sport[];
  stats: {
    totalTournaments: number;
    openRegistrationTournaments: number;
    ongoingTournaments: number;
    totalTeams: number;
    totalSports: number;
    totalAthletesOrRegistrations: number;
    totalMatches: number;
    upcomingMatches: number;
    completedMatches: number;
    collectedAmount: number;
  };
}
