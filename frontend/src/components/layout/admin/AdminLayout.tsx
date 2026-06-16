import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <AdminHeader setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 overflow-y-auto beautiful-scrollbar bg-muted/10 p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
export default AdminLayout;