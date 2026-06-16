const TABS = [
  { id: "overview", label: "Tổng quan" },
  { id: "teams", label: "Đội thi" },
  { id: "schedule", label: "Lịch thi đấu" },
  { id: "standings", label: "Bảng xếp hạng" },
  { id: "bracket", label: "Sơ đồ" }
];

const TournamentDetailNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  return (
    <div className="bg-card border-b border-border sticky top-[72px] z-40">
      <div className="max-w-7xl mx-auto px-8 flex gap-8 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 text-sm font-bold uppercase transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
export default TournamentDetailNav;