import { Search, Plus, Building2, Check, Clock, XCircle, Eye, Edit, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminOrgRecord } from "@/types/adminDashboard";

interface Props {
  orgs: AdminOrgRecord[];
  isMobile: boolean;
}

const AdminDashboardOrgs = ({ orgs = [], isMobile = false }: Partial<Props>) => {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-black text-lg text-foreground uppercase">Quản lý Tổ chức</h3>
          <p className="text-xs text-muted-foreground mt-1">24 tổ chức đã đăng ký trên tất cả môn thể thao</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
           <div className="relative flex-1 sm:w-48">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
             <input type="text" placeholder="Tìm kiếm..." className="w-full pl-9 pr-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-amber-500" />
           </div>
           <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-none shrink-0">
             <Plus className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Thêm Tổ chức</span>
           </Button>
        </div>
      </div>

      {isMobile ? (
        <div className="p-4 space-y-4">
          {orgs.map(org => (
            <div key={org.id} className="border border-border rounded-xl p-4 bg-background">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-sm text-foreground">{org.name}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${org.status === 'Hoạt động' ? 'bg-green-100 text-green-700' : org.status === 'Chờ duyệt' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>{org.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{org.email}</p>
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div><span className="text-muted-foreground block mb-0.5">Gói cước</span><span className="font-bold text-amber-600">{org.plan}</span></div>
                <div><span className="text-muted-foreground block mb-0.5">Tham gia</span><span className="font-semibold">{org.joinedAt}</span></div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border">
                <div className="text-xs font-semibold"><span className="text-primary">{org.tournamentsCount} Giải</span> • <span>{org.usersCount} User</span></div>
                {org.status === 'Chờ duyệt' ? (
                   <Button size="sm" className="h-7 text-xs bg-green-500 hover:bg-green-600 text-white"><Check className="w-3 h-3 mr-1"/> Duyệt</Button>
                ) : org.status === 'Đình chỉ' ? (
                   <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-200 bg-green-50">Khôi phục</Button>
                ) : (
                   <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Edit className="w-4 h-4 text-muted-foreground"/></Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto beautiful-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 text-[10px] uppercase font-bold text-muted-foreground border-b border-border">
              <tr>
                <th className="p-4 w-10"><input type="checkbox" className="rounded accent-amber-500" /></th>
                <th className="p-4">Tổ chức</th>
                <th className="p-4">Gói cước</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-center">Giải đấu</th>
                <th className="p-4 text-center">Người dùng</th>
                <th className="p-4">Tham gia</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {orgs.map(org => (
                <tr key={org.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4"><input type="checkbox" className="rounded accent-amber-500" /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center"><Building2 className="w-4 h-4"/></div>
                      <div><p className="font-bold text-sm leading-tight">{org.name}</p><p className="text-[10px] text-muted-foreground">{org.email}</p></div>
                    </div>
                  </td>
                  <td className="p-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-max ${org.plan === 'Doanh nghiệp' ? 'bg-amber-100 text-amber-700' : org.plan === 'Chuyên nghiệp' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>★ {org.plan}</span></td>
                  <td className="p-4"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max border ${org.status === 'Hoạt động' ? 'bg-green-50 text-green-700 border-green-200' : org.status === 'Chờ duyệt' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-muted text-muted-foreground border-border'}`}>{org.status === 'Hoạt động' ? <Check className="w-3 h-3"/> : org.status === 'Chờ duyệt' ? <Clock className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>} {org.status}</span></td>
                  <td className="p-4 text-center font-bold">{org.tournamentsCount}</td>
                  <td className="p-4 text-center font-semibold text-muted-foreground">{org.usersCount.toLocaleString('vi-VN')}</td>
                  <td className="p-4 text-xs">{org.joinedAt}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {org.status === 'Chờ duyệt' ? (
                        <Button size="sm" className="h-7 text-xs bg-green-500 hover:bg-green-600 text-white px-3"><Check className="w-3 h-3 mr-1"/> Duyệt</Button>
                      ) : org.status === 'Đình chỉ' ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-200 bg-green-50 hover:bg-green-100"><Check className="w-3 h-3 mr-1"/> Khôi phục</Button>
                      ) : (
                        <>
                          <button className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Eye className="w-4 h-4" /></button>
                          <button className="p-1.5 text-muted-foreground hover:text-amber-500 transition-colors"><Edit className="w-4 h-4" /></button>
                          <button className="p-1.5 text-muted-foreground hover:bg-muted rounded"><MoreVertical className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default AdminDashboardOrgs;
