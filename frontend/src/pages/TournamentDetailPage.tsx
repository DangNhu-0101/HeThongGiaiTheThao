import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TournamentDetailHero from "@/components/tournament-detail/TournamentDetailHero";
import TournamentDetailNav from "@/components/tournament-detail/TournamentDetailNav";
import OverviewTab from "@/components/tournament-detail/overview/OverviewTab";
import TeamsTab from "@/components/tournament-detail/team/TeamsTab";
import { useTournamentDetailStore } from "@/stores/useTournamentDetailStore";
import BracketTab from "@/components/tournament-detail/bracket/BracketTab";
import StandingsTab from "@/components/tournament-detail/standing/StandingsTab";
import ScheduleTab from "@/components/tournament-detail/schedule/ScheduleTab";

const TournamentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    detail, recentResults, sports, upcomingMatches,
    loading, activeTab, fetchDetail, setActiveTab 
  } = useTournamentDetailStore();

  useEffect(() => {
    // Gọi store fetch dữ liệu giả lập
    fetchDetail(id || "t1");
  }, [id, fetchDetail]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-foreground">Đang tải thông tin giải đấu...</div>;
  }

  if (!detail) {
    return <div className="flex min-h-screen items-center justify-center bg-background font-bold text-muted-foreground">Không tìm thấy dữ liệu giải đấu.</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <Header />
      
      <main className="flex-1">
        <TournamentDetailHero detail={detail} />
        <TournamentDetailNav activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="page-shell w-full">
          {activeTab === "overview" && (
            <OverviewTab 
              detail={detail} 
              sports={sports} 
              upcomingMatches={upcomingMatches}
              recentResults={recentResults}
            />
          )}
          {activeTab === "teams" && (
            <TeamsTab tournamentItemId={id || detail._id || ""} />
          )}
          {activeTab === "bracket" && (
            <BracketTab tournamentId={id || "t1"} />
        )}
          {activeTab === "standings" && (
            <StandingsTab tournamentId={id || "t1"} />
          )}
          {activeTab === "schedule" && (
            <ScheduleTab tournamentId={id || "t1"} />
          )}
         
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TournamentDetailPage;


