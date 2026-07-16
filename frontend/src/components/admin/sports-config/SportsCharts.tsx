import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartData } from "@/types/adminSportsConfig";
import { Card } from "@/components/ui/card";

interface Props {
  usageData: ChartData[];
  formatData: ChartData[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#94a3b8"];

const SportsCharts = ({ usageData }: Props) => {
  return (
    <div className="mt-6 grid grid-cols-1 gap-6">
      <Card className="flex flex-col border-border p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase text-foreground">Số giải theo môn thi</h3>
            <p className="mt-0.5 text-[10px] uppercase text-muted-foreground">Đếm từ TournamentItem theo sportType</p>
          </div>
        </div>
        <div className="h-[280px] min-w-0 w-full">
          <ResponsiveContainer width="100%" height={280} minWidth={0}>
            <BarChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 36 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {usageData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default SportsCharts;
