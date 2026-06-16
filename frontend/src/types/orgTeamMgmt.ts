export interface TeamMgmtStat {
  id: string;
  label: string;
  value: number;
  iconType: 'total' | 'approved' | 'pending' | 'rejected' | 'athletes' | 'sports' | 'free';
  color: string;
}

export type TeamStatus = 'Approved' | 'Pending' | 'Rejected' | 'Suspended';

export interface OrgTeamRecord {
  id: string;
  name: string;
  tournamentName: string;
  sport: string;
  playersCount: number;
  status: TeamStatus;
  submittedAt?: string; // Ví dụ: "3 days ago"
  issueText?: string; // Ví dụ: "Incomplete documentation"
  isFree: boolean; // Cờ đánh dấu đội được miễn phí (theo yêu cầu ghi chú đen)
  avatars: string[]; // Mảng URL hình ảnh hoặc Initials
}