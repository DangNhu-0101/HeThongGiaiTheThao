import { Card, CardContent } from "@/components/ui/card";
import { Building2, ClipboardList, CheckCircle2, TrendingDown } from "lucide-react";
import type { Tournament, Sponsor } from "../index";

const money = (val: number) => val.toLocaleString("vi-VN");

interface Props {
  tournament: Tournament;
  sponsors: Sponsor[];
}

export function FinanceOverview({ tournament, sponsors }: Props) {
  const incomes = tournament?.incomes || [];
  const expenses = tournament?.expenses || [];

  const totalSponsorAmount = sponsors.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  
  const expectedFeeRevenue = tournament?.sportsConfig?.reduce((sum, sport) => {
    return sum + (Number(sport.feeEntry || sport.feePerAthlete || 0) * Number(sport.maxTeams || 0));
  }, 0) || 0;

  const collectedFeeRevenue = incomes
    .filter((i) => i.type === "fee" || i.name?.toLowerCase().includes("lệ phí"))
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const otherIncome = incomes
    .filter((i) => i.type !== "fee" && !i.name?.toLowerCase().includes("lệ phí"))
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalIncome = totalSponsorAmount + collectedFeeRevenue + otherIncome;
  const balance = totalIncome - totalExpense;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StatCard = ({ title, value, sub, icon: Icon, colorClass }: any) => (
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Tổng tài trợ" value={totalSponsorAmount} sub={`${sponsors.length} nhà tài trợ`} icon={Building2} colorClass="text-amber-500" />
        <StatCard title="Lệ phí dự kiến" value={expectedFeeRevenue} sub="Dựa trên số đội tối đa" icon={ClipboardList} colorClass="text-sky-500" />
        <StatCard title="Lệ phí đã thu" value={collectedFeeRevenue} sub="Từ các đội đã đăng ký" icon={CheckCircle2} colorClass="text-emerald-500" />
        <StatCard title="Tổng chi" value={totalExpense} sub="Đã chi tiêu" icon={TrendingDown} colorClass="text-rose-500" />
      </div>

      <Card className="bg-gradient-to-br from-sky-800 to-sky-600 border-none shadow-md">
        <CardContent className="p-10 text-center text-white flex flex-col items-center justify-center gap-2">
          <p className="uppercase tracking-widest text-sky-200 font-bold text-sm">Số dư hiện tại</p>
          <h2 className="text-5xl font-black drop-shadow-sm">{money(balance)} ₫</h2>
        </CardContent>
      </Card>
    </div>
  );
}
