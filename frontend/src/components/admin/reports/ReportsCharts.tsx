import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import type { TrendDataPoint, DistributionDataPoint } from "@/types/adminReports";
import { Card } from "@/components/ui/card";

interface Props { trendData: TrendDataPoint[]; distributionData: DistributionDataPoint[]; }

const ReportsCharts = ({ trendData, distributionData }: Props) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Biểu đồ xu hướng VĐV */}
      <Card className="lg:col-span-2 p-6 border-border shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-foreground text-base">Xu hướng đăng ký VĐV</h3>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase">Lượt đăng ký hàng tháng trên mọi môn thể thao</p>
          </div>
          <div className="flex bg-muted p-1 rounded-lg">
            <button className="px-3 py-1 bg-background shadow-sm rounded-md text-xs font-bold text-primary">Hàng tháng</button>
            <button className="px-3 py-1 text-xs font-bold text-muted-foreground hover:text-foreground">Hàng quý</button>
          </div>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs><linearGradient id="colorAthletes" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
              <Area type="monotone" dataKey="athletes" name="Vận động viên" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorAthletes)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Biểu đồ phân bổ môn thể thao */}
      <Card className="lg:col-span-1 p-6 border-border shadow-sm flex flex-col">
        <div className="mb-4">
           <h3 className="font-bold text-foreground text-base">Phân bổ Môn thi đấu</h3>
           <p className="text-[10px] text-muted-foreground mt-1 uppercase">Tỷ lệ VĐV theo từng môn</p>
        </div>
        <div className="flex-1 w-full flex items-center justify-center relative min-h-[220px]">
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie data={distributionData} innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                 {distributionData.map((e, i) => <Cell key={i} fill={e.color} />)}
               </Pie>
               <Tooltip />
             </PieChart>
           </ResponsiveContainer>
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black">4,821</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold">VĐV</span>
           </div>
        </div>
        <div className="mt-4 space-y-2">
           {distributionData.map((item, idx) => (
             <div key={idx} className="flex items-center justify-between text-xs">
               <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }}></span><span className="font-semibold">{item.name}</span></div>
               <span className="font-bold">{item.value.toLocaleString('vi-VN')}</span>
             </div>
           ))}
        </div>
      </Card>
    </div>
  );
};
export default ReportsCharts;