export interface TeamMgmtStat {
  id: string;
  label: string;
  value: number;
  iconType: 'total' | 'approved' | 'pending' | 'rejected' | 'athletes' | 'sports' | 'free';
  color: string;
}

export type TeamStatus = 'Approved' | 'Pending' | 'Rejected' | 'Suspended';
export type TeamPaymentStatus = 'paid' | 'unpaid' | 'exempted';
export type TeamSource = 'user' | 'organization' | 'import';

export interface OrgTeamRecord {
  id: string;
  slug?: string;
  name: string;
  tournamentName: string;
  sport: string;
  playersCount: number;
  status: TeamStatus;
  submittedAt?: string;
  issueText?: string;
  isFree: boolean;
  paymentStatus?: TeamPaymentStatus;
  source?: TeamSource;
  avatars: string[];
  memberFees?: Array<{
    playerId: string;
    playerName: string;
    amount: number;
    amountPaid?: number;
    status: "unpaid" | "pending" | "paid" | "rejected" | "exempted";
    receiptImage?: string;
    submittedAt?: string;
    reviewedAt?: string;
    rejectReason?: string;
  }>;
}
