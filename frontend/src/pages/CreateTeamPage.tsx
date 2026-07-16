import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Search, ShieldCheck, Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { participantService } from "@/services/participantService";
import { useParticipantStore } from "@/stores/useParticipantStore";
import type { TeamTournamentOption } from "@/types/participant";

const CreateTeamPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createParticipant = useParticipantStore((state) => state.createParticipant);
  const loading = useParticipantStore((state) => state.loading);
  const error = useParticipantStore((state) => state.error);
  const [tournaments, setTournaments] = useState<TeamTournamentOption[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [tournamentItemId, setTournamentItemId] = useState(searchParams.get("tournament") || "");
  const [tournamentSearch, setTournamentSearch] = useState("");
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");

  useEffect(() => {
    participantService.getTournamentOptions()
      .then((options) => {
        setTournaments(options);
        if (!searchParams.get("tournament") && options.length === 1) setTournamentItemId(options[0].id);
      })
      .catch(() => toast.error("Không thể tải danh sách giải đang nhận đăng ký."))
      .finally(() => setLoadingTournaments(false));
  }, [searchParams]);

  const selectedTournament = useMemo(
    () => tournaments.find((item) => item.id === tournamentItemId),
    [tournamentItemId, tournaments],
  );
  const filteredTournaments = useMemo(
    () => tournaments.filter((item) => `${item.parentTournamentName || ""} ${item.name} ${item.sportType}`.toLowerCase().includes(tournamentSearch.toLowerCase())),
    [tournamentSearch, tournaments],
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!tournamentItemId) return toast.error("Hãy chọn giải đấu.");

    try {
      const participant = await createParticipant({
        tournamentItemId,
        type: "team",
        name: name.trim(),
        logo: logo || undefined,
      });

      if (participant && participant._id) {
        toast.success("Đã tạo đội thành công!");
        navigate(`/teams/${participant._id}`, { replace: true });
      } else {
        toast.error("Đăng ký thành công nhưng chưa mở được trang chi tiết đội. Vui lòng tải lại danh sách đội.");
      }
    } catch (error: unknown) {
      console.error("Lỗi tạo đội:", error);
      toast.error("Đã xảy ra lỗi khi kết nối đến máy chủ.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-10 lg:grid-cols-[1fr_340px]">
        <form onSubmit={submit} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-primary">Dành cho đội trưởng</p>
            <h1 className="mt-2 text-3xl font-bold">Tạo đội thi đấu</h1>
            <p className="mt-2 text-sm text-muted-foreground">Chọn giải trước, sau đó nhập thông tin đội. Mỗi vận động viên chỉ được tham gia một đội trong cùng giải.</p>
          </div>

          <div className="space-y-3">
            <Label>Chọn giải tham gia *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={tournamentSearch} onChange={(event) => setTournamentSearch(event.target.value)} placeholder="Tìm giải, hội thao hoặc môn..." />
            </div>
            <div className="grid max-h-80 gap-3 overflow-y-auto rounded-xl border border-border p-3 md:grid-cols-2">
              {filteredTournaments.map((item) => {
                const active = item.id === tournamentItemId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTournamentItemId(item.id)}
                    className={`rounded-xl border p-4 text-left transition-colors ${active ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted"}`}
                  >
                    <p className="font-bold">{item.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.parentTournamentName ? `${item.parentTournamentName} · ` : ""}{item.sportType}</p>
                    {item.registrationEnd && <p className="mt-3 text-[11px] font-bold text-primary">Đóng đăng ký: {new Date(item.registrationEnd).toLocaleDateString("vi-VN")}</p>}
                  </button>
                );
              })}
              {!loadingTournaments && filteredTournaments.length === 0 && <div className="col-span-full rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Không tìm thấy giải phù hợp.</div>}
              {loadingTournaments && <div className="col-span-full p-6 text-center text-sm text-muted-foreground">Đang tải danh sách giải...</div>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-name">Tên đội *</Label>
            <Input id="team-name" required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Saigon Smashers" />
          </div>

          <ImageUploadField label="Logo đội" value={logo} onChange={setLogo} recommended="Chọn ảnh từ máy, tối đa 3 MB" />

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <Button
            type="submit"
            className="h-12 w-full text-base font-bold"
            disabled={loading || loadingTournaments || !tournamentItemId}
          >
            {loading ? "Đang tạo đội..." : "Tạo đội và tham gia giải"}
          </Button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-bold">Sau khi tạo đội</h2>
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex gap-3"><Users className="mt-0.5 h-4 w-4 text-primary" /><span>Đội xuất hiện trong danh sách đội của giải để vận động viên tìm và xin gia nhập.</span></div>
              <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 text-primary" /><span>Đội trưởng có thể mời thành viên hoặc duyệt yêu cầu gia nhập.</span></div>
            </div>
          </div>
          {selectedTournament && (
            <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
              <p className="text-xs font-bold uppercase opacity-75">Đang chọn</p>
              <h3 className="mt-2 text-lg font-bold">{selectedTournament.name}</h3>
              <p className="mt-1 text-sm opacity-80">{selectedTournament.sportType}</p>
              {selectedTournament.registrationEnd && (
                <p className="mt-4 flex items-center gap-2 text-xs">
                  <CalendarDays className="h-4 w-4" />
                  Đóng đăng ký: {new Date(selectedTournament.registrationEnd).toLocaleString("vi-VN")}
                </p>
              )}
            </div>
          )}
        </aside>
      </main>
      <Footer />
    </div>
  );
};

export default CreateTeamPage;
