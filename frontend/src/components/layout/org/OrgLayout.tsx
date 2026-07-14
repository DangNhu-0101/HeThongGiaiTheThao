import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import OrgSidebar from "./OrgSidebar";
import OrgHeader from "./OrgHeader";
import { useOrgContextStore } from "@/stores/useOrgContextStore";

const OrgLayout = () => {
  // Biến này giờ chỉ quản lý nút bấm mở menu trên Điện thoại
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fetchTournaments = useOrgContextStore((state) => state.fetchTournaments);

  useEffect(() => {
    void fetchTournaments();
  }, [fetchTournaments]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <OrgSidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />

      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <OrgHeader setSidebarOpen={setSidebarOpen} />

        <div className="beautiful-scrollbar flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
          <div className="page-fade">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrgLayout;
