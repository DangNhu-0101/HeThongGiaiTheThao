import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="bg-header border-t-4 border-accent text-white mt-12 py-16">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="md:w-2/3">
          <h2 className="text-3xl md:text-4xl font-extrabold uppercase mb-4">
            BẠN ĐÃ SẴN SÀNG <span className="text-accent">TỔ CHỨC GIẢI ĐẤU?</span>
          </h2>
          <p className="text-subtitle text-sm md:text-base max-w-2xl leading-relaxed">
            Gia nhập hàng ngàn ban tổ chức đang tin tưởng TMS để quản lý giải đấu của họ một cách chuyên nghiệp. Bắt đầu miễn phí ngay hôm nay.
          </p>
        </div>
        <div className="md:w-1/3 flex gap-4 justify-end w-full">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-6 py-6 text-base w-full md:w-auto shadow-lg shadow-accent/20">
            🚀 Bắt đầu tổ chức
          </Button>
          <Button variant="outline" className="border-white/20 text-header-foreground hover:bg-white/10 hover:text-white px-6 py-6 text-base w-full md:w-auto">
            📞 Liên hệ Sales
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;