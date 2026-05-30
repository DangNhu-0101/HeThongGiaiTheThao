import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCog, Plus, Edit, Trash2 } from "lucide-react";

export function RefereeList() {
  const referees = [
    { id: 1, name: "Nguyễn Văn A", level: "Quốc gia", phone: "0901 234 567", status: "Sẵn sàng" },
    { id: 2, name: "Trần Thị B", level: "Khu vực", phone: "0912 345 678", status: "Đang làm nhiệm vụ" },
    { id: 3, name: "Lê Hoàng C", level: "Tỉnh/Thành", phone: "0987 654 321", status: "Tạm nghỉ" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <UserCog className="h-6 w-6 text-sky-600" />
          Danh sách Trọng tài
        </h1>
        <Button className="gap-2 shadow-sm font-bold bg-sky-600 hover:bg-sky-700">
          <Plus className="h-4 w-4" />
          Thêm trọng tài
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Họ và tên</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Cấp bậc</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Số điện thoại</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Trạng thái</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referees.map((referee) => (
                <TableRow key={referee.id} className="hover:bg-slate-50">
                  <TableCell className="font-bold text-slate-800 whitespace-nowrap">{referee.name}</TableCell>
                  <TableCell className="text-slate-600 font-medium whitespace-nowrap">{referee.level}</TableCell>
                  <TableCell className="text-slate-600 whitespace-nowrap">{referee.phone}</TableCell>
                  <TableCell>
                    <Badge variant={referee.status === "Sẵn sàng" ? "default" : "secondary"} className="whitespace-nowrap shadow-none font-bold">
                      {referee.status}
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