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
    detail, teams, recentResults, sports, upcomingMatches, 
    loading, activeTab, fetchDetail, setActiveTab 
  } = useTournamentDetailStore();

  useEffect(() => {
    // Gọi store fetch dữ liệu giả lập
    fetchDetail(id || "t1");
  }, [id, fetchDetail]);

  if (loading || !detail) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Đang tải thông tin giải đấu...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Header />
      
      <main className="flex-1">
        <TournamentDetailHero detail={detail} />
        <TournamentDetailNav activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="max-w-7xl mx-auto px-8 w-full">
          {activeTab === "overview" && (
            <OverviewTab 
              detail={detail} 
              sports={sports} 
              upcomingMatches={upcomingMatches}
              recentResults={recentResults}
            />
          )}
          {activeTab === "teams" && (
            <TeamsTab teams={teams} />
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
          {/* Chừa sẵn chỗ cho các Tab khác */}
         
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TournamentDetailPage;