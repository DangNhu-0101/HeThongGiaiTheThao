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
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/ui/image-upload-field";
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
  const [editingAthlete, setEditingAthlete] = useState<OrgAthleteRecord | null>(null);
  const [linkingAthlete, setLinkingAthlete] = useState<OrgAthleteRecord | null>(null);
  const [exportingAccounts, setExportingAccounts] = useState(false);
  const [exportingList, setExportingList] = useState(false);
  const [importingTeams, setImportingTeams] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const selectedTournamentItemId = useOrgContextStore((state) => state.selectedTournamentItemId);

  const {
    stats: teamStats,
    records: teamRecords,
    loading: teamLoading,
    fetchData: fetchTeams,
    toggleFeeExempt,
    approveTeam,
    rejectTeam,
    unapproveTeam,
    deleteTeam,
    addTeamByOrganization,
    importTeamsFromFile,
  } = useOrgTeamMgmtStore();

  const {
    records: athleteRecords,
    loading: athleteLoading,
    fetchData: fetchAthletes,
    toggleStatus: toggleAthleteStatus,
    updateAthlete,
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
      downloadBlob(blob, "mau-nhap-doi-vdv.xlsx");
    } catch (error) {
      console.error(error);
      toast.error("Chưa thể tải mẫu Excel.");
    }
  };

  const exportDefaultAccounts = async () => {
    if (!selectedTournamentItemId) {
      toast.error("Vui lòng chọn giải trước khi xuất tài khoản.");
      return;
    }
    setExportingAccounts(true);
    try {
      const blob = await orgTeamMgmtService.exportDefaultAccounts(selectedTournamentItemId);
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `danh-sach-tai-khoan-van-dong-vien-${date}.xlsx`);
      toast.success("Đã xuất danh sách tài khoản vận động viên.");
    } catch (error) {
      console.error(error);
      toast.error("Không thể xuất danh sách tài khoản.");
    } finally {
      setExportingAccounts(false);
    }
  };

  const exportTeamAthleteList = async () => {
    if (!selectedTournamentItemId) {
      toast.error("Vui lòng chọn giải trước khi xuất danh sách.");
      return;
    }
    setExportingList(true);
    try {
      const blob = await orgTeamMgmtService.exportTeamAthleteList(selectedTournamentItemId);
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `danh-sach-doi-vdv-${date}.xlsx`);
      toast.success("Đã xuất danh sách đội và vận động viên.");
    } catch (error) {
      console.error(error);
      toast.error("Không thể xuất danh sách đội và vận động viên.");
    } finally {
      setExportingList(false);
    }
  };

  const handleImportFile = async (file?: File) => {
    if (!file) return;
    setImportingTeams(true);
    try {
      const result = await importTeamsFromFile(file);
      if (result.loginFile?.base64) {
        downloadBase64File(result.loginFile.base64, result.loginFile.mimeType, result.loginFile.fileName);
      }
      toast.success(result.message || "Đã nhập đội và VĐV từ file. File tài khoản đăng nhập đã được tải về.");
    } catch (error) {
      const responseData = (error as { response?: { data?: { message?: string; errors?: Array<{ row?: number; message: string }>; notes?: string[] } } })?.response?.data;
      const detail = responseData?.errors?.slice(0, 5).map((item) => `Dòng ${item.row || "?"}: ${item.message}`).join("\n");
      const notes = responseData?.notes?.join("\n");
      const message = [responseData?.message || (error instanceof Error ? error.message : "Không thể nhập file."), detail, notes].filter(Boolean).join("\n");
      toast.error(message);
    } finally {
      setImportingTeams(false);
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

  const reviewMemberFee = async (teamId: string, playerId: string, decision: "approve" | "reject") => {
    const reason = decision === "reject" ? window.prompt("Lý do từ chối bằng chứng lệ phí") || "" : "";
    try {
      await orgTeamMgmtService.reviewMemberFee(teamId, playerId, decision, reason);
      toast.success(decision === "approve" ? "Đã xác nhận lệ phí thành viên." : "Đã từ chối bằng chứng lệ phí.");
      if (selectedTournamentItemId) await fetchTeams(selectedTournamentItemId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể cập nhật lệ phí thành viên.";
      toast.error(message);
    }
  };

  const renderTeamSection = (title: string, icon: ReactNode, teams: typeof teamRecords) => {
    if (!teams.length) return null;
    return (
      <div className="border-t border-border/50 pt-8 first:border-t-0 first:pt-0">
        <div className="mb-4 flex items-center gap-3">
          {icon}
          <h2 className="text-xl font-black uppercase text-foreground">{title}</h2>
        </div>
        <div className={gridLayoutClass}>
          {teams.map((team) => (
            <TeamMgmtCard
              key={team.id}
              team={team}
              onViewPublic={(record) => navigate(`/teams/${encodeURIComponent(record.slug || record.id)}`)}
              onToggleFree={(id) => void toggleFeeExempt(id)}
              onReviewMemberFee={(teamId, playerId, decision) => void reviewMemberFee(teamId, playerId, decision)}
              onApprove={(id) => void approveTeam(id)}
              onReject={(id) => void rejectTeam(id)}
              onUnapprove={(id) => {
                if (window.confirm("Bỏ duyệt đội này? Thao tác có thể ảnh hưởng đến lịch thi đấu, bảng đấu hoặc tài chính nếu giải đã vận hành.")) {
                  void unapproveTeam(id);
                }
              }}
              onDelete={(id) => {
                if (window.confirm("Xóa đội này? Backend sẽ kiểm tra quyền và ràng buộc dữ liệu trước khi xóa.")) {
                  void deleteTeam(id);
                }
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  if (teamLoading || athleteLoading) {
    return <div className="flex h-full items-center justify-center font-medium text-muted-foreground animate-pulse">Đang tải dữ liệu...</div>;
  }

  if (!selectedTournamentItemId) {
    return <RequireTournamentSelection description="Hãy chọn giải ở sidebar để quản lý đội và VĐV của giải đó." />;
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl bg-header p-6 text-white shadow-lg md:flex-row md:items-end md:p-8">
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-white/70">
            <span>Cổng tổ chức</span>
            <span className="text-accent">&gt;</span>
            <span>Quản lý đội và VĐV</span>
          </div>
          <h1 className="mb-1 text-3xl font-black uppercase tracking-wider">
            Quản lý {activeTab === "teams" ? "đội thi" : "vận động viên"}
          </h1>
          <p className="text-sm text-white/75">
            Duyệt đăng ký, theo dõi lệ phí và quản lý danh sách tham gia theo giải đang chọn.
          </p>
        </div>

        <div className={`relative z-10 flex w-full gap-3 md:w-auto ${isMobile ? "flex-col" : "flex-row"}`}>
          <div className="flex w-full gap-3">
            <Button type="button" variant="outline" disabled={exportingList} onClick={exportTeamAthleteList} className="flex-1 border-white/20 bg-white text-foreground hover:bg-white/90 md:flex-none">
              <Download className="mr-2 hidden h-4 w-4 sm:inline" /> {exportingList ? "Đang xuất..." : "Xuất danh sách"}
            </Button>
            <Button type="button" variant="outline" disabled={exportingAccounts} onClick={exportDefaultAccounts} className="flex-1 border-white/20 bg-white text-foreground hover:bg-white/90 md:flex-none">
              <Download className="mr-2 hidden h-4 w-4 sm:inline" /> {exportingAccounts ? "Đang xuất..." : "Tải tài khoản"}
            </Button>
            <Button type="button" variant="outline" onClick={downloadImportTemplate} className="flex-1 border-white/20 bg-white text-foreground hover:bg-white/90 md:flex-none">
              <FileSpreadsheet className="mr-2 hidden h-4 w-4 sm:inline" /> Tải mẫu Excel
            </Button>
            <Button type="button" variant="outline" disabled={importingTeams} onClick={() => importInputRef.current?.click()} className="flex-1 border-white/20 bg-white text-foreground hover:bg-white/90 md:flex-none">
              <Upload className={`mr-2 hidden h-4 w-4 sm:inline ${importingTeams ? "animate-pulse" : ""}`} /> {importingTeams ? "Đang nhập..." : "Nhập file"}
            </Button>
          </div>
          <input ref={importInputRef} type="file" accept=".xlsx,.csv" className="hidden" disabled={importingTeams} onChange={(event) => void handleImportFile(event.target.files?.[0])} />
        </div>
      </div>

      {activeTab === "teams" && <TeamMgmtStats stats={teamStats} />}

      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm xl:flex-row xl:items-center">
        <div className="flex w-full rounded-lg bg-muted p-1 sm:w-auto">
          <button
            onClick={() => setActiveTab("teams")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-1.5 text-xs font-bold transition-all sm:flex-none ${activeTab === "teams" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Đội thi <span className={`${activeTab === "teams" ? "bg-primary/10" : "bg-black/5"} rounded-full px-1.5 py-0.5`}>{teamRecords.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("athletes")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-1.5 text-xs font-bold transition-all sm:flex-none ${activeTab === "athletes" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            VĐV <span className={`${activeTab === "athletes" ? "bg-primary/10" : "bg-black/5"} rounded-full px-1.5 py-0.5`}>{athleteRecords.length}</span>
          </button>
        </div>

        <div className={`flex w-full gap-3 xl:w-auto ${isMobile ? "flex-col" : "flex-row items-center"}`}>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Tìm kiếm ${activeTab === "teams" ? "đội" : "vận động viên"}...`}
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <select className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none sm:flex-none">
              <option>Giải đang chọn</option>
            </select>
          </div>
          <div className="ml-auto hidden shrink-0 rounded-lg bg-muted p-1 sm:flex xl:ml-0">
            <button className="rounded-md bg-background p-1.5 text-foreground shadow-sm" aria-label="Hiển thị dạng lưới">
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground" aria-label="Hiển thị dạng danh sách">
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {activeTab === "teams" ? (
        <div className="space-y-8">
          {renderTeamSection("Đang chờ duyệt", <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600"><Clock className="h-5 w-5" /></div>, pendingTeams)}
          {renderTeamSection("Đội chính thức", <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600"><CheckCircle2 className="h-5 w-5" /></div>, approvedTeams)}
          {renderTeamSection("Trạng thái khác", <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"><ShieldAlert className="h-5 w-5" /></div>, otherTeams)}
        </div>
      ) : (
        <div className="mt-6">
          <AthleteMgmtTable records={athleteRecords} isMobile={isMobile} onToggleStatus={toggleAthleteStatus} onView={setViewingAthlete} onEdit={setEditingAthlete} />
        </div>
      )}

      {viewingAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-muted/20 p-4">
              <h3 className="font-bold text-foreground">Thông tin vận động viên</h3>
              <button type="button" onClick={() => setViewingAthlete(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Đóng">
                ×
              </button>
            </div>
            <div className="space-y-3 p-4 text-sm text-foreground">
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

      {editingAthlete && (
        <AthleteEditDialog
          athlete={editingAthlete}
          onClose={() => setEditingAthlete(null)}
          onSave={async (payload) => {
            await updateAthlete(editingAthlete.id, payload);
            toast.success("Đã cập nhật vận động viên.");
            setEditingAthlete(null);
          }}
          onLinkAccount={() => {
            setLinkingAthlete(editingAthlete);
            setEditingAthlete(null);
          }}
        />
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

const AthleteEditDialog = ({
  athlete,
  onClose,
  onSave,
  onLinkAccount,
}: {
  athlete: OrgAthleteRecord;
  onClose: () => void;
  onSave: (payload: Partial<OrgAthleteRecord>) => Promise<void>;
  onLinkAccount: () => void;
}) => {
  const [form, setForm] = useState<Partial<OrgAthleteRecord>>({ ...athlete });
  const [saving, setSaving] = useState(false);
  const setField = <K extends keyof OrgAthleteRecord>(key: K, value: OrgAthleteRecord[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    if (!form.name?.trim()) {
      toast.error("Họ và tên là bắt buộc.");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Email không đúng định dạng.");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } catch (error) {
      console.error(error);
      toast.error("Không thể cập nhật vận động viên.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 p-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Sửa thông tin vận động viên</h3>
            <p className="text-xs text-muted-foreground">Không chỉnh sửa ID tài khoản, vai trò hoặc mật khẩu.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label="Đóng">×</button>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="md:col-span-2 rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm font-bold text-foreground">Tài khoản liên kết</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {athlete.accountLinked ? `Đang liên kết: ${athlete.accountLabel || "tài khoản người dùng"}` : "Chưa liên kết tài khoản thật."}
            </p>
            <Button type="button" variant="outline" className="mt-3" onClick={onLinkAccount}>
              {athlete.accountLinked ? "Đổi tài khoản liên kết" : "Liên kết tài khoản"}
            </Button>
          </div>
          <div className="md:col-span-2">
            <ImageUploadField label="Ảnh đại diện" value={form.avatarUrl || ""} onChange={(value) => setField("avatarUrl", value)} />
          </div>
          <Field label="Họ và tên"><Input value={form.name || ""} onChange={(event) => setField("name", event.target.value)} /></Field>
          <Field label="Ngày sinh"><Input type="date" value={form.birthDate || ""} onChange={(event) => setField("birthDate", event.target.value)} /></Field>
          <Field label="Giới tính">
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.genderCode || "male"} onChange={(event) => setField("genderCode", event.target.value as OrgAthleteRecord["genderCode"])}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </Field>
          <Field label="Trình độ"><Input type="number" min={1} max={5} value={form.skill || 1} onChange={(event) => setField("skill", Number(event.target.value))} /></Field>
          <Field label="Số áo"><Input value={form.jerseyNumber || ""} onChange={(event) => setField("jerseyNumber", event.target.value)} /></Field>
          <Field label="Trạng thái">
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status || "Active"} onChange={(event) => setField("status", event.target.value as OrgAthleteRecord["status"])}>
              <option value="Active">Đang hoạt động</option>
              <option value="Suspended">Đình chỉ</option>
            </select>
          </Field>
          <Field label="Số điện thoại"><Input value={form.phone || ""} onChange={(event) => setField("phone", event.target.value)} /></Field>
          <Field label="Email"><Input value={form.email || ""} onChange={(event) => setField("email", event.target.value)} /></Field>
          <Field label="Địa chỉ"><Input value={form.address || ""} onChange={(event) => setField("address", event.target.value)} /></Field>
          <Field label="Ghi chú"><Input value={form.note || ""} onChange={(event) => setField("note", event.target.value)} /></Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
          <Button type="button" disabled={saving} onClick={submit}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

export default OrgTeamMgmtPage;

