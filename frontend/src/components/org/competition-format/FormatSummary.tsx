import { GitBranch, Target, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { CompetitionStageConfig } from "@/types/competitionFormat";

const FormatSummary = ({ stages }: { stages: CompetitionStageConfig[] }) => {
  const stats = [
    { label: "Số chặng", value: stages.length, icon: Target, color: "text-primary bg-primary/10" },
    { label: "Đội đầu vào", value: stages[0]?.input.teams || 0, icon: Users, color: "text-blue-700 bg-blue-100" },
    { label: "Nhánh/bracket", value: stages.reduce((total, stage) => total + stage.brackets.length, 0), icon: GitBranch, color: "text-amber-700 bg-amber-100" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="flex items-center gap-3 border-border p-4 shadow-sm">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}><stat.icon className="h-5 w-5" /></div>
          <div><p className="text-xs font-bold uppercase text-muted-foreground">{stat.label}</p><p className="text-2xl font-black text-foreground">{stat.value}</p></div>
        </Card>
      ))}
    </div>
  );
};

export default FormatSummary;
