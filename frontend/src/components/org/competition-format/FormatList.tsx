import { Layers3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CompetitionFormatRecord } from "@/types/competitionFormat";

interface Props {
  formats: CompetitionFormatRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

const FormatList = ({ formats, selectedId, onSelect, onCreate }: Props) => (
  <Card className="border-border p-4 shadow-sm">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div><h2 className="text-sm font-black uppercase text-foreground">Mẫu thể thức</h2><p className="mt-1 text-xs text-muted-foreground">Cấu trúc luồng thi đấu có thể tái sử dụng.</p></div>
      <Button type="button" size="sm" onClick={onCreate}><Plus className="mr-1 h-4 w-4" /> Tạo</Button>
    </div>
    <div className="space-y-2">
      {formats.map((format) => {
        const active = format.id === selectedId;
        return (
          <button key={format.id} type="button" onClick={() => onSelect(format.id)} className={`w-full rounded-lg border p-3 text-left transition-colors ${active ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted"}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-md ${active ? "bg-primary text-white" : "bg-secondary text-secondary-foreground"}`}><Layers3 className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-foreground">{format.name}</p><p className="mt-1 text-xs text-muted-foreground">{format.sportType} · {format.stageCount} chặng</p></div>
            </div>
          </button>
        );
      })}
    </div>
  </Card>
);

export default FormatList;
