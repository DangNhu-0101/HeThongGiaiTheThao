import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Edit, Trash2, Gift, WalletCards } from "lucide-react";
import { resourceService, type ApiTeam } from "@/services/resourceService";

const statusLabel: Record<string, string> = {
  pending: "Chờ duyệt",
  validated: "Đã xác thực",
  confirmed: "Đã xác nhận",
  playing: "Đang thi đấu",
  eliminated: "Đã loại",
  champion: "Vô địch",
  Active: "Đang hoạt động",
};

const getSportLabel = (team: ApiTeam) => team.sportCategory || team.sportType || "Chưa cấu hình";
const isTeamApproved = (team: ApiTeam) => Boolean(team.isConfirm);

export function TeamList() {
  const { id } = useParams<{ id: string }>();
  const isSystemWide = !id;
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [editingTeam, setEditingTeam] = useState<ApiTeam | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", tournamentId: id || "", sportCategory: "", status: "pending" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingTeamId, setUpdatingTeamId] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    try {
      setTeams(await resourceService.getTeams(id));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTeams();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTeams]);

  const openCreate = () => {
    setEditingTeam(null);
    setForm({ name: "", tournamentId: id || "", sportCategory: "", status: "pending" });
    setIsDialogOpen(true);
  };

  const openEdit = (team: ApiTeam) => {
    setEditingTeam(team);
    setForm({
      name: team.name || "",
      tournamentId: typeof team.tournamentId === "string" ? team.tournamentId : team.tournamentId?._id || id || "",
      sportCategory: getSportLabel(team) === "Chưa cấu hình" ? "" : getSportLabel(team),
      status: team.status || "pending",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên đội.");
      return;
    }
    if (!form.tournamentId.trim()) {
      toast.error("Vui lòng nhập tournamentId cho đội.");
      return;
    }
    if (!form.sportCategory.trim()) {
      toast.error("Vui lòng nhập môn thi đấu.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        tournamentId: form.tournamentId.trim(),
        sportCategory: form.sportCategory.trim(),
        status: form.status,
      };
      if (editingTeam) {
        await resourceService.updateTeam(editingTeam._id, payload);
      } else {
        await resourceService.createTeam(payload);
      }
      toast.success(editingTeam ? "Đã cập nhật đội." : "Đã thêm đội.");
      setEditingTeam(null);
      setIsDialogOpen(false);
      await loadTeams();
    } catch {
      toast.error(editingTeam ? "Không thể cập nhật đội." : "Không thể thêm đội.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (team: ApiTeam) => {
    if (!window.confirm(`Xóa đội "${team.name}"?`)) return;
    try {
      await resourceService.deleteTeam(team._id);
      toast.success("Đã xóa đội.");
      await loadTeams();
    } catch {
      toast.error("Không thể xóa đội.");
    }
  };

  const handleApprovalToggle = async (team: ApiTeam, mode: "free" | "paid") => {
    const isTurningOff = (mode === "free" && team.isFree) || (mode === "paid" && team.isPaid);
    setUpdatingTeamId(team._id);
    try {
      await resourceService.updateTeam(
        team._id,
        isTurningOff
          ? { isFree: false, isPaid: false, isConfirm: false, status: "pending" }
          : { isFree: mode === "free", isPaid: mode === "paid", isConfirm: true, status: "confirmed" },
      );
      toast.success(isTurningOff ? "Đã chuyển đội về chờ duyệt." : "Đã duyệt đội.");
      await loadTeams();
    } catch {
      toast.error("Không thể cập nhật trạng thái duyệt đội.");
    } finally {
      setUpdatingTeamId(null);
    }
  };

  const pendingTeams = teams.filter((team) => !isTeamApproved(team));
  const approvedTeams = teams.filter(isTeamApproved);

  const renderApprovalButtons = (team: ApiTeam) => {
    const isUpdating = updatingTeamId === team._id;
    return (
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          size="sm"
          variant={team.isFree ? "default" : "outline"}
          className={team.isFree ? "gap-2 bg-emerald-600 hover:bg-emerald-700" : "gap-2"}
          disabled={isUpdating || Boolean(team.isPaid)}
          onClick={() => handleApprovalToggle(team, "free")}
        >
          <Gift className="h-4 w-4" />
          Miễn phí
        </Button>
        <Button
          size="sm"
          variant={team.isPaid ? "default" : "outline"}
          className={team.isPaid ? "gap-2 bg-sky-600 hover:bg-sky-700" : "gap-2"}
          disabled={isUpdating || Boolean(team.isFree)}
          onClick={() => handleApprovalToggle(team, "paid")}
        >
          <WalletCards className="h-4 w-4" />
          Đã đóng phí
        </Button>
      </div>
    );
  };

  const renderTeamRows = (list: ApiTeam[], emptyText: string) => {
    if (isLoading) {
      return <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">Đang tải đội thi đấu...</TableCell></TableRow>;
    }
    if (!list.length) {
      return <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">{emptyText}</TableCell></TableRow>;
    }
    return list.map((team) => (
      <TableRow key={team._id} className="hover:bg-slate-50">
        <TableCell className="font-bold text-slate-800 whitespace-nowrap">{team.name}</TableCell>
        <TableCell className="text-slate-600 whitespace-nowrap">{getSportLabel(team)}</TableCell>
        <TableCell className="text-slate-600 whitespace-nowrap font-medium text-center sm:text-left">{team.memberCount ?? team.members?.length ?? 0}</TableCell>
        <TableCell>
          <Badge variant={isTeamApproved(team) ? "default" : "secondary"} className="whitespace-nowrap shadow-none font-bold">
            {isTeamApproved(team) ? "Đã duyệt" : statusLabel[team.status || ""] || "Chờ duyệt"}
          </Badge>
        </TableCell>
        <TableCell>{renderApprovalButtons(team)}</TableCell>
        <TableCell className="text-right whitespace-nowrap">
          <Button variant="ghost" size="icon" className="hover:bg-slate-200" onClick={() => openEdit(team)}><Edit className="h-4 w-4 text-slate-500" /></Button>
          <Button variant="ghost" size="icon" className="hover:bg-rose-100" onClick={() => handleDelete(team)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
        </TableCell>
      </TableRow>
    ));
  };

  const renderTeamTable = (list: ApiTeam[], emptyText: string) => (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-slate-600 whitespace-nowrap">Tên đội</TableHead>
              <TableHead className="font-bold text-slate-600 whitespace-nowrap">Môn thi đấu</TableHead>
              <TableHead className="font-bold text-slate-600 whitespace-nowrap">Thành viên</TableHead>
              <TableHead className="font-bold text-slate-600 whitespace-nowrap">Trạng thái</TableHead>
              <TableHead className="font-bold text-slate-600 whitespace-nowrap text-right">Duyệt phí</TableHead>
              <TableHead className="font-bold text-slate-600 whitespace-nowrap text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderTeamRows(list, emptyText)}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-sky-600" />
            Danh sách đội thi đấu
          </h1>
          <p className="text-sm text-slate-500 mt-1">Chờ duyệt: {pendingTeams.length} • Đã duyệt: {approvedTeams.length}</p>
        </div>
        <Button className="gap-2 shadow-sm font-bold bg-sky-600 hover:bg-sky-700" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Thêm đội mới
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Đội chờ duyệt</h2>
        {renderTeamTable(pendingTeams, "Không có đội nào đang chờ duyệt.")}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Đội đã duyệt</h2>
        {renderTeamTable(approvedTeams, "Chưa có đội nào được duyệt.")}
      </section>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingTeam(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingTeam ? "Sửa đội thi đấu" : "Thêm đội thi đấu"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1"><Label>Tên đội</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div className="space-y-1"><Label>Tournament ID</Label><Input value={form.tournamentId} disabled={!isSystemWide} onChange={(event) => setForm({ ...form, tournamentId: event.target.value })} /></div>
            <div className="space-y-1"><Label>Môn thi đấu</Label><Input value={form.sportCategory} onChange={(event) => setForm({ ...form, sportCategory: event.target.value })} /></div>
            <div className="space-y-1">
              <Label>Trạng thái</Label>
              <select className="h-9 w-full rounded-md border px-3 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="pending">Chờ duyệt</option>
                <option value="validated">Đã xác thực</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="playing">Đang thi đấu</option>
                <option value="eliminated">Đã loại</option>
                <option value="champion">Vô địch</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Đang lưu..." : "Lưu"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
