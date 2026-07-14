import { PlusCircle, Users, CalendarPlus, FileDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

const OrgQuickActions = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6 border-l-4 border-accent pl-3">
        <h3 className="font-bold uppercase text-foreground">Thao tác nhanh</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/org/tournaments" className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-muted transition-colors">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><PlusCircle className="w-5 h-5" /></div>
          <span className="text-xs font-bold text-foreground text-center">Tạo Giải Mới</span>
        </Link>
        <Link to="/org/teams" className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-muted transition-colors">
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><Users className="w-5 h-5" /></div>
          <span className="text-xs font-bold text-foreground text-center">Thêm Đội</span>
        </Link>
        <Link to="/org/schedule" className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-muted transition-colors">
          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><CalendarPlus className="w-5 h-5" /></div>
          <span className="text-xs font-bold text-foreground text-center">Xếp Lịch</span>
        </Link>
        <Link to="/org/reports" className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-muted transition-colors">
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><FileDown className="w-5 h-5" /></div>
          <span className="text-xs font-bold text-foreground text-center">Xuất Báo Cáo</span>
        </Link>
      </div>
    </Card>
  );
};
export default OrgQuickActions;
