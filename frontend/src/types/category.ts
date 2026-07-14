export interface Category {
  _id?: string;
  id?: string;
  tournamentItemId?: string;
  name: string;
  sportType?: string;
  description?: string;
  displayName?: string;
  playerSlotsPerTeam?: {
    min?: number;
    max?: number;
  };
  gameRule?: string;
  scoringRule?: string;
  timeManagementRule?: string;
  resourceManagementRule?: string;
  faultsAndPenaltiesRule?: string;
  customFields?: Record<string, unknown>;
  status?: "actived" | "inactived" | "cancelled";
  // FE cũ dùng các tên này; giữ optional để mock/template chưa gãy.
  categoryType?: string;
  Name?: string;
  minPlayers?: number;
  maxPlayers?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
