import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ClipboardList, Gift, Users, Edit, Trash2 } from "lucide-react";
import type { Tournament as BaseTournament } from "@/types/tournament";
import type { Sponsor } from "@/types/sponsor";
import type { Team } from "@/types/Team";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { financeService } from "@/services/financeService";
import { toast } from "sonner";

const money = (val: number) => val.toLocaleString("vi-VN");

interface Income {
  type?: string;
  name?: string;
  amount?: number | string;
}

interface Expense {
  amount?: number | string;
}

interface SponsorPackage {
  name?: string;
  benefitsText?: string;
  benefitsImage?: string;
}

interface Tournament extends BaseTournament {
  incomes?: Income[];
  expenses?: Expense[];
  sponsorPackages?: SponsorPackage[];
}

interface Props {
  tournament: Tournament;
  sponsors: Sponsor[];
  teams?: Team[];
  fetchData?: () => Promise<void>;
}

interface StatCardProps {
  title: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  colorClass: string;
}

const StatCard = ({ title, value, sub, icon: Icon, colorClass }: StatCardProps) => (
  <Card className="shadow-sm border-slate-200">
    <CardContent className="p-6 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
        <Icon className={`h-4 w-4 ${colorClass}`} /> {title}
      </div>
      <div className="text-3xl font-extrabold text-slate-800">{money(value)} ₫</div>
      <div className="text-xs text-slate-400 font-medium">{sub}</div>
    </CardContent>
  </Card>
);

export function FinanceOverview({ tournament, sponsors, teams = [], fetchData }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pkgName, setPkgName] = useState("");
  const [pkgBenefits, setPkgBenefits] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sponsorPackages = tournament?.sponsorPackages || [];
  const freeTeams = teams.filter(t => t.isFree === true);

  const totalSponsorAmount = sponsors.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  
  const expectedFeeRevenue = tournament?.sportsConfig?.reduce((sum, sport) => {
    const s = sport as typeof sport & { feeEntry?: number | string };
    return sum + (Number(s.feeEntry || s.feePerAthlete || 0) * Number(s.maxTeams || 0));
  }, 0) || 0;

  const handleOpenDialog = (index?: number) => {
    if (index !== undefined) {
      setEditingIndex(index);
      setPkgName(sponsorPackages[index].name || "");
      setPkgBenefits(sponsorPackages[index].benefitsText || "");
    } else {
      setEditingIndex(null);
      setPkgName("");
      setPkgBenefits("");
    }
    setIsDialogOpen(true);
  };

  const handleSavePackage = async () => {
    if (!pkgName.trim() || !tournament?._id) return;
    setIsLoading(true);
    try {
      const updatedPackages = [...sponsorPackages];
      if (editingIndex !== null) {
        updatedPackages[editingIndex] = { ...updatedPackages[editingIndex], name: pkgName, benefitsText: pkgBenefits };
      } else {
        updatedPackages.push({ name: pkgName, benefitsText: pkgBenefits, benefitsImage: "" });
      }

      await financeService.updateSponsorPackages(tournament._id, updatedPackages);
      toast.success("Đã cập nhật cấu hình ưu đãi!");
      setIsDialogOpen(false);
      if (fetchData) fetchData();
    } catch (err) {
      toast.error("Cập nhật thất bại.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePackage = async (index: number) => {
    if (!tournament?._id) return;
    if (!confirm("Bạn có chắc muốn xóa gói này?")) return;
    setIsLoading(true);
    try {
      const updatedPackages = sponsorPackages.filter((_, i) => i !== index);
      await financeService.updateSponsorPackages(tournament._id, updatedPackages);
      toast.success("Đã xóa gói ưu đãi!");
      if (fetchData) fetchData();
    } catch (err) {
      toast.error("Xóa thất bại.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Tổng tài trợ" value={totalSponsorAmount} sub={`${sponsors.length} nhà tài trợ`} icon={Building2} colorClass="text-amber-500" />
        <StatCard title="Lệ phí" value={expectedFeeRevenue} sub="Dựa trên số đội tối đa" icon={ClipboardList} colorClass="text-sky-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ưu đãi nhà tài trợ */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-rose-500" />
              <CardTitle className="text-lg font-bold text-slate-800">Cấu hình ưu đãi tài trợ</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleOpenDialog()} className="font-bold text-sky-600 border-sky-200 hover:bg-sky-50">Thêm gói</Button>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {sponsorPackages.length === 0 ? (
              <div className="text-center text-slate-500 py-6 text-sm">Chưa có cấu hình gói ưu đãi nào.</div>
            ) : (
              sponsorPackages.map((pkg, idx) => (
                <div key={idx} className="border border-slate-100 rounded-lg p-4 flex gap-4 bg-white items-start">
                   {pkg.benefitsImage && <img src={`http://localhost:5001/${pkg.benefitsImage}`} alt="Benefit" className="h-16 w-16 object-cover rounded" />}
                   <div className="flex-1">
                     <div className="font-bold text-slate-800">{pkg.name}</div>
                     <div className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{pkg.benefitsText}</div>
                   </div>
                   <div className="flex gap-2">
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-sky-600" onClick={() => handleOpenDialog(idx)}>
                       <Edit className="h-4 w-4" />
                     </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => handleDeletePackage(idx)}>
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Đội miễn phí */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-lg font-bold text-slate-800">Danh sách đội miễn phí</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
             {freeTeams.length === 0 ? (
                <div className="text-center text-slate-500 py-6 text-sm">Chưa có đội nào được miễn lệ phí.</div>
             ) : (
                freeTeams.map(team => (
                  <div key={team._id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-800">{team.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Bộ môn: {team.sportCategory || 'Không xác định'}</div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 shadow-none">Miễn phí</Badge>
                  </div>
                ))
             )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Sửa gói ưu đãi" : "Thêm gói ưu đãi"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pkg-name">Tên gói tài trợ <span className="text-red-500">*</span></Label>
              <Input
                id="pkg-name"
                value={pkgName}
                onChange={(e) => setPkgName(e.target.value)}
                placeholder="VD: Nhà tài trợ Kim Cương"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pkg-benefits">Quyền lợi</Label>
              <Textarea
                id="pkg-benefits"
                value={pkgBenefits}
                onChange={(e) => setPkgBenefits(e.target.value)}
                placeholder="Mô tả các quyền lợi của nhà tài trợ"
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSavePackage} disabled={isLoading || !pkgName.trim()}>
              {isLoading ? "Đang lưu..." : "Lưu gói ưu đãi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
