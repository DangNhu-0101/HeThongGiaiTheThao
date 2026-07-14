import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  name: string;
  sportType: string;
  description: string;
  stageCount: number;
  configured: boolean;
  sports: string[];
  onNameChange: (value: string) => void;
  onSportTypeChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onStageCountChange: (value: number) => void;
  onConfirmStages: () => void;
}

const RoundCountStep = ({
  name,
  sportType,
  description,
  stageCount,
  configured,
  sports,
  onNameChange,
  onSportTypeChange,
  onDescriptionChange,
  onStageCountChange,
  onConfirmStages,
}: Props) => (
  <Card className="border-border p-5 shadow-sm">
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-black text-primary-foreground">1</div>
      <div>
        <h2 className="text-sm font-black uppercase text-primary">Khai báo cấu trúc</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Mỗi chặng là một bước nhận đội, tổ chức thi đấu và chuyển đội sang một hoặc nhìều nhánh tiếp theo.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr_180px_auto]">
      <div className="space-y-2">
        <Label>Tên thể thức</Label>
        <Input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="VD: Pickleball 24 cặp - Serie A/B" />
      </div>
      <div className="space-y-2">
        <Label>Môn thi đấu</Label>
        <select
          value={sportType}
          onChange={(event) => onSportTypeChange(event.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {sports.map((sport) => (
            <option key={sport} value={sport}>{sport}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Số chặng thi đấu</Label>
        <Input type="number" min={1} max={20} value={stageCount} onChange={(event) => onStageCountChange(Number(event.target.value))} />
      </div>
      <Button type="button" className="self-end" onClick={onConfirmStages}>
        {configured ? <RotateCcw className="mr-2 h-4 w-4" /> : <ArrowRight className="mr-2 h-4 w-4" />}
        {configured ? "Cập nhật chặng" : "Tiếp tục"}
      </Button>
    </div>

    <div className="mt-4 space-y-2">
      <Label>Mô tả vận hành</Label>
      <textarea
        className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        placeholder="Mô tả luồng thi đấu, cách phân nhánh và điều kiện xếp hạng."
      />
    </div>
  </Card>
);

export default RoundCountStep;
