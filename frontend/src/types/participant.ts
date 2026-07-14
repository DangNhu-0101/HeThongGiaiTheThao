export type ParticipantType = "player" | "team";

export interface ParticipantPlayerRef {
  _id: string;
  name?: string;
  gender?: "male" | "female" | "other";
  birthDate?: string;
  skill?: number;
  userId?: string | { _id: string };
  sports?: {
    category?: string;
    level?: string;
    position?: string;
  } | Array<{
    category?: string;
    level?: string;
    position?: string;
  }>;
  status?: "actived" | "injured" | "unavailable";
  // BE Player không có avatar; giữ optional để FE fallback từ mock/User nếu có populate thêm.
  avatar?: string;
  username?: string;
}

export interface ParticipantTournamentItemRef {
  _id: string;
  name?: string;
  sportType?: string;
  feeEntry?: number;
  paymentQR?: string;
  timeLine?: {
    registrationStart?: string;
    registrationEnd?: string;
    tournamentStart?: string;
    tournamentEnd?: string;
  };
}

export interface ParticipantLineupItem {
  Player: string | ParticipantPlayerRef;
}

export interface ParticipantMemberFee {
  _id?: string;
  playerId: string | ParticipantPlayerRef;
  amount: number;
  status: "unpaid" | "pending" | "paid" | "exempted";
  receiptImage?: string;
  paidAt?: string | null;
}

export interface Participant {
  _id: string;
  tournamentItemId: string | ParticipantTournamentItemRef;
  type: ParticipantType;
  name: string;
  logo?: string;
  lineup: ParticipantLineupItem[];
  memberFees?: ParticipantMemberFee[];
  registrationStatus?: "pending" | "approved" | "rejected" | "suspended";
  paymentStatus?: "unpaid" | "paid" | "exempted";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateParticipantPayload {
  tournamentItemId: string;
  type: ParticipantType;
  name?: string;
  logo?: string;
  lineup?: Array<{ Player: string }>;
  invitees?: string[];
}

export interface ParticipantApiResponse {
  success: boolean;
  message?: string;
  data: Participant;
}

export interface TeamTournamentOption {
  id: string;
  name: string;
  sportType: string;
  registrationEnd?: string;
  parentTournamentName?: string;
}
