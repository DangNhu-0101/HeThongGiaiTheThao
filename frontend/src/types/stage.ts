export interface Stage {
  _id?: string;
  id?: string;
  tournamentItemId?: string;
  number?: number;
  name: string;
  pointsConfig?: {
    win?: number;
    draw?: number;
    loss?: number;
  };
  hasBracket?: boolean;
  rankingCriteria?: string[];
  totalTeamsIn?: number;
  hasWildcards?: boolean;
  wildcardsCount?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  status?: "pending" | "actived" | "completed";
  // FE/template cũ còn dùng mô tả; BE StageRule chưa có description.
  description?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
