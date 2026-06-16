import { useState } from "react";
import type { ResultMatchRecord } from "@/types/orgResultMgmt";

interface Props {
  matches: ResultMatchRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ResultMatchList = ({ matches, selectedId, onSelect }: Props) => {
  const [activeTab, setActiveTab] = useState('all');

  const filtered = matches.filter(m => {
    if (activeTab === 'live') return m.status === 'Live';
    if (activeTab === 'pending') return m.status === 'Pending';
    if (activeTab === 'completed') return m.status === 'Completed';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-border text-xs font-bold bg-muted/20">
        <button onClick={() => setActiveTab('all')} className={`flex-1 py-3 ${activeTab === 'all' ? 'text-primary border-b-2 border-primary bg-background' : 'text-muted-foreground'}`}>Tất cả</button>
        <button onClick={() => setActiveTab('live')} className={`flex-1 py-3 flex items-center justify-center gap-1 ${activeTab === 'live' ? 'text-red-600 border-b-2 border-red-600 bg-background' : 'text-muted-foreground'}`}><span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span> Live</button>
        <button onClick={() => setActiveTab('pending')} className={`flex-1 py-3 ${activeTab === 'pending' ? 'text-orange-500 border-b-2 border-orange-500 bg-background' : 'text-muted-foreground'}`}>Chờ nhập</button>
        <button onClick={() => setActiveTab('completed')} className={`flex-1 py-3 ${activeTab === 'completed' ? 'text-green-600 border-b-2 border-green-600 bg-background' : 'text-muted-foreground'}`}>Xong</button>
      </div>

      <div className="p-3 border-b border-border">
        <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none">
          <option>Tất cả giải đấu</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto beautiful-scrollbar p-3 space-y-3">
        {filtered.map(m => (
          <div 
            key={m.id} 
            onClick={() => onSelect(m.id)}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedId === m.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-background hover:border-primary/50'}`}
          >
            <div className="flex justify-between items-center mb-2">
              {m.status === 'Live' ? (
                <span className="bg-red-50 text-red-600 border border-red-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Live</span>
              ) : m.status === 'Pending' ? (
                <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Chờ nhập</span>
              ) : (
                <span className="bg-green-50 text-green-600 border border-green-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Đã xong</span>
              )}
              <span className="text-[10px] text-primary font-bold">{m.matchCode}</span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground mb-3">
              <span>{m.time}</span>
              <span>{m.venue}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`font-bold text-sm ${selectedId === m.id ? 'text-foreground' : 'text-muted-foreground'}`}>{m.teamA.name}</span>
                <span className="font-black text-lg">{m.status === 'Pending' ? '-' : m.teamA.score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`font-bold text-sm ${selectedId === m.id ? 'text-foreground' : 'text-muted-foreground'}`}>{m.teamB.name}</span>
                <span className="font-black text-lg">{m.status === 'Pending' ? '-' : m.teamB.score}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ResultMatchList;