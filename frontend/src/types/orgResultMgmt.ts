export type ResultMatchStatus = string;

export interface MatchStatusTag {
  value: string;
  label: string;
  tone?: "muted" | "danger" | "warning" | "success" | "info";
  resultLocked?: boolean;
}

export interface ResultStageOption {
  id: string;
  name: string;
  order: number;
  standingsStatus: "draft" | "published";
}

export interface ResultStat {
  id: string;
  label: string;
  value: number;
  iconType: "total" | "live" | "completed" | "pending" | "synced";
  color: string;
}

export interface ResultTeam {
  id: string;
  name: string;
  logo: string;
  score: number;
}

export interface ResultMatchRecord {
  id: string;
  tournamentName: string;
  round: string;
  stageId?: string;
  groupName?: string;
  courtId?: string;
  date?: string;
  tags?: string[];
  matchCode: string;
  time: string;
  venue: string;
  referee: string;
  teamA: ResultTeam;
  teamB: ResultTeam;
  status: ResultMatchStatus;
  statusLabel?: string;
  minute?: string;
}
