import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";

import type { FormatConfigState } from "@/types/tournament";

interface Props {
  sportName: string;
  onSuccess?: () => void;
  children: React.ReactNode;
}

const CreateFormatModal = ({ sportName, onSuccess, children }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const [formData, setFormData] = useState<FormatConfigState>({
    name: "", type: "GROUP_STAGE", minTeams: 4, maxTeams: 32, description: "", matchDuration: 15, hasWildcards: false, rankingCriteria: []
  });

  const handleClose = () => setIsOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Fake API
      toast.success("Đã thêm mẫu thể thức mới!");
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      toast.error("Lỗi khi thêm thể thức.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 bg-background gap-0 overflow-hidden outline-none">
        
        <DialogHeader className="px-6 py-4 border-b border-border bg-card shrink-0">
          <DialogTitle className="text-lg font-black uppercase flex items-center gap-2 text-foreground">
             <Settings2 className="w-5 h-5 text-primary" />
             Thêm Thể thức mới cho môn {sportName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4 bg-muted/20 shrink-0 border-b border-border">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="general" className="text-xs font-bold uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Thông tin chung</TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs font-bold uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Luật thi đấu</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-full flex-1 px-6 py-4 min-h-0 bg-muted/10">
            <form id="format-form" onSubmit={handleSubmit} className="flex flex-col gap-6 pb-8">
              
              {/* TAB 1: THÔNG TIN CHUNG */}
              <TabsContent value="general" className="m-0 space-y-5 animate-in fade-in">
                <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Tên mẫu thể thức <span className="text-red-500">*</span></Label>
                    <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Vòng bảng + Loại trực tiếp..." />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Loại nhánh đấu</Label>
                    <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" 
                      value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}
                    >
                      <option value="GROUP_STAGE">Đấu vòng tròn (League / Group)</option>
                      <option value="KNOCKOUT">Loại trực tiếp (Knockout)</option>
                      <option value="HYBRID">Hỗn hợp (Hybrid)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Số đội tối thiểu</Label>
                      <Input type="number" required value={formData.minTeams} onChange={e => setFormData({...formData, minTeams: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Số đội tối đa</Label>
                      <Input type="number" required value={formData.maxTeams} onChange={e => setFormData({...formData, maxTeams: Number(e.target.value)})} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Mô tả vận hành</Label>
                    <Textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Cách chia bảng, lên hạng, xuống hạng..." />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: CẤU HÌNH LUẬT (Dành cho việc gắn MatchPanel, RankingPanel vào) */}
              <TabsContent value="advanced" className="m-0 space-y-4 animate-in fade-in">
                {/* Panel mô phỏng Luật thi đấu */}
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <h4 className="font-bold text-sm text-primary uppercase mb-4 flex items-center gap-2">
                     <span className="w-1.5 h-4 bg-primary rounded-full"></span> Mặc định Thông số trận
                  </h4>
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Thời lượng mỗi trận (phút)</Label>
                        <Input type="number" value={formData.matchDuration} onChange={e => setFormData({...formData, matchDuration: Number(e.target.value)})} />
                     </div>
                  </div>
                </div>

                {/* Panel mô phỏng Luật xếp hạng & Vé vớt */}
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <h4 className="font-bold text-sm text-primary uppercase mb-4 flex items-center gap-2">
                     <span className="w-1.5 h-4 bg-primary rounded-full"></span> Cơ chế xếp hạng vòng bảng
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border">
                      <input type="checkbox" className="rounded accent-primary w-4 h-4" 
                        checked={formData.hasWildcards} onChange={e => setFormData({...formData, hasWildcards: e.target.checked})} 
                      />
                      <span className="text-sm font-semibold">Cho phép Vé vớt (Lucky Losers)</span>
                    </label>
                  </div>
                </div>

              </TabsContent>

            </form>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t border-border bg-card flex justify-end gap-3 shrink-0">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>Hủy</Button>
          <Button type="submit" form="format-form" disabled={loading} className="font-bold bg-primary text-primary-foreground min-w-[140px]">
            {loading ? 'Đang lưu...' : 'Lưu Thể Thức'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};

export default CreateFormatModal;