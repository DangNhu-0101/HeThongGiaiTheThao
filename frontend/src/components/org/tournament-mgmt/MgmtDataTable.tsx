import { Edit, Eye, Send, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { TournamentRecord } from "@/types/orgTournamentMgmt";
import CreateTournamentModal from "./create-sections/CreateTournamentModal";

interface Props {
  records: TournamentRecord[];
  isMobile: boolean;
  onDelete?: (record: TournamentRecord) => void;
  onUpdated?: () => void;
}

const money = (value?: number) =>
  Number(value || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

const statusLabel = (status: TournamentRecord["status"]) => {
  if (status === "Live") return { label: "Đang diễn ra", className: "bg-red-50 text-red-700 border-red-200" };
  if (status === "Registration Open") return { label: "Mở đăng ký", className: "bg-blue-50 text-blue-700 border-blue-200" };
  if (status === "Draft") return { label: "Bản nháp", className: "bg-slate-100 text-slate-700 border-slate-200" };
  return { label: "Hoàn tất", className: "bg-green-50 text-green-700 border-green-200" };
};

const MgmtDataTable = ({ records, isMobile, onDelete, onUpdated }: Props) => {
  const renderStatus = (status: TournamentRecord["status"]) => {
    const meta = statusLabel(status);
    return (
      <span className={`inline-flex w-max items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold ${meta.className}`}>
        {status === "Live" && <span className="h-1.5 w-1.5 rounded-full bg-red-600" />}
        {meta.label}
      </span>
    );
  };

  const actions = (record: TournamentRecord) => (
    <div className="flex items-center justify-end gap-1">
      <Link to={`/tournaments/${record.tournamentItemId || record.id}`} title="Xem chi tiết">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
      <CreateTournamentModal mode="edit" record={record} onSuccess={onUpdated}>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Chỉnh sửa">
          <Edit className="h-4 w-4" />
        </Button>
      </CreateTournamentModal>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent" title="Xóa" onClick={() => onDelete?.(record)}>
        <Trash2 className="h-4 w-4" />
      </Button>
      {record.status === "Draft" && (
        <Button size="sm" className="ml-2 h-8 text-xs">
          <Send className="mr-1 h-3 w-3" /> Công bố
        </Button>
      )}
    </div>
  );

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <h3 className="font-heading text-lg font-bold text-title">Chưa có giải phù hợp</h3>
        <p className="mt-2 text-sm text-muted-foreground">Hãy thử đổi bộ lọc hoặc tạo giải mới.</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {records.map((record) => (
          <article key={record.id} className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="h-32 bg-muted">
              {record.coverImage ? <img src={record.coverImage} alt={record.name} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-foreground">{record.name}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{record.competitionType} · {record.sport}</p>
                </div>
                {renderStatus(record.status)}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Info label="Thời gian" value={`${record.startDate} - ${record.endDate}`} />
                <Info label="Hạn đăng ký" value={record.registrationDeadline || "Chưa cập nhật"} />
                <Info label="Địa điểm" value={record.venue || "Chưa cập nhật"} />
                <Info label="Lệ phí" value={money(record.feeEntry)} />
                <Info label="Đội/VĐV" value={`${record.teamsCount}/${record.registration.max || "?"}`} />
                <Info label="Công bố" value={record.published ? "Đã công bố" : "Chưa công bố"} />
              </div>
              <div className="flex justify-end border-t border-border pt-3">{actions(record)}</div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto beautiful-scrollbar">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs uppercase text-foreground">
            <tr>
              <th className="p-4 font-semibold">Giải đấu</th>
              <th className="p-4 font-semibold">Môn / hình thức</th>
              <th className="p-4 font-semibold">Thể thức</th>
              <th className="p-4 font-semibold">Thời gian</th>
              <th className="p-4 font-semibold">Địa điểm</th>
              <th className="p-4 font-semibold">Đăng ký</th>
              <th className="p-4 font-semibold">Lệ phí</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 text-center font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {records.map((record) => (
              <tr key={record.id} className="transition-colors hover:bg-muted/40">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {record.coverImage ? <img src={record.coverImage} alt={record.name} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div>
                      <p className="font-bold leading-tight">{record.name}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{record.published ? "Đã công bố" : "Chưa công bố"}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-xs"><strong>{record.sport}</strong><br /><span className="text-muted-foreground">{record.competitionType}</span></td>
                <td className="p-4 text-xs font-semibold">{record.format}</td>
                <td className="p-4 text-xs">{record.startDate} - {record.endDate}<br /><span className="text-muted-foreground">Hạn đăng ký: {record.registrationDeadline || "Chưa cập nhật"}</span></td>
                <td className="max-w-[180px] p-4 text-xs">{record.venue || "Chưa cập nhật"}</td>
                <td className="p-4">
                  <div className="mb-1 flex justify-between text-[10px] font-semibold">
                    <span className={record.registration.isOpen ? "text-primary" : "text-muted-foreground"}>{record.registration.statusText}</span>
                    <span>{record.registration.current}/{record.registration.max || "?"}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(100, (record.registration.current / (record.registration.max || 1)) * 100)}%` }} />
                  </div>
                </td>
                <td className="p-4 text-xs font-bold">{money(record.feeEntry)}</td>
                <td className="p-4">{renderStatus(record.status)}</td>
                <td className="p-4 text-right">{actions(record)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span className="mb-0.5 block text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground">{value}</span>
  </div>
);

export default MgmtDataTable;
