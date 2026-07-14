import { Search, RotateCcw, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

const MgmtFilters = () => {
  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 bg-card p-4 rounded-xl border border-border">
      
      <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Tìm kiếm giải đấu..." 
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary"
          />
        </div>
        
        <select className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:border-primary">
          <option>Tất cả Trạng thái</option>
          <option>Trực tiếp</option>
          <option>Mở đăng ký</option>
        </select>

        <select className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:border-primary">
          <option>Tất cả Môn</option>
          <option>Pickleball</option>
        </select>
        
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm px-3">
          <RotateCcw className="w-4 h-4 mr-2" /> Đặt lại
        </Button>
      </div>

      <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-end">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Sắp xếp:</span>
          <select className="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer border-b border-dashed border-border pb-0.5">
            <option>Mới nhất trước</option>
            <option>Tên A-Z</option>
          </select>
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
          <button className="p-1.5 bg-background shadow-sm rounded-md text-foreground"><List className="w-4 h-4" /></button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><LayoutGrid className="w-4 h-4" /></button>
        </div>
      </div>

    </div>
  );
};
export default MgmtFilters;