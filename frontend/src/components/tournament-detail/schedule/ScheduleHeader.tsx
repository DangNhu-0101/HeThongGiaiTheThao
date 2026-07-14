import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export type ScheduleStatusFilter = "all" | "live" | "upcoming" | "completed" | "conflict";
export type ScheduleViewMode = "day" | "week" | "month";

interface ScheduleHeaderProps {
  status: ScheduleStatusFilter;
  viewMode: ScheduleViewMode;
  title: string;
  onStatusChange: (status: ScheduleStatusFilter) => void;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

const statusOptions: Array<{ value: ScheduleStatusFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "live", label: "Trực tiếp" },
  { value: "upcoming", label: "Sắp tới" },
  { value: "completed", label: "Hoàn tất" },
  { value: "conflict", label: "Trùng lịch" },
];

const viewOptions: Array<{ value: ScheduleViewMode; label: string }> = [
  { value: "day", label: "Ngày" },
  { value: "week", label: "Tuần" },
  { value: "month", label: "Tháng" },
];

const ScheduleHeader = ({
  status,
  viewMode,
  title,
  onStatusChange,
  onViewModeChange,
  onToday,
  onPrevious,
  onNext,
}: ScheduleHeaderProps) => {
  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex w-full items-center overflow-hidden rounded-lg border border-border bg-background shadow-sm sm:w-auto">
            <button type="button" onClick={onPrevious} className="px-3 py-2 transition-colors hover:bg-muted" aria-label="Khoảng trước">
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={onToday}
              className="flex-1 border-x border-border px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-muted sm:flex-none"
            >
              Hôm nay
            </button>
            <button type="button" onClick={onNext} className="px-3 py-2 transition-colors hover:bg-muted" aria-label="Khoảng sau">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <h2 className="flex items-center gap-2 text-base font-extrabold uppercase text-foreground sm:text-lg">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {title}
          </h2>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1 beautiful-scrollbar">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onStatusChange(option.value)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                  status === option.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex rounded-lg bg-muted p-1">
            {viewOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onViewModeChange(option.value)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition-colors sm:flex-none ${
                  viewMode === option.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleHeader;
