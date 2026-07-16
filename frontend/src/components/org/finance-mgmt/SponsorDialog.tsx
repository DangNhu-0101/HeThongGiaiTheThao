import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { SponsorPackage, SponsorRecord } from "@/types/orgFinanceMgmt";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/ui/image-upload-field";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sponsor: SponsorRecord) => void | Promise<void>;
  editingSponsor?: SponsorRecord | null;
  packages: SponsorPackage[];
}

const SponsorDialog = ({ isOpen, onClose, onSave, editingSponsor, packages }: Props) => {
  const [formData, setFormData] = useState({
    name: "",
    logoUrl: "",
    tier: packages[0]?.name || "",
    status: "Active",
  });
  const selectedPackage = useMemo(
    () => packages.find((item) => item.name === formData.tier) || packages[0],
    [formData.tier, packages],
  );

  useEffect(() => {
    queueMicrotask(() => {
      if (editingSponsor) {
        setFormData({
          name: editingSponsor.name,
          logoUrl: editingSponsor.logoUrl,
          tier: editingSponsor.tier,
          status: editingSponsor.status,
        });
      } else {
        setFormData({ name: "", logoUrl: "", tier: packages[0]?.name || "", status: "Active" });
      }
    });
  }, [editingSponsor, isOpen, packages]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPackage) return;
    await onSave({
      id: editingSponsor?.id || `sponsor-${Date.now()}`,
      ...formData,
      tier: selectedPackage.name,
      amount: selectedPackage.amount || 0,
      status: formData.status as SponsorRecord["status"],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 p-4">
          <h3 className="font-bold">{editingSponsor ? "Chỉnh sửa nhà tài trợ" : "Thêm nhà tài trợ"}</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Tên đơn vị</span>
            <input
              required
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <ImageUploadField
            label="Logo / Hình ảnh"
            value={formData.logoUrl}
            onChange={(logoUrl) => setFormData({ ...formData, logoUrl })}
          />
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Danh mục tài trợ</span>
            <select
              value={formData.tier}
              disabled={!packages.length}
              onChange={(event) => setFormData({ ...formData, tier: event.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {packages.map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">
              {selectedPackage
                ? `Giá trị gói: ${(selectedPackage.amount || 0).toLocaleString("vi-VN")} VNĐ`
                : "Chưa có gói tài trợ được cấu hình cho giải này."}
            </p>
          </label>
          <div className="flex gap-3 pt-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
            <Button type="submit" disabled={!formData.logoUrl || !selectedPackage} className="flex-1">Lưu thông tin</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SponsorDialog;
