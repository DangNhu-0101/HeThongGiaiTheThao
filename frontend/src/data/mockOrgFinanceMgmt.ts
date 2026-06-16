import type { FeeProgressData, SponsorRecord } from "@/types/orgFinanceMgmt";

export const mockFeeProgress: FeeProgressData = {
  expectedAmount: 150000000, // 150 Triệu
  collectedAmount: 108000000, // 108 Triệu
  progressPercentage: 72,
};

export const mockSponsors: SponsorRecord[] = [
  { 
    id: "sp1", name: "NikeSport Vietnam", 
    logoUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80", // Ảnh demo giày Nike
    tier: "Tài trợ Kim Cương", amount: 50000000, status: "Active" 
  },
  { 
    id: "sp2", name: "Nước khoáng Aqua", 
    logoUrl: "https://images.unsplash.com/photo-1548839140-29a749e1abc5?w=200&q=80", 
    tier: "Tài trợ Vàng", amount: 20000000, status: "Active" 
  },
  { 
    id: "sp3", name: "VNB Sports", 
    logoUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=200&q=80", 
    tier: "Tài trợ Bạc", amount: 10000000, status: "Expired" 
  },
];