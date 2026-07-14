import { Download, FileSpreadsheet, FileText, FileJson } from "lucide-react";
import type { ExportFileItem } from "@/types/adminReports";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ExportCenter = ({ files }: { files: ExportFileItem[] }) => {
  const getIcon = (format: string) => {
    switch (format) {
      case 'XLSX': return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
      case 'PDF': return <FileText className="w-6 h-6 text-red-500" />;
      case 'CSV': return <FileJson className="w-6 h-6 text-blue-500" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  return (
    <Card className="p-6 border-border shadow-sm">
      <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
        <div>
          <h3 className="font-bold text-foreground text-base">Trung tâm Xuất dữ liệu</h3>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase">Tải xuống các báo cáo đã sẵn sàng (Audit-ready)</p>
        </div>
        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full">{files.length} Báo cáo sẵn sàng</span>
      </div>

      <div className="space-y-4">
        {files.map(file => (
          <div key={file.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-background border border-border shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {getIcon(file.format)}
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">{file.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{file.description} • {file.format} • {file.size}</p>
              </div>
            </div>
            <Button size="sm" className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white shadow-sm">
              <Download className="w-4 h-4 mr-2" /> Tải xuống
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};
export default ExportCenter;