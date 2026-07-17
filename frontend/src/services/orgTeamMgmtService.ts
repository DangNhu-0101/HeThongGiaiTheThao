import api, { normalizeUploadUrl } from "@/libs/axios";
import type { TeamMgmtStat, OrgTeamRecord } from "@/types/orgTeamMgmt";
import type { Participant } from "@/types/participant";

type BackendParticipant = Participant & {
  registrationStatus?: "pending" | "approved" | "rejected" | "suspended";
  paymentStatus?: "paid" | "unpaid" | "exempted";
  source?: "user" | "organization" | "import";
};

const mapRegistrationStatus = (status?: BackendParticipant["registrationStatus"]): OrgTeamRecord["status"] => {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "suspended") return "Suspended";
  return "Pending";
};

const normalizeAvatarUrl = (value?: unknown) => {
  const avatar = String(value || "").trim();
  if (!avatar) return "";
  return normalizeUploadUrl(avatar);
};

const emptyStats = (): TeamMgmtStat[] => [
  { id: "total", label: "Tổng đội", value: 0, iconType: "total", color: "text-blue-700 bg-blue-100" },
  { id: "approved", label: "Đã duyệt", value: 0, iconType: "approved", color: "text-green-700 bg-green-100" },
  { id: "pending", label: "Chờ duyệt", value: 0, iconType: "pending", color: "text-orange-700 bg-orange-100" },
  { id: "rejected", label: "Từ chối", value: 0, iconType: "rejected", color: "text-red-700 bg-red-100" },
  { id: "athletes", label: "Tổng VĐV", value: 0, iconType: "athletes", color: "text-purple-700 bg-purple-100" },
  { id: "sports", label: "Môn thi", value: 0, iconType: "sports", color: "text-gray-700 bg-gray-100" },
  { id: "free", label: "Đội miễn phí", value: 0, iconType: "free", color: "text-indigo-700 bg-indigo-100" },
];

export const orgTeamMgmtService = {
  async downloadImportTemplate() {
    const response = await api.get("/participants/organization/import-template", { responseType: "blob" });
    return response.data as Blob;
  },

  async getTeamData(tournamentItemId?: string): Promise<{ stats: TeamMgmtStat[]; records: OrgTeamRecord[] }> {
    try {
      if (!tournamentItemId) return { stats: emptyStats(), records: [] };
      const [participantsResponse, tournamentResponse] = await Promise.all([
        api.get<{ data: BackendParticipant[] }>(`/participants/tournament/${tournamentItemId}`),
        api.get(`/tournaments/single/${tournamentItemId}`),
      ]);
      const tournament = tournamentResponse.data as { name?: string; sportType?: string };
      const records: OrgTeamRecord[] = participantsResponse.data.data
        .filter((item) => item.type === "team")
        .map((item) => {
          const playerById = new Map(item.lineup.map((lineup) => {
            const player = typeof lineup.Player === "string" ? undefined : lineup.Player;
            return [player?._id || "", player];
          }));
          return {
            id: item._id,
            slug: String((item as BackendParticipant & { slug?: string }).slug || item._id),
            name: item.name,
            tournamentName: tournament.name || "Giải đấu",
            sport: tournament.sportType || "Chưa cập nhật",
            playersCount: item.lineup.length,
            status: item.paymentStatus === "exempted" ? "Approved" : mapRegistrationStatus(item.registrationStatus),
            submittedAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "",
            issueText: "",
            isFree: item.paymentStatus === "exempted",
            paymentStatus: item.paymentStatus || "unpaid",
            source: item.source || "user",
            avatars: item.lineup
              .map((lineup, memberIndex) => {
                const player = typeof lineup.Player === "string" ? undefined : lineup.Player;
                return normalizeAvatarUrl(player?.avatar) || player?.name?.slice(0, 1) || `${memberIndex + 1}`;
              })
              .filter(Boolean),
            memberFees: (item.memberFees || []).map((fee) => {
              const rawPlayerId = typeof fee.playerId === "string" ? fee.playerId : fee.playerId?._id || "";
              const player = typeof fee.playerId === "object" ? fee.playerId : playerById.get(rawPlayerId);
              return {
                playerId: rawPlayerId,
                playerName: player?.name || "Vận động viên",
                amount: Number(fee.amount || 0),
                amountPaid: Number(fee.amountPaid || 0),
                status: fee.status,
                receiptImage: normalizeAvatarUrl(fee.receiptImage),
                submittedAt: fee.submittedAt || undefined,
                reviewedAt: fee.reviewedAt || undefined,
                rejectReason: fee.rejectReason || undefined,
              };
            }),
          };
        });
      const athleteCount = records.reduce((sum, item) => sum + item.playersCount, 0);
      const stats: TeamMgmtStat[] = [
        { id: "total", label: "Tổng đội", value: records.length, iconType: "total", color: "text-blue-700 bg-blue-100" },
        { id: "approved", label: "Đã duyệt", value: records.filter((item) => item.status === "Approved").length, iconType: "approved", color: "text-green-700 bg-green-100" },
        { id: "pending", label: "Chờ duyệt", value: records.filter((item) => item.status === "Pending").length, iconType: "pending", color: "text-orange-700 bg-orange-100" },
        { id: "rejected", label: "Từ chối", value: records.filter((item) => item.status === "Rejected").length, iconType: "rejected", color: "text-red-700 bg-red-100" },
        { id: "athletes", label: "Tổng VĐV", value: athleteCount, iconType: "athletes", color: "text-purple-700 bg-purple-100" },
        { id: "sports", label: "Môn thi", value: tournament.sportType ? 1 : 0, iconType: "sports", color: "text-gray-700 bg-gray-100" },
        { id: "free", label: "Đội miễn phí", value: records.filter((item) => item.isFree).length, iconType: "free", color: "text-indigo-700 bg-indigo-100" },
      ];
      return { stats, records };
    } catch (error) {
      console.error("Không thể tải danh sách đội từ backend.", error);
      return { stats: emptyStats(), records: [] };
    }
  },

  async reviewTeam(teamId: string, registrationStatus: "pending" | "approved" | "rejected" | "suspended") {
    const response = await api.patch(`/participants/${teamId}/review`, { registrationStatus });
    return response.data;
  },

  async updatePayment(teamId: string, paymentStatus: "paid" | "unpaid" | "exempted") {
    const response = await api.patch(`/participants/${teamId}/review`, { paymentStatus });
    return response.data;
  },

  async reviewMemberFee(teamId: string, playerId: string, decision: "approve" | "reject", reason?: string) {
    const response = await api.patch(`/participants/${teamId}/fees/${playerId}/review`, { decision, reason });
    return response.data;
  },

  async deleteTeam(teamId: string) {
    const response = await api.delete(`/participants/${teamId}`);
    return response.data;
  },

  async createTeamByOrganization(payload: {
    tournamentItemId: string;
    name: string;
    representative?: { name?: string; phone?: string; email?: string };
    athletes?: Array<{ name: string; birthDate?: string; gender?: string; skill?: number }>;
    paymentStatus?: "paid" | "unpaid" | "exempted";
    source?: "organization" | "import";
  }) {
    const response = await api.post("/participants/organization", payload);
    return response.data;
  },

  async importTeamsFromFile(tournamentItemId: string, file: File) {
    const formData = new FormData();
    formData.append("tournamentItemId", tournamentItemId);
    formData.append("file", file);
    const response = await api.post<{
      success: boolean;
      message?: string;
      errors?: Array<{ row?: number; message: string }>;
      notes?: string[];
      loginFile?: { fileName: string; mimeType: string; base64: string };
    }>("/participants/organization/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async exportDefaultAccounts(tournamentItemId: string) {
    const response = await api.get(`/participants/tournament/${tournamentItemId}/default-accounts`, { responseType: "blob" });
    return response.data as Blob;
  },

  async exportTeamAthleteList(tournamentItemId: string) {
    const response = await api.get(`/participants/tournament/${tournamentItemId}/export-list`, { responseType: "blob" });
    return response.data as Blob;
  },
};
