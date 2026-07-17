import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Sport } from "@/types/tournament";

export interface TournamentListFilters {
  search: string;
  sport: string;
  status: string;
  location: string;
  time: string;
}

interface TournamentFiltersProps {
  filters: TournamentListFilters;
  sports: Sport[];
  locations: string[];
  resultCount: number;
  onChange: (patch: Partial<TournamentListFilters>) => void;
  onClear: () => void;
}

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "open", label: "Mở đăng ký" },
  { value: "active", label: "Đang diễn ra" },
  { value: "completed", label: "Đã hoàn tất" },
];

const timeOptions = [
  { value: "", label: "Tất cả thời gian" },
  { value: "this-month", label: "Tháng này" },
  { value: "next-month", label: "Tháng sau" },
  { value: "upcoming", label: "Sắp tới" },
];

const TournamentFilters = ({
  filters,
  sports,
  resultCount,
  onChange,
  onClear,
}: TournamentFiltersProps) => {
  const activeFilters = [
    filters.sport && { key: "sport", label: sports.find((sport) => sport.slug === filters.sport || sport.name === filters.sport)?.name || filters.sport },
    filters.status && { key: "status", label: statusOptions.find((item) => item.value === filters.status)?.label || filters.status },
    filters.location && { key: "location", label: filters.location },
    filters.time && { key: "time", label: timeOptions.find((item) => item.value === filters.time)?.label || filters.time },
    filters.search && { key: "search", label: filters.search },
  ].filter(Boolean) as Array<{ key: keyof TournamentListFilters; label: string }>;

  return (
    <section className="page-shell py-6">
      <div className="summer-panel rounded-lg p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={filters.search}
                onChange={(event) => onChange({ search: event.target.value })}
                placeholder="Tìm kiếm giải đấu, môn thi, ban tổ chức..."
                className="h-11 w-full rounded-lg border border-border bg-white/82 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-ring/15"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={filters.sport}
                onChange={(event) => onChange({ sport: event.target.value })}
                className="h-11 rounded-lg border border-border bg-white/82 px-3 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-ring/15"
              >
                <option value="">Tất cả môn thi</option>
                {sports.map((sport) => (
                  <option key={sport._id} value={sport.slug || sport.name}>{sport.name}</option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(event) => onChange({ status: event.target.value })}
                className="h-11 rounded-lg border border-border bg-white/82 px-3 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-ring/15"
              >
                {statusOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>{option.label}</option>
                ))}
              </select>
             
              <select
                value={filters.time}
                onChange={(event) => onChange({ time: event.target.value })}
                className="h-11 rounded-lg border border-border bg-white/82 px-3 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-ring/15"
              >
                {timeOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>{option.label}</option>
                ))}
              </select>

              <Button type="button" className="h-11 gap-2" onClick={() => onChange({ ...filters })}>
                <Search className="size-4" /> Tìm kiếm
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-border pt-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Đang lọc:</span>
              {activeFilters.length === 0 ? (
                <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">Tất cả giải</span>
              ) : activeFilters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onChange({ [item.key]: "" })}
                  className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                >
                  {item.label} <X className="size-3" />
                </button>
              ))}
              <span className="text-xs text-muted-foreground">Hiển thị {resultCount.toLocaleString("vi-VN")} kết quả</span>
            </div>
            <button type="button" onClick={onClear} className="w-fit text-xs font-bold text-ring hover:underline">Xóa bộ lọc</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TournamentFilters;
