import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ContactPerson {
  name: string;
  phone: string;
}

interface TimeLineState {
  registrationStart: string;
  registrationEnd: string;
  tournamentStart: string;
  tournamentEnd: string;
}

interface TimelineContactSectionProps {
  contactPerson: ContactPerson;
  handleContactChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  timeLine: TimeLineState;
  handleTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TimelineContactSection = ({
  contactPerson,
  handleContactChange,
  timeLine,
  handleTimeChange
}: TimelineContactSectionProps) => {
  return (
    <div className="border border-border/50 rounded-xl p-6 bg-card shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 mb-4">
        <span className="w-1.5 h-5 bg-primary rounded-full"></span>
        Lịch trình & Liên hệ
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label>Người phụ trách liên hệ</Label>
          <Input name="name" value={contactPerson.name} onChange={handleContactChange} placeholder="Nhập họ tên..." />
        </div>
        <div className="space-y-2">
          <Label>Hotline/Zalo liên hệ</Label>
          <Input name="phone" value={contactPerson.phone} onChange={handleContactChange} placeholder="Số điện thoại..." />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase">Mở đăng ký</Label>
          <Input type="datetime-local" name="registrationStart" required value={timeLine.registrationStart} onChange={handleTimeChange} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase">Đóng đăng ký</Label>
          <Input type="datetime-local" name="registrationEnd" required value={timeLine.registrationEnd} onChange={handleTimeChange} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase">Khai mạc</Label>
          <Input type="datetime-local" name="tournamentStart" required value={timeLine.tournamentStart} onChange={handleTimeChange} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase">Bế mạc</Label>
          <Input type="datetime-local" name="tournamentEnd" required value={timeLine.tournamentEnd} onChange={handleTimeChange} />
        </div>
      </div>
    </div>
  );
};

export default TimelineContactSection;