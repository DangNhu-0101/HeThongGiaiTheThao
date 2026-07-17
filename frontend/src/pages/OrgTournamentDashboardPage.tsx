import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Edit, ImageIcon, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrgContextStore } from "@/stores/useOrgContextStore";
import { useOrgTournamentMgmtStore } from "@/stores/useOrgTournamentMgmtStore";
import { useOrgFinanceMgmtStore } from "@/stores/useOrgFinanceMgmtStore";
import CreateTournamentModal from "@/components/org/tournament-mgmt/create-sections/CreateTournamentModal";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

const formatDateTimeDisplay = (value?: string) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const OrgTournamentDashboardPage = () => {
  const { tournamentId } = useParams();
  const { selectedTournamentId, selectedTournamentItemId } = useOrgContextStore();
  const { records, fetchData } = useOrgTournamentMgmtStore();
  const { fetchData: fetchFinance } = useOrgFinanceMgmtStore();

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const selectedTournament = useMemo(
    () => records.find((record) =>
      record.id === tournamentId ||
      record.tournamentItemId === tournamentId ||
      record.id === selectedTournamentId ||
      record.tournamentItemId === selectedTournamentItemId
    ),
    [records, selectedTournamentId, selectedTournamentItemId, tournamentId],
  );

  const activeTournamentItemId = selectedTournament?.tournamentItemId || selectedTournamentItemId || "";

  useEffect(() => {
    if (!activeTournamentItemId) return;
    void fetchFinance(activeTournamentItemId);
  }, [activeTournamentItemId, fetchFinance]);

  if (!selectedTournament) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-lg border border-dashed border-border p-10 text-center">
        <Trophy className="mb-3 h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-black text-foreground">Chưa chọn giải đấu</h1>
        <p className="mt-2 text-sm text-muted-foreground">Hãy chọn một giải trong combobox ở sidebar để xem bảng điều khiển riêng của giải.</p>
      </div>
    );
  }

  const mediaImages = [
    { label: "Ảnh bìa giải", url: selectedTournament.coverImage },
    { label: "Logo giải", url: selectedTournament.operations?.logo },
    { label: "QR thanh toán", url: selectedTournament.operations?.paymentQR },
    ...(selectedTournament.operations?.banner || []).map((url, index) => ({
      label: `Banner / poster ${index + 1}`,
      url,
    })),
    ...(selectedTournament.rawTournamentItems || []).flatMap((item, index) => [
      { label: `Ảnh bìa nội dung ${index + 1}`, url: item.banner },
      { label: `Logo nội dung ${index + 1}`, url: item.logo },
    ]),
  ].filter((item, index, list) =>
    item.url && list.findIndex((candidate) => candidate.url === item.url) === index
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 rounded-lg bg-header p-6 text-white shadow-lg md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase text-white/70">Quản lý &gt; Giải đấu đang chọn</div>
          <h1 className="text-3xl font-black uppercase tracking-wider">{selectedTournament.name}</h1>
          <p className="mt-1 text-sm text-white/75">{selectedTournament.sport} · {selectedTournament.format}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CreateTournamentModal mode="edit" record={selectedTournament} onSuccess={fetchData}>
            <Button variant="outline" className="bg-white text-foreground hover:bg-white/90">
              <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
            </Button>
          </CreateTournamentModal>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <Info label="Tên giải" value={selectedTournament.name} />
        <Info label="Môn thể thao" value={selectedTournament.sport} />
        <Info label="Thể thức" value={selectedTournament.format} />
        <Info label="Hình thức" value={selectedTournament.competitionType || selectedTournament.kind} />
        <Info label="Thời gian" value={`${selectedTournament.startDate} - ${selectedTournament.endDate}`} />
        <Info label="Hạn đăng ký" value={selectedTournament.registrationDeadline || "Chưa cập nhật"} />
        <Info label="Địa điểm" value={selectedTournament.venue || "Chưa cập nhật"} />
        <Info label="Trạng thái" value={selectedTournament.status} />
        <Info label="Đăng ký" value={`${selectedTournament.registration.current}/${selectedTournament.registration.max || "?"}`} />
        <Info label="Lệ phí" value={formatCurrency(selectedTournament.feeEntry || 0)} />
        <Info label="Công bố" value={selectedTournament.published ? "Đã công bố" : "Chưa công bố"} />
        <Info label="Mùa giải" value={selectedTournament.season || "Chưa cập nhật"} />
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-black uppercase text-foreground">Ảnh và nhận diện giải</h2>
          <p className="text-sm text-muted-foreground">Ảnh được lấy trực tiếp từ dữ liệu giải và các nội dung thi đấu liên quan.</p>
        </div>
        {mediaImages.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mediaImages.map((item) => (
              <ImageCard key={`${item.label}-${item.url}`} label={item.label} url={item.url || ""} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
            <ImageIcon className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-semibold text-foreground">Chưa có ảnh cho giải này</p>
            <p className="text-sm text-muted-foreground">Có thể bổ sung ảnh bìa, logo hoặc QR trong phần chỉnh sửa giải.</p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-black uppercase text-foreground">Thông tin chi tiết của giải</h2>
          <p className="text-sm text-muted-foreground">Các trường nghiệp vụ đang lưu trong bản ghi giải đấu.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Mô tả" value={selectedTournament.description || "Chưa cập nhật"} />
          <Info label="Giải thưởng" value={selectedTournament.prizes || "Chưa cập nhật"} />
          <Info label="Địa điểm chi tiết" value={selectedTournament.rawLocation?.detail || selectedTournament.venue || "Chưa cập nhật"} />
          <Info label="Mở đăng ký" value={formatDateTimeDisplay(selectedTournament.rawTimeline?.registrationStart)} />
          <Info label="Đóng đăng ký" value={formatDateTimeDisplay(selectedTournament.rawTimeline?.registrationEnd)} />
          <Info label="Bắt đầu thi đấu" value={formatDateTimeDisplay(selectedTournament.rawTimeline?.tournamentStart)} />
          <Info label="Kết thúc thi đấu" value={formatDateTimeDisplay(selectedTournament.rawTimeline?.tournamentEnd)} />
          <Info label="Số đội hiện có" value={String(selectedTournament.registration.current)} />
          <Info label="Giới hạn đăng ký" value={String(selectedTournament.registration.max || selectedTournament.operations?.maxRegistrations || 0)} />
          <Info label="Trạng thái đăng ký" value={selectedTournament.registration.statusText} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-black uppercase text-foreground">Vận hành mở rộng</h2>
          <p className="text-sm text-muted-foreground">Thông tin đăng ký, lệ phí, truyền thông, gala và tài trợ đang lưu theo giải.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Hình thức đăng ký" value={selectedTournament.operations?.registrationMode === "external" ? "Link đăng ký riêng" : "Hệ thống của web"} />
          <Info label="Link form đăng ký" value={selectedTournament.operations?.registrationFormUrl || "Không dùng"} />
          <Info label="Link nhóm Zalo" value={selectedTournament.operations?.zaloGroupUrl || "Chưa cập nhật"} />
          <Info label="Giới hạn đăng ký" value={String(selectedTournament.operations?.maxRegistrations || selectedTournament.registration.max || 0)} />
          <Info label="Liên hệ hỗ trợ" value={selectedTournament.operations?.supportContacts || "Chưa cập nhật"} />
          <Info label="Lệ phí bao gồm" value={selectedTournament.operations?.feeIncludes || "Chưa cập nhật"} />
          <Info label="Ngân hàng" value={selectedTournament.operations?.bankName || "Chưa cập nhật"} />
          <Info label="Chủ tài khoản" value={selectedTournament.operations?.accountName || "Chưa cập nhật"} />
          <Info label="Số tài khoản" value={selectedTournament.operations?.accountNumber || "Chưa cập nhật"} />
          <Info label="Nội dung chuyển khoản" value={selectedTournament.operations?.transferContent || "Chưa cập nhật"} />
          <Info label="QR thanh toán" value={selectedTournament.operations?.paymentQR ? "Đã cấu hình" : "Chưa cấu hình"} />
          <Info label="Logo giải" value={selectedTournament.operations?.logo ? "Đã cấu hình" : "Chưa cấu hình"} />
          <Info label="Số banner/poster" value={String(selectedTournament.operations?.banner?.length || 0)} />
          <Info label="Gala" value={selectedTournament.operations?.hasGala ? "Có chương trình gala" : "Không có"} />
          <Info label="Địa điểm gala" value={selectedTournament.operations?.galaVenue || "Chưa cập nhật"} />
          <Info label="Liên hệ tài trợ" value={selectedTournament.operations?.sponsorContact || "Chưa cập nhật"} />
          <Info label="Số gói tài trợ" value={String(selectedTournament.operations?.sponsorTiers?.length || 0)} />
        </div>
      </div>


    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
    <p className="mt-1 break-words font-semibold text-foreground">{value}</p>
  </div>
);

const ImageCard = ({ label, url }: { label: string; url: string }) => (
  <figure className="overflow-hidden rounded-lg border border-border bg-background">
    <img src={url} alt={label} className="h-56 w-full object-cover" />
    <figcaption className="border-t border-border px-4 py-3 text-sm font-semibold text-foreground">{label}</figcaption>
  </figure>
);

export default OrgTournamentDashboardPage;
