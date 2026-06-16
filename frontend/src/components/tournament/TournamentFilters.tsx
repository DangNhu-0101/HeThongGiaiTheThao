import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const TournamentFilters = () => {
  return (
    <section className="max-w-7xl mx-auto px-8 py-6">
      <div className="bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col gap-4">
        
        {/* Main Filter Row */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text" 
              placeholder="Tìm kiếm giải đấu, đội tuyển, ban tổ chức..." 
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option>Tất cả môn thi</option>
              <option>Pickleball</option>
            </select>
            <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option>Trạng thái</option>
              <option>Đang mở đăng ký</option>
            </select>
            <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option>Khu vực</option>
              <option>Miền Nam</option>
            </select>
            <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option>Thời gian</option>
              <option>Tháng này</option>
            </select>
            
            <Button className="bg-ring hover:bg-ring/90 text-white gap-2">
              <Search className="w-4 h-4" /> Tìm kiếm
            </Button>
            <Button variant="outline" className="border-border text-foreground hover:bg-muted gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Nâng cao
            </Button>
          </div>
        </div>

        {/* Active Filters Row */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Đang lọc:</span>
            <div className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs font-medium">
              Tất cả môn thi <X className="w-3 h-3 cursor-pointer" />
            </div>
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> Đang diễn ra <X className="w-3 h-3 cursor-pointer" />
            </div>
            <span className="text-muted-foreground text-xs ml-2">Hiển thị 18 kết quả</span>
          </div>
          <button className="text-xs text-ring hover:underline font-medium">Xóa bộ lọc</button>
        </div>
      </div>
    </section>
  );
};

export default TournamentFilters;
