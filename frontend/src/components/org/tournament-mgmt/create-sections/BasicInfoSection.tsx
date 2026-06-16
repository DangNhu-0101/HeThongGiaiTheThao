import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface BasicInfoState {
  name: string; slogan: string; targetParticipants: string; location: string; description: string; prizes: string; organizer: string;
}

interface Props {
  formData: BasicInfoState;
  handleTextChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => void;
  organizerName?: string;
}

export const BasicInfoSection = ({ formData, handleTextChange, organizerName }: Props) => {
  return (
    <div className="border border-border rounded-xl p-6 bg-card shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 mb-4">
        <span className="w-1.5 h-5 bg-primary rounded-full"></span> Thông tin định danh
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Tên giải đấu chính thức <span className="text-red-500">*</span></Label>
          <Input id="name" name="name" required value={formData.name} onChange={handleTextChange} placeholder="Nhập tên giải đấu..." className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slogan">Slogan giải đấu</Label>
          <Input id="slogan" name="slogan" value={formData.slogan} onChange={handleTextChange} placeholder="Slogan..." className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label>Đơn vị tổ chức <span className="text-red-500">*</span></Label>
          <Input value={organizerName} disabled className="bg-muted font-medium text-muted-foreground" />
          <input type="hidden" name="organizer" value={formData.organizer} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetParticipants">Đối tượng tham gia</Label>
          <Input id="targetParticipants" name="targetParticipants" value={formData.targetParticipants} onChange={handleTextChange} placeholder="VD: Sinh viên, Doanh nghiệp..." className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Địa điểm tổ chức</Label>
          <Input id="location" name="location" value={formData.location} onChange={handleTextChange} placeholder="Nhập địa điểm..." className="bg-background" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Mô tả giải đấu</Label>
          <Textarea id="description" name="description" value={formData.description} onChange={handleTextChange} placeholder="Mô tả ngắn gọn..." className="min-h-[100px] bg-background" />
        </div>
      </div>
    </div>
  );
};
export default BasicInfoSection;