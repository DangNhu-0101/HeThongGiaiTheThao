import PublicHero from "@/components/layout/PublicHero";
import heroImage from "@/assets/spectator.png";

interface TournamentListingHeroProps {
  total: number;
  active: number;
  open: number;
  sportCount: number;
}

const TournamentListingHero = ({ total, active, open, sportCount }: TournamentListingHeroProps) => {
  return (
    <PublicHero
      eyebrow="Danh sách giải đấu"
      title="Tìm sân chơi phù hợp cho đội của bạn"
      description="Khám phá các giải đang hoạt động, sắp diễn ra và đã hoàn tất trên nhiều môn thể thao. Bộ lọc nhanh giúp người chơi chọn đúng mùa giải, đúng khu vực và đúng cấp độ."
      imageSrc={heroImage}
      imageAlt="Vận động viên thi đấu trên sân thể thao"
      stats={[
        { value: total, label: "Tổng giải" },
        { value: active, label: "Đang diễn ra" },
        { value: open, label: "Mở đăng ký" },
        { value: sportCount, label: "Môn thể thao" },
      ]}
    />
  );
};

export default TournamentListingHero;
