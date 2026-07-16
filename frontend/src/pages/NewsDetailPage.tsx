import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Loader2, Newspaper } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { RichTextRenderer } from "@/components/ui/rich-text-renderer";
import { newsService, type NewsRecord } from "@/services/newsService";
import { formatNewsDate } from "@/utils/newsDisplay";
import NewsImage from "@/components/news/NewsImage";
import RelatedNewsCarousel from "@/components/news/RelatedNewsCarousel";

const NewsDetailPage = () => {
  const { slug = "" } = useParams();
  const [item, setItem] = useState<NewsRecord | null>(null);
  const [related, setRelated] = useState<NewsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDetail = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError("");
    try {
      const detail = await newsService.get(slug);
      setItem(detail);
      setRelated(await newsService.related(detail.slug, 8));
    } catch (requestError) {
      console.error("Không thể tải bài viết:", requestError);
      setError("Không thể tải bài viết. Vui lòng kiểm tra lại đường dẫn hoặc thử lại sau.");
      setItem(null);
      setRelated([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchDetail(), 0);
    return () => window.clearTimeout(timeout);
  }, [fetchDetail]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="page-fade">
        {loading ? (
          <section className="page-shell flex min-h-[60dvh] items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Loader2 className="mx-auto mb-3 size-6 animate-spin text-primary" />
              Đang tải bài viết...
            </div>
          </section>
        ) : error || !item ? (
          <section className="page-shell flex min-h-[60dvh] items-center justify-center">
            <div className="summer-panel max-w-xl rounded-2xl p-8 text-center">
              <Newspaper className="mx-auto size-10 text-primary" />
              <h1 className="mt-4 text-2xl font-extrabold">Không tìm thấy bài viết</h1>
              <p className="mt-2 text-sm text-muted-foreground">{error || "Bài viết không tồn tại hoặc chưa được công bố."}</p>
              <Link to="/news" className="mt-5 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
                Quay lại tin tức
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="relative isolate overflow-hidden bg-[#d9efff] text-primary-dark">
              <NewsImage src={item.coverImage} alt={item.title} className="absolute inset-0 -z-20 h-full w-full object-cover" />
              <div className="absolute inset-0 -z-10 bg-[#47B0FF]/30" />
              <div className="absolute inset-0 -z-10 bg-white/34" />
              <div className="page-shell flex min-h-[25rem] flex-col justify-center py-14 sm:min-h-[29rem] md:min-h-[33rem] lg:py-20">
                <Link to="/news" className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-primary-dark/10 px-3 py-1.5 text-xs font-bold uppercase text-primary-dark ring-1 ring-primary-dark/15">
                  <ArrowLeft className="size-3.5" /> Tin tức
                </Link>
                <div className="max-w-4xl">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-white">
                    <Newspaper className="size-3.5" /> {item.topic || item.category || "Tin tức"}
                  </span>
                  <h1 className="mt-5 font-heading text-[clamp(2.25rem,5.6vw,4.25rem)] font-bold leading-[1.08] text-primary-dark">{item.title}</h1>
                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary-dark/76">
                    <CalendarDays className="size-4" /> {formatNewsDate(item.publishedAt || item.createdAt)}
                  </div>
                </div>
              </div>
            </section>

            <section className="section-y page-shell">
              <article className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
                <RichTextRenderer html={item.content || item.excerpt} className="rich-text-content" />
                <RelatedNewsCarousel items={related} />
              </article>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default NewsDetailPage;
