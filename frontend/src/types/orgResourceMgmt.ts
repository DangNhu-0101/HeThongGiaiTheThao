export interface ResourceStat {
  id: string;
  label: string;
  value: number | string;
  subtext: string;
  iconType: 'total' | 'available' | 'maintenance' | 'warning' | 'activity';
  color: string;
}

export type VenueStatus = 'Available' | 'Booked' | 'Maintenance' | 'Closed';

export interface OrgVenueRecord {
  id: string;
  name: string;
  location: string;
  type: string; // VD: Sân trong nhà, Cụm sân ngoài trời
  sports: string[]; // Thay thế cho Capacity theo yêu cầu
  status: VenueStatus;
  nextBooking: string;
}

export type RefereeStatus = 'Available' | 'Assigned' | 'Unavailable';
export type WorkloadLevel = 'Low' | 'Med' | 'High' | 'Over';

export interface OrgRefereeRecord {
  id: string;
  name: string;
  phoneNumber?: string;
  avatar: string;
  refId: string;
  qualification: string; // VD: Cấp Quốc gia, Cấp Khu vực
  experience: number; // Số năm kinh nghiệm
  matchesAssigned: number;
  workload: WorkloadLevel;
  status: RefereeStatus;
  accountLinked?: boolean;
  accountLabel?: string;
}
