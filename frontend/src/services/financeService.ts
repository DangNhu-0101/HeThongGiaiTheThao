import api from "../libs/axios";

export const financeService = {
  getSponsors: async (tournamentId: string) => {
    const res = await api.get(`/sponsors/tournaments/${tournamentId}/sponsors`);
    return res.data?.data || [];
  },
  createSponsor: async (payload: unknown) => {
    const res = await api.post("/sponsors/sponsors", payload);
    return res.data;
  },
  updateSponsor: async (id: string, payload: unknown) => {
    const res = await api.put(`/sponsors/sponsors/${id}`, payload);
    return res.data;
  },
  deactivateSponsor: async (id: string) => {
    const res = await api.patch(`/sponsors/sponsors/${id}/deactivate`);
    return res.data;
  },
  createTransaction: async (tournamentId: string, type: "income" | "expense", payload: unknown) => {
    const res = await api.post(`/tournaments/${tournamentId}/finance/${type}`, payload);
    return res.data;
  },
  updateTransaction: async (tournamentId: string, type: "income" | "expense", id: string, payload: unknown) => {
    const res = await api.put(`/tournaments/${tournamentId}/finance/${type}/${id}`, payload);
    return res.data;
  },
  deleteTransaction: async (tournamentId: string, type: "income" | "expense", id: string) => {
    const res = await api.delete(`/tournaments/${tournamentId}/finance/${type}/${id}`);
    return res.data;
  }
};
