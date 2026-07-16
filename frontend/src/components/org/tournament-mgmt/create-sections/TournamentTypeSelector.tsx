import { Layers, Trophy } from "lucide-react";
import { cn } from "@/libs/utils";
import type { TournamentKind } from "@/types/orgTournamentMgmt";

interface Props {
  value: TournamentKind | null;
  onChange: (kind: TournamentKind) => void;
}

const options: Array<{ kind: TournamentKind; title: string; description: string; icon: typeof Trophy }> = [
  {
    kind: "multi",
    title: "Hội thao nhiều môn",
    description: "Tạo một sự kiện lớn gồm nhiều môn, mỗi môn có cấu hình luật riêng.",
    icon: Layers,
  },
  {
    kind: "single",
    title: "Giải đấu 1 môn",
    description: "Tạo nhanh một giải độc lập cho một môn thi đấu.",
    icon: Trophy,
  },
];

const TournamentTypeSelector = ({ value, onChange }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.kind;
        return (
          <button
            key={option.kind}
            type="button"
            onClick={() => onChange(option.kind)}
            className={cn(
              "text-left border rounded-xl p-5 bg-card hover:border-primary/50 transition-colors",
              active && "border-primary bg-primary/5 shadow-sm",
            )}
          >
            <div className="flex items-start gap-3">
              <span className={cn("h-10 w-10 rounded-lg border flex items-center justify-center", active ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground")}>
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black uppercase text-foreground">{option.title}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TournamentTypeSelector;

