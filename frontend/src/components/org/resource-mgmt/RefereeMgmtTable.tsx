import { Eye, Edit, Trash2 } from "lucide-react";
import type { OrgRefereeRecord, WorkloadLevel } from "@/types/orgResourceMgmt";
import { Button } from "@/components/ui/button";

interface Props {
  records: OrgRefereeRecord[];
  isMobile: boolean;
  onEdit?: (record: OrgRefereeRecord) => void;
  onDelete?: (record: OrgRefereeRecord) => void;
  onView?: (record: OrgRefereeRecord) => void;
}

const RefereeMgmtTable = ({ records, isMobile, onEdit, onDelete, onView }: Props) => {
  const renderStatus = (status: string) => {
    switch (status) {
      case 'Available': return <span className="bg-green-50 text-green-600 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded w-max">Sẵn sàng</span>;
      case 'Assigned': return <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded w-max">Đang làm nhìệm vụ</span>;
      default: return <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded w-max">Không trống lịch</span>;
    }
  };

  const renderWorkload = (workload: WorkloadLevel) => {
    let color = '', width = '', label = '';
    switch(workload) {
      case 'Low': color = 'bg-green-500'; width = '25%'; label = 'Thấp'; break;
      case 'Med': color = 'bg-blue-500'; width = '50%'; label = 'Vừa'; break;
      case 'High': color = 'bg-orange-500'; width = '75%'; label = 'Cao'; break;
      case 'Over': color = 'bg-red-500'; width = '100%'; label = 'Quá tải'; break;
    }
    return (
      <div className="w-24">
        <div className="flex justify-between text-[10px] font-bold mb-1">
          <span className="text-muted-foreground uppercase">Tải CV</span>
          <span className={color.replace('bg-', 'text-')}>{label}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div className={`h-1.5 rounded-full ${color}`} style={{ width }}></div>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        {records.map((r) => (
          <div key={r.id} className="bg-card border border-border rounded-xl p-4 shadow-sm relative">
            <div className="absolute top-4 right-4">{renderStatus(r.status)}</div>
            <div className="flex items-center gap-3 mb-4 pr-24">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{r.avatar}</div>
              <div>
                <h4 className="font-bold text-foreground text-sm leading-tight">{r.name}</h4>
                <p className="text-[10px] text-muted-foreground">{r.refId} • {r.experience} năm KN</p>
              </div>
            </div>
            <div className="flex justify-between items-end mb-4">
               <div>
                 <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase font-bold">Chuyên môn</span>
                 <span className="bg-accent/10 text-accent-foreground text-xs font-bold px-2 py-0.5 rounded">{r.qualification}</span>
               </div>
               <div className="text-right">
                 <span className="text-xl font-black">{r.matchesAssigned}</span>
                 <span className="text-[10px] text-muted-foreground ml-1 uppercase">Trận</span>
               </div>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-3">
              {renderWorkload(r.workload)}
              <Button size="sm" variant="ghost" onClick={() => onEdit?.(r)} className="h-7 w-7 p-0 text-muted-foreground"><Edit className="w-4 h-4" /></Button>
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
              <th className="p-4 font-semibold">Trọng tài</th>
              <th className="p-4 font-semibold text-center">Số trận phân công</th>
              <th className="p-4 font-semibold">Khối lượng CV</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-muted/10 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">{r.avatar}</div>
                    <div>
                      <p className="font-bold text-sm leading-tight flex items-center gap-2">
                        {r.name} 
                        <span className="bg-accent/10 text-accent-foreground border border-accent/20 text-[9px] px-1.5 py-0.5 rounded uppercase">{r.qualification}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{r.experience} năm kinh nghiệm</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-black">{r.matchesAssigned}</span>
                    <span className="text-[9px] text-muted-foreground uppercase">Trận</span>
                  </div>
                </td>
                <td className="p-4">{renderWorkload(r.workload)}</td>
                <td className="p-4">{renderStatus(r.status)}</td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Xem" onClick={() => onView?.(r)}><Eye className="w-4 h-4" /></button>
                    <button className="p-1.5 text-muted-foreground hover:text-accent transition-colors" title="Sửa" onClick={() => onEdit?.(r)}><Edit className="w-4 h-4" /></button>
                    <button className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Xóa" onClick={() => onDelete?.(r)}><Trash2 className="w-4 h-4" /></button>
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
export default RefereeMgmtTable;
