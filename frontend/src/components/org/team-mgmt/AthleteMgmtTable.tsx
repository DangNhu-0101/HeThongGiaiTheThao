import { Eye, Edit, UserX, Check } from "lucide-react";
import type { OrgAthleteRecord } from "@/types/orgAthleteMgmt";
import { Button } from "@/components/ui/button";

interface Props {
  records: OrgAthleteRecord[];
  isMobile: boolean;
  onToggleStatus: (id: string, status: OrgAthleteRecord['status']) => void;
}

const AthleteMgmtTable = ({ records, isMobile, onToggleStatus }: Props) => {
  const renderStatus = (status: string) => {
    switch (status) {
      case 'Active': return <span className="bg-green-50 text-green-600 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded w-max">Đang thi đấu</span>;
      case 'Pending': return <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-bold px-2 py-0.5 rounded w-max">Chờ duyệt</span>;
      case 'Suspended': return <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded w-max">Đình chỉ</span>;
      default: return null;
    }
  };

  // KỊCH BẢN 1: MOBILE (Card List)
  if (isMobile) {
    return (
      <div className="space-y-4">
        {records.map((r) => (
          <div key={r.id} className="bg-card border border-border rounded-xl p-4 shadow-sm relative">
            <div className="absolute top-4 right-4">{renderStatus(r.status)}</div>
            
            <div className="flex items-center gap-3 mb-4 pr-20">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {r.avatar}
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm leading-tight">{r.name}</h4>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                  <span className="w-3 h-3 rounded-sm bg-muted flex items-center justify-center font-bold">{r.teamLogo}</span>
                  {r.teamName}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs mb-4 bg-muted/30 p-2 rounded-lg">
               <div className="text-center"><span className="text-muted-foreground block text-[10px] mb-0.5 uppercase">Giới tính/Tuổi</span><span className="font-semibold">{r.gender}, {r.age}</span></div>
               <div className="text-center border-l border-r border-border/50"><span className="text-muted-foreground block text-[10px] mb-0.5 uppercase">Trình độ</span><span className="font-semibold text-accent-foreground">{r.rating}</span></div>
               <div className="text-center"><span className="text-muted-foreground block text-[10px] mb-0.5 uppercase">Đăng ký</span><span className="font-semibold">{r.registeredAt}</span></div>
            </div>

            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="text-[10px] text-muted-foreground">{r.contact}</span>
              <div className="flex gap-2">
                {r.status === 'Pending' && (
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-green-200 text-green-600 hover:bg-green-50" onClick={() => onToggleStatus(r.id, 'Active')}><Check className="w-3 h-3"/></Button>
                )}
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground"><Eye className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground"><Edit className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // KỊCH BẢN 2: DESKTOP (Data Table)
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto beautiful-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/30 text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="p-4 w-10"><input type="checkbox" className="rounded accent-primary" /></th>
              <th className="p-4 font-semibold">Vận động viên</th>
              <th className="p-4 font-semibold">Trực thuộc Đội</th>
              <th className="p-4 font-semibold text-center">Trình độ</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 font-semibold">Liên hệ</th>
              <th className="p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-muted/10 transition-colors group">
                <td className="p-4"><input type="checkbox" className="rounded accent-primary" /></td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">{r.avatar}</div>
                    <div>
                      <p className="font-bold text-sm leading-tight">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground">{r.gender} • {r.age} tuổi</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[9px] font-bold shrink-0">{r.teamLogo}</div>
                    <span className="font-semibold text-xs">{r.teamName}</span>
                  </div>
                </td>
                <td className="p-4 text-center font-black text-accent-foreground">{r.rating}</td>
                <td className="p-4">{renderStatus(r.status)}</td>
                <td className="p-4 text-xs">
                  <p className="font-semibold">{r.contact}</p>
                  <p className="text-[10px] text-muted-foreground">{r.registeredAt}</p>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    {r.status === 'Pending' && (
                       <button onClick={() => onToggleStatus(r.id, 'Active')} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Duyệt"><Check className="w-4 h-4" /></button>
                    )}
                    <button className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Xem"><Eye className="w-4 h-4" /></button>
                    <button className="p-1.5 text-muted-foreground hover:text-accent transition-colors" title="Sửa"><Edit className="w-4 h-4" /></button>
                    {r.status === 'Active' && (
                       <button onClick={() => onToggleStatus(r.id, 'Suspended')} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Đình chỉ"><UserX className="w-4 h-4" /></button>
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
export default AthleteMgmtTable;