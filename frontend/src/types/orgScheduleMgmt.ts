export type MatchScheduleStatus = 'Scheduled' | 'Unscheduled' | 'Conflict' | 'Live';

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
  id?: string;
  name: string;
  logo: string;
}

export interface ScheduleReferee {
  id: string;
  name: string;
  qualification: string;
  experience: number;
  status?: string;
}

export type SchedulePublishStatus = "draft" | "published";

export interface ScheduleStageOption {
  id: string;
  name: string;
  order: number;
  colorClass: string;
  publishStatus: SchedulePublishStatus;
}

export interface ScheduleMatchRecord {
  id: string;
  code: string;
  stageId?: string;
  stageOrder?: number;
  stageName?: string;
  stageColorClass?: string;
  round: string;
  teamA: ScheduleTeam;
  teamB: ScheduleTeam;
  date?: string;
  time?: string;
  endTime?: string;
  durationMinutes?: number;
  venue?: string;
  order?: number;
  referee?: string;
  refereeIds?: string[];
  referees?: ScheduleReferee[];
  assistant?: string;
  status: MatchScheduleStatus;
  publishStatus?: SchedulePublishStatus;
  conflictReason?: string;
}

export interface VenueColumn {
  id: string;
  name: string;
  statusText: string;
  isConflict?: boolean;
}

export interface ScheduleGroupGenerationPayload {
  tournamentItemId: string;
  stageOrder: number;
  stageName: string;
  startAt?: string;
  matchMinutes?: number;
  gapMinutes?: number;
  groups: Array<{
    name: string;
    teamIds: string[];
    sport?: string;
  }>;
}
