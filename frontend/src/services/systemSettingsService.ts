import api from "@/libs/axios";

export interface SystemSettings {
  siteName: string;
  logoUrl: string;
  contactAddress: string;
  supportEmail: string;
  contactPhone: string;
  updatedAt?: string;
}

const fallback: SystemSettings = {
  siteName: "TMS",
  logoUrl: "",
  contactAddress: "Supply Base - POVO",
  supportEmail: "",
  contactPhone: "",
};

export const systemSettingsService = {
  fallback,
  async getPublic(): Promise<SystemSettings> {
    const response = await api.get<{ data: SystemSettings }>("/settings/public");
    return { ...fallback, ...response.data.data };
  },
  async update(payload: Partial<SystemSettings>): Promise<SystemSettings> {
    const response = await api.put<{ data: SystemSettings }>("/settings/admin", payload);
    return { ...fallback, ...response.data.data };
  },
};
