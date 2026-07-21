export interface TeamMember {
  id: string;
  userId?: string;
  name: string;
  role: "Đội trưởng" | "Thành viên" | "Huấn luyện viên";
  avatar: string;
  gender?: string;
  birthDate?: string;
  skill?: number;
  position?: string;
  jerseyNumber?: string;
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
  tournamentName: string;
  sport: string;
  achievedAt?: string;
  badgeImage?: string;
  branchKey?: string;
  branchName?: string;
  finalMatchName?: string;
  description: string;
  type: "champion" | "runner-up" | "third-place" | "other";
}

export interface TeamDetailInfo {
  id: string;
  slug?: string;
  tournamentItemId?: string;
  name: string;
  logo: string;
  banner?: string;
  description?: string;
  sport: string;
  tournamentName?: string;
  tournamentStatus?: string;
  status: "Đang hoạt động" | "Tạm ngưng";
  division: string;
  location: string;
  founded: number;
  coach: string;
  captainName?: string;
  currentMembers: number;
  maxMembers: number;
  isFull: boolean;
  registrationOpen: boolean;
  canRequestJoin: boolean;
  publicContact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  paymentQR?: string;
  feeAmount?: number;
  overallStats: {
    players: number;
    wins: number;
    titles: number;
  };
}
