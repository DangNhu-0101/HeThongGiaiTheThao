import api from "@/libs/axios";
import type {
  MemberFee,
  PlayerProfileSummary,
  TeamInvitation,
  TeamJoinRequest,
  TeamNotification,
} from "@/types/teamCollaboration";

const unwrap = <T>(value: { data?: T } | T): T =>
  value && typeof value === "object" && "data" in value
    ? (value as { data: T }).data
    : value as T;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const mapPlayer = (value: unknown): PlayerProfileSummary => {
  const raw = asRecord(value);
  const player = asRecord(raw.playerProfile);
  const sports = Array.isArray(player.sports) ? asRecord(player.sports[0]) : asRecord(player.sports);
  return {
    id: String(player._id || raw._id || raw.id || ""),
    userId: String(raw._id || raw.id || player.userId || ""),
    name: String(player.name || raw.username || raw.name || "Vận động viên"),
    avatar: String(raw.avatar || player.avatar || player.name?.toString().slice(0, 1) || raw.username?.toString().slice(0, 1) || ""),
    gender: String(player.gender || ""),
    birthDate: String(player.birthDate || ""),
    skill: Number(player.skill || 0),
    sport: String(sports.category || "Chưa cập nhật"),
    level: String(sports.level || (player.skill ? `${player.skill}` : "Chưa cập nhật")),
    experience: "Chưa cập nhật",
  };
};

const mapInvitation = (value: unknown): TeamInvitation => {
  const raw = asRecord(value);
  const participant = asRecord(raw.participantId);
  const receiver = asRecord(raw.receiverId);
  return {
    id: String(raw._id || raw.id || ""),
    teamId: String(participant._id || raw.participantId || ""),
    teamName: String(participant.name || "Đội thi đấu"),
    tournamentItemId: String(participant.tournamentItemId || ""),
    senderId: String(asRecord(raw.senderId)._id || raw.senderId || ""),
    receiverId: String(receiver._id || raw.receiverId || ""),
    receiver: mapPlayer(receiver),
    message: String(raw.message || ""),
    status: (raw.status || "pending") as TeamInvitation["status"],
    createdAt: String(raw.createdAt || new Date().toISOString()),
  };
};

const mapJoinRequest = (value: unknown): TeamJoinRequest => {
  const raw = asRecord(value);
  const participant = asRecord(raw.participantId);
  const requester = asRecord(raw.requesterPlayerId);
  return {
    id: String(raw._id || raw.id || ""),
    teamId: String(participant._id || raw.participantId || ""),
    tournamentItemId: String(participant.tournamentItemId || raw.tournamentItemId || ""),
    player: {
      id: String(requester._id || raw.requesterPlayerId || ""),
      userId: String(raw.requesterId || ""),
      name: String(requester.name || "Vận động viên"),
      avatar: String(requester.name?.toString().slice(0, 1) || ""),
      gender: String(requester.gender || ""),
      birthDate: String(requester.birthDate || ""),
      skill: Number(requester.skill || 0),
      sport: "Chưa cập nhật",
      level: requester.skill ? String(requester.skill) : "Chưa cập nhật",
      experience: "Chưa cập nhật",
      teamId: String(participant._id || raw.participantId || ""),
      teamName: String(participant.name || "Đội thi đấu"),
    },
    message: String(raw.message || ""),
    status: (raw.status || "pending") as TeamJoinRequest["status"],
    createdAt: String(raw.createdAt || new Date().toISOString()),
  };
};

const mapFee = (value: unknown): MemberFee => {
  const raw = asRecord(value);
  const player = asRecord(raw.playerId);
  return {
    playerId: String(player._id || raw.playerId || ""),
    playerName: String(player.name || "Vận động viên"),
    amount: Number(raw.amount || 0),
    status: (raw.status || "unpaid") as MemberFee["status"],
    paidAt: raw.paidAt ? String(raw.paidAt) : undefined,
    receiptImage: raw.receiptImage ? String(raw.receiptImage) : undefined,
  };
};

export const teamCollaborationService = {
  async searchPlayers(tournamentItemId: string, keyword: string) {
    const response = await api.get<{ data: unknown[] }>("/users/search", {
      params: { name: keyword, role: "player", tournamentItemId },
    });
    return response.data.data.map(mapPlayer);
  },

  async invite(teamId: string, receiverId: string, message: string) {
    const response = await api.post(`/participants/${teamId}/invitations`, { receiverId, message });
    return mapInvitation(unwrap<unknown>(response.data));
  },

  async getInvitations(teamId: string) {
    const response = await api.get<{ data: unknown[] }>(`/participants/${teamId}/invitations`);
    return response.data.data.map(mapInvitation);
  },

  async getMyInvitations() {
    const response = await api.get<{ data: unknown[] }>("/participants/invitations/my");
    return response.data.data.map(mapInvitation);
  },

  async getSentInvitations() {
    const response = await api.get<{ data: unknown[] }>("/participants/invitations/sent");
    return response.data.data.map(mapInvitation);
  },

  async acceptInvitation(id: string) {
    await api.put(`/participants/invitations/${id}/accept`);
  },

  async rejectInvitation(id: string) {
    await api.put(`/participants/invitations/${id}/reject`);
  },

  async cancelInvitation(id: string) {
    await api.delete(`/participants/invitations/${id}/cancel`);
  },

  async searchTeams(tournamentItemId: string, keyword: string) {
    const response = await api.get(`/participants/tournament/${tournamentItemId}`, { params: { search: keyword } });
    return response.data.data;
  },

  async requestToJoin(teamId: string, message: string) {
    const response = await api.post(`/participants/${teamId}/join-requests`, { message });
    return mapJoinRequest(unwrap<unknown>(response.data));
  },

  async getJoinRequests(teamId: string) {
    const response = await api.get<{ data: unknown[] }>(`/participants/${teamId}/join-requests`);
    return response.data.data.map(mapJoinRequest);
  },

  async getMyJoinRequests() {
    const response = await api.get<{ data: unknown[] }>("/participants/join-requests/my");
    return response.data.data.map(mapJoinRequest);
  },

  async cancelJoinRequest(id: string) {
    await api.delete(`/participants/join-requests/${id}`);
  },

  async reviewJoinRequest(id: string, decision: "accept" | "reject") {
    const response = await api.patch(`/participants/join-requests/${id}/review`, { decision });
    return mapJoinRequest(unwrap<unknown>(response.data));
  },

  async getNotifications() {
    return [] as TeamNotification[];
  },

  async markNotificationRead(id: string) {
    void id;
  },

  async getMemberFees(teamId: string) {
    const response = await api.get<{ data: unknown[] }>(`/participants/${teamId}/fees`);
    return response.data.data.map(mapFee);
  },

  async submitFee(teamId: string, playerId: string, receiptImage: string) {
    void playerId;
    const response = await api.post(`/participants/${teamId}/fees/receipt`, { receiptImage });
    return mapFee(unwrap<unknown>(response.data));
  },
};
