import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Search,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import TeamMgmtStats from "@/components/org/team-mgmt/TeamMgmtStats";
import TeamMgmtCard from "@/components/org/team-mgmt/TeamMgmtCard";
import AthleteMgmtTable from "@/components/org/team-mgmt/AthleteMgmtTable";
import AccountLinkDialog from "@/components/org/shared/AccountLinkDialog";
import RequireTournamentSelection from "@/components/org/RequireTournamentSelection";
import { useOrgTeamMgmtStore } from "@/stores/useOrgTeamMgmtStore";
import { useOrgAthleteMgmtStore } from "@/stores/useOrgAthleteMgmtStore";
import { useOrgContextStore } from "@/stores/useOrgContextStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { orgTeamMgmtService } from "@/services/orgTeamMgmtService";
import type { OrgAthleteRecord } from "@/types/orgAthleteMgmt";

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const downloadBase64File = (base64: string, mimeType: string, fileName: string) => {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  downloadBlob(new Blob([bytes], { type: mimeType }), fileName);
};

const OrgTeamMgmtPage = () => {
  const [activeTab, setActiveTab] = useState<"teams" | "athletes">("teams");
  const [viewingAthlete, setViewingAthlete] = useState<OrgAthleteRecord | null>(null);
  const [linkingAthlete, setLinkingAthlete] = useState<OrgAthleteRecord | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const selectedTournamentItemId = useOrgContextStore((state) => state.selectedTournamentItemId);

  const {
    stats: teamStats,
    records: teamRecords,
    loading: teamLoading,
    fetchData: fetchTeams,
    toggleFeeExempt,
    approveTeam,
    rejectTeam,
    addTeamByOrganization,
    importTeamsFromFile,
  } = useOrgTeamMgmtStore();

  const {
    records: athleteRecords,
    loading: athleteLoading,
    fetchData: fetchAthletes,
    toggleStatus: toggleAthleteStatus,
    linkPlayerAccount,
  } = useOrgAthleteMgmtStore();

  useEffect(() => {
    if (!selectedTournamentItemId) return;
    fetchTeams(selectedTournamentItemId);
    fetchAthletes(selectedTournamentItemId);
  }, [fetchTeams, fetchAthletes, selectedTournamentItemId]);

  const pendingTeams = teamRecords.filter((team) => team.status === "Pending" && team.paymentStatus !== "exempted" && !team.isFree);
  const approvedTeams = teamRecords.filter((team) => team.status === "Approved" || team.paymentStatus === "exempted" || team.isFree);
  const otherTeams = teamRecords.filter((team) => team.status === "Rejected" || team.status === "Suspended");
  const gridLayoutClass = `grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`;

  const downloadImportTemplate = async () => {
    try {
      const blob = await orgTeamMgmtService.downloadImportTemplate();
      downloadBlob(blob, "mau-nhap-6-doi-vdv.xlsx");
    } catch (error) {
      console.error(error);
      toast.error("Chưa thể tai mau Excel.");
    }
  };

  const handleImportFile = async (file?: File) => {
    if (!file) return;
    try {
      const result = await importTeamsFromFile(file);
      if (result.loginFile?.base64) {
        downloadBase64File(result.loginFile.base64, result.loginFile.mimeType, result.loginFile.fileName);
      }
      toast.success(result.message || "Đã nhập đội và VĐV từ file. File tài khoản đăng nhập đã được tải về.");
    } catch (error) {
      const responseData = (error as { response?: { data?: { message?: string; errors?: Array<{ row?: number; message: string }>; notes?: string[] } } })?.response?.data;
      const detail = responseData?.errors?.slice(0, 5).map((item) => `Dong ${item.row || "?"}: ${item.message}`).join("\n");
      const notes = responseData?.notes?.join("\n");
      const message = [responseData?.message || (error instanceof Error ? error.message : "Không thể nhap file."), detail, notes].filter(Boolean).join("\n");
      toast.error(message);
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handleAddTeam = async () => {
    const name = window.prompt("Tên đội");
    if (!name?.trim()) return;
    const representativeName = window.prompt("Người đại diện") || "";
    const phone = window.prompt("Số điện thoại") || "";
    const firstAthlete = window.prompt("VĐV đầu tiên") || representativeName || name;
    try {
      await addTeamByOrganization({
        name: name.trim(),
        representative: { name: representativeName, phone },
        athletes: firstAthlete ? [{ name: firstAthlete, gender: "other", skill: 1 }] : [],
        paymentStatus: "unpaid",
        source: "organization",
      });
      toast.success("Đã thêm đội.");
      fetchAthletes(selectedTournamentItemId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể thêm đội.";
      toast.error(message);
    }
  };

  void handleAddTeam;

  const renderTeamSection = (title: string, icon: ReactNode, teams: typeof teamRecords) => {
    if (!teams.length) return null;
    return (
      <div className="pt-8 first:pt-0 first:border-t-0 border-t border-border/50">
        <div className="flex items-center gap-3 mb-4">
          {icon}
          <h2 className="text-xl font-black uppercase text-foreground">{title}</h2>
        </div>
        <div className={gridLayoutClass}>
          {teams.map((team) => (
            <TeamMgmtCard
              key={team.id}
              team={team}
              onToggleFree={(id) => void toggleFeeExempt(id)}
              onApprove={(id) => void approveTeam(id)}
              onReject={(id) => void rejectTeam(id)}
            />
          ))}
        </div>
      </div>
    );
  };

  if (teamLoading || athleteLoading) {
    return <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu...</div>;
  }

  if (!selectedTournamentItemId) {
    return <RequireTournamentSelection description="Hãy chọn giải ở Sidebar để quản lý đội và VĐV của giải đó." />;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-header text-white p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[10px] text-white/70 font-bold uppercase mb-2">
            <span>Cổng Tổ Chức</span>
            <span className="text-accent">&gt;</span>
            <span>Quản lý Đội & VĐV</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-1">Quản lý {activeTab === "teams" ? "Đội thi" : "Vận động viên"}</h1>
          <p className="text-sm text-white/70">Duyệt đăng ký, theo dõi lệ phí và quản lý danh sách tham gia theo giải đang chọn.</p>
        </div>

        <div className={`flex gap-3 relative z-10 w-full md:w-auto ${isMobile ? "flex-col" : "flex-row"}`}>
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="border-white/20 text-foreground bg-white hover:bg-white/90 flex-1 md:flex-none">
              <Download className="w-4 h-4 mr-2 hidden sm:inline" /> Xuất danh sách
            </Button>
            <Button type="button" variant="outline" onClick={downloadImportTemplate} className="border-white/20 text-foreground bg-white hover:bg-white/90 flex-1 md:flex-none">
              <FileSpreadsheet className="w-4 h-4 mr-2 hidden sm:inline" /> Tải mẫu Excel
            </Button>
            <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()} className="border-white/20 text-foreground bg-white hover:bg-white/90 flex-1 md:flex-none">
              <Upload className="w-4 h-4 mr-2 hidden sm:inline" /> Nhập file
            </Button>
           
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(event) => void handleImportFile(event.target.files?.[0])}
          />
       
        </div>
      </div>

      {activeTab === "teams" && <TeamMgmtStats stats={teamStats} />}
    

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex bg-muted p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("teams")}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === "teams" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Đội thi <span className={`${activeTab === "teams" ? "bg-primary/10" : "bg-black/5"} px-1.5 py-0.5 rounded-full`}>{teamRecords.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("athletes")}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === "athletes" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            V?V <span className={`${activeTab === "athletes" ? "bg-primary/10" : "bg-black/5"} px-1.5 py-0.5 rounded-full`}>{athleteRecords.length}</span>
          </button>
        </div>

        <div className={`flex gap-3 w-full xl:w-auto ${isMobile ? "flex-col" : "flex-row items-center"}`}>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Tìm kiếm ${activeTab === "teams" ? "đội" : "vận động viên"}...`}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="flex-1 sm:flex-none border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none">
              <option>Giải đang chọn</option>
            </select>
          </div>
          <div className="hidden sm:flex bg-muted p-1 rounded-lg shrink-0 ml-auto xl:ml-0">
            <button className="p-1.5 bg-background shadow-sm rounded-md text-foreground"><LayoutGrid className="w-4 h-4" /></button>
            <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><List className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {activeTab === "teams" ? (
        <div className="space-y-8">
          {renderTeamSection("Đang chờ duyệt", <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Clock className="w-5 h-5" /></div>, pendingTeams)}
          {renderTeamSection("Đội chính thức", <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle2 className="w-5 h-5" /></div>, approvedTeams)}
          {renderTeamSection("Trạng thái khác", <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><ShieldAlert className="w-5 h-5" /></div>, otherTeams)}
        </div>
      ) : (
        <div className="mt-6">
          <AthleteMgmtTable records={athleteRecords} isMobile={isMobile} onToggleStatus={toggleAthleteStatus} onView={setViewingAthlete} />
        </div>
      )}

      {viewingAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-muted/20 p-4">
              <h3 className="font-bold">Thông tin vận động viên</h3>
              <button type="button" onClick={() => setViewingAthlete(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted">×</button>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <p><span className="font-bold">Họ tên:</span> {viewingAthlete.name}</p>
              <p><span className="font-bold">Đội:</span> {viewingAthlete.teamName}</p>
              <p><span className="font-bold">Giới tính/Tuổi:</span> {viewingAthlete.gender}, {viewingAthlete.age}</p>
              <p><span className="font-bold">Trình độ:</span> {viewingAthlete.rating}</p>
              <p><span className="font-bold">Tài khoản:</span> {viewingAthlete.accountLinked ? `Đã liên kết ${viewingAthlete.accountLabel || ""}` : "Chưa liên kết"}</p>
            </div>
            {!viewingAthlete.accountLinked && (
              <div className="border-t border-border p-4">
                <Button className="w-full" onClick={() => { setLinkingAthlete(viewingAthlete); setViewingAthlete(null); }}>
                  Liên kết tài khoản
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <AccountLinkDialog
        open={Boolean(linkingAthlete)}
        title={`Liên kết cho ${linkingAthlete?.name || "VĐV"}`}
        role="player"
        onClose={() => setLinkingAthlete(null)}
        onSelect={async (account) => {
          if (!linkingAthlete) return;
          await linkPlayerAccount(linkingAthlete.id, account.id);
          setLinkingAthlete(null);
        }}
      />
    </div>
  );
};

export default OrgTeamMgmtPage;
