import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="bg-gradient-to-r from-hero-start to-hero-end text-white px-8 py-20 flex flex-col md:flex-row items-center justify-between overflow-hidden">
      <div className="md:w-1/2 space-y-6 z-10">
        <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-accent backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          LIVE TOURNAMENTS ACTIVE
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold uppercase leading-tight">
          Nền tảng quản lý <br/><span className="text-accent">Giải Đấu</span>
        </h1>
        <p className="text-subtitle text-lg max-w-md">
          Quản lý, theo dõi và trải nghiệm các giải đấu đa môn thể thao với công cụ chuyên nghiệp. Từ chia nhánh đến tỉ số trực tiếp.
        </p>
        <div className="flex gap-4 pt-4">
          <Button className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-6 text-lg">Khám phá Giải đấu</Button>
          <Button variant="outline" className="border-white text-primary hover:bg-white hover:text-primary px-8 py-6 text-lg">Xem trực tiếp</Button>
        </div>
        <div className="flex gap-8 pt-8 border-t border-white/20 mt-8">
          <div><h4 className="text-3xl font-bold">240+</h4><p className="text-sm text-subtitle">Giải đang diễn ra</p></div>
          <div><h4 className="text-3xl font-bold">1,840</h4><p className="text-sm text-subtitle">Đội đăng ký</p></div>
          <div><h4 className="text-3xl font-bold">12</h4><p className="text-sm text-subtitle">Môn thể thao</p></div>
        </div>
      </div>
      
      {/* Đã sửa lại cấu trúc thẻ bọc ảnh để không bị tràn bảng tỉ số */}
      <div className="md:w-1/2 mt-12 md:mt-0 relative w-full max-w-xl mx-auto flex justify-end">
        <div className="relative w-full aspect-video rounded-2xl shadow-2xl overflow-hidden border border-white/10">
          <img src="https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=800&q=80" alt="Sports" className="w-full h-full object-cover" />
          
          {/* Bảng tỉ số Absolute bám theo khung cha */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md rounded-xl p-4 flex justify-between items-center border border-white/20">
            <div className="flex items-center gap-4 text-white w-1/3">
              <div className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">VU</div>
              <div className="truncate">
                <p className="text-[10px] text-gray-300">LIVE NOW • 72'</p>
                <p className="font-bold text-sm truncate">Vũng Tàu Club</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-widest text-center w-1/3">2 - 1</div>
            <div className="flex items-center gap-4 text-white w-1/3 justify-end">
              <div className="text-right truncate">
                <p className="text-[10px] text-accent font-semibold">Tứ kết</p>
                <p className="font-bold text-sm truncate">Saigon Masters</p>
              </div>
              <div className="bg-green-600 w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">SG</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default Hero;