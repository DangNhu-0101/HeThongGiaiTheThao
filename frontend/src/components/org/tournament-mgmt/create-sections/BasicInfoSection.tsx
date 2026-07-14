import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { TournamentKind } from "@/types/orgTournamentMgmt";

export interface BasicInfoState {
  name: string;
  slogan: string;
  purpose: string;
  targetParticipants: string;
  location: string;
  description: string;
  prizes: string;
  organizer: string;
}

interface Props {
  kind: TournamentKind;
  formData: BasicInfoState;
  handleTextChange: (
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | { target: { name: string; value: string } }
  ) => void;
  organizerName?: string;
}

const BasicInfoSection = ({
  kind,
  formData,
  handleTextChange,
  organizerName,
}: Props) => (
  <section className="space-y-4">
    <div>
      <h3 className="font-bold text-foreground">
        {kind === "multi" ? "Thông tin chung của hội thao" : "Thông tin giải đấu"}
      </h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {kind === "multi"
          ? "Chỉ nhóm này được dùng chung. Luật, đăng ký, lệ phí, giải thưởng và vận hành được cấu hình riêng trong từng môn."
          : "Nhập thông tin nhận diện cơ bản của giải đấu một môn."}
      </p>
    </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="name">{kind === "multi" ? "Tên hội thao" : "Tên giải đấu"} *</Label>
        <Input id="name" name="name" required value={formData.name} onChange={handleTextChange} placeholder="Hội thao thể thao 2026" />
      </div>
      <div className="space-y-2">
        <Label>Đơn vị tổ chức</Label>
        <Input value={organizerName || formData.organizer} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Địa điểm chung</Label>
        <Input id="location" name="location" value={formData.location} onChange={handleTextChange} placeholder="Thành phố, quận/huyện, địa chỉ chi tiết" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Mô tả</Label>
        <RichTextEditor minHeight={110} value={formData.description} onChange={(value) => handleTextChange({ target: { name: "description", value } })} placeholder="Mô tả ngắn về sự kiện..." />
      </div>
    </div>
  </section>
);

export default BasicInfoSection;
