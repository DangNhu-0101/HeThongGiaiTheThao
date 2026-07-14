import { Wallet, TrendingUp } from "lucide-react";
import type { FeeProgressData } from "@/types/orgFinanceMgmt";
import { Card } from "@/components/ui/card";

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const FeeProgressCard = ({ data }: { data: FeeProgressData }) => {
  if (!data) return null;

  return (
    <Card className="p-6 border-border shadow-sm bg-card relative overflow-hidden">
      <div className="absolute right-0 top-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-black text-lg text-foreground flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" /> Tiến độ Thu Lệ phí</h3>
          <p className="text-xs text-muted-foreground mt-1">Dự kiến thu từ đăng ký giải đấu & hội viên</p>
        </div>
        <div className="bg-green-100 text-green-700 font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> {data.progressPercentage}% Hoàn thành
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-muted/30 border border-border p-4 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Đã thu thực tế</p>
          <p className="text-3xl font-black text-primary">{formatCurrency(data.collectedAmount)}</p>
        </div>
        <div className="bg-muted/30 border border-border p-4 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Lệ phí Dự kiến</p>
          <p className="text-3xl font-black text-foreground">{formatCurrency(data.expectedAmount)}</p>
        </div>
      </div>

      <div className="w-full bg-muted rounded-full h-3 overflow-hidden border border-border/50">
        <div 
          className="bg-primary h-full transition-all duration-1000 ease-out" 
          style={{ width: `${data.progressPercentage}%` }}
        ></div>
      </div>
    </Card>
  );
};
export default FeeProgressCard;