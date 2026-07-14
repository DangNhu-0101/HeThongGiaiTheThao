import type { Sponsor } from "./sponsor";
import type { BaseRule } from "./baseRule";

export interface ITimeLine {
    registrationStart: Date;
    registrationEnd: Date;
    tournamentStart: Date;
    tournamentEnd: Date;
}

export interface IGalaConfig {
    hasGala: boolean;
    time: Date | null;
    venue: string;
    description: string;
}

export interface ILocation {
    city?: string;
    district?: string;
}

export interface Tournament {
    _id?: string; // Bổ sung _id vì dữ liệu từ MongoDB luôn có trường này
    name: string;
    description: string;
    logo: string;
    banner: string;
    sportType: string[];
    timeLine: ITimeLine;
    paymentQR: string;
    prizes: string;
    galaConfig: IGalaConfig;
    location: ILocation;
    baseRule: BaseRule[]; // Đã sửa cú pháp mảng
    budget: {
        totalSponsor: number;
        totalExpense: number;
    };
    organizer: string; // Đã sửa String -> string
    sponsors: Sponsor[]; // Đã sửa cú pháp mảng
    status: 'upcoming' | 'ongoing' | 'completed'; // Ép kiểu cụ thể thay vì string
    registeredTeams?: number;
    maxTeams?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface Prize {
  rank: string;
  amount: string;
  color: string;
}

export interface TournamentFormat {
  name: string;
  description: string;
}

export interface TournamentFilter {
  searchTerm?: string;
  sport?: string;
  status?: string;
  location?: string;
  time?: string;
}

// Bắt buộc phải có dòng export này
export interface TournamentDetail extends Omit<Tournament, 'prizes'> {
  registeredTeams: number;
  maxTeams: number;
  about: string;
  format: TournamentFormat[];
  prizes: Prize[];
  registrationMode: "system" | "external";
  registrationFormUrl: string;
  registrationInstructions: string;
  supportContacts: string;
}
export interface Sport {
  _id: string;
  name: string;
  iconUrl: string;
  eventCount: number;
  imageUrl?: string;
}

export interface Match {
  _id: string;
  tournamentId: string;
  tournamentName: string;
  teamA: { name: string; logoUrl?: string; score?: number };
  teamB: { name: string; logoUrl?: string; score?: number };
  startTime: string;
  status: 'scheduled' | 'live' | 'finished';
  round: string;
  courtName?: string;
  groupName?: string;
}

export interface Team {
  _id: string;
  name: string;
  logo: string;
  sport: string;
  location: string;
  stats: {
    athletes: number;
    wins: number;
    winRate: string;
  };
  status: 'active' | 'pending' | 'inactive';
}

export interface MatchResult {
  _id: string;
  date: string;
  teamA: { name: string; logo?: string; score: number };
  teamB: { name: string; logo?: string; score: number };
  stadium: string;
}
export interface BasicInfoState {
  name: string;
  slogan: string;
  targetParticipants: string;
  location: string;
  description: string;
}

export interface FormatConfigState {
    name: string;
    type: 'GROUP_STAGE' | 'KNOCKOUT' | 'HYBRID';
  minTeams: number;
  maxTeams: number;
  description: string;
  matchDuration: number;
    hasWildcards: boolean;
    rankingCriteria: string[];
    groupsCount: number;
    teamsPerGroup: number;
    roundRobinLegs: number;
    qualifiersPerGroup: number;
    wildcardCount: number;
    winPoints: number;
    drawPoints: number;
    lossPoints: number;
    groupTargetScore: number;
    groupChangeSideAt: number;
    finalTargetScore: number;
    finalChangeSideAt: number;
    maxWaitMinutes: number;
    timeoutCount: number;
    timeoutSeconds: number;
    branchRules: string;
    refereeRules: string;
    uniformRules: string;
    customRules: string;
  }
