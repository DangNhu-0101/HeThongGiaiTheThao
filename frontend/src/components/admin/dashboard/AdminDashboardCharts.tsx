import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import  type { ChartData } from "@/types/adminDashboard";

interface Props {
  revenueData: ChartData[];
  pieData: { name: string; value: number; color: string }[];
}

const AdminDashboardCharts = ({ revenueData, pieData }: Props) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Doanh thu */}
      <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold uppercase text-foreground text-lg">Tổng Doanh Thu</h3>
            <p className="text-xs text-muted-foreground">Doanh thu đăng ký thuê bao nền tảng</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-foreground">$84.2k</p>
            <p className="text-xs text-green-500 font-bold">↑ +18.4% MoM</p>
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Phân bổ người dùng */}
      <div className="lg:col-span-1 bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
        <div>
           <h3 className="font-bold uppercase text-foreground text-lg">Phân bổ người dùng</h3>
           <p className="text-xs text-muted-foreground">Theo vai trò trên toàn hệ thống</p>
        </div>
        <div className="flex-1 w-full flex items-center justify-center relative mt-4">
           <ResponsiveContainer width="100%" height={200}>
             <PieChart><Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">{pieData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart>
           </ResponsiveContainer>
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black">14.2K</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Người dùng</span>
           </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
           {pieData.map((item, idx) => (
             <div key={idx}>
               <div className="flex items-center gap-1.5 mb-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span><span className="font-bold text-foreground">{item.name}</span></div>
               <span className="text-muted-foreground pl-4">{item.value.toLocaleString('vi-VN')}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
export default AdminDashboardCharts;