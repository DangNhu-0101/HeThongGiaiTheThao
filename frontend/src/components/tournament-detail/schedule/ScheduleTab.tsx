import { useEffect } from "react";
import ScheduleHeader from "./ScheduleHeader";
import WeeklyCalendar from "./WeeklyCalendar";
import { useScheduleStore } from "@/stores/useScheduleStore";

const ScheduleTab = ({ tournamentId }: { tournamentId: string }) => {
  const { matches, loading, fetchSchedule } = useScheduleStore();

  useEffect(() => {
    fetchSchedule(tournamentId);
  }, [tournamentId, fetchSchedule]);

  if (loading) return <div className="py-20 text-center text-muted-foreground font-medium animate-pulse">Đang tải lịch thi đấu...</div>;

  return (
    <div className="py-8">
      <ScheduleHeader />
      <WeeklyCalendar matches={matches} />
    </div>
  );
};

export default ScheduleTab;