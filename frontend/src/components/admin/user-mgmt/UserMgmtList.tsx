import { useState } from "react";
import { Search, Check, Eye, Edit, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminUserRecord } from "@/types/adminUserMgmt";

interface Props {
  records: AdminUserRecord[];
  isMobile: boolean;
  onUpdateStatus: (id: string, status: AdminUserRecord['status']) => void;
}

const UserMgmtList = ({ records, isMobile, onUpdateStatus }: Props) => {
  const [activeTab, setActiveTab] = useState<'Tất cả' | 'Tổ chức' | 'Trọng tài' | 'Vận động viên'>('Tất cả');

  // Lọc dữ liệu theo Tab
  const filteredRecords = records.filter(r => activeTab === 'Tất cả' || r.role === activeTab);

  return (
    <div className="flex flex-col gap-4">
      {/* Thanh điều hướng tab & Bộ lọc */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col gap-4">
        <div className="flex border-b border-border overflow-x-auto beautiful-scrollbar">
          {(['Tất cả', 'Tổ chức', 'Trọng tài', 'Vận động viên'] as const).map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`px-4 py-2.5 text-xs font-bold uppercase border-b-2 tracking-wide transition-colors shrink-0 ${activeTab === tab ? 'border-amber-500 text-amber-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <div className="relative flex-1 md:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Tìm kiếm tên, email..." className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-amber-500" />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select className="flex-1 md:flex-none border border-border rounded-lg px-3 py-2 text-sm bg-background"><option>Tất cả trạng thái</option></select>
            <select className="flex-1 md:flex-none border border-border rounded-lg px-3 py-2 text-sm bg-background"><option>Tất cả khu vực</option></select>
          </div>
        </div>
      </div>

      {/* Danh sách hiển thị */}
      {isMobile ? (
        <div className="space-y-4">
          {filteredRecords.map(user => (
            <div key={user.id} className="bg-card border border-border rounded-xl p-4 shadow-sm relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-600 shrink-0">{user.avatar}</div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-foreground truncate">{user.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-border/50 py-3 my-3">
                <div><span className="text-muted-foreground block text-[10px] uppercase">Vai trò</span><span className="font-bold text-foreground">{user.role}</span></div>
                <div><span className="text-muted-foreground block text-[10px] uppercase">Trạng thái</span><span className={`font-bold ${user.status === 'Hoạt động' ? 'text-green-600' : user.status === 'Chờ duyệt' ? 'text-amber-600' : 'text-red-500'}`}>{user.status}</span></div>
                <div><span className="text-muted-foreground block text-[10px] uppercase">Khu vực</span><span className="font-semibold">{user.region}</span></div>
                <div><span className="text-muted-foreground block text-[10px] uppercase">Đăng nhập</span><span className="text-muted-foreground">{user.lastLogin}</span></div>
              </div>
              <div className="flex justify-end gap-1">
                 {/* ĐÃ FIX: Chỉ hiện nút duyệt nếu user KHÔNG phải là Vận động viên */}
                 {user.status === 'Chờ duyệt' && user.role !== 'Vận động viên' && (
                   <Button size="sm" className="bg-green-500 text-white h-7 text-xs px-2" onClick={() => onUpdateStatus(user.id, 'Hoạt động')}>
                     <Check className="w-3 h-3 mr-1"/>Duyệt
                   </Button>
                 )}
                 <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Eye className="w-4 h-4 text-muted-foreground" /></Button>
                 <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Edit className="w-4 h-4 text-muted-foreground" /></Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto beautiful-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 text-[10px] font-bold uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-4">Người dùng</th>
                  <th className="p-4">Vai trò</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Quyền truy cập</th>
                  <th className="p-4">Đăng nhập cuối</th>
                  <th className="p-4">Khu vực</th>
                  <th className="p-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {filteredRecords.map(user => (
                  <tr key={user.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold text-sm shrink-0">{user.avatar}</div>
                        <div><p className="font-bold text-sm leading-tight">{user.name}</p><p className="text-[10px] text-muted-foreground">{user.email}</p></div>
                      </div>
                    </td>
                    <td className="p-4"><span className="bg-muted px-2 py-0.5 border border-border text-xs rounded-md font-semibold text-foreground">{user.role}</span></td>
                    <td className="p-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${user.status === 'Hoạt động' ? 'bg-green-50 text-green-600 border-green-200' : user.status === 'Chờ duyệt' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{user.status}</span></td>
                    <td className="p-4 text-xs font-semibold text-muted-foreground">{user.accessLevel}</td>
                    <td className="p-4 text-xs font-medium">{user.lastLogin}</td>
                    <td className="p-4 text-xs font-bold text-muted-foreground">{user.region}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        
                        {/* ĐÃ FIX: Chỉ hiện nút duyệt nếu user KHÔNG phải là Vận động viên */}
                        {user.status === 'Chờ duyệt' && user.role !== 'Vận động viên' && (
                          <button className="p-1.5 text-green-600 hover:bg-green-50 rounded" onClick={() => onUpdateStatus(user.id, 'Hoạt động')} title="Duyệt">
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        <button className="p-1.5 text-muted-foreground hover:text-primary"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-muted-foreground hover:text-amber-500"><Edit className="w-4 h-4" /></button>
                        
                        {user.status === 'Hoạt động' && (
                          <button className="p-1.5 text-red-500 hover:bg-red-50 rounded" onClick={() => onUpdateStatus(user.id, 'Đang khóa')} title="Khóa">
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}
                        
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMgmtList;