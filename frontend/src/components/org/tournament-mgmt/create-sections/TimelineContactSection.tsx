import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface TimeLineState {
  registrationStart: string;
  registrationEnd: string;
  tournamentStart: string;
  tournamentEnd: string;
}

export interface Props {
  commonOnly?: boolean;
  contactPerson: { name: string; phone: string };
  handleContactChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  timeLine: TimeLineState;
  handleTimeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TimelineContactSection = ({
  commonOnly = false,
  timeLine,
  handleTimeChange,
}: Props) => (
  <div className="space-y-4">
    <div>
      <h3 className="font-bold text-foreground">{commonOnly ? "Thời gian chung" : "Lịch trình"}</h3>
      {commonOnly && (
        <p className="mt-1 text-xs text-muted-foreground">
          Hội thao chỉ dùng ngày bắt đầu và kết thúc chung; lịch đăng ký nằm trong từng môn.
        </p>
      )}
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {!commonOnly && (
        <>
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Mở đăng ký</Label>
            <Input
              type="datetime-local"
              name="registrationStart"
              required
              value={timeLine.registrationStart}
              onChange={handleTimeChange}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Đóng đăng ký</Label>
            <Input
              type="datetime-local"
              name="registrationEnd"
              required
              value={timeLine.registrationEnd}
              onChange={handleTimeChange}
            />
          </div>
        </>
      )}
      <div className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">
          {commonOnly ? "Bắt đầu hội thao" : "Khai mạc"}
        </Label>
        <Input
          type="datetime-local"
          name="tournamentStart"
          required
          value={timeLine.tournamentStart}
          onChange={handleTimeChange}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">
          {commonOnly ? "Kết thúc hội thao" : "Bế mạc"}
        </Label>
        <Input
          type="datetime-local"
          name="tournamentEnd"
          required
          value={timeLine.tournamentEnd}
          onChange={handleTimeChange}
        />
      </div>
    </div>
  </div>
);

export default TimelineContactSection;
