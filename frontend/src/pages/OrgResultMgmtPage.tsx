import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResultStats from "@/components/org/result-mgmt/ResultStats";
import ResultMatchList from "@/components/org/result-mgmt/ResultMatchList";
import ResultEditor from "@/components/org/result-mgmt/ResultEditor";
import { useOrgResultMgmtStore } from "@/stores/useOrgResultMgmtStore";
import { useIsMobile } from "@/hooks/use-mobile";

const OrgResultMgmtPage = () => {
  const isMobile = useIsMobile();
  const { stats, matches, selectedMatchId, loading, fetchData, setSelectedMatchId, updateScore } = useOrgResultMgmtStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tự động chọn trận đầu tiên trên màn hình lớn nếu chưa chọn
  useEffect(() => {
    if (!isMobile && matches.length > 0 && !selectedMatchId) {
      setSelectedMatchId(matches[0].id);
    }
  }, [isMobile, matches, selectedMatchId, setSelectedMatchId]);

  if (loading || matches.length === 0) {
    return <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu kết quả...</div>;
  }

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  // KỊCH BẢN MOBILE: Tách biệt Màn hình Danh sách và Màn hình Editor
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden -m-4 md:-m-8 p-4 bg-muted/10">
        {!selectedMatch ? (
          <>
            <div className="mb-4 shrink-0">
              <h1 className="text-xl font-black uppercase text-foreground mb-4">Cập nhật Kết quả</h1>
              <ResultStats stats={stats} />
            </div>
            <div className="flex-1 min-h-0">
              <ResultMatchList matches={matches} selectedId={selectedMatchId} onSelect={setSelectedMatchId} />
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full overflow-y-auto beautiful-scrollbar">
            <Button variant="ghost" className="self-start mb-4 text-muted-foreground pl-0" onClick={() => setSelectedMatchId(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
            </Button>
            <ResultEditor match={selectedMatch} onUpdateScore={updateScore} />
          </div>
        )}
      </div>
    );
  }

  // KỊCH BẢN DESKTOP: Hiển thị song song (Grid)
  return (
    <div className="max-w-[1600px] mx-auto space-y-6 flex flex-col h-[calc(100vh-100px)]">
      
      {/* Header/Hero Panel (Đồng bộ theme xanh đen) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-header text-white p-6 rounded-2xl shadow-lg relative overflow-hidden shrink-0">
        {/* Họa tiết trang trí */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[10px] text-white/70 font-bold uppercase mb-2">
            <span>Cổng Tổ Chức</span> <span className="text-accent">&gt;</span> <span>Quản lý Kết quả</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-1">Cập nhật kết quả trận đấu</h1>
          <p className="text-sm text-white/70">Nhập tỷ số, ghi chú và xác nhận hoàn tất để đồng bộ BXH.</p>
        </div>

        {/* Nút thao tác bên phải */}
        <div className="flex gap-3 relative z-10 w-full md:w-auto mt-4 md:mt-0">
          <Button variant="outline" className="border-white/20 text-foreground bg-white hover:bg-white/90 w-full md:w-auto">
            Làm mới dữ liệu
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="shrink-0">
        <ResultStats stats={stats} />
      </div>

      {/* Main Workspace: Chia 3 cột */}
      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left: Danh sách trận (1 cột) */}
        <div className="col-span-1 h-full">
          <ResultMatchList matches={matches} selectedId={selectedMatchId} onSelect={setSelectedMatchId} />
        </div>

        {/* Right: Trình chỉnh sửa (2 cột) */}
        <div className="col-span-2 h-full overflow-y-auto beautiful-scrollbar pr-2">
          {selectedMatch ? (
            <ResultEditor match={selectedMatch} onUpdateScore={updateScore} />
          ) : (
            <div className="h-full flex items-center justify-center bg-card border border-border rounded-xl text-muted-foreground text-sm font-medium">
              Vui lòng chọn một trận đấu bên trái để cập nhật.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default OrgResultMgmtPage;