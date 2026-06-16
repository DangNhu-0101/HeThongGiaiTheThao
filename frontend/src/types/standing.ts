export interface TeamStanding {
  id: string;
  rank: number;
  teamName: string;
  logo: string;
  played: number; // Số trận đã đấu (MP)
  won: number;    // Thắng (W)
  drawn: number;  // Hòa (D)
  lost: number;   // Thua (L)
  goalsFor: number; // Bàn thắng / Điểm ghi được (GF)
  goalsAgainst: number; // Bàn thua / Điểm bị mất (GA)
  goalDifference: number; // Hiệu số (GD)
  points: number; // Điểm (Pts)
  status: 'advance' | 'playoff' | 'eliminated' | 'neutral'; // Trạng thái để tô viền trái
}

export interface GroupStanding {
  groupId: string;
  groupName: string;
  teams: TeamStanding[];
}

export interface TopPerformer {
  id: string;
  rank: number;
  playerName: string;
  avatar: string;
  teamName: string;
  teamLogo: string;
  score: number;
}