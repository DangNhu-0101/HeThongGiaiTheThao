import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { FormatConfigState } from "@/types/tournament";

interface Props {
  value: FormatConfigState;
  onChange: (value: FormatConfigState) => void;
}

const rankingOptions = [
  ["matchPoints", "Điểm trận"], ["scoreDifference", "Hiệu số"],
  ["headToHead", "Đối đầu"], ["drawingLots", "Bốc thăm"],
] as const;

const FormatConfigFields = ({ value, onChange }: Props) => {
  const set = <K extends keyof FormatConfigState>(key: K, next: FormatConfigState[K]) => onChange({ ...value, [key]: next });
  const number = (key: keyof FormatConfigState, raw: string) => set(key, Number(raw) as never);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2"><Label>Tên thể thức *</Label><Input required value={value.name} onChange={(e) => set("name", e.target.value)} placeholder="VD: 6 bảng - Serie A/B" /></div>
        <div className="space-y-2"><Label>Loại thể thức</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value.type} onChange={(e) => set("type", e.target.value as FormatConfigState["type"])}><option value="GROUP_STAGE">Vòng bảng</option><option value="KNOCKOUT">Loại trực tiếp</option><option value="HYBRID">Vòng bảng + loại trực tiếp</option></select></div>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Đội tối thiểu</Label><Input type="number" min={2} value={value.minTeams} onChange={(e) => number("minTeams", e.target.value)} /></div><div className="space-y-2"><Label>Đội tối đa</Label><Input type="number" min={2} value={value.maxTeams} onChange={(e) => number("maxTeams", e.target.value)} /></div></div>
        <div className="space-y-2 md:col-span-2"><Label>Mô tả vận hành</Label><RichTextEditor value={value.description} onChange={(next) => set("description", next)} placeholder="Mô tả cách chia bảng, phân nhánh và vào vòng trong..." /></div>
      </div>

      {value.type !== "KNOCKOUT" && <div className="rounded-xl border border-border p-4 space-y-4"><h4 className="font-bold text-primary">Vòng bảng</h4><div className="grid grid-cols-2 gap-3 md:grid-cols-4"><div><Label>Số bảng</Label><Input type="number" min={1} value={value.groupsCount} onChange={(e) => number("groupsCount", e.target.value)} /></div><div><Label>Đội / bảng</Label><Input type="number" min={2} value={value.teamsPerGroup} onChange={(e) => number("teamsPerGroup", e.target.value)} /></div><div><Label>Số lượt vòng tròn</Label><Input type="number" min={1} value={value.roundRobinLegs} onChange={(e) => number("roundRobinLegs", e.target.value)} /></div><div><Label>Suất chính / bảng</Label><Input type="number" min={0} value={value.qualifiersPerGroup} onChange={(e) => number("qualifiersPerGroup", e.target.value)} /></div></div><div className="grid grid-cols-3 gap-3"><div><Label>Điểm thắng</Label><Input type="number" value={value.winPoints} onChange={(e) => number("winPoints", e.target.value)} /></div><div><Label>Điểm hòa</Label><Input type="number" value={value.drawPoints} onChange={(e) => number("drawPoints", e.target.value)} /></div><div><Label>Điểm thua</Label><Input type="number" value={value.lossPoints} onChange={(e) => number("lossPoints", e.target.value)} /></div></div></div>}

      <div className="rounded-xl border border-border p-4 space-y-4"><h4 className="font-bold text-primary">Xếp hạng và vé vớt</h4><div className="flex flex-wrap gap-3">{rankingOptions.map(([id, label]) => <label key={id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.rankingCriteria.includes(id)} onChange={(e) => set("rankingCriteria", e.target.checked ? [...value.rankingCriteria, id] : value.rankingCriteria.filter((item) => item !== id))} />{label}</label>)}</div><div className="grid grid-cols-2 gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.hasWildcards} onChange={(e) => set("hasWildcards", e.target.checked)} />Có vé vớt / lucky loser</label><div><Label>Số vé vớt</Label><Input type="number" min={0} disabled={!value.hasWildcards} value={value.wildcardCount} onChange={(e) => number("wildcardCount", e.target.value)} /></div></div><div><Label>Quy tắc phân nhánh (Serie A/B hoặc nhánh khác)</Label><Textarea value={value.branchRules} onChange={(e) => set("branchRules", e.target.value)} placeholder="VD: Nhất/Nhì vào Serie A; Ba/Tư vào Serie B..." /></div></div>

      <div className="rounded-xl border border-border p-4 space-y-4"><h4 className="font-bold text-primary">Điểm số theo vòng</h4><div className="grid grid-cols-2 gap-3 md:grid-cols-4"><div><Label>Chạm điểm vòng đầu</Label><Input type="number" value={value.groupTargetScore} onChange={(e) => number("groupTargetScore", e.target.value)} /></div><div><Label>Đổi sân tại</Label><Input type="number" value={value.groupChangeSideAt} onChange={(e) => number("groupChangeSideAt", e.target.value)} /></div><div><Label>Chạm điểm bán kết/CK</Label><Input type="number" value={value.finalTargetScore} onChange={(e) => number("finalTargetScore", e.target.value)} /></div><div><Label>Đổi sân tại</Label><Input type="number" value={value.finalChangeSideAt} onChange={(e) => number("finalChangeSideAt", e.target.value)} /></div></div></div>

      <div className="rounded-xl border border-border p-4 space-y-4"><h4 className="font-bold text-primary">Luật trận và trọng tài</h4><div className="grid grid-cols-1 gap-3 md:grid-cols-3"><div><Label>Trễ tối đa (phút)</Label><Input type="number" value={value.maxWaitMinutes} onChange={(e) => number("maxWaitMinutes", e.target.value)} /></div><div><Label>Timeout / đội</Label><Input type="number" value={value.timeoutCount} onChange={(e) => number("timeoutCount", e.target.value)} /></div><div><Label>Thời lượng timeout (giây)</Label><Input type="number" value={value.timeoutSeconds} onChange={(e) => number("timeoutSeconds", e.target.value)} /></div></div><Textarea value={value.refereeRules} onChange={(e) => set("refereeRules", e.target.value)} placeholder="Quy định trọng tài, khiếu nại, fair-play..." /><Input value={value.uniformRules} onChange={(e) => set("uniformRules", e.target.value)} placeholder="Quy định trang phục" /><div><Label>Điều lệ tùy chỉnh</Label><RichTextEditor value={value.customRules} onChange={(next) => set("customRules", next)} placeholder="Nhập mọi quy định riêng chưa có trường cấu trúc..." /></div></div>
    </div>
  );
};

export default FormatConfigFields;
