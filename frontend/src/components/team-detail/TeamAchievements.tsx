import { Trophy, Medal, Star } from "lucide-react";
import type { Achievement } from "@/types/Team";

const TeamAchievements = ({ achievements }: { achievements: Achievement[] }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'champion': return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 'runner-up': return <Medal className="w-8 h-8 text-gray-400" />;
      case 'third-place': return <Medal className="w-8 h-8 text-orange-500" />;
      default: return <Star className="w-8 h-8 text-blue-400" />;
    }
  };

  return (
    <section className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-primary rounded-full"></div>
        <h2 className="text-2xl font-black uppercase text-foreground">Thành tích nổi bật</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achieve) => (
          <div key={achieve.id} className="bg-card border border-border rounded-xl p-6 flex gap-4 items-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              {getIcon(achieve.type)}
            </div>
            <div>
              <div className="text-xs font-black text-primary mb-1">{achieve.year}</div>
              <h4 className="font-bold text-foreground leading-tight">{achieve.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{achieve.description}</p>
            </div>
          </div>
        ))}
        {achievements.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground italic">
            Chưa có thành tích nào được ghi nhận.
          </div>
        )}
      </div>
    </section>
  );
};

export default TeamAchievements;