import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Organization {
  _id: string;
  name: string;
}

interface FormDataState {
  name: string;
  slogan: string;
  targetParticipants: string;
  location: string;
  description: string;
  prizes: string;
  organizer: string;
}

// Khai báo đúng chuẩn bạn yêu cầu
interface BasicInfoSectionProps {
  formData: FormDataState;
  handleTextChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => void;
  organizations: Organization[];
}

const BasicInfoSection = ({
  formData,
  handleTextChange,
  organizations
}: BasicInfoSectionProps) => {
  
  const handleSelectChange = (value: string) => {
    handleTextChange({ target: { name: 'organizer', value } });
  };

  return (
    <div className="border border-border/50 rounded-xl p-6 bg-card shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 mb-4">
        <span className="w-1.5 h-5 bg-primary rounded-full"></span>
        Thông tin định danh
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Tên giải đấu chính thức <span className="text-destructive">*</span></Label>
          <Input id="name" name="name" required value={formData.name} onChange={handleTextChange} placeholder="Nhập tên giải đấu..." />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="slogan">Slogan giải đấu</Label>
          <Input id="slogan" name="slogan" value={formData.slogan} onChange={handleTextChange} placeholder="Slogan..." />
        </div>

        <div className="space-y-2">
          <Label>Đơn vị tổ chức <span className="text-destructive">*</span></Label>
          <Select value={formData.organizer} onValueChange={handleSelectChange}>
            <SelectTrigger>
              <SelectValue placeholder="-- Chọn Đơn vị tổ chức --" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((o) => (
                <SelectItem key={o._id} value={o._id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetParticipants">Đối tượng tham gia</Label>
          <Input id="targetParticipants" name="targetParticipants" value={formData.targetParticipants} onChange={handleTextChange} placeholder="VD: Sinh viên, IT..." />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Địa điểm tổ chức</Label>
          <Input id="location" name="location" value={formData.location} onChange={handleTextChange} placeholder="Nhập địa điểm..." />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Mô tả giải đấu</Label>
          <Textarea id="description" name="description" value={formData.description} onChange={handleTextChange} placeholder="Mô tả ngắn gọn..." className="min-h-[100px]" />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection;