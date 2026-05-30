import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus, Edit, Trash2 } from "lucide-react";

export function TeamList() {
  const teams = [
    { id: 1, name: "FC Vũng Tàu", sport: "Bóng đá", membersCount: 15, status: "Đang hoạt động" },
    { id: 2, name: "Pickleball Pro", sport: "Pickleball", membersCount: 4, status: "Đang hoạt động" },
    { id: 3, name: "Spiker King", sport: "Bóng chuyền", membersCount: 12, status: "Tạm ngưng" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="h-6 w-6 text-sky-600" />
          Danh sách Đội thi đấu
        </h1>
        <Button className="gap-2 shadow-sm font-bold bg-sky-600 hover:bg-sky-700">
          <Plus className="h-4 w-4" />
          Thêm đội mới
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Tên đội</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Môn thi đấu</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Số lượng thành viên</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap">Trạng thái</TableHead>
                <TableHead className="font-bold text-slate-600 whitespace-nowrap text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id} className="hover:bg-slate-50">
                  <TableCell className="font-bold text-slate-800 whitespace-nowrap">{team.name}</TableCell>
                  <TableCell className="text-slate-600 whitespace-nowrap">{team.sport}</TableCell>
                  <TableCell className="text-slate-600 whitespace-nowrap font-medium text-center sm:text-left">{team.membersCount}</TableCell>
                  <TableCell>
                    <Badge variant={team.status === "Đang hoạt động" ? "default" : "secondary"} className="whitespace-nowrap shadow-none font-bold">
                      {team.status}
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