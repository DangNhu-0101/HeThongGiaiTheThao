import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccountMenu from "../AccountMenu";

const AdminHeader = ({ setSidebarOpen }: { setSidebarOpen: (v: boolean) => void }) => {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden p-2 -ml-2 text-foreground hover:bg-muted rounded-md transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:flex items-center relative">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tim kiem to chuc, nguoi dung..."
            className="pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-lg w-64 xl:w-80 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-card" />
        </Button>
        <div className="h-8 w-px bg-border mx-1 hidden sm:block" />
        <AccountMenu compact />
      </div>
    </header>
  );
};

export default AdminHeader;
