export interface FeeProgressData {
  expectedAmount: number;
  collectedAmount: number;
  progressPercentage: number;
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