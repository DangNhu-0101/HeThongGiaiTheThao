import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MatchHero from "@/components/match-detail/MatchHero";
import MatchNav from "@/components/match-detail/MatchNav";
import MatchTimeline from "@/components/match-detail/overview/MatchTimeline";
import MatchInfoCard from "@/components/match-detail/overview/MatchInfoCard";
import MatchScorersCard from "@/components/match-detail/overview/MatchScorersCard";
import { useMatchDetailStore } from "@/stores/useMatchDetailStore";

const MatchDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { matchData, loading, activeTab, fetchMatchDetail, setActiveTab } = useMatchDetailStore();

  useEffect(() => {
    fetchMatchDetail(id || "m1");
  }, [id, fetchMatchDetail]);

  if (loading || !matchData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-medium animate-pulse">
        Đang tải thông tin trận đấu...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Top Header & Scoreboard */}
        <MatchHero match={matchData} />
        
        {/* Navigation Tabs */}
        <MatchNav activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-8 w-full py-8">
          
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left Column: Timeline */}
              <div className="lg:col-span-2">
                <MatchTimeline events={matchData.events} teamAId={matchData.teamA.id} />
              </div>

              {/* Right Column: Info & Stats */}
              <div className="lg:col-span-1 space-y-6">
                <MatchInfoCard info={matchData.info} />
                <MatchScorersCard 
                  players={matchData.keyPlayers} 
                  teamA={matchData.teamA} 
                  teamB={matchData.teamB} 
                />
              </div>

            </div>
          )}

          {activeTab !== "overview" && (
            <div className="py-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
              Tính năng tab "{activeTab}" đang được cập nhật...
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MatchDetailPage;