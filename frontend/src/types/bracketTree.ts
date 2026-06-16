export interface BracketTeam {
  id: string;
  name: string;
  logo: string;
  score?: number;
  isWinner?: boolean;
}

export interface BracketTreeNode {
  id: string;
  round: string;
  teamA: BracketTeam | null;
  teamB: BracketTeam | null;
  status: 'completed' | 'live' | 'upcoming';
  time: string;
  info: string;
  children?: BracketTreeNode[]; 
}

// Thêm đoạn này vào cuối file
export interface TieBreakRule {
  id: number;
  title: string;
  description: string;
}