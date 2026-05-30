import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Users, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tournament } from "@/types/tournament";

const IMAGE_BASE_URL = "http://localhost:5001/";

interface TournamentCardProps {
  tournament: Tournament;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
  const tourId = (tournament._id || (tournament as { id?: string | number }).id || "").toString();
  
  // Format ảnh và ngày tháng an toàn
  const bannerUrl = tournament.banner ? `${IMAGE_BASE_URL}${tournament.banner.replace(/\\/g, '/')}` : null;
  const logoUrl = tournament.logo ? `${IMAGE_BASE_URL}${tournament.logo.replace(/\\/g, '/')}` : null;
  const startDate = tournament.timeLine?.tournamentStart 
    ? new Date(tournament.timeLine.tournamentStart).toLocaleDateString("vi-VN") 
    : "Đang cập nhật";

  // Số lượng đội và môn thi đấu
  const teamCount = (tournament as { registeredTeams?: unknown[] }).registeredTeams?.length || (tournament as { teams?: unknown[] }).teams?.length || 0;
  const sportNames = tournament.sportType?.join(", ") || "Pickleball";

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ongoing": return <Badge className="bg-green-500 hover:bg-green-600 text-white font-bold shadow-xs border-none">Đang diễn ra</Badge>;
      case "upcoming": return <Badge className="bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-xs border-none">Sắp diễn ra</Badge>;
      case "completed": return <Badge className="bg-slate-500 hover:bg-slate-600 text-white font-bold shadow-xs border-none">Đã kết thúc</Badge>;
      default: return <Badge variant="outline" className="bg-white/90">Đang cập nhật</Badge>;
    }
  };

  return (
    <Link to={`/tournaments/${tourId}`} className="block group">
      <Card className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 bg-white">
        
        {/* Phần Banner & Logo */}
        <div className="relative h-32 w-full bg-slate-100">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-sky-800 to-sky-500 opacity-90" />
          )}
          
          {/* Lớp phủ gradient cho mượt */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Badge Trạng thái góc phải */}
          <div className="absolute top-3 right-3">
            {getStatusBadge(tournament.status)}
          </div>

          {/* Logo đè lên viền dưới của Banner */}
          <div className="absolute -bottom-6 left-4 h-14 w-14 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm flex items-center justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Trophy className="h-6 w-6 text-slate-300" />
            )}
          </div>
        </div>

        <CardContent className="pt-8 pb-4 px-4">
          <h3 className="font-extrabold text-slate-900 text-lg line-clamp-1 group-hover:text-sky-700 transition-colors">
            {tournament.name}
          </h3>
          <p className="text-xs text-sky-600 font-bold mb-3 mt-1 truncate uppercase tracking-wide">
            {sportNames}
          </p>

          <div className="flex flex-col gap-2 mt-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="font-medium">{startDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">{typeof tournament.location === 'string' ? tournament.location : (tournament.location as { name?: string })?.name || "Chưa thiết lập sân"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400 shrink-0" />
              <span><strong className="text-slate-900">{teamCount}</strong> đội tham gia</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};