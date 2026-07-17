import SportsCarousel from "@/components/home/SportsCarousel";
import UpcomingMatches from "@/components/home/UpcomingMatches";
import { Button } from "@/components/ui/button";
import { RichTextRenderer } from "@/components/ui/rich-text-renderer";
import { useEffect, useState } from "react";
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
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    queueMicrotask(() => setNow(Date.now()));
  }, []);
  const registrationClosed = remainingSlots === 0 || (now !== null && new Date(detail.timeLine.registrationEnd).getTime() < now);
  const progress = Math.min(100, (registeredTeams / Math.max(1, detail.maxTeams)) * 100);
  const usesExternalRegistration = detail.registrationMode === "external" && Boolean(detail.registrationFormUrl);
  const sponsorItems = detail.sponsors.filter((sponsor) => sponsor.status !== "inactive" && (sponsor.logo || sponsor.name));
  const marqueeSponsors = sponsorItems.length
    ? Array.from({ length: Math.max(2, Math.ceil(8 / sponsorItems.length)) }).flatMap(() => sponsorItems)
    : [];
  const formatDateTime = (date: Date) => date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="grid grid-cols-1 gap-8 py-8 md:grid-cols-3">
      <div className="space-y-8 md:col-span-2">
        {marqueeSponsors.length > 0 && (
          <section className="overflow-hidden rounded-xl border border-border bg-card py-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between px-5">
              <h3 className="border-l-4 border-primary pl-2 text-sm font-bold uppercase text-foreground">Nhà tài trợ</h3>
            </div>
            <div className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-card to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-card to-transparent" />
              <div className="tournament-sponsor-marquee flex w-max gap-4 px-5">
                {marqueeSponsors.map((sponsor, index) => {
                  const content = (
                    <div className="flex h-16 min-w-48 items-center gap-3 rounded-lg border border-border bg-background px-4 shadow-sm">
                      {sponsor.logo ? (
                        <img src={sponsor.logo} alt={sponsor.name} className="h-10 w-16 object-contain" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-sm font-black text-primary">
                          {sponsor.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{sponsor.name}</p>
                        {sponsor.sponsorType && <p className="truncate text-xs text-muted-foreground">{sponsor.sponsorType}</p>}
                      </div>
                    </div>
                  );
                  return sponsor.website ? (
                    <a key={`${sponsor._id || sponsor.name}-${index}`} href={sponsor.website} target="_blank" rel="noreferrer" className="shrink-0">
                      {content}
                    </a>
                  ) : (
                    <div key={`${sponsor._id || sponsor.name}-${index}`} className="shrink-0">
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 border-l-4 border-primary pl-2 text-lg font-bold uppercase">Về giải đấu này</h3>
          <RichTextRenderer html={detail.about} />
        </section>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <SportsCarousel sports={sports} compact hideControlsWhenSingle />
        </div>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 border-l-4 border-primary pl-2 text-lg font-bold uppercase">Thể thức thi đấu</h3>
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
            <h3 className="border-l-4 border-primary pl-2 text-lg font-bold uppercase">Kết quả gần đây</h3>
            <span className="cursor-pointer text-xs font-bold text-primary hover:underline">Xem tất cả &rarr;</span>
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
        <div className="rounded-xl bg-primary-dark p-6 text-white shadow-lg">
          <h3 className="mb-2 font-bold uppercase text-white/80">{registrationClosed ? "Đăng ký đã đóng" : "Đang mở đăng ký"}</h3>
          <p className="mb-4 text-xs text-white/80">
            {registrationClosed
              ? `Đã có ${registeredTeams}/${detail.maxTeams} đội. Giải đấu không còn nhận thêm đội.`
              : `Chỉ còn ${remainingSlots} suất. Đăng ký trước ${formatDateTime(new Date(detail.timeLine.registrationEnd))}.`}
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
          <Button render={<Link to="/contact" />} variant="outline" className="w-full border-white/30 bg-white/8 !text-white hover:bg-white/14">
            {detail.supportContacts || "Liên hệ Ban tổ chức"}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase text-muted-foreground">Thông tin giải</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex flex-col"><span className="text-xs text-muted-foreground">Môn thi đấu</span><span className="font-semibold">{detail.sportType[0]}</span></li>
           
            <li className="flex flex-col"><span className="text-xs text-muted-foreground">Thời gian đăng ký</span><span className="font-semibold">{formatDateTime(new Date(detail.timeLine.registrationStart))} - {formatDateTime(new Date(detail.timeLine.registrationEnd))}</span></li>
            <li className="flex flex-col"><span className="text-xs text-muted-foreground">Thời gian thi đấu</span><span className="font-semibold">{formatDateTime(new Date(detail.timeLine.tournamentStart))} - {formatDateTime(new Date(detail.timeLine.tournamentEnd))}</span></li>
            <li className="flex flex-col"><span className="text-xs text-muted-foreground">Địa điểm thi đấu</span><span className="font-semibold">{detail.location.detail || "Chưa cập nhật"}</span></li>
            
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase text-muted-foreground">Cơ cấu giải thưởng</h3>
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
