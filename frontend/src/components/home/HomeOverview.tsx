import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, MapPin, CalendarDays } from "lucide-react";
import type { Tournament } from "@/pages/tournamentPage";

export function HomeOverview({ tournament }: { tournament: Tournament }) {
  const getOrgName = (org: unknown) => {
    if (typeof org === 'string') return org;
    if (org && typeof org === 'object' && 'name' in org) return (org as { name: string }).name;
    return 'Ban tổ chức';
  };

  const timelineEvents = [];
  if (tournament.timeLine?.registrationStart) {
    timelineEvents.push({ time: new Date(tournament.timeLine.registrationStart).toLocaleDateString('vi-VN'), name: 'Mở đăng ký' });
  }
  if (tournament.timeLine?.tournamentStart) {
    timelineEvents.push({ time: new Date(tournament.timeLine.tournamentStart).toLocaleDateString('vi-VN'), name: 'Khai mạc' });
  }
  if (tournament.timeLine?.tournamentEnd) {
    timelineEvents.push({ time: new Date(tournament.timeLine.tournamentEnd).toLocaleDateString('vi-VN'), name: 'Bế mạc' });
  }
  if (tournament.galaConfig?.hasGala && tournament.galaConfig.time) {
    timelineEvents.push({ time: new Date(tournament.galaConfig.time).toLocaleDateString('vi-VN'), name: 'Gala Dinner' });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
      {/* Left Column: Media */}
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-sky-600" />
          Tổng quan giải đấu
        </h2>
        {tournament.videoUrl ? (
          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <iframe 
              src={tournament.videoUrl} 
              title="Trailer" 
              className="w-full h-full" 
              allowFullScreen 
            />
          </div>
        ) : tournament.bannerUrl ? (
          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
             <img src={`http://localhost:5001/${tournament.bannerUrl.replace(/\\/g, '/').replace(/^\/+/, '')}`} alt="Banner" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-video w-full rounded-2xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
            Không có hình ảnh/video
          </div>
        )}
      </div>

      {/* Right Column: Info & Timeline */}
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-slate-50 border-none shadow-sm">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-3 bg-sky-100 text-sky-600 rounded-xl shrink-0"><Building2 className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Ban tổ chức</p>
                <p className="font-semibold text-slate-800 leading-snug">{getOrgName(tournament.organizer)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 border-none shadow-sm">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0"><Users className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Đối tượng</p>
                <p className="font-semibold text-slate-800 leading-snug">{tournament.targetAudience || 'Tất cả'}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 border-none shadow-sm sm:col-span-2">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0"><MapPin className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Địa điểm thi đấu</p>
                <p className="font-semibold text-slate-800 leading-snug">{tournament.venue || tournament.location || 'Đang cập nhật'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {timelineEvents.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Lịch trình sự kiện</h3>
            <div className="relative flex justify-between items-center w-full px-2">
              <div className="absolute top-3 left-0 right-0 h-0.5 bg-slate-200 -z-10" />
              {timelineEvents.map((event, i) => (
                <div key={i} className="flex flex-col items-center gap-3 bg-white px-2">
                  <div className="h-5 w-5 rounded-full bg-sky-500 border-[4px] border-white shadow-sm" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">{event.time}</p>
                    <p className="text-xs text-slate-500 mt-1">{event.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}