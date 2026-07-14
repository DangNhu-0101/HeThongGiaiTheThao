export interface TeamMember {
  id: string;
  userId?: string;
  name: string;
  role: "Đội trưởng" | "Thành viên" | "Huấn luyện viên";
  avatar: string;
  stats: {
    matches: number;
    wins: number;
    rating: string;
  };
  country: string;
}

export interface Achievement {
  id: string;
  year: number;
  title: string;
  description: string;
  type: "champion" | "runner-up" | "third-place" | "other";
}

export interface TeamDetailInfo {
  id: string;
  tournamentItemId?: string;
  name: string;
  logo: string;
  sport: string;
  status: "Đang hoạt động" | "Tạm ngưng";
  division: string;
  location: string;
  founded: number;
  coach: string;
  paymentQR?: string;
  feeAmount?: number;
  overallStats: {
    players: number;
    wins: number;
    titles: number;
    ranking: number;
  };
}
