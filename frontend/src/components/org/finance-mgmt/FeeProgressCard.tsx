import { TrendingUp, Wallet } from "lucide-react";
import type { FeeProgressData } from "@/types/orgFinanceMgmt";
import { Card } from "@/components/ui/card";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);

const rows = (data: FeeProgressData) => [
  ["Tổng vận động viên", data.totalPlayers ?? 0],
  ["VĐV thuộc đội đã duyệt", data.approvedPlayers ?? 0],
  ["VĐV miễn phí", data.approvedFreePlayers ?? data.freePlayers ?? 0],
  ["VĐV tính phí", data.approvedPaidPlayers ?? 0],
  ["Lệ phí mỗi người", formatCurrency(data.feePerPlayer ?? 0)],
  ["Dự kiến thu", formatCurrency(data.expectedAmount)],
  ["Đã thu thực tế", formatCurrency(data.collectedAmount)],
];

const FeeProgressCard = ({ data }: { data: FeeProgressData }) => {
  if (!data) return null;

  return (
    <Card className="relative overflow-hidden border-border bg-card p-6 shadow-sm">
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-500/5 blur-2xl" />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-black text-foreground">
            <Wallet className="h-5 w-5 text-primary" /> Tiến độ thu lệ phí
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">Tính theo vận động viên thuộc đội hợp lệ, đã duyệt và không miễn phí.</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
          <TrendingUp className="h-3 w-3" /> {data.progressPercentage}% hoàn thành
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Đã thu thực tế</p>
          <p className="text-3xl font-black text-primary">{formatCurrency(data.collectedAmount)}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Lệ phí dự kiến</p>
          <p className="text-3xl font-black text-foreground">{formatCurrency(data.expectedAmount)}</p>
        </div>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full border border-border/50 bg-muted">
        <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, data.progressPercentage)}%` }} />
      </div>

      <div className="mt-5 grid gap-2 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-2">
        {rows(data).map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-b-0 sm:last:border-b">
            <span className="text-muted-foreground">{label}</span>
            <strong className="text-right text-foreground">{value}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default FeeProgressCard;
