import { useEffect, useMemo, useState } from "react";
import { Plus, Search, LayoutGrid, List, MapPin, Flag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResourceStats from "@/components/org/resource-mgmt/ResourceStats";
import VenueMgmtTable from "@/components/org/resource-mgmt/VenueMgmtTable";
import RefereeMgmtTable from "@/components/org/resource-mgmt/RefereeMgmtTable";
import AccountLinkDialog from "@/components/org/shared/AccountLinkDialog";
import RequireTournamentSelection from "@/components/org/RequireTournamentSelection";
import { useOrgResourceMgmtStore } from "@/stores/useOrgResourceMgmtStore";
import { useOrgContextStore } from "@/stores/useOrgContextStore";
import { useIsMobile } from "@/hooks/use-mobile";
import type { OrgRefereeRecord, OrgVenueRecord, RefereeStatus, VenueStatus } from "@/types/orgResourceMgmt";

type ResourceDialogMode = "venue" | "referee";

const emptyVenue = { name: "", location: "", status: "Available" as VenueStatus };
const emptyReferee = {
  name: "",
  phoneNumber: "",
  qualification: "",
  experience: 0,
  status: "Available" as RefereeStatus,
};

const OrgResourceMgmtPage = () => {
  const [activeTab, setActiveTab] = useState<"venues" | "referees">("venues");
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogMode, setDialogMode] = useState<ResourceDialogMode | null>(null);
  const [editingVenue, setEditingVenue] = useState<OrgVenueRecord | null>(null);
  const [editingReferee, setEditingReferee] = useState<OrgRefereeRecord | null>(null);
  const [venueForm, setVenueForm] = useState(emptyVenue);
  const [refereeForm, setRefereeForm] = useState(emptyReferee);
  const isMobile = useIsMobile();
  const selectedTournamentItemId = useOrgContextStore((state) => state.selectedTournamentItemId);
  const {
    venueStats,
    refereeStats,
    venues,
    referees,
    loading,
    fetchData,
    addVenue,
    updateVenue,
    deleteVenue,
    addReferee,
    updateReferee,
    deleteReferee,
    linkRefereeAccount,
  } = useOrgResourceMgmtStore();
  const [viewingReferee, setViewingReferee] = useState<OrgRefereeRecord | null>(null);
  const [linkingReferee, setLinkingReferee] = useState<OrgRefereeRecord | null>(null);

  useEffect(() => {
    if (!selectedTournamentItemId) return;
    fetchData(selectedTournamentItemId);
  }, [fetchData, selectedTournamentItemId]);

  const filteredVenues = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return venues;
    return venues.filter((item) => `${item.name} ${item.location}`.toLowerCase().includes(keyword));
  }, [searchTerm, venues]);

  const filteredReferees = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return referees;
    return referees.filter((item) => `${item.name} ${item.qualification}`.toLowerCase().includes(keyword));
  }, [searchTerm, referees]);

  const openAddDialog = () => {
    if (activeTab === "venues") {
      setEditingVenue(null);
      setVenueForm(emptyVenue);
      setDialogMode("venue");
      return;
    }
    setEditingReferee(null);
    setRefereeForm(emptyReferee);
    setDialogMode("referee");
  };

  const openEditVenue = (venue: OrgVenueRecord) => {
    setEditingVenue(venue);
    setVenueForm({ name: venue.name, location: venue.location, status: venue.status });
    setDialogMode("venue");
  };

  const openEditReferee = (referee: OrgRefereeRecord) => {
    setEditingReferee(referee);
    setRefereeForm({
      name: referee.name,
      phoneNumber: "",
      qualification: referee.qualification,
      experience: referee.experience,
      status: referee.status,
    });
    setDialogMode("referee");
  };

  const handleSubmitVenue = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { name: venueForm.name.trim(), location: venueForm.location.trim(), status: venueForm.status };
    if (editingVenue) {
      await updateVenue(editingVenue.id, payload);
    } else {
      await addVenue(payload);
    }
    setDialogMode(null);
  };

  const handleSubmitReferee = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      name: refereeForm.name.trim(),
      phoneNumber: refereeForm.phoneNumber.trim(),
      qualification: refereeForm.qualification.trim(),
      experience: Number(refereeForm.experience || 0),
      status: refereeForm.status,
    };
    if (editingReferee) {
      await updateReferee(editingReferee.id, payload);
    } else {
      await addReferee(payload);
    }
    setDialogMode(null);
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center font-medium text-muted-foreground animate-pulse">Đang tải dữ liệu tài nguyên...</div>;
  }

  if (!selectedTournamentItemId) {
    return <RequireTournamentSelection description="Hãy chọn giải ở Sidebar để quản lý sân, trọng tài và tài nguyên của giải đó." />;
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-lg bg-header p-6 text-white shadow-lg md:flex-row md:items-end md:justify-between md:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-white/70">
            <span>Cổng Tổ Chức</span> <span className="text-accent">&gt;</span> <span>Tài nguyên</span>
          </div>
          <h1 className="mb-1 text-3xl font-black uppercase tracking-wider">Quản lý Tài nguyên</h1>
          <p className="text-sm text-white/70">Quản lý cơ sở vật chất sân bãi và phân công trọng tài điều hành.</p>
        </div>

        <Button onClick={openAddDialog} className="relative z-10 bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" /> Thêm {activeTab === "venues" ? "Sân mới" : "Trọng tài"}
        </Button>
      </div>

      <ResourceStats stats={activeTab === "venues" ? venueStats : refereeStats} />

      <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-sm xl:flex-row xl:items-center">
        <div className="flex w-full rounded-lg bg-muted p-1 sm:w-auto">
          <button
            onClick={() => setActiveTab("venues")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-1.5 text-xs font-bold transition-all sm:flex-none ${activeTab === "venues" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <MapPin className="h-3.5 w-3.5" /> Sân thi đấu <span className="rounded-full bg-black/5 px-1.5 py-0.5">{venues.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("referees")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-1.5 text-xs font-bold transition-all sm:flex-none ${activeTab === "referees" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Flag className="h-3.5 w-3.5" /> Trọng tài <span className="rounded-full bg-black/5 px-1.5 py-0.5">{referees.length}</span>
          </button>
        </div>

        <div className={`flex w-full gap-3 xl:w-auto ${isMobile ? "flex-col" : "flex-row items-center"}`}>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={`Tìm ${activeTab === "venues" ? "sân thi đấu" : "trọng tài"}...`}
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="hidden shrink-0 rounded-lg bg-muted p-1 sm:flex">
            <button className="rounded-md bg-background p-1.5 text-foreground shadow-sm"><List className="h-4 w-4" /></button>
            <button className="p-1.5 text-muted-foreground transition-colors hover:text-foreground"><LayoutGrid className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {activeTab === "venues" ? (
        <VenueMgmtTable
          records={filteredVenues}
          isMobile={isMobile}
          onEdit={openEditVenue}
          onDelete={(venue) => {
            if (window.confirm(`Xóa sân "${venue.name}"?`)) void deleteVenue(venue.id);
          }}
        />
      ) : (
        <RefereeMgmtTable
          records={filteredReferees}
          isMobile={isMobile}
          onEdit={openEditReferee}
          onDelete={(referee) => {
            if (window.confirm(`Xóa trọng tài "${referee.name}"?`)) void deleteReferee(referee.id);
          }}
          onView={setViewingReferee}
        />
      )}

      {viewingReferee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-muted/20 p-4">
              <h3 className="font-bold">Thông tin trọng tài</h3>
              <button type="button" onClick={() => setViewingReferee(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <p><span className="font-bold">Tên:</span> {viewingReferee.name}</p>
              <p><span className="font-bold">Môn/chuyên môn:</span> {viewingReferee.qualification}</p>
              <p><span className="font-bold">Kinh nghiệm:</span> {viewingReferee.experience} n?m</p>
              <p><span className="font-bold">Tài khoản:</span> {viewingReferee.accountLinked ? `Đã liên kết ${viewingReferee.accountLabel || ""}` : "Chưa liên kết"}</p>
            </div>
            {!viewingReferee.accountLinked && (
              <div className="border-t border-border p-4">
                <Button className="w-full" onClick={() => { setLinkingReferee(viewingReferee); setViewingReferee(null); }}>
                  Liên kết tài khoản
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <AccountLinkDialog
        open={Boolean(linkingReferee)}
        title={`Liên kết cho ${linkingReferee?.name || "trọng tài"}`}
        role="referee"
        onClose={() => setLinkingReferee(null)}
        onSelect={async (account) => {
          if (!linkingReferee) return;
          await linkRefereeAccount(linkingReferee.id, account.id);
          setLinkingReferee(null);
        }}
      />

      {dialogMode === "venue" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmitVenue} className="w-full max-w-md overflow-hidden rounded-lg bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-muted/20 p-4">
              <h3 className="font-bold">{editingVenue ? "Cập nhật sân thi đấu" : "Thêm sân thi đấu"}</h3>
              <button type="button" onClick={() => setDialogMode(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-4">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Tên sân</span>
                <input required value={venueForm.name} onChange={(event) => setVenueForm({ ...venueForm, name: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Địa điểm</span>
                <input value={venueForm.location} onChange={(event) => setVenueForm({ ...venueForm, location: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Trạng thái</span>
                <select value={venueForm.status} onChange={(event) => setVenueForm({ ...venueForm, status: event.target.value as VenueStatus })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="Available">Sẵn sàng</option>
                  <option value="Booked">Đã đặt</option>
                  <option value="Maintenance">Bảo trì</option>
                  <option value="Closed">Đóng cửa</option>
                </select>
              </label>
            </div>
            <div className="flex gap-3 border-t border-border p-4">
              <Button type="button" variant="outline" onClick={() => setDialogMode(null)} className="flex-1">Hủy</Button>
              <Button type="submit" className="flex-1">Lưu</Button>
            </div>
          </form>
        </div>
      )}

      {dialogMode === "referee" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmitReferee} className="w-full max-w-md overflow-hidden rounded-lg bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-muted/20 p-4">
              <h3 className="font-bold">{editingReferee ? "Cập nhật trọng tài" : "Thêm trọng tài"}</h3>
              <button type="button" onClick={() => setDialogMode(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-4">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Tên trọng tài</span>
                <input required value={refereeForm.name} onChange={(event) => setRefereeForm({ ...refereeForm, name: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Số điện thoại</span>
                <input value={refereeForm.phoneNumber} onChange={(event) => setRefereeForm({ ...refereeForm, phoneNumber: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Chuyên môn</span>
                <input value={refereeForm.qualification} onChange={(event) => setRefereeForm({ ...refereeForm, qualification: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Kinh nghiệm</span>
                  <input type="number" min={0} value={refereeForm.experience} onChange={(event) => setRefereeForm({ ...refereeForm, experience: Number(event.target.value) })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Trạng thái</span>
                  <select value={refereeForm.status} onChange={(event) => setRefereeForm({ ...refereeForm, status: event.target.value as RefereeStatus })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="Available">Sẵn sàng</option>
                    <option value="Assigned">Đã phân công</option>
                    <option value="Unavailable">Không trống lịch</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="flex gap-3 border-t border-border p-4">
              <Button type="button" variant="outline" onClick={() => setDialogMode(null)} className="flex-1">Hủy</Button>
              <Button type="submit" className="flex-1">Lưu</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default OrgResourceMgmtPage;
