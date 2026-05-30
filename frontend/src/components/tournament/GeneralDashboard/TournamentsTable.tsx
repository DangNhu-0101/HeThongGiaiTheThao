// src/components/dashboard/RecentTournamentsTable.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import  TournamentRulesModal  from "@/components/tournament/RuleModal/TournamentRulesModal"; // Cập nhật lại đường dẫn chéo nếu cần
import type { Tournament } from "@/types/tournament";

interface RecentTournamentsTableProps {
  tournamentList: Tournament[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export const RecentTournamentsTable: React.FC<RecentTournamentsTableProps> = ({
  tournamentList,
  loading,
  onRefresh,
}) => {
  return (
    <Card className="xl:col-span-2 shadow-xs border-slate-200 bg-white">
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-1">
          <CardTitle className="text-base font-bold">Giải đấu gần đây</CardTitle>
          <CardDescription className="text-xs">
            Danh sách các giải đấu thực tế lôi từ database hệ thống.
          </CardDescription>
        </div>
        <Button asChild size="sm" variant="outline" className="ml-auto gap-1 text-xs">
          <Link to="/tournaments"> 
            Xem tất cả
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow>
              <TableHead className="font-bold text-slate-700">Giải đấu</TableHead>
              <TableHead className="font-bold text-slate-700">Trạng thái</TableHead>
              <TableHead className="font-bold text-slate-700">Ngày tạo</TableHead>
              <TableHead className="text-center font-bold text-slate-700 w-24">Cấu hình vòng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-sm text-slate-400 font-medium">
                  Đang tải danh sách giải đấu thật...
                </TableCell>
              </TableRow>
            ) : tournamentList.length > 0 ? (
              tournamentList.map((tour) => {
                const tourId = tour._id || "";
                const dateStr = tour.createdAt ? new Date(tour.createdAt).toLocaleDateString("vi-VN") : "Chưa rõ";
                
                return (
                  <TableRow key={tourId} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="font-semibold text-slate-900">{tour.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {tour.sportType?.join(", ") || "Pickleball"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {tour.status === "ongoing" && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold">
                          Đang diễn ra
                        </Badge>
                      )}
                      {tour.status === "upcoming" && (
                        <Badge variant="secondary" className="bg-sky-50 text-sky-700 border-sky-200 font-semibold">
                          Sắp diễn ra
                        </Badge>
                      )}
                      {tour.status === "completed" && <Badge variant="destructive">Đã kết thúc</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{dateStr}</TableCell>
                    
                    <TableCell className="text-center">
                      <TournamentRulesModal tournamentId={tourId} onSuccess={onRefresh}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100" title="Cấu hình vòng đấu & luật">
                          <Settings2 className="h-4 w-4 text-slate-500" />
                        </Button>
                      </TournamentRulesModal>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-sm text-slate-400 font-medium">
                  Chưa có giải đấu nào được khởi tạo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};