export type AthleteStatus = 'Active' | 'Pending' | 'Suspended';

export interface OrgAthleteRecord {
  id: string;
  name: string;
  avatar: string;
  teamName: string;
  teamLogo: string;
  gender: 'Nam' | 'Nữ';
  age: number;
  rating: string; // Hạng/Trình độ (VD: 3.5, 4.0, 4.5)
  contact: string;
  status: AthleteStatus;
  registeredAt: string;
}