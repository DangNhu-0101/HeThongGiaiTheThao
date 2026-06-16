import { useState } from "react";
import type { TopPerformer } from "@/types/standing";

interface TopPerformersProps {
  scorers: TopPerformer[];
  assists: TopPerformer[];
}

const TopPerformers = ({ scorers, assists }: TopPerformersProps) => {
  const [activeTab, setActiveTab] = useState<'scorers' | 'assists'>('scorers');

  const currentData = activeTab === 'scorers' ? scorers : assists;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 flex items-center gap-2 border-b border-border bg-muted/30">
        <div className="w-1 h-5 bg-accent rounded-full"></div>
        <h3 className="font-bold uppercase text-foreground">VĐV Xuất Sắc</h3>
      </div>

      <div className="p-4">
        {/* Toggle Tabs */}
        <div className="flex bg-muted p-1 rounded-lg mb-4">
          <button 
            onClick={() => setActiveTab('scorers')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'scorers' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Điểm số
          </button>
          <button 
            onClick={() => setActiveTab('assists')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'assists' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Kiến tạo
          </button>
        </div>

        {/* Danh sách */}
        <div className="space-y-1">
          {currentData.map((player) => (
            <div key={player.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
              <span className="w-4 text-xs font-bold text-muted-foreground text-center">
                {player.rank}
              </span>
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex flex-shrink-0 items-center justify-center font-bold text-xs">
                {player.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{player.playerName}</p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                  <div className="w-3 h-3 rounded-sm bg-muted flex items-center justify-center text-[8px] font-bold text-foreground">{player.teamLogo}</div>
                  <span className="truncate">{player.teamName}</span>
                </div>
              </div>
              <div className="font-bold text-foreground pl-2 text-right">
                {player.score}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopPerformers;