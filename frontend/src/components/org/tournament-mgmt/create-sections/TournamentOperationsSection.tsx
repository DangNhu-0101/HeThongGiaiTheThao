import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MultiImageUploadField } from "@/components/ui/multi-image-upload-field";
import type { SponsorTierState, TournamentOperationsState } from "@/types/orgTournamentMgmt";

export type { SponsorTierState, TournamentOperationsState };

interface Props {
  value: TournamentOperationsState;
  onChange: (value: TournamentOperationsState) => void;
  feePerAthlete?: number;
  onFeePerAthleteChange?: (value: number) => void;
}

const TournamentOperationsSection = ({ value, onChange, feePerAthlete, onFeePerAthleteChange }: Props) => {
  const set = <K extends keyof TournamentOperationsState>(key: K, next: TournamentOperationsState[K]) => onChange({ ...value, [key]: next });
  const updateTier = (index: number, patch: Partial<SponsorTierState>) => set("sponsorTiers", value.sponsorTiers.map((tier, current) => current === index ? { ...tier, ...patch } : tier));
  return <div className="space-y-5">

    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h3 className="font-bold uppercase text-primary">Phương thức đăng ký</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Chọn đăng ký trực tiếp trên hệ thống hoặc chuyển người tham gia sang form riêng.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {([
          ["system", "Hệ thống của web", "Tạo đội, mời thành viên và duyệt đăng ký ngay trên web."],
          ["external", "Link đăng ký riêng", "Dùng Google Form hoặc trang đăng ký bên ngoài."],
        ] as const).map(([mode, title, description]) => (
          <button
            key={mode}
            type="button"
            onClick={() => set("registrationMode", mode)}
            className={`rounded-lg border p-4 text-left transition-colors ${
              value.registrationMode === mode
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            <span className="block text-sm font-bold">{title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
          </button>
        ))}
      </div>

      {value.registrationMode === "external" && (
        <div className="space-y-4 border-t border-border pt-4">
          <h4 className="text-sm font-black uppercase">Đăng ký và hỗ trợ</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Link form đăng ký *</Label>
              <Input
                required
                type="url"
                value={value.registrationFormUrl}
                onChange={(event) => set("registrationFormUrl", event.target.value)}
                placeholder="https://forms.gle/..."
              />
            </div>
            <div>
              <Label>Link nhóm Zalo</Label>
              <Input
                type="url"
                value={value.zaloGroupUrl}
                onChange={(event) => set("zaloGroupUrl", event.target.value)}
                placeholder="https://zalo.me/g/..."
              />
            </div>
            <div>
              <Label>Giới hạn lượt đăng ký</Label>
              <Input
                type="number"
                min={0}
                value={value.maxRegistrations}
                onChange={(event) => set("maxRegistrations", Number(event.target.value))}
              />
            </div>
            <div>
              <Label>Liên hệ hỗ trợ</Label>
              <Input
                value={value.supportContacts}
                onChange={(event) => set("supportContacts", event.target.value)}
                placeholder="Tên - Số điện thoại"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Hướng dẫn đăng ký</Label>
              <RichTextEditor
                minHeight={90}
                value={value.registrationInstructions}
                onChange={(next) => set("registrationInstructions", next)}
                placeholder="Điều kiện giữ suất, cách xác nhận đăng ký..."
              />
            </div>
          </div>
        </div>
      )}
    </section>

    <section className="space-y-4 rounded-xl border border-border bg-card p-6"><h3 className="font-bold uppercase text-primary">Lệ phí và thanh toán</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{onFeePerAthleteChange && <div><Label>Lệ phí / VĐV</Label><Input type="number" min={0} value={feePerAthlete || 0} onChange={(e) => onFeePerAthleteChange(Number(e.target.value))} /></div>}<div className={onFeePerAthleteChange ? "" : "md:col-span-2"}><Label>Lệ phí bao gồm</Label><Input value={value.feeIncludes} onChange={(e) => set("feeIncludes", e.target.value)} placeholder="Nước, trái cây, bóng, áo thi đấu..." /></div><div><Label>Ngân hàng</Label><Input value={value.bankName} onChange={(e) => set("bankName", e.target.value)} /></div><div><Label>Chủ tài khoản</Label><Input value={value.accountName} onChange={(e) => set("accountName", e.target.value)} /></div><div><Label>Số tài khoản</Label><Input value={value.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} /></div><div><Label>Nội dung chuyển khoản</Label><Input value={value.transferContent} onChange={(e) => set("transferContent", e.target.value)} placeholder="Tên giải_Tên VĐV_SĐT" /></div><div className="md:col-span-2"><Label>Hướng dẫn xác nhận thanh toán</Label><Textarea value={value.paymentInstructions} onChange={(e) => set("paymentInstructions", e.target.value)} /></div>
    <div className="md:col-span-2"><Label>Chính sách hoàn phí / lưu ý</Label>
    <RichTextEditor value={value.refundPolicy} onChange={(next) => set("refundPolicy", next)} placeholder="Quy định hoàn phí /Lưu ý..." /></div>
    <div className="md:col-span-2">
      <ImageUploadField label="QR thanh toán" value={value.paymentQR} onChange={(image) => set("paymentQR", image)} />
    </div>
    </div>
    </section>

    <section className="space-y-4 rounded-xl border border-border bg-card p-6"><h3 className="font-bold uppercase text-primary">Truyền thông và gala</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div>
      <ImageUploadField label="Logo giải" value={value.logo} onChange={(image) => set("logo", image)} /></div>
      <MultiImageUploadField label="Banner / poster" values={value.banner} onChange={(images) => set("banner", images)} recommended="Có thể chọn nhìều ảnh" />
        
        <label className="flex items-center gap-2 md:col-span-2">
            <input type="checkbox" checked={value.hasGala} onChange={(e) => set("hasGala", e.target.checked)} />Có chương trình gala</label>{value.hasGala && <><div>
              <Label>Bắt đầu gala</Label><Input type="datetime-local" value={value.galaStart} onChange={(e) => set("galaStart", e.target.value)} /></div><div><Label>Kết thúc gala</Label><Input type="datetime-local" value={value.galaEnd} onChange={(e) => set("galaEnd", e.target.value)} /></div><div><Label>Địa điểm gala</Label><Input value={value.galaVenue} onChange={(e) => set("galaVenue", e.target.value)} /></div><div><Label>Nội dung gala</Label><Input value={value.galaDescription} onChange={(e) => set("galaDescription", e.target.value)} /></div></>}</div></section>

    <section className="space-y-4 rounded-xl border border-border bg-card p-6"><div className="flex justify-between"><div><h3 className="font-bold uppercase text-primary">Gói tài trợ</h3><p className="text-xs text-muted-foreground">Cấu hình số lượng, giá trị và quyền lợi từng cấp.</p></div><Button type="button" size="sm" variant="outline" onClick={() => set("sponsorTiers", [...value.sponsorTiers, { name: "Gói mới", slots: 1, amount: 0, benefits: "" }])}><Plus className="mr-1 h-4 w-4" />Thêm gói</Button></div><div><Label>Liên hệ tài trợ</Label><Input value={value.sponsorContact} onChange={(e) => set("sponsorContact", e.target.value)} placeholder="Tên, điện thoại, email" /></div>{value.sponsorTiers.map((tier, index) => <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_.5fr_1fr_2fr_auto]"><div><Label>Tên cấp</Label><Input value={tier.name} onChange={(e) => updateTier(index, { name: e.target.value })} /></div><div><Label>Số suất</Label><Input type="number" min={0} value={tier.slots} onChange={(e) => updateTier(index, { slots: Number(e.target.value) })} /></div><div><Label>Giá trị / suất</Label><Input type="number" min={0} value={tier.amount} onChange={(e) => updateTier(index, { amount: Number(e.target.value) })} /></div><div><Label>Quyền lợi</Label><Textarea value={tier.benefits} onChange={(e) => updateTier(index, { benefits: e.target.value })} placeholder="Logo backdrop; trao cúp; video quảng cáo; tham gia giải..." /></div><Button type="button" size="icon" variant="ghost" className="self-end text-red-600" onClick={() => set("sponsorTiers", value.sponsorTiers.filter((_, current) => current !== index))}><Trash2 className="h-4 w-4" /></Button></div>)}</section>
  </div>;
};

export default TournamentOperationsSection;
