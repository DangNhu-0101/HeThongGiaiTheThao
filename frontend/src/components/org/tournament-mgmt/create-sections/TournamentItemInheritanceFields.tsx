import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { TournamentRuleRef } from "@/types/orgTournamentMgmt";

export interface TournamentInheritancePreview {
  location: string;
  prizes: string;
  registrationStart: string;
  registrationEnd: string;
  tournamentStart: string;
  tournamentEnd: string;
}

interface Props {
  rule: TournamentRuleRef;
  inherited: TournamentInheritancePreview;
  onChange: (patch: Partial<TournamentRuleRef>) => void;
}

const TournamentItemInheritanceFields = ({ rule, inherited, onChange }: Props) => (
  <div className="space-y-4 border-t border-border pt-5">
    <div>
      <h4 className="text-sm font-black uppercase text-foreground">Thông tin riêng của môn</h4>
      <p className="mt-1 text-xs text-muted-foreground">
        Các trường dưới đây thuộc TournamentItem, không lưu chung ở cấp hội thao.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-3 rounded-lg bg-muted/20 p-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Mở đăng ký *</Label>
        <Input
          required
          type="datetime-local"
          value={rule.registrationStart || ""}
          onChange={(event) => onChange({ registrationStart: event.target.value, inheritTimeline: false })}
        />
      </div>
      <div className="space-y-2">
        <Label>Đóng đăng ký *</Label>
        <Input
          required
          type="datetime-local"
          value={rule.registrationEnd || ""}
          onChange={(event) => onChange({ registrationEnd: event.target.value, inheritTimeline: false })}
        />
      </div>
      <div className="space-y-2">
        <Label>Bắt đầu thi đấu *</Label>
        <Input
          required
          type="datetime-local"
          value={rule.tournamentStart || inherited.tournamentStart || ""}
          onChange={(event) => onChange({ tournamentStart: event.target.value, inheritTimeline: false })}
        />
      </div>
      <div className="space-y-2">
        <Label>Kết thúc thi đấu *</Label>
        <Input
          required
          type="datetime-local"
          value={rule.tournamentEnd || inherited.tournamentEnd || ""}
          onChange={(event) => onChange({ tournamentEnd: event.target.value, inheritTimeline: false })}
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label>Địa điểm riêng của môn</Label>
      <Input
        value={rule.location || ""}
        onChange={(event) => onChange({ location: event.target.value, inheritLocation: false })}
        placeholder="Tên sân, địa chỉ chi tiết"
      />
    </div>
    <div className="space-y-2">
      <Label>Giải thưởng riêng</Label>
      <RichTextEditor
        minHeight={90}
        value={rule.prizes || ""}
        onChange={(value) => onChange({ prizes: value, inheritPrizes: false })}
        placeholder="Cơ cấu giải thưởng của riêng môn này..."
      />
    </div>
  </div>
);

export default TournamentItemInheritanceFields;
