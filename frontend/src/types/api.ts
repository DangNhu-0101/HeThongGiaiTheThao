import type { Tournament, Match, Sport } from "./tournament";

export interface HomeDataResponse {
  tournaments: Tournament[];
  matches: Match[];
  sports: Sport[];
  stats: {
    ongoingTournaments: number;
    totalTeams: number;
    totalSports: number;
    totalAthletesOrRegistrations: number;
  };
}
