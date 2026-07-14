export type TeamActionStatus = "pending" | "accepted" | "rejected" | "expired" | "cancelled";
export type FeeStatus = "unpaid" | "pending" | "paid" | "exempted";

export interface PlayerProfileSummary {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  gender?: string;
  birthDate?: string;
  skill: number;
  sport: string;
  level: string;
  experience: string;
  teamId?: string;
  teamName?: string;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
  tournamentItemId: string;
  senderId: string;
  receiverId: string;
  receiver: PlayerProfileSummary;
  message: string;
  status: TeamActionStatus;
  createdAt: string;
}

export interface TeamJoinRequest {
  id: string;
  teamId: string;
  tournamentItemId: string;
  player: PlayerProfileSummary;
  message: string;
  status: TeamActionStatus;
  createdAt: string;
}

export interface MemberFee {
  playerId: string;
  playerName: string;
  amount: number;
  status: FeeStatus;
  paidAt?: string;
  receiptImage?: string;
}

export interface TeamNotification {
  id: string;
  type: "team_invitation" | "join_request" | "request_result" | "invitation_result" | "member_joined" | "fee";
  title: string;
  message: string;
  href?: string;
  read: boolean;
  createdAt: string;
  actionId?: string;
  actionKind?: "invitation" | "join_request";
}
