

import * as React from "react"
import CreateTournamentModal from "@/components/tournament/CreateTournamentModal/CreateTournamentModal"
import { Button } from "@/components/ui/button"
import { NavMain } from "@/components/sidebar/nav-main"
import { NavSecondary } from "@/components/sidebar/nav-secondary"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings2Icon, LifeBuoyIcon, SendIcon, TerminalIcon, Trophy, ChevronsUpDown, Plus } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useTournamentStore } from "@/stores/useTournamentStore"
import { useAuthStore } from "@/stores/useAuthStore"

interface SidebarTournament {
  _id?: string;
  name: string;
}

const data = {
  user: {
    name: "Hệ thống quản trị",
    email: "admin@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Hệ thống",
      url: "#",
      icon: <Settings2Icon />,
      isActive: true,
      items: [
        {
          title: "Dashboard hệ thống",
          url: "/org",
        },
        {
          title: "Danh sách sân",
          url: "/org/courts",
        },
        {
          title: "Danh sách trọng tài",
          url: "/org/referees",
        },
        {
          title: "Danh sách đội",
          url: "/org/teams",
        },
        {
          title: "Import dữ liệu",
          url: "/org/import",
        },
        
        
      ],
    },
    
  ],
  navTournament: [
    {
      title: "Điều hành giải",
      url: "#",
      icon: <Trophy />,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "/tournaments/:tournamentId/dashboard",
        },
        {
          title: "Vòng đấu & luật",
          url: "/tournaments/:tournamentId/rules",
        },
        {
          title: "Trận đấu",
          url: "/tournaments/:tournamentId/matches",
        },
        {
          title: "Đội tuyển",
          url: "/tournaments/:tournamentId/teams",
        },
        {
          title: "Sân bãi",
          url: "/tournaments/:tournamentId/courts",
        },
        {
          title: "Trọng tài",
          url: "/tournaments/:tournamentId/referees",
        },
        {
          title: "Tài chính",
          url: "/tournaments/:tournamentId/finance",
        },
        {
          title: "Import dữ liệu",
          url: "/tournaments/:tournamentId/import",
        },
      ],
    },
  ],

  navSecondary: [
    {
      title: "Hỗ trợ",
      url: "#",
      icon: <LifeBuoyIcon />,
    },
    {
      title: "Phản hồi",
      url: "#",
      icon: <SendIcon />,
    },
  ],

}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { tournamentList, fetchTournaments } = useTournamentStore()
  const { user } = useAuthStore();
  const location = useLocation();
  const [activeTournament, setActiveTournament] = React.useState<SidebarTournament | null>(null)
  const currentTournamentId = React.useMemo(() => {
    const match = location.pathname.match(/^\/tournaments\/([^/]+)/);
    return match?.[1] || "";
  }, [location.pathname])

  React.useEffect(() => {
    if (fetchTournaments) {
      fetchTournaments()
    }
  }, [fetchTournaments])

  // Tự động chọn giải đấu đầu tiên nếu chưa có giải nào được chọn
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (tournamentList && tournamentList.length > 0 && !activeTournament) {
      timer = setTimeout(() => {
        setActiveTournament(tournamentList[0])
      }, 0);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [tournamentList, activeTournament])

  // Cập nhật URL động cho các menu Điều hành giải dựa trên ID giải đang chọn
  const dynamicNavTournament = React.useMemo(() => {
    return data.navTournament.map((group) => {
      const tournamentId = activeTournament?._id || currentTournamentId;
      if (tournamentId) {
        return {
          ...group,
          items: group.items.map((item) => ({
            ...item,
            // Truyền ID giải đấu vào URL để các trang điều hành có thể lấy được dữ liệu
            url: item.url.replace(':tournamentId', tournamentId),
          })),
        }
      }
      return group
    })
  }, [activeTournament, currentTournamentId])

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/org">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <TerminalIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">ITVTG HUB</span>
                <span className="truncate text-xs">Admin Dashboard</span>
              </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {/* 1. Hệ thống */}
        <NavMain items={data.navMain} />
        
        {/* 2. Chọn giải đấu (Tournament Switcher) */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Chọn giải đấu</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-sidebar-border bg-background text-foreground">
                      <Trophy className="size-4 text-primary" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {activeTournament ? activeTournament.name : "Chọn giải đấu"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {activeTournament ? "Đang điều hành" : "Chưa có dữ liệu"}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Giải đấu của bạn
                  </DropdownMenuLabel>
                  {tournamentList?.map((tournament: SidebarTournament, index: number) => (
                    <DropdownMenuItem
                      key={tournament._id || index}
                      onClick={() => setActiveTournament(tournament)}
                      className="gap-2 p-2 cursor-pointer"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <Trophy className="size-4 shrink-0" />
                      </div>
                      <span className="truncate font-medium">{tournament.name}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 p-2 cursor-pointer" asChild>
                     <CreateTournamentModal onSuccess={fetchTournaments}>
                      <Button variant="outline" className="gap-2 font-bold shadow-xs bg-white border-blue-400 text-blue-400 hover:bg-blue-50 hover:text-blue-600 w-full justify-start">
                        <Plus className="h-4 w-4" />
                        Tạo giải đấu mới
                      </Button>
                </CreateTournamentModal>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* 3. Điều hành giải */}
        <NavMain items={dynamicNavTournament} />

        {/* 4. Hỗ trợ & Phản hồi */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={{
          name: user?.username || "Guest",
          email: user?.email || "",
          avatar: user?.avatarUrl || "/avatars/shadcn.jpg",
        }} />
        <div className="p-2 text-center text-xs text-muted-foreground font-medium">
          © 2025 IT Vũng Tàu Group
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
