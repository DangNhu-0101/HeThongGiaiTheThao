import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadService, validateImageFile } from "@/services/uploadService";

interface Props {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  recommended?: string;
  maxSizeMb?: number;
  maxFiles?: number;
}

export const MultiImageUploadField = ({
  label,
  values,
  onChange,
  recommended,
  maxSizeMb = 5,
  maxFiles = 8,
}: Props) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const readFiles = async (files: File[]) => {
    const available = Math.max(0, maxFiles - values.length);
    const selected = files.slice(0, available);
    const validationError = selected.map((file) => validateImageFile(file, maxSizeMb)).find(Boolean);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setUploading(true);
    try {
      const images = await Promise.all(selected.map((file) => uploadService.image(file)));
      onChange([...values, ...images]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <span className="text-[11px] text-muted-foreground">{values.length}/{maxFiles} ảnh</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {values.map((value, index) => (
          <div key={`${value.slice(0, 30)}-${index}`} className="group relative overflow-hidden rounded-xl border border-border bg-muted/20">
            <img src={value} alt={`${label} ${index + 1}`} className="h-28 w-full object-cover" />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute right-2 top-2 h-7 w-7 opacity-90"
              onClick={() => onChange(values.filter((_, current) => current !== index))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            {index === 0 && <span className="absolute bottom-2 left-2 rounded bg-black/65 px-2 py-1 text-[10px] font-bold text-white">Ảnh đại diện</span>}
          </div>
        ))}

        {values.length < maxFiles && (
          <div className="relative flex h-28 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20">
            <div className="flex flex-col items-center gap-1 text-center text-muted-foreground">
              <ImagePlus className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold">{uploading ? "Đang tải ảnh..." : "Thêm ảnh"}</span>
              {recommended && <span className="px-2 text-[10px]">{recommended}</span>}
            </div>
            <Input
              multiple
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              disabled={uploading}
              onChange={(event) => void readFiles(Array.from(event.target.files || []))}
              className="absolute inset-0 h-full cursor-pointer opacity-0"
            />
          </div>
        )}
      </div>
      {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
    </div>
  );
};
