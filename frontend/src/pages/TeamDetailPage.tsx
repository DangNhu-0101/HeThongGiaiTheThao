import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TeamHero from "@/components/team-detail/TeamHero";
import MemberCard from "@/components/team-detail/MemberCard";
import TeamAchievements from "@/components/team-detail/TeamAchievements";
import AllTournaments from "@/components/home/AllTournaments"; // Tái sử dụng component
import { useTeamStore } from "@/stores/useTeamStore";
import { Search } from "lucide-react";

const TeamDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { info, members, tournaments, achievements, loading, fetchTeamDetail } = useTeamStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTeamDetail(id || "t1");
  }, [id, fetchTeamDetail]);

  if (loading || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-medium animate-pulse">
        Đang tải thông tin đội thi đấu...
      </div>
    );
  }

  // Lọc thành viên theo thanh tìm kiếm
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* 1. Hero */}
        <TeamHero info={info} />

        <div className="max-w-7xl mx-auto px-8 w-full space-y-16 py-12">
          
          {/* 2. Danh sách thành viên */}
          <section>
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary rounded-full"></div>
                <h2 className="text-2xl font-black uppercase text-foreground">Danh sách thành viên</h2>
              </div>
              
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Tìm thành viên..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredMembers.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
            {filteredMembers.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">Không tìm thấy thành viên nào.</div>
            )}
          </section>

          {/* 3. Giải đấu đã tham gia (Tái sử dụng AllTournaments) */}
          <section>
             <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-8 bg-primary rounded-full"></div>
                <h2 className="text-2xl font-black uppercase text-foreground">Giải đấu tham gia</h2>
              </div>
             {/* Bọc trong div -mx-8 để bù trừ cho padding mặc định của AllTournaments nếu có */}
             <div className="-mx-8">
               <AllTournaments tournaments={tournaments} />
             </div>
          </section>

          {/* 4. Thành tích */}
          <TeamAchievements achievements={achievements} />

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TeamDetailPage;