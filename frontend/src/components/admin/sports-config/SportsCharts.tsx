import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import type { ChartData } from "@/types/adminSportsConfig";
import { Card } from "@/components/ui/card";

interface Props { usageData: ChartData[]; formatData: ChartData[]; }

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#94a3b8'];

const SportsCharts = ({ usageData, formatData }: Props) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      
      {/* Bar Chart */}
      <Card className="p-6 border-border shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-black text-sm uppercase text-foreground">Phân bổ sử dụng môn thi</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Số lượng giải đấu theo từng môn trên toàn nền tảng</p>
          </div>
          <button className="text-xs font-bold text-primary hover:underline">Xem chi tiết</button>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {usageData.map((_, index)=> <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Pie Chart */}
      <Card className="p-6 border-border shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-black text-sm uppercase text-foreground">Mức độ phổ biến thể thức</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Các mẫu thể thức được tổ chức chuộng dùng nhất</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6 relative min-h-[250px]">
           <div className="w-[200px] h-[200px] relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={formatData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                   {formatData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black">202</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Giải đấu</span>
             </div>
           </div>
           
           <div className="flex flex-col gap-3 text-xs w-full sm:w-auto">
             {formatData.map((item, idx) => (
               <div key={idx} className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                 <span className="font-semibold text-foreground flex-1">{item.name}</span>
               </div>
             ))}
           </div>
        </div>
      </Card>

    </div>
  );
};
export default SportsCharts;