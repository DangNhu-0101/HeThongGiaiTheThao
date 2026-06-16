import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { ChartData } from "@/types/orgDashboard";
import { Card } from "@/components/ui/card";

export const RevenueChart = ({ data }: { data: ChartData[] }) => {
  return (
    <Card className="p-6 h-[350px] flex flex-col">
      <div className="flex justify-between items-start mb-6 border-l-4 border-primary pl-3">
        <div>
          <h3 className="font-bold uppercase text-foreground">Phân bổ Doanh thu</h3>
          <p className="text-xs text-muted-foreground">Theo giải đấu - Mùa giải 2026</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-foreground">1.84 Tỷ VNĐ</div>
          <div className="text-xs text-green-600 font-medium">+12% so với mùa trước</div>
        </div>
      </div>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}Tr`} />
            <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export const SportDistributionChart = ({ data }: { data: ChartData[] }) => {
  return (
    <Card className="p-6 h-[350px] flex flex-col">
      <div className="mb-6 border-l-4 border-accent pl-3">
        <h3 className="font-bold uppercase text-foreground">Phân bổ Thể thức</h3>
        <p className="text-xs text-muted-foreground">Tỉ lệ đội tham gia theo bộ môn</p>
      </div>
      <div className="flex-1 w-full flex items-center justify-center relative min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black">124</span>
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Đội thi</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></span>
            <span className="truncate text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};