import React, { useState } from "react";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import FormatConfigFields from "@/components/org/tournament-mgmt/create-sections/FormatConfigFields";
import { createEmptyFormatConfig } from "@/libs/formatConfig";
import { adminSportsConfigService } from "@/services/adminSportsConfigService";

interface Props { sportName: string; onSuccess?: () => void; children: React.ReactNode; }

const CreateFormatModal = ({ sportName, onSuccess, children }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(createEmptyFormatConfig);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await adminSportsConfigService.createFormat(sportName, formData);
      toast.success("Đã lưu thể thức mới.");
      setOpen(false);
      setFormData(createEmptyFormatConfig());
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Không thể lưu thể thức.");
    } finally { setLoading(false); }
  };

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger render={children as React.ReactElement} />
    <DialogContent className="flex h-[96vh] w-[96vw] max-w-[96vw] sm:max-w-[96vw] flex-col gap-0 overflow-hidden p-0">
      <DialogHeader className="border-b border-border px-6 py-4"><DialogTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" />Cấu hình thể thức cho {sportName}</DialogTitle></DialogHeader>
      <ScrollArea className="min-h-0 flex-1 px-6 py-5"><form id="format-form" onSubmit={submit} className="pb-8"><FormatConfigFields value={formData} onChange={setFormData} /></form></ScrollArea>
      <DialogFooter className="border-t border-border px-6 py-4"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button form="format-form" type="submit" disabled={loading}>{loading ? "Đang lưu..." : "Lưu thể thức"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
};

export default CreateFormatModal;
