import React, { useState, useRef } from 'react';
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Users, 
  Shield, 
  Trophy, 
  LayoutGrid, 
  Zap, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
} from "lucide-react";
import { cn } from "@/libs/utils";
import { toast } from "sonner";
import type { AlertMessage, ImportType, ValidationError } from "@/types/import";
import { importService } from "@/services/importService";
import { ImportDropzone } from "@/components/import/ImportDropzone";
import { ImportInstructions } from "@/components/import/ImportInstructions";
import axios from "axios"; // Thêm import axios

const IMPORT_TYPES: ImportType[] = [
  { id: 'teams', label: 'Đội thi đấu', icon: Users },
  { id: 'players', label: 'Vận động viên', icon: Shield },
  { id: 'referees', label: 'Trọng tài', icon: Trophy },
  { id: 'courts', label: 'Sân bãi', icon: LayoutGrid },
  { id: 'schedules', label: 'Lịch thi đấu', icon: Zap },
];

export const ImportManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(IMPORT_TYPES[0].id);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<AlertMessage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = async () => {
    try {
      await importService.downloadTemplate(activeTab);
    } catch{
      toast.error("Không thể tải file mẫu.");
    }
  };

  const handleExport = async () => {
    try {
      await importService.exportData(activeTab);
    } catch {
      toast.error("Xuất dữ liệu thất bại.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', activeTab);

    try {
      await importService.upload(formData);
      setMessage({ type: 'success', text: 'Dữ liệu đã được nhập thành công vào hệ thống.' });
      setFile(null);
    } catch (error: unknown) {  // ← Sử dụng unknown thay vì any
      if (axios.isAxiosError(error)) {  // ← Type guard của axios
        const errData = error.response?.data;
        if (errData?.errors && Array.isArray(errData.errors)) {
          const errorList = errData.errors as ValidationError[];
          const errorText = errorList
            .map((e) => `• Sheet "${e.sheet}": Dòng ${e.row} - ${e.message}`)
            .join('\n');
          setMessage({ type: 'error', text: `Phát hiện lỗi dữ liệu:\n${errorText}` });
        } else {
          setMessage({ type: 'error', text: errData?.message || 'Có lỗi xảy ra trong quá trình upload.' });
        }
      } else if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message || 'Có lỗi xảy ra trong quá trình upload.' });
      } else {
        setMessage({ type: 'error', text: 'Có lỗi xảy ra trong quá trình upload.' });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">

      <div className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý Import dữ liệu</h1>
        <p className="text-slate-500">Đẩy dữ liệu hàng loạt vào hệ thống thông qua tệp Excel (.xlsx)</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1 bg-slate-100">
          {IMPORT_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <TabsTrigger 
                key={type.id} 
                value={type.id} 
                className="flex items-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium text-xs">{type.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-8">
                <ImportDropzone 
                  file={file}
                  fileInputRef={fileInputRef}
                  onFileChange={handleFileChange}
                  onClear={clearFile}
                />

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
                    <Download className="h-4 w-4" /> Tải file mẫu
                  </Button>
                  <Button variant="outline" onClick={handleExport} className="gap-2">
                    <Download className="h-4 w-4" /> Xuất dữ liệu
                  </Button>
                </div>

                <Button 
                  disabled={!file || uploading} 
                  onClick={handleUpload} 
                  className="w-full mt-4 bg-slate-900 hover:bg-slate-800"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {uploading ? 'Đang xử lý...' : 'Import dữ liệu'}
                </Button>
              </CardContent>
            </Card>

            {message && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={cn(
                "animate-in slide-in-from-top-2 duration-300",
                message.type === 'success' && "bg-emerald-50 border-emerald-200 text-emerald-800"
              )}>
                {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                <AlertTitle className="font-bold">{message.type === 'error' ? 'Lỗi Import' : 'Thành công'}</AlertTitle>
                <AlertDescription className="whitespace-pre-line leading-relaxed">
                  {message.text}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-6">
            <ImportInstructions />
          </div>
        </div>
      </Tabs>
    </div>
  );
};