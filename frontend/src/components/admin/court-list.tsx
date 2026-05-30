import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";

export function CourtList() {
  // Lấy ID từ URL. Nếu đang ở /org/courts thì id sẽ là undefined
  const { id } = useParams<{ id: string }>(); 
  const isSystemWide = !id;

  const courts = [
    { id: 1, name: "Sân Trung tâm 1", address: "Khu A, Trung tâm Thể thao", status: "Hoạt động" },
    { id: 2, name: "Sân Trung tâm 2", address: "Khu A, Trung tâm Thể thao", status: "Bảo trì" },
    { id: 3, name: "Sân Phụ 1", address: "Khu B, Trung tâm Thể thao", status: "Hoạt động" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-sky-600" />
          {isSystemWide ? "Danh sách Sân (Toàn hệ thống)" : "Danh sách Sân (Của giải đấu)"}
        </h1>
        <Button className="gap-2 shadow-sm font-bold bg-sky-600 hover:bg-sky-700">
          <Plus className="h-4 w-4" />
          Thêm sân mới
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Tên sân</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Địa chỉ</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Trạng thái</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courts.map((court) => (
                <TableRow key={court.id} className="hover:bg-slate-50">
                  <TableCell className="font-semibold text-slate-800 whitespace-nowrap">{court.name}</TableCell>
                  <TableCell className="text-slate-600 min-w-[200px]">{court.address}</TableCell>
                  <TableCell>
                    <Badge variant={court.status === "Hoạt động" ? "default" : "destructive"} className="whitespace-nowrap shadow-none">
                      {court.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" className="hover:bg-slate-200"><Edit className="h-4 w-4 text-slate-500" /></Button>
                    <Button variant="ghost" size="icon" className="hover:bg-rose-100"><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}