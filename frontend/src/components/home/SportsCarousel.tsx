import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Sport } from "@/types/tournament";
import { Button } from "@/components/ui/button";

// Mở rộng type để hỗ trợ ảnh (Nếu backend sau này trả về)
interface SportWithImage extends Sport {
  imageUrl?: string;
}

const SportsCarousel = ({ sports }: { sports: SportWithImage[] }) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Kiểm tra trạng thái cuộn để vô hiệu hóa (disable) nút khi đến đầu/cuối
  const checkScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      // Cộng thêm 1px để tránh sai số làm tròn của trình duyệt
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [sports]);

  // Hàm xử lý trượt đúng 1 Card
  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      // Lấy chiều rộng của 1 card (phần tử con đầu tiên) + khoảng cách gap-4 (16px)
      const firstCard = carouselRef.current.firstElementChild as HTMLElement;
      const scrollAmount = firstCard ? firstCard.offsetWidth + 16 : 300;

      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Mảng ảnh mặc định nếu dữ liệu chưa có ảnh
  const defaultImages = [
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=600&q=80", // Pickleball
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80", // Bóng đá
    "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80", // Cầu lông
    "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=80", // Tennis
  ];

  return (
    <section className="py-12 px-8 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-border pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground uppercase border-l-4 border-primary pl-2 leading-tight">
            Khám phá môn thi đấu
          </h2>
          <p className="text-muted-foreground text-sm mt-2 ml-3">
            Lọc các giải đấu theo sở trường và đam mê của bạn
          </p>
        </div>
        
        {/* Nút Điều Hướng (Arrows) */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="w-10 h-10 rounded-full border-border bg-card text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all disabled:opacity-30 disabled:hover:bg-card disabled:hover:text-foreground disabled:hover:border-border shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="w-10 h-10 rounded-full border-border bg-card text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all disabled:opacity-30 disabled:hover:bg-card disabled:hover:text-foreground disabled:hover:border-border shadow-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Carousel Track */}
      <div className="relative -mx-2 px-2">
        <div 
          ref={carouselRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4"
          // Ẩn thanh cuộn dọc mặc định để UI đẹp hơn
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} 
        >
          {/* Ẩn scrollbar cho Chrome/Safari/Edge */}
          <style>{`
            div::-webkit-scrollbar { display: none; }
          `}</style>

          {sports.map((sport, index) => {
            const img = sport.imageUrl || defaultImages[index % defaultImages.length];
            
            return (
              <div 
                key={sport._id} 
                // Tính toán width: Điện thoại (1 item) -> Tablet (2 item) -> Desktop (4 item)
                // calc(25% - 0.75rem) bù trừ chính xác khoảng cách gap-4 (1rem)
                className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)] flex-shrink-0 snap-start group cursor-pointer"
              >
                <div className="relative h-[340px] rounded-2xl overflow-hidden border border-border shadow-sm group-hover:shadow-xl transition-all duration-300">
                  
                  {/* Ảnh Nền */}
                  <img 
                    src={img} 
                    alt={sport.name} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Lớp màng đen Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
                  
                  {/* Nội dung bên trong Card */}
                  <div className="absolute bottom-0 w-full p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    
                    {/* Icon Emoji */}
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-2xl mb-4 border border-white/30 group-hover:bg-primary transition-colors duration-300 shadow-lg">
                      {sport.iconUrl}
                    </div>
                    
                    <h4 className="font-bold text-xl mb-2 text-white">{sport.name}</h4>
                    
                    <div className="flex items-center justify-between">
                      <span className="bg-accent/90 text-accent-foreground text-xs font-extrabold px-2 py-1 rounded-md shadow-sm">
                        {sport.eventCount} giải đấu
                      </span>
                      <span className="text-xs text-white/60 font-bold group-hover:text-white transition-colors duration-300">
                        Xem tất cả &rarr;
                      </span>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SportsCarousel;