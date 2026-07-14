const TABS = [
  { id: "overview", label: "Tổng quan" },
  { id: "teams", label: "Đội thi" },
  { id: "schedule", label: "Lịch thi đấu" },
  { id: "standings", label: "Bảng xếp hạng" },
  { id: "bracket", label: "Sơ đồ" },
];

const TournamentDetailNav = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) => {
  return (
    <div className="sticky top-[4.25rem] z-40 border-b border-border bg-card/92 backdrop-blur-xl">
      <div className="page-shell flex gap-3 overflow-x-auto beautiful-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-12 whitespace-nowrap border-b-2 px-2 text-sm font-bold transition-colors ${
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
