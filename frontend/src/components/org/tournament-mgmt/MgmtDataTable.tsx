import { Eye, Edit, Send } from "lucide-react";
import type { TournamentRecord } from "@/types/orgTournamentMgmt";
import { Button } from "@/components/ui/button";

interface Props {
  records: TournamentRecord[];
  isMobile: boolean;
}

const MgmtDataTable = ({ records, isMobile }: Props) => {
  // Helper render Badge Trạng thái
  const renderStatus = (status: string) => {
    switch (status) {
      case 'Live': return <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-max"><span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span> Live</span>;
      case 'Registration Open': return <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded w-max">Reg. Open</span>;
      case 'Draft': return <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold px-2 py-0.5 rounded w-max">Draft</span>;
      default: return <span className="bg-green-50 text-green-600 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded w-max">Completed</span>;
    }
  };

  // KỊCH BẢN 1: GIAO DIỆN MOBILE (Dạng Card List)
  if (isMobile) {
    return (
      <div className="space-y-4">
        {records.map((r) => (
          <div key={r.id} className="bg-card border border-border rounded-xl p-4 shadow-sm relative">
            <div className="absolute top-4 right-4">{renderStatus(r.status)}</div>
            <h4 className="font-bold text-foreground pr-20">{r.name}</h4>
            <p className="text-xs text-muted-foreground mb-4">{r.sport} • {r.season}</p>
            
            <div className="grid grid-cols-2 gap-y-3 text-xs mb-4">
               <div><span className="text-muted-foreground block mb-0.5">Thời gian</span><span className="font-semibold">{r.startDate} - {r.endDate}</span></div>
               <div><span className="text-muted-foreground block mb-0.5">Đội thi</span><span className="font-semibold">{r.teamsCount} đội</span></div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-[10px] font-semibold mb-1">
                <span className={r.registration.isOpen ? "text-orange-500" : "text-muted-foreground"}>{r.registration.statusText}</span>
                <span>{r.registration.current}/{r.registration.max}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${r.status === 'Live' ? 'bg-primary' : r.registration.isOpen ? 'bg-orange-500' : 'bg-muted-foreground'}`} style={{ width: `${(r.registration.current / (r.registration.max || 1)) * 100}%` }}></div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Eye className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Edit className="w-4 h-4" /></Button>
              {r.status === 'Draft' && <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground ml-2">Publish</Button>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // KỊCH BẢN 2: GIAO DIỆN DESKTOP (Dạng Table chuẩn chỉ)
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto beautiful-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/30 text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="p-4 w-10"><input type="checkbox" className="rounded accent-primary" /></th>
              <th className="p-4 font-semibold">Giải đấu</th>
              <th className="p-4 font-semibold">Môn</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 font-semibold w-48">Đăng ký</th>
              <th className="p-4 font-semibold text-center">Đội thi</th>
              <th className="p-4 font-semibold">Thời gian</th>
              <th className="p-4 font-semibold">Doanh thu</th>
              <th className="p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-muted/10 transition-colors group">
                <td className="p-4"><input type="checkbox" className="rounded accent-primary" /></td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-[10px] shrink-0 text-secondary-foreground">{r.sport.substring(0,2).toUpperCase()}</div>
                    <div>
                      <p className="font-bold text-sm leading-tight">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground">{r.season} • {r.format}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-xs font-semibold">{r.sport}</td>
                <td className="p-4">{renderStatus(r.status)}</td>
                <td className="p-4">
                  <div className="flex justify-between text-[10px] font-semibold mb-1">
                    <span className={r.registration.isOpen ? "text-orange-500" : "text-muted-foreground"}>{r.registration.statusText}</span>
                    <span>{r.registration.current}/{r.registration.max}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${r.status === 'Live' ? 'bg-primary' : r.registration.isOpen ? 'bg-orange-500' : 'bg-muted-foreground'}`} style={{ width: `${(r.registration.current / (r.registration.max || 1)) * 100}%` }}></div>
                  </div>
                </td>
                <td className="p-4 text-center font-bold">{r.teamsCount}</td>
                <td className="p-4 text-xs">
                  <p className="font-semibold">{r.startDate} - {r.endDate}</p>
                  <p className="text-[10px] text-muted-foreground">Bắt đầu / Kết thúc</p>
                </td>
                <td className="p-4 text-xs">
                  <p className="font-bold">{r.revenue.amount}</p>
                  <p className={`text-[10px] font-semibold ${r.revenue.isUp ? 'text-green-600' : 'text-muted-foreground'}`}>{r.revenue.projectedText}</p>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    {r.status === 'Draft' ? (
                       <Button size="sm" className="h-7 text-[10px] bg-primary hover:bg-primary-hover text-white rounded gap-1"><Send className="w-3 h-3"/> Publish</Button>
                    ) : (
                      <>
                        <button className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Xem"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-muted-foreground hover:text-accent transition-colors" title="Sửa"><Edit className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default MgmtDataTable;