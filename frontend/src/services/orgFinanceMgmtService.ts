import { mockFeeProgress, mockSponsors } from "@/data/mockOrgFinanceMgmt";
import type { FeeProgressData, SponsorRecord } from "@/types/orgFinanceMgmt";
import { getBackendSponsors } from "./backendAdapters";

export const orgFinanceMgmtService = {
  async getFinanceData(): Promise<{ feeProgress: FeeProgressData; sponsors: SponsorRecord[] }> {
    try {
      return await getBackendSponsors();
    } catch (error) {
      console.warn("Cannot fetch sponsors from backend, using demo data.", error);
      return { feeProgress: mockFeeProgress, sponsors: mockSponsors };
    }
  },
};
