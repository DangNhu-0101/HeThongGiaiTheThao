export interface FeeProgressData {
  expectedAmount: number;
  collectedAmount: number;
  progressPercentage: number;
  feePerPlayer?: number;
  totalPlayers?: number;
  approvedPlayers?: number;
  approvedPaidPlayers?: number;
  approvedFreePlayers?: number;
  allEligiblePaidPlayers?: number;
  freePlayers?: number;
  paidTeams?: number;
  freeTeams?: number;
}

export type SponsorStatus = 'Active' | 'Expired';

export interface SponsorRecord {
  id: string;
  name: string;
  logoUrl: string; // Bắt buộc có để quảng bá
  tier: string; // Ví dụ: Nhà tài trợ Vàng, Bạc, Đồng...
  amount: number; // Số tiền tài trợ
  status: SponsorStatus;
}

export interface SponsorPackage {
  name: string;
  amount: number;
  slots?: number;
  benefits?: string;
}
