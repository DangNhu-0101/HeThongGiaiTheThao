import api from "@/api/axiosConfig";

export type ApiTeam = {
  _id: string;
  name: string;
  sportCategory?: string;
  sportType?: string;
  status?: string;
  memberCount?: number;
  members?: unknown[];
  isPaid?: boolean;
  isFree?: boolean;
  isConfirm?: boolean;
  tournamentId?: string | { _id?: string; name?: string; sportType?: string[] };
};

export type ApiReferee = {
  _id: string;
  name: string;
  birthDate?: string;
  gender?: "male" | "female" | "other";
  phoneNumber?: string;
  phone?: string;
  email?: string;
  sports?: Array<{ category?: string; yearsOfExperience?: number }>;
};

export type ApiCourt = {
  _id: string;
  name: string;
  location?: string;
  status?: "empty" | "busy" | "maintenance" | "inActive";
  sportTypes?: string[];
  tournamentId?: string | { _id?: string; name?: string; sportType?: string[] };
};

const unwrapList = <T>(response: unknown): T[] => {
  const data = response as { data?: { data?: T[] } | T[] };
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.data?.data)) return data.data.data;
  return [];
};

export const resourceService = {
  getTeams: async (tournamentId?: string) => {
    const res = tournamentId
      ? await api.get(`/teams/tournaments/${tournamentId}/teams`)
      : await api.get("/teams");
    return unwrapList<ApiTeam>(res);
  },

  createTeam: async (payload: Partial<ApiTeam> & { name: string; tournamentId: string }) => {
    const res = await api.post("/teams/create", payload);
    return res.data?.data as ApiTeam;
  },

  getReferees: async () => {
    const res = await api.get("/referees/all");
    return unwrapList<ApiReferee>(res);
  },

  createReferee: async (payload: Partial<ApiReferee> & { name: string; phoneNumber: string; email: string }) => {
    const res = await api.post("/referees", payload);
    return res.data?.data as ApiReferee;
  },

  getCourts: async (tournamentId?: string) => {
    const res = tournamentId
      ? await api.get(`/courts/tournaments/${tournamentId}/courts`)
      : await api.get("/courts");
    return unwrapList<ApiCourt>(res);
  },

  createCourt: async (payload: Partial<ApiCourt> & { name: string; tournamentId: string }) => {
    const res = await api.post("/courts/courts", payload);
    return res.data?.data as ApiCourt;
  },

  updateTeam: async (id: string, payload: Partial<ApiTeam>) => {
    const res = await api.put(`/teams/edit/${id}`, payload);
    return res.data?.data as ApiTeam;
  },

  deleteTeam: async (id: string) => {
    await api.delete(`/teams/delete/${id}`);
  },

  updateReferee: async (id: string, payload: Partial<ApiReferee>) => {
    const res = await api.put(`/referees/${id}`, payload);
    return res.data?.data as ApiReferee;
  },

  deleteReferee: async (id: string) => {
    await api.delete(`/referees/${id}`);
  },

  updateCourt: async (id: string, payload: Partial<ApiCourt>) => {
    const res = await api.put(`/courts/courts/${id}`, payload);
    return res.data?.data as ApiCourt;
  },

  deleteCourt: async (id: string) => {
    await api.delete(`/courts/courts/${id}`);
  },
};
