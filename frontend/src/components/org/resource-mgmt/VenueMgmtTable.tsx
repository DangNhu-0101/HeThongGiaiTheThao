import { Eye, Edit, Trash2 } from "lucide-react";
import type { OrgVenueRecord } from "@/types/orgResourceMgmt";
import { Button } from "@/components/ui/button";

interface Props {
  records: OrgVenueRecord[];
  isMobile: boolean;
  onEdit?: (record: OrgVenueRecord) => void;
  onDelete?: (record: OrgVenueRecord) => void;
}

const VenueMgmtTable = ({ records, isMobile, onEdit, onDelete }: Props) => {
  const renderStatus = (status: string) => {
    switch (status) {
      case 'Available': return <span className="bg-green-50 text-green-600 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-max"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span> Sẵn sàng</span>;
      case 'Booked': return <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded w-max flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> Đã đặt</span>;
      case 'Maintenance': return <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-bold px-2 py-0.5 rounded w-max flex items-center gap-1"><span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span> Bảo trì</span>;
      default: return <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded w-max flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Đóng cửa</span>;
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        {records.map((r) => (
          <div key={r.id} className="bg-card border border-border rounded-xl p-4 shadow-sm relative">
            <div className="absolute top-4 right-4">{renderStatus(r.status)}</div>
            <h4 className="font-bold text-foreground text-sm pr-24">{r.name}</h4>
            <p className="text-xs text-muted-foreground mb-3">{r.location} • {r.type}</p>
            
            <div className="mb-3">
              <span className="text-[10px] text-muted-foreground block mb-1 uppercase font-bold">Môn thi đấu</span>
              <div className="flex flex-wrap gap-1">
                {r.sports.map((s, i) => <span key={i} className="bg-muted text-foreground text-[10px] px-2 py-0.5 rounded">{s}</span>)}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-border pt-3">
              <div>
                <span className="text-[10px] text-muted-foreground block uppercase font-bold">Lịch tiếp theo</span>
                <span className="text-xs font-semibold">{r.nextBooking}</span>
              </div>
              <div className="flex gap-1">
                {onEdit && <Button size="sm" variant="ghost" onClick={() => onEdit(r)} className="h-7 w-7 p-0 text-muted-foreground"><Edit className="w-4 h-4" /></Button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto beautiful-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/30 text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="p-4 font-semibold">Tên sân & Địa điểm</th>
              <th className="p-4 font-semibold">Loại sân</th>
              <th className="p-4 font-semibold">Môn thi đấu</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 font-semibold">Lịch tiếp theo</th>
              <th className="p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-muted/10 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">VN</div>
                    <div>
                      <p className="font-bold text-sm leading-tight">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground">{r.location}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-xs font-semibold text-muted-foreground">{r.type}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {r.sports.map((s, i) => <span key={i} className="bg-muted border border-border/50 text-foreground text-[10px] px-2 py-0.5 rounded">{s}</span>)}
                  </div>
                </td>
                <td className="p-4">{renderStatus(r.status)}</td>
                <td className="p-4 text-xs font-semibold">{r.nextBooking}</td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Xem"><Eye className="w-4 h-4" /></button>
                    {onEdit && <button className="p-1.5 text-muted-foreground hover:text-accent transition-colors" title="Sửa" onClick={() => onEdit(r)}><Edit className="w-4 h-4" /></button>}
                    {onDelete && <button className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Xóa" onClick={() => onDelete(r)}><Trash2 className="w-4 h-4" /></button>}
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
export default VenueMgmtTable;
