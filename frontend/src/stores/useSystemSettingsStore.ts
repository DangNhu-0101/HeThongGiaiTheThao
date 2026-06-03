import { create } from "zustand";
import api from "@/api/axiosConfig";

interface SystemSettings {
    siteName: string;
    siteSlogan: string;
    logoUrl: string;
}

interface SystemSettingsStore {
    settings: SystemSettings;
    loading: boolean;
    fetchSettings: () => Promise<void>;
}

export const useSystemSettingsStore = create<SystemSettingsStore>((set) => ({
    settings: {
        siteName: 'ITVTG HUB',
        siteSlogan: 'Admin Dashboard',
        logoUrl: '',
    },
    loading: false,
    fetchSettings: async () => {
        try {
            set({ loading: true });
            const res = await api.get('/settings');
            if (res.data.success) {
                set({ settings: res.data.data });
            }
        } catch (error) {
            console.error("Failed to fetch system settings", error);
        } finally {
            set({ loading: false });
        }
    }
}));
