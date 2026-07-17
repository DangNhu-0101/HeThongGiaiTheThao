import api, { normalizeUploadUrl } from "@/libs/axios";
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

const normalizeImage = (value?: unknown) => {
  const image = String(value || "").trim();
  if (!image) return "";
  return normalizeUploadUrl(image) || image;
};

const genderLabel = (value?: string) => {
  if (value === "male") return "Nam";
  if (value === "female") return "Nữ";
  if (value === "other") return "Khác";
  return "";
};

const mapPlayer = (value: unknown): PlayerProfileSummary => {
  const raw = asRecord(value);
  const player = asRecord(raw.playerProfile || raw);
  const user = asRecord(raw.userId || raw.requesterId);
  const sports = Array.isArray(player.sports) ? asRecord(player.sports[0]) : asRecord(player.sports);
  const name = String(player.name || raw.username || raw.name || "Vận động viên");
  return {
    id: String(player._id || raw._id || raw.id || ""),
    userId: String(user._id || raw.requesterId || raw._id || raw.id || player.userId || ""),
    name,
    avatar: normalizeImage(raw.avatar || player.avatar) || name.slice(0, 1).toUpperCase(),
    email: String(raw.email || user.email || player.email || ""),
    phone: String(raw.phoneNumber || raw.phone || user.phoneNumber || player.phone || ""),
    gender: genderLabel(String(player.gender || "")),
    birthDate: String(player.birthDate || ""),
    skill: Number(player.skill || 0),
    sport: String(sports.category || "Chưa cập nhật"),
    level: String(sports.level || (player.skill ? `${player.skill}/5` : "Chưa cập nhật")),
    position: String(sports.position || ""),
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
  const requesterUser = asRecord(raw.requesterId);
  return {
    id: String(raw._id || raw.id || ""),
    teamId: String(participant._id || raw.participantId || ""),
    tournamentItemId: String(participant.tournamentItemId || raw.tournamentItemId || ""),
    player: {
      ...mapPlayer({ ...requester, requesterId: requesterUser }),
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
  const user = asRecord(player.userId);
  return {
    playerId: String(player._id || raw.playerId || ""),
    playerName: String(player.name || "Vận động viên"),
    playerAvatar: normalizeImage(player.avatar || user.avatar),
    playerEmail: String(player.email || user.email || user.username || ""),
    playerPhone: String(player.phone || user.phoneNumber || ""),
    amount: Number(raw.amount || 0),
    amountPaid: Number(raw.amountPaid || 0),
    status: (raw.status || "unpaid") as MemberFee["status"],
    paidAt: raw.paidAt ? String(raw.paidAt) : undefined,
    submittedAt: raw.submittedAt ? String(raw.submittedAt) : undefined,
    reviewedAt: raw.reviewedAt ? String(raw.reviewedAt) : undefined,
    receiptImage: normalizeImage(raw.receiptImage),
    method: String(raw.method || ""),
    transactionCode: String(raw.transactionCode || ""),
    note: String(raw.note || ""),
    rejectReason: String(raw.rejectReason || ""),
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

  async reviewJoinRequest(id: string, decision: "accept" | "reject", reason?: string) {
    const response = await api.patch(`/participants/join-requests/${id}/review`, { decision, reason });
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

  async submitFee(teamId: string, payload: {
    receiptImage: string;
    amountPaid?: number;
    transferDate?: string;
    method?: string;
    transactionCode?: string;
    note?: string;
  }) {
    const response = await api.post(`/participants/${teamId}/fees/receipt`, payload);
    return mapFee(unwrap<unknown>(response.data));
  },

  async cancelFee(teamId: string, playerId: string) {
    const response = await api.delete(`/participants/${teamId}/fees/${playerId}/receipt`);
    return mapFee(unwrap<unknown>(response.data));
  },

  async reviewFee(teamId: string, playerId: string, decision: "approve" | "reject", reason?: string) {
    const response = await api.patch(`/participants/${teamId}/fees/${playerId}/review`, { decision, reason });
    return mapFee(unwrap<unknown>(response.data));
  },
};
