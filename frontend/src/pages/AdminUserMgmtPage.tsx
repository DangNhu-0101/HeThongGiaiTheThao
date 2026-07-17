import { useEffect } from "react";

import UserMgmtStats from "@/components/admin/user-mgmt/UserMgmtStats";
import UserMgmtList from "@/components/admin/user-mgmt/UserMgmtList";

import { useAdminUserMgmtStore } from "@/stores/useAdminUserMgmtStore";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminUserMgmtPage = () => {
  const isMobile = useIsMobile();
  const { stats, records, loading, fetchData, updateUserStatus } = useAdminUserMgmtStore();

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  if (loading || stats.length === 0) return <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu người dùng...</div>;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 flex flex-col pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-header text-white p-6 rounded-2xl shadow-lg relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[10px] text-white/70 font-bold uppercase mb-2">
            <span>Quản trị Hệ thống</span> <span className="text-amber-500">&gt;</span> <span>Người dùng</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-1">Quản lý người dùng</h1>
          <p className="text-sm text-white/70">Điều chỉnh quyền hạn, phê duyệt hồ sơ năng lực và kiểm soát trạng thái truy cập.</p>
        </div>

      </div>

      {/* Gọi các Component đã chia nhỏ */}
      <UserMgmtStats stats={stats} />

      <UserMgmtList 
        records={records} 
        isMobile={isMobile} 
        onUpdateStatus={updateUserStatus} 
      />

    </div>
  );
};

export default AdminUserMgmtPage;
