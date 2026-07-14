import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus } from "lucide-react";

interface Props {
formData: Record<string, string>;
  handleTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  previews: { logo: string | null; paymentQR: string | null; banners: string[] };
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
 // removeBanner: (index: number) => void;
}

const GalaMediaSection = ({ formData, handleTextChange, previews, handleFileChange }: Props) => {
  return (
    <div className="border border-border rounded-xl p-6 bg-card shadow-sm space-y-6">
      <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 mb-4">
        <span className="w-1.5 h-5 bg-primary rounded-full"></span> Hình ảnh & Giải thưởng
      </h3>
      <div className="space-y-2">
        <Label>Cơ cấu giải thưởng</Label>
        <Textarea name="prizes" value={formData.prizes} onChange={handleTextChange} placeholder="VD: Nhất 5tr, Nhì 3tr..." className="bg-background"/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground">Logo giải</Label>
          <div className="relative border-2 border-dashed border-border rounded-xl h-32 flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden group">
            {previews.logo ? <img src={previews.logo} alt="" className="w-full h-full object-contain p-2" /> : (
              <div className="text-primary flex flex-col items-center"><ImagePlus className="w-6 h-6 mb-2 opacity-70 group-hover:opacity-100" /><span className="text-xs font-bold">+ TẢI LOGO</span></div>
            )}
            <input type="file" name="logo" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground">QR Thanh toán</Label>
          <div className="relative border-2 border-dashed border-border rounded-xl h-32 flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden group">
            {previews.paymentQR ? <img src={previews.paymentQR} alt="" className="w-full h-full object-contain p-2" /> : (
              <div className="text-green-600 flex flex-col items-center"><ImagePlus className="w-6 h-6 mb-2 opacity-70 group-hover:opacity-100" /><span className="text-xs font-bold">+ TẢI QR</span></div>
            )}
            <input type="file" name="paymentQR" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
};
export default GalaMediaSection;