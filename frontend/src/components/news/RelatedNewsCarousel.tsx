import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NewsRecord } from "@/services/newsService";
import NewsCard from "./NewsCard";

const RelatedNewsCarousel = ({ items }: { items: NewsRecord[] }) => {
  const [index, setIndex] = useState(0);
  const pageSize = Math.min(3, items.length);
  const maxIndex = Math.max(0, items.length - pageSize);
  const visibleItems = useMemo(() => items.slice(index, index + 3), [index, items]);

  if (items.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <span className="section-kicker">Bài viết liên quan</span>
          <h2 className="mt-3 text-2xl font-extrabold text-foreground">Cùng chủ đề</h2>
        </div>
        {items.length > 1 && (
          <div className="flex gap-2">
            <Button variant="outline" size="icon" aria-label="Bài trước" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>
              <ChevronLeft className="size-5" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Bài tiếp theo" disabled={index >= maxIndex} onClick={() => setIndex((value) => Math.min(maxIndex, value + 1))}>
              <ChevronRight className="size-5" />
            </Button>
          </div>
        )}
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item) => <NewsCard key={item._id} item={item} />)}
      </div>
    </section>
  );
};

export default RelatedNewsCarousel;
