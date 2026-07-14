import ScheduleMatchCard from "./ScheduleMatchCard";
import type { CalendarDay, ScheduleMatch } from "@/types/schedule";

interface WeeklyCalendarProps {
  days: CalendarDay[];
  matches: ScheduleMatch[];
  onViewResult: (match: ScheduleMatch) => void;
}

const WeeklyCalendar = ({ days, matches, onViewResult }: WeeklyCalendarProps) => {
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm font-bold text-muted-foreground">
        Chưa có trận đấu phù hợp với bộ lọc hiện tại.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto beautiful-scrollbar">
        <div className={`grid min-w-[720px] divide-x divide-border`} style={{ gridTemplateColumns: `repeat(${days.length}, minmax(160px, 1fr))` }}>
          {days.map((day) => (
            <div key={day.dateString} className={`border-b border-border p-4 text-center ${day.isToday ? "bg-blue-50/50" : "bg-muted/10"}`}>
              <div className={`mb-1 text-xs font-bold uppercase ${day.isToday ? "text-primary" : "text-muted-foreground"}`}>
                {day.dayOfWeek}
              </div>
              <div className="flex justify-center">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold ${day.isToday ? "bg-primary text-white shadow-md" : "text-foreground"}`}>
                  {day.dayOfMonth}
                </span>
              </div>
              {day.isToday && <div className="mt-1 text-[10px] font-bold text-primary">Hôm nay</div>}
            </div>
          ))}

          {days.map((day) => {
            const dayMatches = matches.filter((match) => match.date === day.dateString);
            return (
              <div key={day.dateString} className={`min-h-[260px] p-2 ${day.isToday ? "bg-blue-50/10" : ""}`}>
                {dayMatches.length > 0 ? (
                  dayMatches.map((match) => <ScheduleMatchCard key={match.id} match={match} onViewResult={onViewResult} />)
                ) : (
                  <div className="m-2 flex min-h-28 items-center justify-center rounded-lg border-2 border-dashed border-border/50 px-3 text-center text-xs font-medium italic text-muted-foreground/60">
                    Không có trận đấu
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;
