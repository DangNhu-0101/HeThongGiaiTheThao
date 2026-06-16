export type MatchScheduleStatus = 'Scheduled' | 'Unscheduled' | 'Conflict';

export interface ScheduleStat {
  id: string;
  label: string;
  value: string | number;
  iconType: 'total' | 'scheduled' | 'unscheduled' | 'conflict' | 'referee';
  color: string;
}

export interface CapacityData {
  referees: { used: number; total: number };
  venues: { used: number; total: number };
  schedule: { scheduled: number; total: number };
}

export interface ScheduleTeam {
  name: string;
  logo: string;
}

export interface ScheduleMatchRecord {
  id: string;
  code: string;
  round: string;
  teamA: ScheduleTeam;
  teamB: ScheduleTeam;
  date?: string;
  time?: string;
  venue?: string;
  referee?: string;
  assistant?: string;
  status: MatchScheduleStatus;
  conflictReason?: string;
}

export interface VenueColumn {
  id: string;
  name: string;
  statusText: string;
  isConflict?: boolean;
}