const TournamentListingHero = () => {
  return (
    <section className="bg-gradient-to-r from-hero-start to-hero-end text-white py-12 px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="md:w-1/2 space-y-4">
          <div className="text-sm text-subtitle flex gap-2 items-center">
            <span className="hover:text-white cursor-pointer transition-colors">Trang chủ</span> 
            <span>&gt;</span> 
            <span className="text-accent font-medium">Danh sách giải đấu</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold uppercase">
            TẤT CẢ <span className="text-accent">GIẢI ĐẤU</span>
          </h1>
          <p className="text-subtitle text-base max-w-lg leading-relaxed">
            Khám phá và duyệt qua hơn 240+ giải đấu đang hoạt động, sắp diễn ra và đã hoàn tất trên 12 môn thể thao trên toàn cầu.
          </p>
        </div>
        
        {/* Stats Boxes */}
        <div className="md:w-1/2 flex flex-wrap gap-4 justify-end">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 min-w-[120px] text-center">
            <h4 className="text-2xl font-bold text-white">240+</h4>
            <p className="text-xs text-subtitle">Tổng sự kiện</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 min-w-[120px] text-center">
            <h4 className="text-2xl font-bold text-accent">18</h4>
            <p className="text-xs text-subtitle">Đang diễn ra</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 min-w-[120px] text-center">
            <h4 className="text-2xl font-bold text-white">64</h4>
            <p className="text-xs text-subtitle">Mở đăng ký</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 min-w-[120px] text-center">
            <h4 className="text-2xl font-bold text-white">12</h4>
            <p className="text-xs text-subtitle">Môn thể thao</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TournamentListingHero;