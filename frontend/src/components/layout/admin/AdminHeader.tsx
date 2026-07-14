import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccountMenu from "../AccountMenu";

const AdminHeader = ({ setSidebarOpen }: { setSidebarOpen: (value: boolean) => void }) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/92 px-4 shadow-sm backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="-ml-2 rounded-lg p-2 text-foreground transition-colors hover:bg-secondary md:hidden"
          aria-label="Mở menu"
        >
          <Menu className="size-6" />
        </button>
        <div className="relative hidden items-center md:flex">
          <Search className="absolute left-3 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm tổ chức, người dùng..."
            className="w-64 rounded-lg border border-border bg-muted/45 py-2 pl-9 pr-4 text-sm transition-all focus:border-ring focus:outline-none focus:ring-4 focus:ring-ring/15 xl:w-80"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" aria-label="Thông báo">
          <Bell className="size-5" />
          <span className="absolute right-2.5 top-2 size-2 animate-pulse rounded-full border border-card bg-primary" />
        </Button>
        <div className="mx-1 hidden h-8 w-px bg-border sm:block" />
        <AccountMenu compact />
      </div>
    </header>
  );
};

export default AdminHeader;
