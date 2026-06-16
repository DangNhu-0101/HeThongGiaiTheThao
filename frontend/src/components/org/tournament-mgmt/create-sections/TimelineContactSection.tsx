import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface TimeLineState {
  registrationStart: string; registrationEnd: string; tournamentStart: string; tournamentEnd: string;
}

export interface Props {
  contactPerson: { name: string; phone: string; };
  handleContactChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  timeLine: TimeLineState;
  handleTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TimelineContactSection = ({ contactPerson, handleContactChange, timeLine, handleTimeChange }: Props) => {
  return (
    <div className="border border-border rounded-xl p-6 bg-card shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 mb-4">
        <span className="w-1.5 h-5 bg-primary rounded-full"></span> Lịch trình & Liên hệ
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label>Người phụ trách liên hệ</Label>
          <Input name="name" value={contactPerson.name} onChange={handleContactChange} placeholder="Nhập họ tên..." className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label>Hotline/Zalo liên hệ</Label>
          <Input name="phone" value={contactPerson.phone} onChange={handleContactChange} placeholder="Số điện thoại..." className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase">Mở đăng ký</Label>
          <Input type="datetime-local" name="registrationStart" required value={timeLine.registrationStart} onChange={handleTimeChange} className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase">Đóng đăng ký</Label>
          <Input type="datetime-local" name="registrationEnd" required value={timeLine.registrationEnd} onChange={handleTimeChange} className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase">Khai mạc</Label>
          <Input type="datetime-local" name="tournamentStart" required value={timeLine.tournamentStart} onChange={handleTimeChange} className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase">Bế mạc</Label>
          <Input type="datetime-local" name="tournamentEnd" required value={timeLine.tournamentEnd} onChange={handleTimeChange} className="bg-background" />
        </div>
      </div>
    </div>
  );
};
export default TimelineContactSection;