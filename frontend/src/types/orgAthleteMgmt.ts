export type AthleteStatus = "Active" | "Pending" | "Suspended";

export interface OrgAthleteRecord {
  id: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  teamName: string;
  teamLogo: string;
  gender: "Nam" | "Nữ";
  genderCode?: "male" | "female" | "other";
  birthDate?: string;
  age: number;
  rating: string;
  skill?: number;
  jerseyNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  contact: string;
  status: AthleteStatus;
  registeredAt: string;
  accountLinked?: boolean;
  accountLabel?: string;
}
