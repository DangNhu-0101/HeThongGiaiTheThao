import { Edit, Eye, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { TournamentRecord } from "@/types/orgTournamentMgmt";
import CreateTournamentModal from "./create-sections/CreateTournamentModal";

interface Props {
  records: TournamentRecord[];
  isMobile: boolean;
  onDelete?: (record: TournamentRecord) => void;
}

const MgmtDataTable = ({ records, isMobile, onDelete }: Props) => {
  const renderStatus = (status: TournamentRecord["status"]) => {
    if (status === "Live") {
      return <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-max"><span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" /> Live</span>;
    }
    if (status === "Registration Open") {
      return <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded w-max">Mở đăng ký</span>;
    }
    if (status === "Draft") {
      return <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold px-2 py-0.5 rounded w-max">Bản nháp</span>;
    }
    return <span className="bg-green-50 text-green-600 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded w-max">Hoàn tất</span>;
  };

  const actions = (record: TournamentRecord) => (
    <div className="flex items-center justify-end gap-1">
      <Link to={`/tournaments/${record.id}`} title="Xem">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Eye className="w-4 h-4" />
        </Button>
      </Link>
      <CreateTournamentModal mode="edit" record={record}>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Sửa">
          <Edit className="w-4 h-4" />
        </Button>
      </CreateTournamentModal>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" title="Xóa" onClick={() => onDelete?.(record)}>
        <Trash2 className="w-4 h-4" />
      </Button>
      {record.status === "Draft" && (
        <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground ml-2">
          <Send className="w-3 h-3 mr-1" /> Publish
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="space-y-4">
        {records.map((record) => (
          <div key={record.id} className="bg-card border border-border rounded-xl p-4 shadow-sm relative">
            <div className="absolute top-4 right-4">{renderStatus(record.status)}</div>
            <h4 className="font-bold text-foreground pr-24">{record.name}</h4>
            <p className="text-xs text-muted-foreground mb-4">{record.kind === "multi" ? "Hội thao" : "Giải đơn"} - {record.sport}</p>
            <div className="grid grid-cols-2 gap-y-3 text-xs mb-4">
              <div><span className="text-muted-foreground block mb-0.5">Thời gian</span><span className="font-semibold">{record.startDate} - {record.endDate}</span></div>
              <div><span className="text-muted-foreground block mb-0.5">Đội thi</span><span className="font-semibold">{record.teamsCount} đội</span></div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">{actions(record)}</div>
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
              <th className="p-4 w-10"><input type="checkbox" className="rounded accent-primary" /></th>
              <th className="p-4 font-semibold">Giải đấu</th>
              <th className="p-4 font-semibold">Loại</th>
              <th className="p-4 font-semibold">Môn</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 font-semibold w-48">Đăng ký</th>
              <th className="p-4 font-semibold text-center">Đội thi</th>
              <th className="p-4 font-semibold">Thời gian</th>
              <th className="p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-muted/10 transition-colors group">
                <td className="p-4"><input type="checkbox" className="rounded accent-primary" /></td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-[10px] shrink-0 text-secondary-foreground">
                      {record.sport.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight">{record.name}</p>
                      <p className="text-[10px] text-muted-foreground">{record.season} - {record.format}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-xs font-bold">{record.kind === "multi" ? "Hội thao" : "Giải đơn"}</td>
                <td className="p-4 text-xs font-semibold">{record.sport}</td>
                <td className="p-4">{renderStatus(record.status)}</td>
                <td className="p-4">
                  <div className="flex justify-between text-[10px] font-semibold mb-1">
                    <span className={record.registration.isOpen ? "text-orange-500" : "text-muted-foreground"}>{record.registration.statusText}</span>
                    <span>{record.registration.current}/{record.registration.max}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(record.registration.current / (record.registration.max || 1)) * 100}%` }} />
                  </div>
                </td>
                <td className="p-4 text-center font-bold">{record.teamsCount}</td>
                <td className="p-4 text-xs">
                  <p className="font-semibold">{record.startDate} - {record.endDate}</p>
                  <p className="text-[10px] text-muted-foreground">Bắt đầu / Kết thúc</p>
                </td>
                <td className="p-4 text-right">
                  <div className="opacity-60 group-hover:opacity-100 transition-opacity">{actions(record)}</div>
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
