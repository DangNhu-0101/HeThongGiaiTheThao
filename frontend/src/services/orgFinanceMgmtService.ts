import type { FeeProgressData, SponsorPackage, SponsorRecord } from "@/types/orgFinanceMgmt";
import api from "@/libs/axios";
import { getBackendSponsors } from "./backendAdapters";
import { calculateFeeProgress } from "./orgFinanceCalculator";
import type { Participant } from "@/types/participant";

const emptyFeeProgress = (): FeeProgressData => ({
  collectedAmount: 0,
  expectedAmount: 0,
  progressPercentage: 0,
});

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const getSponsorPackages = async (tournamentItemId: string): Promise<SponsorPackage[]> => {
  const response = await api.get(`/tournaments/single/${tournamentItemId}`);
  const tournamentItem = asRecord(response.data);
  const sponsorshipConfig = asRecord(tournamentItem.sponsorshipConfig);
  if (!Array.isArray(sponsorshipConfig.tiers)) return [];
  return sponsorshipConfig.tiers.map((tier) => {
    const raw = asRecord(tier);
    return {
      name: String(raw.name || "Gói tài trợ"),
      amount: Number(raw.amount || 0),
      slots: Number(raw.slots || 0),
      benefits: String(raw.benefits || ""),
    };
  });
};

export const orgFinanceMgmtService = {
  async getFinanceData(tournamentItemId?: string): Promise<{ feeProgress: FeeProgressData; sponsors: SponsorRecord[]; sponsorPackages: SponsorPackage[] }> {
    try {
      if (!tournamentItemId) return { feeProgress: emptyFeeProgress(), sponsors: [], sponsorPackages: [] };
      const [finance, sponsorPackages, participantsResponse, tournamentResponse] = await Promise.all([
        getBackendSponsors(tournamentItemId),
        getSponsorPackages(tournamentItemId),
        api.get<{ data: Participant[] }>(`/participants/tournament/${tournamentItemId}`),
        api.get(`/tournaments/single/${tournamentItemId}`),
      ]);
      const tournament = asRecord(tournamentResponse.data);
      const feePerPlayer = Number(tournament.feeEntry || asRecord(tournament.paymentConfig).feePerAthlete || 0);
      return { ...finance, feeProgress: calculateFeeProgress(participantsResponse.data.data || [], feePerPlayer), sponsorPackages };
    } catch (error) {
      console.error("Không thể tải thông tin tài trợ từ backend.", error);
      return { feeProgress: emptyFeeProgress(), sponsors: [], sponsorPackages: [] };
    }
  },

  async createSponsor(tournamentItemId: string, sponsor: Omit<SponsorRecord, "id">) {
    const response = await api.post("/sponsors", {
      name: sponsor.name,
      logo: sponsor.logoUrl,
      tournamentItemId,
      sponsorType: sponsor.tier,
      sponsorshipType: "Money",
      amount: sponsor.amount,
      status: sponsor.status === "Expired" ? "inactive" : "actived",
    });
    return response.data;
  },

  async updateSponsor(id: string, sponsor: Partial<SponsorRecord>) {
    const response = await api.put(`/sponsors/${id}`, {
      name: sponsor.name,
      logo: sponsor.logoUrl,
      sponsorType: sponsor.tier,
      amount: sponsor.amount,
      status: sponsor.status === "Expired" ? "inactive" : "actived",
    });
    return response.data;
  },

  async deleteSponsor(id: string) {
    const response = await api.delete(`/sponsors/${id}`);
    return response.data;
  },
};
