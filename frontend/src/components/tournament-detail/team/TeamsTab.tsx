import { Search } from "lucide-react";
import TeamCard from "./TeamCard";
import type { Team } from "@/types/tournament";

const TeamsTab = ({ teams }: { teams: Team[] }) => {
  return (
    <div className="flex flex-col md:flex-row gap-8 py-8">
      {/* Bộ lọc bên trái */}
      <div className="w-full md:w-64 space-y-6 flex-shrink-0">
        <div>
          <div className="flex justify-between items-center mb-3">
             <h4 className="font-bold text-sm uppercase text-muted-foreground">Bộ lọc</h4>
             <button className="text-xs text-primary hover:underline">Xóa tất cả</button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold mb-2">Trạng thái</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="status" defaultChecked className="accent-primary" /> Tất cả</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="status" className="accent-primary" /> Đã duyệt <span className="w-2 h-2 rounded-full bg-green-500"></span></label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="status" className="accent-primary" /> Chờ duyệt <span className="w-2 h-2 rounded-full bg-yellow-500"></span></label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách Đội (Grid) bên phải */}
      <div className="flex-1 space-y-4">
        {/* Thanh tìm kiếm */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-3 rounded-lg border border-border shadow-sm">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Tìm đội theo tên, khu vực..." className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:border-primary" />
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Hiển thị {teams.length} đội
          </div>
        </div>

        {/* Render TeamCard vào Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <TeamCard key={team._id} team={team} />
          ))}
        </div>
      </div>
    </div>
  );
};
export default TeamsTab;