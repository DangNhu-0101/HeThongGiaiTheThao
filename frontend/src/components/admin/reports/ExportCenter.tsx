import { Download, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  onDownload: () => void | Promise<void>;
  loading?: boolean;
}

const ExportCenter = ({ onDownload, loading = false }: Props) => {
  return (
    <Card className="p-6 border-border shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-background shadow-sm">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Xuất báo cáo tổng quát</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Tải một file tổng hợp từ số liệu thống kê hiện tại.
            </p>
          </div>
        </div>
        <Button onClick={onDownload} disabled={loading} className="w-full bg-primary text-white shadow-sm hover:bg-primary-hover sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Tải báo cáo tổng quát
        </Button>
      </div>
    </Card>
  );
};

export default ExportCenter;
