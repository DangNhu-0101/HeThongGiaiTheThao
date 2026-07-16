import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import type { Sport } from "@/types/tournament";
import { Button } from "@/components/ui/button";
import { getSportAssetKey, getSportImage } from "@/utils/sportAssets";

interface SportsCarouselProps {
  sports: Sport[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const SportsCarousel = ({ sports, loading = false, error, onRetry }: SportsCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const uniqueSports = useMemo(() => {
    const seen = new Set<string>();
    return sports.filter((sport) => {
      const key = getSportAssetKey(sport.slug || sport.name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [sports]);

  const checkScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [uniqueSports.length, loading]);

  const scroll = (direction: "left" | "right") => {
    const node = carouselRef.current;
    if (!node) return;
    const firstCard = node.querySelector<HTMLElement>("[data-sport-card]");
    node.scrollBy({
      left: (direction === "left" ? -1 : 1) * (firstCard ? firstCard.offsetWidth + 20 : 320),
      behavior: "smooth",
    });
  };

  return (
    <section className="section-y page-shell">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="section-kicker">Môn thi đấu</span>
          <h2 className="mt-4 text-[clamp(1.75rem,4vw,2.625rem)] font-extrabold tracking-normal text-foreground">
            Khám phá môn thi đấu
          </h2>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => scroll("left")} disabled={!canScrollLeft} className="rounded-full" aria-label="Chuyển sang môn trước">
            <ChevronLeft className="size-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => scroll("right")} disabled={!canScrollRight} className="rounded-full" aria-label="Chuyển sang môn tiếp theo">
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-5 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-72 w-[min(78vw,20rem)] shrink-0 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto size-10 text-primary" />
          <h3 className="mt-4 text-xl font-bold text-foreground">Chưa thể tải môn thi đấu</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{error}</p>
          <Button onClick={onRetry} className="mt-5">Thử lại</Button>
        </div>
      ) : uniqueSports.length === 0 ? (
        <div className="summer-panel rounded-2xl p-10 text-center">
          <Trophy className="mx-auto size-10 text-primary" />
          <h3 className="mt-4 text-xl font-bold text-foreground">Chưa có môn thi đấu</h3>
          <p className="mt-2 text-sm text-muted-foreground">Danh sách môn sẽ được cập nhật từ cấu hình hệ thống.</p>
        </div>
      ) : (
        <div className="relative overflow-hidden">
          <div
            ref={carouselRef}
            onScroll={checkScroll}
            className="flex snap-x snap-mandatory gap-5 overflow-x-hidden scroll-smooth pb-4"
          >
            {uniqueSports.map((sport) => (
              <Link
                key={sport._id}
                data-sport-card
                to={`/tournaments?sport=${encodeURIComponent(sport.slug || sport.name)}`}
                className="group w-[min(78vw,20rem)] shrink-0 snap-start focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 sm:w-[18rem] lg:w-[20rem]"
              >
                <div className="relative h-[21rem] overflow-hidden rounded-2xl border border-border bg-header shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-soft)]">
                  <img
                    src={sport.imageUrl || getSportImage(sport.slug, sport.name)}
                    alt={`Môn ${sport.name}`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/36 to-slate-950/10" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="mb-4 flex size-12 items-center justify-center overflow-hidden rounded-xl border border-white/25 bg-white/18 text-xl font-bold shadow-lg backdrop-blur-md">
                      {sport.iconUrl ? (
                        <img src={sport.iconUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Trophy className="size-6 text-white" />
                      )}
                    </div>
                    <h4 className="line-clamp-2 min-h-[3.5rem] text-xl font-bold leading-tight text-white">{sport.name}</h4>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="whitespace-nowrap rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/15">
                        {sport.eventCount.toLocaleString("vi-VN")} giải
                      </span>
                      <span className="whitespace-nowrap text-xs font-bold text-white/72 transition-colors group-hover:text-white">
                        Xem danh sách
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default SportsCarousel;
