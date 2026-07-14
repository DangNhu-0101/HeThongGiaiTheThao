import { Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import type { NewsRecord } from "@/services/newsService";
import { excerptOf, formatNewsDate } from "@/utils/newsDisplay";
import NewsImage from "./NewsImage";

const NewsCard = ({ item }: { item: NewsRecord }) => (
  <article className="group flex h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
    <Link to={`/news/${item.slug}`} className="flex w-full flex-col focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20">
      <div className="relative h-48 overflow-hidden bg-secondary">
        <NewsImage src={item.coverImage} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs font-bold text-primary">
          <span className="inline-flex items-center gap-2">
            <Newspaper className="size-4" /> {item.topic || item.category || "Tin tức"}
          </span>
          <span className="text-muted-foreground">{formatNewsDate(item.publishedAt || item.createdAt)}</span>
        </div>
        <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-tight">{item.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">{excerptOf(item)}</p>
        <span className="mt-auto pt-5 text-sm font-bold text-primary">Đọc tiếp</span>
      </div>
    </Link>
  </article>
);

export default NewsCard;
