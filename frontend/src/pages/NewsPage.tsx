import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Newspaper, Search } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PublicHero from "@/components/layout/PublicHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { newsService, type NewsRecord } from "@/services/newsService";
import NewsCard from "@/components/news/NewsCard";

const NewsPage = () => {
  const [news, setNews] = useState<NewsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [topic, setTopic] = useState("Tất cả");
  const [visibleCount, setVisibleCount] = useState(9);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setNews(await newsService.list({ status: "published", limit: 80 }));
    } catch (requestError) {
      console.error("Không thể tải tin tức:", requestError);
      setError("Không thể tải tin tức. Vui lòng thử lại sau.");
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchNews(), 0);
    return () => window.clearTimeout(timeout);
  }, [fetchNews]);

  const topics = useMemo(() => ["Tất cả", ...Array.from(new Set(news.map((item) => item.topic || item.category || "Tin tức")))], [news]);
  const filteredNews = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return news.filter((item) => {
      const matchTopic = topic === "Tất cả" || (item.topic || item.category || "Tin tức") === topic;
      const haystack = `${item.title} ${item.excerpt} ${item.content}`.toLowerCase();
      return matchTopic && (!normalizedSearch || haystack.includes(normalizedSearch));
    });
  }, [news, searchTerm, topic]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="page-fade">
        <PublicHero
          eyebrow="Tin tức"
          title="Cập nhật hoạt động và thông tin giải đấu"
          description="Theo dõi thông báo, câu chuyện vận hành và các nội dung mới nhất từ hệ thống giải đấu."
          imageAlt="Tin tức thể thao"
          stats={[
            { value: news.length, label: "Bài đã đăng" },
            { value: topics.length - 1, label: "Chủ đề" },
          ]}
        />

        <section className="section-y page-shell">
          <div className="mb-7 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setVisibleCount(9);
                }}
                className="h-11 pl-10"
                placeholder="Tìm theo tiêu đề hoặc nội dung"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto beautiful-scrollbar">
              {topics.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setTopic(item);
                    setVisibleCount(9);
                  }}
                  className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 ${
                    topic === item ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
              <Loader2 className="mx-auto mb-3 size-6 animate-spin text-primary" />
              Đang tải tin tức...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-700">
              <p className="font-bold">{error}</p>
              <Button onClick={fetchNews} className="mt-4">Thử lại</Button>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="summer-panel rounded-2xl p-10 text-center">
              <Newspaper className="mx-auto size-10 text-primary" />
              <h2 className="mt-4 text-xl font-extrabold">Chưa có tin tức phù hợp</h2>
              <p className="mt-2 text-sm text-muted-foreground">Hãy thử đổi từ khóa tìm kiếm hoặc chủ đề.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredNews.slice(0, visibleCount).map((item) => <NewsCard key={item._id} item={item} />)}
              </div>
              {filteredNews.length > visibleCount && (
                <div className="mt-8 flex justify-center">
                  <Button variant="outline" onClick={() => setVisibleCount((count) => count + 6)}>
                    Tải thêm tin tức
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default NewsPage;
