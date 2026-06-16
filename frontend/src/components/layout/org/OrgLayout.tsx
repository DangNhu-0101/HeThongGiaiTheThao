import { useState } from "react";
import { Outlet } from "react-router-dom";
import OrgSidebar from "./OrgSidebar";
import OrgHeader from "./OrgHeader";

const OrgLayout = () => {
  // Biến này giờ chỉ quản lý nút bấm mở menu trên Điện thoại
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      
      {/* Sidebar tự động co giãn bằng Tailwind CSS */}
      <OrgSidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Thanh Header Điện Thoại: Tự động ẨN trên Desktop nhờ class "md:hidden" */}
        <OrgHeader setSidebarOpen={setSidebarOpen} />
        
          
        
        
        {/* Khu vực chứa trang Dashboard */}
        <div className="flex-1 overflow-y-auto beautiful-scrollbar p-4 md:p-8">
          <Outlet />
        </div>
        
      </main>
    </div>
  );
};

export default OrgLayout;