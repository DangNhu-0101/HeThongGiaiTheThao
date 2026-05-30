import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Trophy, Activity, Medal } from "lucide-react";
import type { Tournament, Team, Match } from "@/pages/tournamentPage";

interface Props {
  tournament: Tournament;
  topTeams: Team[];
  liveMatches: Match[];
}

export function HomeRulesAndStandings({ tournament, topTeams, liveMatches }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
      {/* Col 1: Rules & Prizes */}
      <div className="flex flex-col gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
              <ScrollText className="h-5 w-5 text-sky-600" />
              Điều lệ & Thể thức
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-sm max-w-none text-slate-600 whitespace-pre-wrap">
              {tournament.rules || tournament.description || 'Đang cập nhật thể thức thi đấu...'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-md relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-400">
              <Trophy className="h-5 w-5" />
              Cơ cấu giải thưởng
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 relative z-10">
            <div className="whitespace-pre-wrap text-slate-300 leading-relaxed">
              {tournament.prizes || 'Đang cập nhật cơ cấu giải thưởng...'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Col 2: Live Matches & Standings */}
      <div className="flex flex-col gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl py-4 px-5 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800 m-0">
              <Activity className="h-5 w-5 text-rose-500" />
              Đang thi đấu
              <span className="relative flex h-3 w-3 ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </CardTitle>
            <Badge variant="outline" className="text-xs text-rose-600 font-bold border-rose-200 bg-rose-50">LIVE</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {liveMatches.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Hiện chưa có trận nào đang diễn ra.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {liveMatches.map((match) => (
                  <div key={match._id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col gap-4">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                      <span className="text-rose-600">🔴 {match.courtId?.name || 'Sân chưa xếp'}</span>
                      <span>{match.round ? `Vòng ${match.round}` : ''}</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <div className="flex-1 text-right truncate pr-4 text-sm sm:text-base">{match.team1?.name || 'Đội 1'}</div>
                      <div className="px-4 py-1.5 bg-slate-100 rounded-lg text-xl flex gap-2 tracking-widest shadow-inner">
                        <span className="text-sky-700">{match.team1Score ?? 0}</span>
                        <span className="text-slate-300">-</span>
                        <span className="text-sky-700">{match.team2Score ?? 0}</span>
                      </div>
                      <div className="flex-1 text-left truncate pl-4 text-sm sm:text-base">{match.team2?.name || 'Đội 2'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
              <Medal className="h-5 w-5 text-amber-500" />
              Bảng xếp hạng (Top 5)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topTeams.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Chưa có dữ liệu bảng xếp hạng.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {topTeams.map((team, index) => (
                  <div key={team._id || index} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm shadow-sm
                      ${index === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : index === 1 ? 'bg-slate-200 text-slate-600 border border-slate-300' : 'bg-slate-100 text-slate-500'}
                    `}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {typeof team.name === 'string' ? team.name : (team.name as {name?: string})?.name || team.teamCode || `Đội ${index + 1}`}
                      </p>
                      <p className="text-xs text-slate-500">{team.sportCategory || team.sportType || 'Chưa phân loại'}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="font-bold text-sky-700 bg-sky-100 hover:bg-sky-200">
                        {team.points || 0} pts
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}