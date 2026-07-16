import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DistributionDataPoint, TrendDataPoint } from "@/types/adminReports";
import { Card } from "@/components/ui/card";

interface Props {
  trendData: TrendDataPoint[];
  distributionData: DistributionDataPoint[];
}

const ReportsCharts = ({ trendData, distributionData }: Props) => {
  const totalMatches = distributionData.reduce((sum, item) => sum + Number(item.value || 0), 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="flex flex-col border-border p-6 shadow-sm lg:col-span-2">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Xu hướng đăng ký VĐV</h3>
            <p className="mt-1 text-[10px] uppercase text-muted-foreground">Số VĐV tạo mới theo tháng</p>
          </div>
          <div className="rounded-lg bg-muted p-1">
            <button className="rounded-md bg-background px-3 py-1 text-xs font-bold text-primary shadow-sm">Hàng tháng</button>
          </div>
        </div>
        <div className="h-[280px] min-w-0 w-full">
          <ResponsiveContainer width="100%" height={280} minWidth={0}>
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAthletes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)" }} />
              <Area type="monotone" dataKey="athletes" name="Vận động viên" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorAthletes)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="flex flex-col border-border p-6 shadow-sm lg:col-span-1">
        <div className="mb-4">
          <h3 className="text-base font-bold text-foreground">Phân bổ trạng thái trận đấu</h3>
          <p className="mt-1 text-[10px] uppercase text-muted-foreground">Theo collection matches</p>
        </div>
        <div className="relative flex min-h-[220px] min-w-0 w-full flex-1 items-center justify-center">
          <ResponsiveContainer width="100%" height={220} minWidth={0}>
            <PieChart>
              <Pie data={distributionData} innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                {distributionData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black">{totalMatches.toLocaleString("vi-VN")}</span>
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Trận</span>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {distributionData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }}></span>
                <span className="font-semibold">{item.name}</span>
              </div>
              <span className="font-bold">{item.value.toLocaleString("vi-VN")}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ReportsCharts;
