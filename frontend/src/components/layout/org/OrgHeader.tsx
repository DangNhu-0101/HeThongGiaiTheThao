import { useEffect, useMemo, useState } from "react";
import { HelpCircle, Loader2, Menu, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AccountMenu from "../AccountMenu";
import NotificationCenter from "../NotificationCenter";
import { orgTeamMgmtService } from "@/services/orgTeamMgmtService";
import { useOrgContextStore } from "@/stores/useOrgContextStore";
import type { OrgTeamRecord } from "@/types/orgTeamMgmt";

const OrgHeader = ({ setSidebarOpen }: { setSidebarOpen: (value: boolean) => void }) => {
  const navigate = useNavigate();
  const { tournaments, selectedTournamentItemId, setSelectedTournamentId } = useOrgContextStore();
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState<OrgTeamRecord[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!selectedTournamentItemId) {
      queueMicrotask(() => {
        if (mounted) setTeams([]);
      });
      return () => {
        mounted = false;
      };
    }

    queueMicrotask(() => {
      if (!mounted) return;
      setLoadingTeams(true);
      orgTeamMgmtService
        .getTeamData(selectedTournamentItemId)
        .then((data) => {
          if (mounted) setTeams(data.records);
        })
        .catch(() => {
          if (mounted) setTeams([]);
        })
        .finally(() => {
          if (mounted) setLoadingTeams(false);
        });
    });

    return () => {
      mounted = false;
    };
  }, [selectedTournamentItemId]);

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (keyword.length < 2) return [];

    const tournamentResults = tournaments
      .filter((item) => item.name.toLowerCase().includes(keyword))
      .slice(0, 4)
      .map((item) => ({ id: item.id, title: item.name, subtitle: "Giải đấu", type: "tournament" as const }));

    const teamResults = teams
      .filter((item) => `${item.name} ${item.tournamentName || ""} ${item.sport || ""}`.toLowerCase().includes(keyword))
      .slice(0, 4)
      .map((item) => ({ id: item.id, title: item.name, subtitle: "Đội thi đấu", type: "team" as const }));

    return [...tournamentResults, ...teamResults].slice(0, 6);
  }, [query, teams, tournaments]);

  const openResult = (result: (typeof results)[number]) => {
    setQuery("");
    if (result.type === "tournament") {
      setSelectedTournamentId(result.id);
      navigate("/org/tournaments");
      return;
    }
    navigate("/org/teams");
  };

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
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm kiếm giải đấu, đội thi..."
            className="w-64 rounded-lg border border-border bg-muted/60 py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary-light focus:outline-none focus:ring-4 focus:ring-ring/25 xl:w-80"
            aria-label="Tìm kiếm trong khu vực tổ chức"
          />
          {loadingTeams && <Loader2 className="absolute right-3 size-4 animate-spin text-muted-foreground" />}

          {query.trim().length >= 2 && (
            <div className="absolute left-0 top-12 z-50 w-[22rem] overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-panel)]">
              {results.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">Không tìm thấy kết quả phù hợp.</div>
              ) : (
                <div className="py-2">
                  {results.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onClick={() => openResult(result)}
                      className="flex w-full flex-col px-4 py-3 text-left transition-colors hover:bg-primary-light/25 focus-visible:bg-primary-light/25 focus-visible:outline-none"
                    >
                      <span className="font-heading text-sm font-bold text-title">{result.title}</span>
                      <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" className="hidden text-muted-foreground hover:text-foreground sm:inline-flex" aria-label="Trợ giúp">
          <HelpCircle className="size-5" />
        </Button>
        <NotificationCenter variant="dashboard" />
        <div className="mx-1 hidden h-8 w-px bg-border sm:block" />
        <AccountMenu compact />
      </div>
    </header>
  );
};

export default OrgHeader;
