import { useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import SportsCarousel from "@/components/home/SportsCarousel";
import AllTournaments from "@/components/home/AllTournaments";
import UpcomingMatches from "@/components/home/UpcomingMatches";
import { useHomeStore } from "@/stores/useHomeStore";

const HomePage = () => {
  const { tournaments, upcomingMatches, sports, loading, fetchHomeData } = useHomeStore();

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Đang tải dữ liệu...</div>;
  }

  return (
    // Thêm bg-background và text-foreground vào div ngoài cùng
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main>
        <Hero />
        <SportsCarousel sports={sports} />
        <AllTournaments tournaments={tournaments} />
        <UpcomingMatches matches={upcomingMatches} />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;