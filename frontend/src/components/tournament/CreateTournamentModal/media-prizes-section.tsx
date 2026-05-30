import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X } from "lucide-react";

interface PreviewState {
  logo: string | null;
  paymentQR: string | null;
  banners: string[];
}

interface MediaPrizesSectionProps {
  formData: { prizes: string };
  handleTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  previews: PreviewState;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeBanner: (index: number) => void;
}

const MediaPrizesSection = ({
  formData,
  handleTextChange,
  previews,
  handleFileChange,
  removeBanner
}: MediaPrizesSectionProps) => {
  return (
    <div className="border border-border/50 rounded-xl p-6 bg-card shadow-sm space-y-6">
      <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 mb-4">
        <span className="w-1.5 h-5 bg-primary rounded-full"></span>
        Hình ảnh & Giải thưởng
      </h3>
      
      <div className="space-y-2">
        <Label>Cơ cấu giải thưởng</Label>
        <Textarea name="prizes" value={formData.prizes} onChange={handleTextChange} placeholder="VD: Nhất 5tr, Nhì 3tr..." />
      </div>
        
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground">Logo giải</Label>
          <div className="relative border-2 border-dashed border-border/70 rounded-xl h-32 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer overflow-hidden group">
            {previews.logo ? <img src={previews.logo} alt="" className="w-full h-full object-contain p-2" /> : (
              <div className="text-primary flex flex-col items-center"><ImagePlus className="size-6 mb-2 opacity-70 group-hover:opacity-100" /><span className="text-xs font-bold">+ TẢI LOGO</span></div>
            )}
            <input type="file" name="logo" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground">QR Thanh toán</Label>
          <div className="relative border-2 border-dashed border-border/70 rounded-xl h-32 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer overflow-hidden group">
            {previews.paymentQR ? <img src={previews.paymentQR} alt="" className="w-full h-full object-contain p-2" /> : (
              <div className="text-emerald-600 flex flex-col items-center"><ImagePlus className="size-6 mb-2 opacity-70 group-hover:opacity-100" /><span className="text-xs font-bold">+ TẢI QR</span></div>
            )}
            <input type="file" name="paymentQR" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className="text-xs uppercase text-muted-foreground">Banner giải (Chọn nhiều ảnh)</Label>
          <div className="relative border-2 border-dashed border-border/70 rounded-xl h-16 flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
            <span className="text-xs font-bold text-primary flex items-center gap-2"><ImagePlus className="size-4" /> + BẤM ĐỂ CHỌN NHIỀU BANNER</span>
            <input type="file" name="banners" accept="image/*" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          
          {previews.banners.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mt-4">
              {previews.banners.map((url: string, i: number) => (
                <div key={i} className="relative aspect-square rounded-lg border overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeBanner(i)} className="absolute top-1 right-1 bg-destructive/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="size-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPrizesSection;