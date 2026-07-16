import api from "@/libs/axios";
import type { Sport, Tournament } from "@/types/tournament";
import { buildSportsFromTournaments, getBackendTournaments, slugifySport } from "./backendAdapters";
import { getSportAssetKey, getSportImage } from "@/utils/sportAssets";

type ApiList<T = unknown> = T[] | { data?: T[] };

const asArray = <T>(payload: ApiList<T>): T[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
};

const cleanSportName = (value: unknown) => {
  const text = String(value || "").trim();
  if (!text || /^[A-Z0-9_-]{1,4}$/.test(text)) return "";
  return text;
};

const loadTemplateSports = async (tournaments: Tournament[]): Promise<Sport[]> => {
  const counts = new Map<string, number>();
  tournaments.forEach((tournament) => {
    tournament.sportType.forEach((name) => {
      const cleanName = cleanSportName(name);
      const key = getSportAssetKey(cleanName);
      if (cleanName && key) counts.set(key, (counts.get(key) || 0) + 1);
    });
  });

  try {
    const response = await api.get<ApiList>("/rules/sports");
    const seen = new Set<string>();
    const sports = asArray(response.data)
      .map((value, index) => {
        const raw = asRecord(value);
        const name = cleanSportName(raw.sportType || raw.name || raw.displayName);
        if (!name) return null;
        const slug = slugifySport(raw.slug || raw.sportType || raw.name || raw.displayName || name);
        const key = getSportAssetKey(name || slug);
        if (seen.has(key)) return null;
        seen.add(key);
        return {
          _id: String(raw._id || raw.id || `sport-${index + 1}`),
          name,
          slug,
          iconUrl: String(raw.iconUrl || raw.icon || ""),
          imageUrl: String(raw.imageUrl || raw.image || raw.banner || "") || getSportImage(raw.slug, raw.sportType, raw.name, name),
          eventCount: counts.get(key) || 0,
        } satisfies Sport;
      })
      .filter(Boolean) as Sport[];
    return sports.length > 0 ? sports : buildSportsFromTournaments(tournaments);
  } catch {
    return buildSportsFromTournaments(tournaments);
  }
};

const resolveSportFilter = async (sport?: unknown) => {
  const value = String(sport || "").trim();
  if (!value) return "";

  try {
    const response = await api.get<ApiList>("/rules/sports");
    const match = asArray(response.data)
      .map(asRecord)
      .find((item) => {
        const name = cleanSportName(item.sportType || item.name || item.displayName);
        return name === value || slugifySport(item.slug || name) === value || slugifySport(name) === slugifySport(value);
      });
    return cleanSportName(match?.sportType || match?.name || match?.displayName) || value;
  } catch {
    return value;
  }
};

export const tournamentService = {
  async getAllTournaments(filters?: Record<string, unknown>): Promise<{ tournaments: Tournament[]; sports: Sport[] }> {
    try {
      const { sport, ...rest } = filters || {};
      const sportType = await resolveSportFilter(sport);
      const requestFilters = sportType ? { ...rest, sportType } : rest;
      let tournaments = await getBackendTournaments(requestFilters);

      if (sportType) {
        const target = slugifySport(sportType);
        tournaments = tournaments.filter((item) => item.sportType.some((name) => slugifySport(name) === target));
      }

      const allTournaments = sportType
        ? await getBackendTournaments({ limit: 100, includeCompleted: true })
        : tournaments;

      return {
        tournaments,
        sports: await loadTemplateSports(allTournaments),
      };
    } catch (error) {
      console.error("Không thể tải danh sách giải đấu", error);
      return {
        tournaments: [],
        sports: [],
      };
    }
  },
};
