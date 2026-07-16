import { Menu, Search } from "lucide-react";
import AccountMenu from "../AccountMenu";
import NotificationCenter from "../NotificationCenter";

const AdminHeader = ({ setSidebarOpen }: { setSidebarOpen: (value: boolean) => void }) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-white/95 px-4 shadow-sm backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="-ml-2 rounded-lg p-2 text-foreground transition-colors hover:bg-primary-light/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
          aria-label="Mở menu"
        >
          <Menu className="size-6" />
        </button>
        <div className="relative hidden items-center md:flex">
          <Search className="absolute left-3 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm tổ chức, người dùng..."
            className="w-64 rounded-lg border border-border bg-muted/60 py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary-light focus:outline-none focus:ring-4 focus:ring-ring/25 xl:w-80"
            aria-label="Tìm kiếm trong khu vực quản trị"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationCenter variant="dashboard" />
        <div className="mx-1 hidden h-8 w-px bg-border sm:block" />
        <AccountMenu compact />
      </div>
    </header>
  );
};

export default AdminHeader;
