export interface ScheduleTeam {
  id: string;
  name: string;
}

export interface ScheduleMatch {
  id: string;
  date: string; // Định dạng YYYY-MM-DD để dễ nhóm theo ngày
  time: string; // HH:mm
  venue: string;
  teamA: ScheduleTeam;
  teamB: ScheduleTeam;
  status: 'scheduled' | 'live' | 'completed' | 'conflict' | 'final';
  score?: string; // Ví dụ: "2-1"
  roundInfo: string; // Ví dụ: "Tứ kết - Vòng 1"
  conflictReason?: string; // Ví dụ: "Trùng sân thi đấu"
}

export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayOfWeek: string; // T2, T3...
  dayOfMonth: number; // 19, 20...
  isToday: boolean;
}