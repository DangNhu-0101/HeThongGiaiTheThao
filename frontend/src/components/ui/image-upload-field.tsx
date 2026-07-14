import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadService, validateImageFile } from "@/services/uploadService";

interface Props {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  recommended?: string;
  maxSizeMb?: number;
}

export const ImageUploadField = ({
  label,
  value = "",
  onChange,
  recommended,
  maxSizeMb = 5,
}: Props) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const readImage = async (file?: File) => {
    if (!file) return;
    const validationError = validateImageFile(file, maxSizeMb);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setUploading(true);
    try {
      onChange(await uploadService.image(file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative flex min-h-32 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20">
        {value ? (
          <img src={value} alt={label} className="h-32 w-full object-contain p-2" />
        ) : (
          <div className="flex flex-col items-center gap-2 p-5 text-center text-muted-foreground">
            <ImagePlus className="h-6 w-6 text-primary" />
            <span className="text-xs font-bold">{uploading ? "Đang tải ảnh..." : "Chọn ảnh từ máy"}</span>
            {recommended && <span className="text-[11px]">{recommended}</span>}
          </div>
        )}
        <Input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          disabled={uploading}
          onChange={(event) => void readImage(event.target.files?.[0])}
          className="absolute inset-0 h-full cursor-pointer opacity-0"
        />
      </div>
      {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
      {value && (
        <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => onChange("")}>
          <Trash2 className="mr-1 h-4 w-4" /> Xóa ảnh
        </Button>
      )}
    </div>
  );
};
