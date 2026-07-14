import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const TournamentFilters = () => {
  return (
    <section className="page-shell py-6">
      <div className="summer-panel rounded-lg p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm giải đấu, đội tuyển, ban tổ chức..."
                className="h-11 w-full rounded-lg border border-border bg-white/82 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-ring/15"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select className="h-11 rounded-lg border border-border bg-white/82 px-3 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-ring/15">
                <option>Tất cả môn thi</option>
                <option>Pickleball</option>
              </select>
              <select className="h-11 rounded-lg border border-border bg-white/82 px-3 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-ring/15">
                <option>Trạng thái</option>
                <option>Đang mở đăng ký</option>
              </select>
              <select className="h-11 rounded-lg border border-border bg-white/82 px-3 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-ring/15">
                <option>Khu vực</option>
                <option>Miền Nam</option>
              </select>
              <select className="h-11 rounded-lg border border-border bg-white/82 px-3 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-ring/15">
                <option>Thời gian</option>
                <option>Tháng này</option>
              </select>

              <Button className="h-11 gap-2">
                <Search className="size-4" /> Tìm kiếm
              </Button>
              <Button variant="outline" className="h-11 gap-2">
                <SlidersHorizontal className="size-4" /> Nâng cao
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-border pt-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Đang lọc:</span>
              <div className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                Tất cả môn thi <X className="size-3 cursor-pointer" />
              </div>
              <div className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" /> Đang diễn ra <X className="size-3 cursor-pointer" />
              </div>
              <span className="text-xs text-muted-foreground">Hiển thị 18 kết quả</span>
            </div>
            <button className="w-fit text-xs font-bold text-ring hover:underline">Xóa bộ lọc</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TournamentFilters;
