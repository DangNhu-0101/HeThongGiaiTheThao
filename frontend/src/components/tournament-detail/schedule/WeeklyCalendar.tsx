import ScheduleMatchCard from "./ScheduleMatchCard";
import type { ScheduleMatch, CalendarDay } from "@/types/schedule";

// Hàm helper sinh ra 7 ngày giả lập cho tuần từ 19/05 đến 25/05/2026
const generateWeekDays = (): CalendarDay[] => {
  const weekDays: CalendarDay[] = [];
  
  // Bắt đầu từ ngày 19/05/2026 (Thứ 3 theo lịch thực tế, nhưng mock theo ảnh là Thứ 2 bắt đầu)
  // Để đơn giản, ta sẽ hardcode ngày mock cho khớp với data
  const startDate = new Date(2026, 4, 19); // Tháng 4 là tháng 5 (0-indexed)

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Format YYYY-MM-DD
    const dateString = currentDate.toISOString().split('T')[0];
    
    weekDays.push({
      date: currentDate,
      dateString: dateString,
      dayOfWeek: i === 6 ? "CN" : `T${i + 2}`, // Fake T2 -> CN
      dayOfMonth: currentDate.getDate(),
      isToday: dateString === "2026-05-23" // Đặt thứ 6 (23/05) làm "Hôm nay" để test UI
    });
  }
  return weekDays;
};

const WeeklyCalendar = ({ matches }: { matches: ScheduleMatch[] }) => {
  const weekDays = generateWeekDays();

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto beautiful-scrollbar">
        {/* Lưới 7 cột, giới hạn chiều rộng tối thiểu để không bị bóp nghẹt nội dung */}
        <div className="min-w-[1200px] grid grid-cols-7 divide-x divide-border">
          
          {/* Tiêu đề Ngày (Header row) */}
          {weekDays.map((day, idx) => (
            <div key={idx} className={`p-4 text-center border-b border-border ${day.isToday ? 'bg-blue-50/50' : 'bg-muted/10'}`}>
              <div className={`text-xs font-bold uppercase mb-1 ${day.isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {day.dayOfWeek}
              </div>
              <div className="flex justify-center">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold ${
                  day.isToday ? 'bg-primary text-white shadow-md' : 'text-foreground'
                }`}>
                  {day.dayOfMonth}
                </span>
              </div>
              {day.isToday && <div className="text-[10px] font-bold text-primary mt-1">Hôm nay</div>}
            </div>
          ))}

          {/* Ô nội dung trận đấu cho từng ngày */}
          {weekDays.map((day, idx) => {
            // Lọc các trận đấu thuộc về ngày này
            const dayMatches = matches.filter(m => m.date === day.dateString);
            
            return (
              <div key={idx} className={`p-2 min-h-[400px] ${day.isToday ? 'bg-blue-50/10' : ''}`}>
                {dayMatches.length > 0 ? (
                  dayMatches.map(match => (
                    <ScheduleMatchCard key={match.id} match={match} />
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground/50 font-medium italic border-2 border-dashed border-border/50 rounded-lg m-2">
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
