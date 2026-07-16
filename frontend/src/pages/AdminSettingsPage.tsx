import { useEffect, useState, type FormEvent } from "react";
import { ImagePlus, Loader2, Save, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { systemSettingsService, type SystemSettings } from "@/services/systemSettingsService";
import { uploadService, validateImageFile } from "@/services/uploadService";

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<SystemSettings>(systemSettingsService.fallback);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    systemSettingsService.getPublic()
      .then(setSettings)
      .catch(() => toast.error("Không thể tải cài đặt hệ thống."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!logoFile) {
      queueMicrotask(() => setLogoPreview(""));
      return;
    }
    const url = URL.createObjectURL(logoFile);
    queueMicrotask(() => setLogoPreview(url));
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const selectLogo = (file?: File) => {
    if (!file) return;
    const error = validateImageFile(file, 3);
    if (error) {
      toast.error(error);
      return;
    }
    setLogoFile(file);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (settings.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.supportEmail)) {
      toast.error("Email hỗ trợ không hợp lệ.");
      return;
    }
    if (settings.contactPhone && !/^[0-9+\-\s().]{7,24}$/.test(settings.contactPhone)) {
      toast.error("Số điện thoại liên hệ không hợp lệ.");
      return;
    }
    setSaving(true);
    try {
      let logoUrl = settings.logoUrl;
      if (logoFile) logoUrl = await uploadService.image(logoFile);
      const next = await systemSettingsService.update({ ...settings, logoUrl });
      setSettings(next);
      setLogoFile(null);
      toast.success("Đã cập nhật cài đặt hệ thống.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật cài đặt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12">
      <section className="rounded-2xl bg-header p-6 text-white shadow-lg">
        <p className="text-[10px] font-bold uppercase text-white/70">Quản trị hệ thống</p>
        <h1 className="mt-1 text-3xl font-bold uppercase tracking-normal">Cài đặt hệ thống</h1>
        <p className="mt-2 text-sm text-white/70">Cấu hình tên website, logo và thông tin liên hệ công khai.</p>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-3 size-6 animate-spin text-primary" /> Đang tải cài đặt...
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm lg:grid-cols-[320px_1fr]">
          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border bg-white">
              {logoPreview || settings.logoUrl ? (
                <img src={logoPreview || settings.logoUrl} alt="Logo website" className="h-full w-full object-contain p-4" />
              ) : (
                <Settings className="h-14 w-14 text-muted-foreground" />
              )}
            </div>
            <div className="mt-4 grid gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary/30 text-sm font-bold text-primary hover:bg-primary/5">
                <ImagePlus className="h-4 w-4" /> Chọn logo
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => selectLogo(event.target.files?.[0])} />
              </label>
              {(logoPreview || settings.logoUrl) && (
                <Button type="button" variant="outline" onClick={() => { setLogoFile(null); setSettings({ ...settings, logoUrl: "" }); }}>
                  <Trash2 className="h-4 w-4" /> Xóa logo
                </Button>
              )}
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">Hỗ trợ JPG, PNG, WEBP. Dung lượng tối đa 3 MB.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold md:col-span-2">
              Tên website
              <Input value={settings.siteName} onChange={(event) => setSettings({ ...settings, siteName: event.target.value })} maxLength={120} />
            </label>
            <label className="space-y-2 text-sm font-semibold md:col-span-2">
              Địa chỉ liên hệ
              <Input value={settings.contactAddress} onChange={(event) => setSettings({ ...settings, contactAddress: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Email hỗ trợ
              <Input type="email" value={settings.supportEmail} onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Số điện thoại liên hệ
              <Input value={settings.contactPhone} onChange={(event) => setSettings({ ...settings, contactPhone: event.target.value })} />
            </label>
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Đang lưu..." : "Lưu cài đặt"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettingsPage;
