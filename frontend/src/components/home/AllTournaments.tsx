import type { Tournament } from "@/types/tournament"; 
import { Button } from "@/components/ui/button";

const AllTournaments = ({ tournaments }: { tournaments: Tournament[] }) => {
  return (
    <section className="py-12 px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] uppercase">Tất cả giải đấu</h2>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">Duyệt qua danh sách các sự kiện đang và sắp diễn ra</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((t) => (
          <div key={t._id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
            <div className="relative h-48">
              {/* Đổi imageUrl thành banner */}
              <img src={t.banner} alt={t.name} className="w-full h-full object-cover" /> 
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[var(--foreground)]">
                {/* Lấy phần tử đầu tiên của mảng sportType */}
                {t.sportType && t.sportType[0]}
              </div>
              {t.status === 'ongoing' && (
                <div className="absolute top-3 right-3 bg-[var(--primary)] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> LIVE
                </div>
              )}
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-lg text-[var(--card-foreground)] mb-2 line-clamp-2">{t.name}</h3>
              <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] mb-4">
                {/* Truy cập object location */}
                <span>📍 {t.location?.city}</span> 
                {/* Lấy ngày bắt đầu từ timeLine */}
                <span>🕒 {new Date(t.timeLine.tournamentStart).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="mt-auto flex justify-between items-center pt-4 border-t border-[var(--border)]">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">Giải thưởng</p>
                  <p className="font-bold text-[var(--accent-foreground)]">{t.prizes}</p>
                </div>
                <Button variant="outline" className="text-xs hover:bg-[var(--secondary)]">Chi tiết &rarr;</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
export default AllTournaments;