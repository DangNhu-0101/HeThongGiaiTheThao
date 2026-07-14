import SportsCarousel from "@/components/home/SportsCarousel";
import UpcomingMatches from "@/components/home/UpcomingMatches";
import { Button } from "@/components/ui/button";
import { RichTextRenderer } from "@/components/ui/rich-text-renderer";
import { Link } from "react-router-dom";
import type { Match, MatchResult, Sport, TournamentDetail } from "@/types/tournament";

interface OverviewTabProps {
  detail: TournamentDetail;
  sports: Sport[];
  upcomingMatches: Match[];
  recentResults: MatchResult[];
}

const OverviewTab = ({ detail, sports, upcomingMatches, recentResults }: OverviewTabProps) => {
  const registeredTeams = Math.min(detail.registeredTeams, detail.maxTeams);
  const remainingSlots = Math.max(0, detail.maxTeams - registeredTeams);
  const registrationClosed = remainingSlots === 0 || new Date(detail.timeLine.registrationEnd).getTime() < Date.now();
  const progress = Math.min(100, (registeredTeams / Math.max(1, detail.maxTeams)) * 100);
  const usesExternalRegistration = detail.registrationMode === "external" && Boolean(detail.registrationFormUrl);

  return (
    <div className="grid grid-cols-1 gap-8 py-8 md:grid-cols-3">
      <div className="space-y-8 md:col-span-2">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 border-l-4 border-primary pl-2 text-lg font-bold uppercase">Ve giải đấu nay</h3>
          <RichTextRenderer html={detail.about} />
        </section>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <SportsCarousel sports={sports} />
        </div>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 border-l-4 border-primary pl-2 text-lg font-bold uppercase">Thể thức thi dau</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {detail.format.map((format, index) => (
              <div key={index} className="rounded-lg bg-muted p-4">
                <h4 className="mb-1 font-bold text-foreground">{format.name}</h4>
                <RichTextRenderer html={format.description} className="text-xs" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="border-l-4 border-primary pl-2 text-lg font-bold uppercase">Ket qua gan day</h3>
            <span className="cursor-pointer text-xs font-bold text-primary hover:underline">Xem tat ca &rarr;</span>
          </div>
          <div className="space-y-3">
            {recentResults.map((result) => (
              <div key={result._id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/50 p-3 text-sm">
                <div className="w-16 text-xs text-muted-foreground">{result.date}</div>
                <div className="flex-1 text-right font-bold">{result.teamA.name}</div>
                <div className="mx-4 rounded bg-header px-4 py-1 font-bold text-white">{result.teamA.score} - {result.teamB.score}</div>
                <div className="flex-1 font-bold">{result.teamB.name}</div>
                <div className="hidden w-24 text-right text-xs text-muted-foreground sm:block">{result.stadium}</div>
              </div>
            ))}
            {recentResults.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                Chưa có kết quả trận đấu nào được công bố.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <div className={`${registrationClosed ? "bg-slate-800" : "bg-primary"} rounded-xl p-6 text-white shadow-lg`}>
          <h3 className="mb-2 font-bold uppercase">{registrationClosed ? "Đăng ký đã đóng" : "Đang mở đăng ký"}</h3>
          <p className="mb-4 text-xs text-white/80">
            {registrationClosed
              ? `Đã có ${registeredTeams}/${detail.maxTeams} đội. Giải đấu khong con nhan them đội.`
              : `Chỉ còn ${remainingSlots} suất. Đăng ký trước ${new Date(detail.timeLine.registrationEnd).toLocaleDateString("vi-VN")}.`}
          </p>
          <div className="mb-4 h-2 w-full rounded-full bg-black/20">
            <div className="h-2 rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
          {!registrationClosed && (usesExternalRegistration ? (
            <Button
              render={<a href={detail.registrationFormUrl} target="_blank" rel="noreferrer" />}
              className="mb-2 w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
            >
              Mở link đăng ký
            </Button>
          ) : (
            <Button
              render={<Link to={`/tournaments/${detail._id}/register`} />}
              className="mb-2 w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
            >
              Đăng ký trên hệ thống
            </Button>
          ))}
          {usesExternalRegistration && detail.registrationInstructions && !registrationClosed && (
            <p className="mb-3 text-xs text-white/80">{detail.registrationInstructions}</p>
          )}
          <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
            {detail.supportContacts || "Lien he Ban tổ chức"}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase text-muted-foreground">Thong tin giai</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex flex-col"><span className="text-xs text-muted-foreground">Mon thi dau</span><span className="font-semibold">{detail.sportType[0]}</span></li>
            <li className="flex flex-col"><span className="text-xs text-muted-foreground">Giải thưởng</span><span className="font-semibold text-accent-foreground">{detail.prizes[0].amount}</span></li>
            <li className="flex flex-col"><span className="text-xs text-muted-foreground">Ban tổ chức</span><span className="font-semibold">{detail.organizer}</span></li>
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase text-muted-foreground">Co cau giai thuong</h3>
          <div className="space-y-2">
            {detail.prizes.map((prize, index) => (
              <div key={index} className={`flex items-center justify-between rounded-lg border p-3 ${prize.color}`}>
                <span className="text-sm font-bold">{prize.rank}</span>
                <RichTextRenderer html={prize.amount} className="font-bold" />
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <UpcomingMatches matches={upcomingMatches} />
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
