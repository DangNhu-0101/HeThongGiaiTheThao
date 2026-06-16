import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

const ScheduleHeader = () => {
  return (
    <div className="flex flex-col xl:flex-row justify-between items-center gap-4 mb-6 bg-card p-4 rounded-xl border border-border shadow-sm">
      
      {/* Cụm điều hướng ngày */}
      <div className="flex items-center gap-4">
        <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden shadow-sm">
          <button className="px-3 py-2 hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4 text-muted-foreground" /></button>
          <button className="px-4 py-2 text-sm font-semibold border-x border-border hover:bg-muted transition-colors text-primary">Hôm nay</button>
          <button className="px-3 py-2 hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <h2 className="text-lg font-extrabold uppercase text-foreground flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" /> THÁNG 5 19 - 25, 2026
        </h2>
      </div>

      {/* Cụm bộ lọc (Legend) & Chế độ xem */}
      <div className="flex items-center gap-6 flex-wrap justify-center">
        <div className="flex items-center gap-4 text-xs font-medium">
          <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
            <input type="checkbox" defaultChecked className="accent-red-500 w-3 h-3" /> 
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Trực tiếp
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
            <input type="checkbox" defaultChecked className="accent-blue-400 w-3 h-3" /> Sắp tới
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
            <input type="checkbox" defaultChecked className="accent-green-500 w-3 h-3" /> Hoàn tất
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
            <input type="checkbox" defaultChecked className="accent-yellow-500 w-3 h-3" /> Trùng lịch
          </label>
        </div>

        <div className="flex bg-muted p-1 rounded-lg">
          <button className="px-3 py-1.5 text-xs font-bold rounded-md bg-background text-foreground shadow-sm">Tuần</button>
          <button className="px-3 py-1.5 text-xs font-bold rounded-md text-muted-foreground hover:text-foreground transition-colors">Ngày</button>
          <button className="px-3 py-1.5 text-xs font-bold rounded-md text-muted-foreground hover:text-foreground transition-colors">Tháng</button>
        </div>
      </div>
      
    </div>
  );
};

export default ScheduleHeader;