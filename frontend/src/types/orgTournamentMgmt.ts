export interface TournamentMgmtStat {
  id: string;
  label: string;
  value: number;
  iconType: 'total' | 'live' | 'open' | 'draft' | 'completed';
  color: string;
}

export type TournamentKind = "single" | "multi";
export type TournamentRegistrationMode = "system" | "external";

export interface SponsorTierState {
  name: string;
  slots: number;
  amount: number;
  benefits: string;
}

export interface TournamentOperationsState {
  registrationMode: TournamentRegistrationMode;
  registrationFormUrl: string;
  zaloGroupUrl: string;
  maxRegistrations: number;
  registrationInstructions: string;
  supportContacts: string;
  feeIncludes: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  transferContent: string;
  paymentInstructions: string;
  refundPolicy: string;
  mediaConsent: boolean;
  mediaUsageTerms: string;
  logo: string;
  banner: string[];
  paymentQR: string;
  hasGala: boolean;
  galaStart: string;
  galaEnd: string;
  galaVenue: string;
  galaDescription: string;
  sponsorContact: string;
  sponsorTiers: SponsorTierState[];
}

export interface TournamentRecord {
  id: string;
  tournamentItemId?: string;
  kind: TournamentKind;
  name: string;
  season: string;
  format: string;
  sport: string;
  status: 'Live' | 'Registration Open' | 'Draft' | 'Completed';
  registration: {
    current: number;
    max: number;
    statusText: string;
    isOpen: boolean;
  };
  teamsCount: number;
  startDate: string;
  endDate: string;
  revenue: {
    amount: string;
    projectedText: string;
    isUp: boolean;
  };
}

export interface TournamentRuleRef {
  sport: string;
  categoryRuleId: string;
  categoryTemplateId?: string;
  source?: "system" | "custom";
  categoryName?: string;
  feePerAthlete?: number;
  maxTeams?: number;
  categories?: string[];
  customFormat?: import("./competitionFormat").CompetitionFormatUpsertPayload;
  itemName?: string;
  itemDescription?: string;
  inheritTimeline?: boolean;
  inheritLocation?: boolean;
  inheritMedia?: boolean;
  inheritPrizes?: boolean;
  registrationStart?: string;
  registrationEnd?: string;
  tournamentStart?: string;
  tournamentEnd?: string;
  location?: string;
  prizes?: string;
  itemLogo?: string;
  itemBanners?: string[];
  operations?: TournamentOperationsState;
}

export interface TournamentUpsertPayload {
  kind: TournamentKind;
  name: string;
  description?: string;
  prizes?: string;
  format?: string;
  sportType?: string;
  categoryRuleId?: string;
  categoryRuleIds?: string[];
  sportRules?: TournamentRuleRef[];
  registrationStart: string;
  registrationEnd: string;
  tournamentStart: string;
  tournamentEnd: string;
  location?: {
    city?: string;
    district?: string;
    detail?: string;
  };
  maxTeams?: number;
  overview?: {
    slogan?: string;
    purpose?: string;
    targetParticipants?: string;
    organizerName?: string;
  };
  registrationConfig?: Record<string, unknown>;
  paymentConfig?: Record<string, unknown>;
  sponsorshipConfig?: Record<string, unknown>;
  mediaConfig?: Record<string, unknown>;
  galaConfig?: Record<string, unknown>;
}
