import React from 'react';
import { UploadCloud, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";

interface ImportDropzoneProps {
  file: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export const ImportDropzone: React.FC<ImportDropzoneProps> = ({
  file,
  fileInputRef,
  onFileChange,
  onClear,
}) => {
  return (
    <div 
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "group relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",
        file ? "border-sky-500 bg-sky-50/30" : "border-slate-200 hover:border-sky-400 hover:bg-slate-50"
      )}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".xlsx, .xls" 
        onChange={onFileChange} 
      />
      
      {file ? (
        <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <FileSpreadsheet className="h-10 w-10 text-emerald-600" />
          </div>
          <p className="font-bold text-slate-900 mb-1 truncate max-w-[200px]">{file.name}</p>
          <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { 
              e.stopPropagation(); 
              onClear(); 
            }}
            className="absolute top-4 right-4 text-slate-400 hover:text-rose-500"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="bg-slate-100 p-4 rounded-full mb-4 group-hover:bg-sky-100 transition-colors">
            <UploadCloud className="h-10 w-10 text-slate-400 group-hover:text-sky-600" />
          </div>
          <h3 className="font-bold text-slate-700">Nhấp để chọn hoặc kéo thả file</h3>
          <p className="text-sm text-slate-400 mt-1">Hỗ trợ định dạng Excel (.xlsx, .xls)</p>
        </div>
      )}
    </div>
  );
};