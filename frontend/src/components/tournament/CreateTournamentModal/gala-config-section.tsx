import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface GalaConfigState {
  hasGala: boolean;
  time: string;
  location: string;
  description: string;
}

interface GalaConfigSectionProps {
  galaConfig: GalaConfigState;
handleGalaChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; type: string; checked: boolean; value: string } }) => void;}

const GalaConfigSection = ({
  galaConfig,
  handleGalaChange
}: GalaConfigSectionProps) => {
  return (
    <div className="border border-border/50 rounded-xl p-6 bg-card shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 mb-4">
        <span className="w-1.5 h-5 bg-primary rounded-full"></span>
        Sự kiện Gala Dinner
      </h3>
      
      <div className="flex items-center gap-3 mb-4">
        <Checkbox 
          id="hasGala" 
          checked={galaConfig.hasGala} 
          onCheckedChange={(checked: boolean) => handleGalaChange({ target: { name: 'hasGala', type: 'checkbox', checked, value: '' } })}        />
        <Label htmlFor="hasGala" className="text-sm font-bold cursor-pointer text-primary">
          Có tổ chức Gala Dinner tổng kết & trao giải
        </Label>
      </div>

      {galaConfig.hasGala && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-4">
          <div className="space-y-2">
            <Label>Thời gian diễn ra</Label>
            <Input type="datetime-local" name="time" value={galaConfig.time} onChange={handleGalaChange} />
          </div>
          <div className="space-y-2">
            <Label>Địa điểm tổ chức Gala</Label>
            <Input name="location" value={galaConfig.location} onChange={handleGalaChange} placeholder="Nhập địa điểm..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Mô tả chi tiết</Label>
            <Textarea name="description" value={galaConfig.description} onChange={handleGalaChange} placeholder="Dresscode, kịch bản chương trình..." />
          </div>
        </div>
      )}
    </div>
  );
};

export default GalaConfigSection;