import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  GitBranch,
  Lock,
  MapPinned,
  Play,
  ScrollText,
  ServerCog,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/libs/axios";

type FeatureStatus = "ready" | "partial" | "blocked";

interface BackendAction {
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  roles: string;
  status: FeatureStatus;
  note: string;
  probePath?: string;
}

interface FeatureGroup {
  id: string;
  title: string;
  summary: string;
  icon: typeof ShieldCheck;
  actions: BackendAction[];
}

const statusMeta: Record<FeatureStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  ready: {
    label: "FE gọi được",
    className: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  partial: {
    label: "Có logic, thiếu dữ liệu",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: AlertTriangle,
  },
  blocked: {
    label: "Cần sửa BE",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: AlertTriangle,
  },
};

const backendFeatureGroups: FeatureGroup[] = [
  {
    id: "auth",
    title: "Xác thực tài khoản",
    summary: "Đăng ký, đăng nhập, đăng xuất bằng JWT access token và refresh token cookie.",
    icon: ShieldCheck,
    actions: [
      { name: "Đăng ký tài khoản", method: "POST", path: "/api/auth/register", roles: "Public", status: "partial", note: "Controller có logic, nhưng register đang ghi role/roleName trong khi User schema dùng roles." },
      { name: "Đăng nhập", method: "POST", path: "/api/auth/login", roles: "Public", status: "ready", note: "FE đang dùng trực tiếp cho màn login." },
      { name: "Đăng xuất", method: "POST", path: "/api/auth/logout", roles: "Đã đăng nhập", status: "ready", note: "Xóa refresh token cookie và local token." },
    ],
  },
  {
    id: "tournaments",
    title: "Giải đấu và hội thao",
    summary: "Danh sách public/protected, chi tiết giải đơn môn/đa môn, tạo sửa xóa mềm và đổi trạng thái.",
    icon: Trophy,
    actions: [
      { name: "Danh sách tất cả giải", method: "GET", path: "/api/tournaments", roles: "Đã đăng nhập", status: "ready", note: "FE dùng cho trang chủ và danh sách giải.", probePath: "/tournaments?limit=6" },
      { name: "Giải của tổ chức hiện tại", method: "GET", path: "/api/tournaments/organization/my", roles: "Admin/Org", status: "ready", note: "FE dùng cho trang quản lý giải.", probePath: "/tournaments/organization/my" },
      { name: "Chi tiết giải đơn môn", method: "GET", path: "/api/tournaments/single/:id", roles: "Đã đăng nhập", status: "partial", note: "Có populate categoryRule, FE đã fallback khi thiếu registeredTeams/maxTeams." },
      { name: "Chi tiết hội thao đa môn", method: "GET", path: "/api/tournaments/multi/:id", roles: "Đã đăng nhập", status: "partial", note: "Có populate tournament items, nhưng field tournamnetItem đang sai chính tả." },
      { name: "Tạo giải đơn môn", method: "POST", path: "/api/tournaments/single", roles: "Admin/Org", status: "partial", note: "Yêu cầu categoryRuleId chưa được dùng." },
      { name: "Tạo hội thao đa môn", method: "POST", path: "/api/tournaments/multi", roles: "Admin/Org", status: "partial", note: "Yêu cầu categoryRuleIds, tạo Tournament và nhìều TournamentItem." },
      { name: "Cập nhật giải đơn môn", method: "PUT", path: "/api/tournaments/single/:id", roles: "Admin/Org", status: "partial", note: "Có khóa field khi giải đã playing/completed." },
      { name: "Cập nhật hội thao", method: "PUT", path: "/api/tournaments/multi/:id", roles: "Admin/Org", status: "partial", note: "Có thể thêm categoryRuleIds mới nếu chưa khóa." },
      { name: "Hủy giải đơn môn", method: "DELETE", path: "/api/tournaments/single/:id", roles: "Admin/Org", status: "partial", note: "Soft delete bằng status cancelled." },
      { name: "Hủy hội thao", method: "DELETE", path: "/api/tournaments/multi/:id", roles: "Admin/Org", status: "partial", note: "Soft delete tournament và tournament items." },
      { name: "Đổi trạng thái giải đơn môn", method: "PATCH", path: "/api/tournaments/single/:id/status", roles: "Admin/Org", status: "partial", note: "Nhận newStatus: upcoming/actived/playing/completed/cancelled." },
      { name: "Đổi trạng thái hội thao", method: "PATCH", path: "/api/tournaments/multi/:id/status", roles: "Admin/Org", status: "partial", note: "Nếu cancelled sẽ cập nhật các tournament item." },
    ],
  },
  {
    id: "stages",
    title: "Vòng đấu, bảng đấu và bracket",
    summary: "Tạo stage kèm bracket/group/match, xem stage, cập nhật, xóa cascade và hoàn thành stage.",
    icon: GitBranch,
    actions: [
      { name: "Danh sách stage theo tournament item", method: "GET", path: "/api/stages/tournament-item/:tournamentItemId", roles: "Đã đăng nhập", status: "ready", note: "Cần nhập tournamentItemId để kiểm tra." },
      { name: "Chi tiết stage kèm bracket/group/match", method: "GET", path: "/api/stages/:id", roles: "Đã đăng nhập", status: "partial", note: "Có populate group.matches, chưa normalize thành cây bracket FE." },
      { name: "Tạo stage", method: "POST", path: "/api/stages", roles: "Admin/Org", status: "partial", note: "Dùng stageCreationService, cần payload stageData và brackets." },
      { name: "Cập nhật stage", method: "PUT", path: "/api/stages/:id", roles: "Admin/Org", status: "ready", note: "Cho phép name, dates, pointsConfig, rankingCriteria, totalTeamsIn, wildcard, status." },
      { name: "Xóa stage", method: "DELETE", path: "/api/stages/:id", roles: "Admin/Org", status: "ready", note: "Cascade xóa brackets, groups, matches liên quan." },
      { name: "Hoàn thành stage", method: "PATCH", path: "/api/stages/:id/complete", roles: "Admin/Org", status: "ready", note: "Chuyển current stage completed và active stage kế tiếp nếu có." },
    ],
  },
  {
    id: "rules",
    title: "Luật thi đấu và template",
    summary: "Đọc template hệ thống, category template, flatten rule form, category rule của giải.",
    icon: ScrollText,
    actions: [
      { name: "Danh sách tournament templates", method: "GET", path: "/api/rules/templates", roles: "Đã đăng nhập", status: "ready", note: "FE dùng cho cấu hình môn.", probePath: "/rules/templates" },
      { name: "Chi tiết template", method: "GET", path: "/api/rules/templates/:id", roles: "Đã đăng nhập", status: "ready", note: "Đọc template theo id." },
      { name: "Category templates theo sportType", method: "GET", path: "/api/rules/categories?sportType=", roles: "Đã đăng nhập", status: "ready", note: "Bắt buộc có sportType query." },
      { name: "Chi tiết category template", method: "GET", path: "/api/rules/categories/:id", roles: "Đã đăng nhập", status: "ready", note: "Đọc category template theo id." },
      { name: "Flatten rule form", method: "GET", path: "/api/rules/categories/:categoryId/flatten", roles: "Đã đăng nhập", status: "ready", note: "Trả dữ liệu form từ category template." },
      { name: "Danh sách category rules", method: "GET", path: "/api/rules/category-rules", roles: "Đã đăng nhập", status: "blocked", note: "Controller import categoryRuleService nhưng gọi CategoryRuleService nên có nguy cơ ReferenceError.", probePath: "/rules/category-rules" },
      { name: "Tạo category rule", method: "POST", path: "/api/rules/category-rules", roles: "Admin/Org", status: "blocked", note: "Cùng lỗi CategoryRuleService chưa được khai báo." },
      { name: "Cập nhật category rule", method: "PUT", path: "/api/rules/category-rules/:id", roles: "Admin/Org", status: "blocked", note: "Cùng lỗi CategoryRuleService chưa được khai báo." },
      { name: "Xóa category rule", method: "DELETE", path: "/api/rules/category-rules/:id", roles: "Admin/Org", status: "blocked", note: "Cùng lỗi CategoryRuleService chưa được khai báo." },
    ],
  },
  {
    id: "sponsors",
    title: "Nhà tài trợ",
    summary: "Có CRUD sponsor và activate/deactivate, nhưng controller đang lệch tournamentId/tournamentItemId.",
    icon: BadgeDollarSign,
    actions: [
      { name: "Danh sách sponsor theo giải", method: "GET", path: "/api/sponsors", roles: "Đã đăng nhập", status: "blocked", note: "Route không có :tournamentId nhưng controller đọc req.params.tournamentId." },
      { name: "Chi tiết sponsor", method: "GET", path: "/api/sponsors/:id", roles: "Đã đăng nhập", status: "ready", note: "Có thể đọc sponsor theo id nếu biết id." },
      { name: "Tạo sponsor", method: "POST", path: "/api/sponsors", roles: "Admin/Org", status: "blocked", note: "Controller ghi tournamentId nhưng Sponsor model yêu cầu tournamentItemId." },
      { name: "Cập nhật sponsor", method: "PUT", path: "/api/sponsors/:id", roles: "Admin/Org", status: "blocked", note: "Kiểm quyền dùng sponsor.tournamentId nhưng model không có field này." },
      { name: "Vô hiệu hóa sponsor", method: "PATCH", path: "/api/sponsors/:id/deactivate", roles: "Admin/Org", status: "blocked", note: "Cùng lỗi sponsor.tournamentId." },
      { name: "Kích hoạt sponsor", method: "PATCH", path: "/api/sponsors/:id/activate", roles: "Admin/Org", status: "blocked", note: "Cùng lỗi sponsor.tournamentId." },
    ],
  },
  {
    id: "courts",
    title: "Sân thi đấu",
    summary: "Có CRUD sân và đổi trạng thái, nhưng controller đang dùng tournamentId/sportTypes khác model.",
    icon: MapPinned,
    actions: [
      { name: "Danh sách sân theo giải", method: "GET", path: "/api/courts/tournament/:tournamentId", roles: "Đã đăng nhập", status: "blocked", note: "Court model dùng tournamentItemId, controller query tournamentId." },
      { name: "Thêm sân", method: "POST", path: "/api/courts", roles: "Admin/Org", status: "blocked", note: "Controller ghi tournamentId và sportTypes, model không có các field này." },
      { name: "Cập nhật sân", method: "PUT", path: "/api/courts/:courtId", roles: "Admin/Org", status: "blocked", note: "Kiểm quyền dùng court.tournamentId nhưng model không có field này." },
      { name: "Đổi trạng thái sân", method: "PATCH", path: "/api/courts/:courtId/status", roles: "Admin/Org", status: "blocked", note: "Logic status có, nhưng kiểm quyền đang lệch field." },
      { name: "Xóa sân", method: "DELETE", path: "/api/courts/:courtId", roles: "Admin/Org", status: "blocked", note: "Logic xóa có, nhưng kiểm quyền đang lệch field." },
    ],
  },
];

const methodClassName: Record<BackendAction["method"], string> = {
  GET: "bg-blue-50 text-blue-700",
  POST: "bg-green-50 text-green-700",
  PUT: "bg-amber-50 text-amber-700",
  PATCH: "bg-purple-50 text-purple-700",
  DELETE: "bg-red-50 text-red-700",
};

const AdminBackendFeaturesPage = () => {
  const [probeResults, setProbeResults] = useState<Record<string, string>>({});
  const totals = useMemo(() => {
    const actions = backendFeatureGroups.flatMap((group) => group.actions);
    return {
      all: actions.length,
      ready: actions.filter((action) => action.status === "ready").length,
      partial: actions.filter((action) => action.status === "partial").length,
      blocked: actions.filter((action) => action.status === "blocked").length,
    };
  }, []);

  const probeEndpoint = async (action: BackendAction) => {
    if (!action.probePath) return;
    setProbeResults((state) => ({ ...state, [action.path]: "Đang kiểm tra..." }));
    try {
      const response = await api.get(action.probePath);
      const data = response.data?.data;
      const count = Array.isArray(data) ? `${data.length} bản ghi` : "Có phản hồi";
      setProbeResults((state) => ({ ...state, [action.path]: `OK: ${count}` }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không gọi được endpoint";
      setProbeResults((state) => ({ ...state, [action.path]: `Lỗi: ${message}` }));
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
      <section className="bg-header text-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-white/70 mb-2">
              <ServerCog className="w-4 h-4" /> Backend API
            </div>
            <h1 className="text-3xl font-black uppercase tracking-wider">Tính năng Backend hiện có</h1>
            <p className="text-sm text-white/70 mt-2 max-w-3xl">
              Màn này gom toàn bộ route BE đang mount trong server, đối chiếu với khả năng FE có thể gọi ngay và những phần cần sửa backend trước khi bật thao tác CRUD đầy đủ.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="bg-white/10 px-4 py-3">
              <div className="text-2xl font-black">{totals.all}</div>
              <div className="text-white/70 text-xs uppercase font-bold">Tổng action</div>
            </div>
            <div className="bg-white/10 px-4 py-3">
              <div className="text-2xl font-black text-green-300">{totals.ready}</div>
              <div className="text-white/70 text-xs uppercase font-bold">Gọi được</div>
            </div>
            <div className="bg-white/10 px-4 py-3">
              <div className="text-2xl font-black text-amber-300">{totals.partial}</div>
              <div className="text-white/70 text-xs uppercase font-bold">Thiếu dữ liệu</div>
            </div>
            <div className="bg-white/10 px-4 py-3">
              <div className="text-2xl font-black text-red-300">{totals.blocked}</div>
              <div className="text-white/70 text-xs uppercase font-bold">Cần sửa BE</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {backendFeatureGroups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div key={group.id} className="bg-card border border-border shadow-sm">
              <div className="p-5 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center">
                    <GroupIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase text-foreground">{group.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{group.summary}</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {group.actions.map((action) => {
                  const meta = statusMeta[action.status];
                  const StatusIcon = meta.icon;
                  return (
                    <div key={`${action.method}-${action.path}-${action.name}`} className="p-4 space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-1 text-[10px] font-black ${methodClassName[action.method]}`}>{action.method}</span>
                            <h3 className="font-bold text-sm text-foreground">{action.name}</h3>
                          </div>
                          <code className="mt-2 block text-xs text-muted-foreground break-all">{action.path}</code>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-bold uppercase ${meta.className}`}>
                          <StatusIcon className="w-3 h-3" /> {meta.label}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> {action.roles}
                        </span>
                        <span>{action.note}</span>
                      </div>
                      {action.probePath && (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <Button size="sm" variant="outline" onClick={() => probeEndpoint(action)} className="w-full sm:w-auto">
                            <Play className="w-3.5 h-3.5 mr-2" /> Kiểm tra GET
                          </Button>
                          {probeResults[action.path] && <span className="text-xs font-medium text-muted-foreground">{probeResults[action.path]}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default AdminBackendFeaturesPage;
