import { useEffect, useMemo } from "react";
import { Download, FileDown, Trophy, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { useOrgContextStore } from "@/stores/useOrgContextStore";
import { useOrgTournamentMgmtStore } from "@/stores/useOrgTournamentMgmtStore";
import { useOrgFinanceMgmtStore } from "@/stores/useOrgFinanceMgmtStore";
import { useOrgTeamMgmtStore } from "@/stores/useOrgTeamMgmtStore";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

const downloadTextFile = (fileName: string, content: string, type = "application/json") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const OrgTournamentDashboardPage = () => {
  const { selectedTournamentId, selectedTournamentItemId } = useOrgContextStore();
  const { records, fetchData } = useOrgTournamentMgmtStore();
  const { feeProgress, sponsors, fetchData: fetchFinance } = useOrgFinanceMgmtStore();
  const { records: teams, fetchData: fetchTeams } = useOrgTeamMgmtStore();

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedTournamentItemId) return;
    void fetchFinance(selectedTournamentItemId);
    void fetchTeams(selectedTournamentItemId);
  }, [fetchFinance, fetchTeams, selectedTournamentItemId]);

  const selectedTournament = useMemo(
    () => records.find((record) => record.id === selectedTournamentId || record.tournamentItemId === selectedTournamentItemId),
    [records, selectedTournamentId, selectedTournamentItemId],
  );

  const chartData = [
    { name: "Đội", value: teams.length },
    { name: "Đã duyệt", value: teams.filter((team) => team.status === "Approved").length },
    { name: "Chờ duyệt", value: teams.filter((team) => team.status === "Pending").length },
    { name: "Tài trợ", value: sponsors.length },
  ];

  const reportPayload = {
    tournament: selectedTournament,
    feeProgress,
    sponsors,
    teams,
    exportedAt: new Date().toISOString(),
  };

  const exportJson = () => {
    downloadTextFile(
      `bao-cao-${selectedTournament?.id || "giai-dau"}.json`,
      JSON.stringify(reportPayload, null, 2),
    );
  };

  const exportCsv = () => {
    const rows = [
      ["Chỉ số", "Giá trị"],
      ["Tên giải", selectedTournament?.name || "Chưa chọn giải"],
      ["Môn", selectedTournament?.sport || ""],
      ["Số đội", String(teams.length)],
      ["Nhà tài trợ", String(sponsors.length)],
      ["Đã thu", String(feeProgress?.collectedAmount || 0)],
      ["Dự kiến", String(feeProgress?.expectedAmount || 0)],
    ];
    downloadTextFile(
      `bao-cao-${selectedTournament?.id || "giai-dau"}.csv`,
      rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n"),
      "text/csv;charset=utf-8",
    );
  };

  if (!selectedTournament) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-lg border border-dashed border-border p-10 text-center">
        <Trophy className="mb-3 h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-black text-foreground">Chưa chọn giải đấu</h1>
        <p className="mt-2 text-sm text-muted-foreground">Hãy chọn một giải trong combobox ở sidebar để xem bảng điều khiển riêng của giải.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 rounded-lg bg-header p-6 text-white shadow-lg md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase text-white/70">Quản lý &gt; Giải đấu đang chọn</div>
          <h1 className="text-3xl font-black uppercase tracking-wider">{selectedTournament.name}</h1>
          <p className="mt-1 text-sm text-white/75">{selectedTournament.sport} · {selectedTournament.format}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={exportCsv} variant="outline" className="bg-white text-foreground hover:bg-white/90">
            <FileDown className="mr-2 h-4 w-4" /> Xuất CSV
          </Button>
          <Button onClick={exportJson} className="bg-primary text-white hover:bg-primary-hover">
            <Download className="mr-2 h-4 w-4" /> Xuất JSON
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Đội đăng ký</span>
            <Users className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-3 text-3xl font-black">{teams.length}</p>
          <p className="text-xs text-muted-foreground">Tối đa {selectedTournament.registration.max || selectedTournament.teamsCount || 0}</p>
        </div>
        {/* <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Đã thu lệ phí</span>
            <WalletCards className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-3 text-3xl font-black">{formatCurrency(feeProgress?.collectedAmount || 0)}</p>
          <p className="text-xs text-muted-foreground">Dự kiến {formatCurrency(feeProgress?.expectedAmount || 0)}</p>
        </div> */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Nhà tài trợ</span>
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-3 text-3xl font-black">{sponsors.length}</p>
          <p className="text-xs text-muted-foreground">Tổng tài trợ {formatCurrency(sponsors.reduce((sum, sponsor) => sum + sponsor.amount, 0))}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-black uppercase text-foreground">Biểu đồ vận hành</h2>
          <p className="text-sm text-muted-foreground">Tổng hợp nhanh theo giải đang chọn.</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default OrgTournamentDashboardPage;
