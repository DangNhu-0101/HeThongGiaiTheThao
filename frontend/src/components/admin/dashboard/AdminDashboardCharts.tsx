import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartData } from "@/types/adminDashboard";

interface Props {
  revenueData: ChartData[];
  pieData: { name: string; value: number; color: string }[];
}

const AdminDashboardCharts = ({ revenueData, pieData }: Props) => {
  const totalUsers = pieData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const totalTournaments = revenueData.reduce((sum, item) => sum + Number(item.revenue || 0), 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold uppercase text-title">Giải đấu theo tháng</h3>
            <p className="text-xs text-muted-foreground">Số giải đấu được tạo từ dữ liệu hệ thống</p>
          </div>
          <div className="text-right">
            <p className="font-highlight text-xl font-semibold text-title">{totalTournaments.toLocaleString("vi-VN")}</p>
            <p className="text-xs font-bold text-muted-foreground">6 tháng gần nhất</p>
          </div>
        </div>
        <div className="h-[250px] min-w-0 w-full">
          <ResponsiveContainer width="100%" height={250} minWidth={0}>
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTournamentTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorTournamentTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:col-span-1">
        <div>
          <h3 className="font-heading text-lg font-bold uppercase text-title">Phân bổ người dùng</h3>
          <p className="text-xs text-muted-foreground">Theo vai trò trên toàn hệ thống</p>
        </div>
        <div className="relative mt-4 flex min-h-[200px] min-w-0 w-full flex-1 items-center justify-center">
          <ResponsiveContainer width="100%" height={200} minWidth={0}>
            <PieChart>
              <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                {pieData.map((item, index) => <Cell key={`${item.name}-${index}`} fill={item.color || "var(--color-primary)"} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-highlight text-xl font-semibold">{totalUsers.toLocaleString("vi-VN")}</span>
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Người dùng</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
          {pieData.length ? pieData.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color || "var(--color-primary)" }} />
                <span className="font-bold text-title">{item.name}</span>
              </div>
              <span className="pl-4 text-muted-foreground">{item.value.toLocaleString("vi-VN")}</span>
            </div>
          )) : (
            <div className="col-span-2 rounded-lg border border-dashed border-border p-4 text-center font-bold text-muted-foreground">
              Chưa có dữ liệu vai trò.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardCharts;
