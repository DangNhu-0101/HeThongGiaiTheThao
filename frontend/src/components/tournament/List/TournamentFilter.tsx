import React from "react";
import { Search } from "lucide-react";

interface TournamentFilterProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

export const TournamentFilter: React.FC<TournamentFilterProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}) => {
  const filterTabs = [
    { value: "all", label: "Tất cả giải đấu" },
    { value: "ongoing", label: "Đang diễn ra" },
    { value: "upcoming", label: "Sắp diễn ra" },
    { value: "completed", label: "Đã kết thúc" },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
      
      {/* Cụm Tabs Trạng thái */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 md:pb-0">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-colors ${
              statusFilter === tab.value
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cụm Tìm kiếm */}
      <div className="relative w-full md:max-w-xs shrink-0">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Tìm tên giải đấu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
        />
      </div>
    </div>
  );
};