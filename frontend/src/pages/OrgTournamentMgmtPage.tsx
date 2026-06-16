import { useEffect } from "react";
import { Download, Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import MgmtStats from "@/components/org/tournament-mgmt/MgmtStats";
import MgmtFilters from "@/components/org/tournament-mgmt/MgmtFilters";
import MgmtDataTable from "@/components/org/tournament-mgmt/MgmtDataTable";
import { useOrgTournamentMgmtStore } from "@/stores/useOrgTournamentMgmtStore";
import { useIsMobile } from "@/hooks/use-mobile";
import CreateTournamentModal from "@/components/org/tournament-mgmt/create-sections/CreateTournamentModal";

const OrgTournamentMgmtPage = () => {
  const { stats, records, loading, fetchData } = useOrgTournamentMgmtStore();
  
  // Dùng hook responsive để truyền xuống Table
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || records.length === 0) {
    return <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse font-medium">Đang tải danh sách giải đấu...</div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      
      {/* Header/Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-header text-white p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[10px] text-white/70 font-bold uppercase mb-2">
            <span>Cổng Tổ Chức</span> <span className="text-accent">&gt;</span> <span>Quản lý giải đấu</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-1">Quản lý Giải đấu</h1>
          <p className="text-sm text-white/70">Tạo, quản lý, xuất bản và lưu trữ tất cả giải đấu của bạn.</p>
        </div>
        <div className="flex flex-wrap gap-3 relative z-10 w-full md:w-auto">
          <Button variant="outline" className="border-white/20 text-foreground bg-white hover:bg-white/90 flex-1 md:flex-none">
            <Download className="w-4 h-4 mr-2" /> Xuất dữ liệu
          </Button>
          <Button variant="outline" className="border-white/20 text-foreground bg-white hover:bg-white/90 flex-1 md:flex-none">
            <Copy className="w-4 h-4 mr-2" /> Dùng Mẫu
          </Button>
                <CreateTournamentModal onSuccess={() => {
            // Chỗ này gọi hàm fetch/reload lại danh sách giải đấu sau khi tạo xong
            console.log("Đã tải lại danh sách giải đấu!");
          }}>
            {/* Cái nút này sẽ tự động trở thành công tắc mở Modal */}
            <Button className="bg-primary hover:bg-primary-hover text-white font-bold shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Khởi tạo Giải đấu
            </Button>
          </CreateTournamentModal>
        </div>
      </div>

      {/* Thống kê Tổng quan */}
      <MgmtStats stats={stats} />

      {/* Bộ lọc & Bảng Dữ liệu */}
      <div className="space-y-4">
        <MgmtFilters />
        
        {/* Component DataTable tự động đổi UI dựa vào isMobile */}
        <MgmtDataTable records={records} isMobile={isMobile} />

        {/* Phân trang (Pagination) */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground pt-4">
          <div>Hiển thị <span className="font-bold text-foreground">1-5</span> trong số <span className="font-bold text-foreground">8</span> giải đấu</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Số dòng:</span>
              <select className="bg-transparent border-b border-border font-medium focus:outline-none">
                <option>10</option>
                <option>20</option>
              </select>
            </div>
            <div className="flex gap-1">
              <button className="px-2 py-1 rounded hover:bg-muted">&lt;</button>
              <button className="px-2.5 py-1 rounded bg-primary text-white font-bold">1</button>
              <button className="px-2.5 py-1 rounded hover:bg-muted">2</button>
              <button className="px-2 py-1 rounded hover:bg-muted">&gt;</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
export default OrgTournamentMgmtPage;