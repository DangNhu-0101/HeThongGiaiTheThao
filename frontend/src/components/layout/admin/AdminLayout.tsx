import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AdminSidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />
      <main className="relative flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader setSidebarOpen={setSidebarOpen} />
        <div className="beautiful-scrollbar flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
          <div className="page-fade">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
export default AdminLayout;
