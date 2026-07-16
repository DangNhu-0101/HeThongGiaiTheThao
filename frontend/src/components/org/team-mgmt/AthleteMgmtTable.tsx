import { Check, Edit, Eye, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrgAthleteRecord } from "@/types/orgAthleteMgmt";

interface Props {
  records: OrgAthleteRecord[];
  isMobile: boolean;
  onToggleStatus: (id: string, status: OrgAthleteRecord["status"]) => void;
  onView?: (record: OrgAthleteRecord) => void;
  onEdit?: (record: OrgAthleteRecord) => void;
}

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value) && value.length) return value.join(", ");
  if (typeof value === "object" && "name" in value) return String((value as { name?: string }).name || "-");
  return "-";
};

const renderStatus = (status: string) => {
  if (status === "Active") return <span className="w-max rounded border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">Đang hoạt động</span>;
  if (status === "Pending") return <span className="w-max rounded border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">Chờ duyệt</span>;
  return <span className="w-max rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">Đình chỉ</span>;
};

const Avatar = ({ record }: { record: OrgAthleteRecord }) => (
  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary">
    {record.avatarUrl ? <img src={record.avatarUrl} alt={record.name} className="h-full w-full object-cover" /> : record.avatar}
  </div>
);

const AthleteMgmtTable = ({ records, isMobile, onToggleStatus, onView, onEdit }: Props) => {
  if (!records.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Chưa có vận động viên trong giải đang chọn.
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {records.map((record) => (
          <div key={record.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar record={record} />
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold text-foreground">{record.name}</h4>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{record.teamName}</p>
                </div>
              </div>
              {renderStatus(record.status)}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/30 p-2 text-center text-xs">
              <div><span className="block text-[10px] uppercase text-muted-foreground">Giới tính/Tuổi</span><strong>{record.gender}, {record.age || "-"}</strong></div>
              <div><span className="block text-[10px] uppercase text-muted-foreground">Trình độ</span><strong>{record.rating}</strong></div>
              <div><span className="block text-[10px] uppercase text-muted-foreground">Đăng ký</span><strong>{record.registeredAt}</strong></div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="truncate text-xs text-muted-foreground">{formatValue(record.contact)}</span>
              <div className="flex gap-1">
                {record.status === "Pending" && <Button size="icon-sm" variant="outline" onClick={() => onToggleStatus(record.id, "Active")} aria-label="Duyệt vận động viên"><Check className="h-4 w-4" /></Button>}
                <Button size="icon-sm" variant="ghost" onClick={() => onView?.(record)} aria-label="Xem vận động viên"><Eye className="h-4 w-4" /></Button>
                <Button size="icon-sm" variant="ghost" onClick={() => onEdit?.(record)} aria-label="Sửa vận động viên"><Edit className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto beautiful-scrollbar">
        <table className="min-w-[900px] w-full table-fixed text-left text-sm">
          <thead className="border-b border-border bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-4 font-semibold">Vận động viên</th>
              <th className="p-4 font-semibold">Đội</th>
              <th className="p-4 text-center font-semibold">Trình độ</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 font-semibold">Liên hệ</th>
              <th className="p-4 text-center font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {records.map((record) => (
              <tr key={record.id} className="transition-colors hover:bg-muted/10">
                <td className="p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar record={record} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{record.name}</p>
                      <p className="text-[10px] text-muted-foreground">{record.gender} · {record.age || "-"} tuổi</p>
                    </div>
                  </div>
                </td>
                <td className="p-4"><span className="truncate text-xs font-semibold">{record.teamName}</span></td>
                <td className="p-4 text-center font-bold">{record.rating}</td>
                <td className="p-4">{renderStatus(record.status)}</td>
                <td className="p-4 text-xs"><p className="truncate font-semibold">{formatValue(record.contact)}</p><p className="text-[10px] text-muted-foreground">{record.registeredAt}</p></td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-1">
                    {record.status === "Pending" && <button onClick={() => onToggleStatus(record.id, "Active")} className="rounded p-1.5 text-green-600 hover:bg-green-50" title="Duyệt"><Check className="h-4 w-4" /></button>}
                    <button className="rounded p-1.5 text-muted-foreground hover:text-primary" title="Xem" onClick={() => onView?.(record)}><Eye className="h-4 w-4" /></button>
                    <button className="rounded p-1.5 text-muted-foreground hover:text-accent" title="Sửa" onClick={() => onEdit?.(record)}><Edit className="h-4 w-4" /></button>
                    {record.status === "Active" && <button onClick={() => onToggleStatus(record.id, "Suspended")} className="rounded p-1.5 text-red-500 hover:bg-red-50" title="Đình chỉ"><UserX className="h-4 w-4" /></button>}
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
