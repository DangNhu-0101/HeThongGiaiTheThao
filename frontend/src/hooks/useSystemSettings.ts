import { useEffect, useState } from "react";
import { systemSettingsService, type SystemSettings } from "@/services/systemSettingsService";

const fallback = systemSettingsService.fallback;
let cachedSettings: SystemSettings | null = null;

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>(cachedSettings || fallback);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    let mounted = true;
    systemSettingsService.getPublic()
      .then((data) => {
        cachedSettings = data;
        if (mounted) setSettings(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { settings, loading };
};
