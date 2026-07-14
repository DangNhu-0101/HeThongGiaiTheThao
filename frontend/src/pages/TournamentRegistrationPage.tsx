import { Link, Navigate, useParams } from "react-router-dom";
import { Search, Users } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";

const TournamentRegistrationPage = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { accessToken, user, initialized } = useAuthStore();

  if (!initialized) return <div className="flex min-h-screen items-center justify-center">Đang xác thực...</div>;
  if (!accessToken || !user) return <Navigate to="/login" replace state={{ from: `/tournaments/${id}/register` }} />;

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <Link to={`/tournaments/${id}`} className="text-xs font-bold text-primary hover:underline">Quay lại giải đấu</Link>
          <h1 className="mt-3 text-3xl font-black">Đăng ký tham gia giải</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Chọn một luồng đăng ký. Mỗi player chỉ được thuộc một đội trong cùng giải; các bước mời/duyệt thành viên sẽ xử lý trong trang đội.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-black">Tạo đội</h2>
              <p className="mt-2 text-sm text-muted-foreground">Bạn là đội trưởng, tạo đội trong giải này rồi mời thành viên.</p>
              <Button className="mt-6 w-full" render={<Link to={`/teams/create?tournament=${id}`} />}>Tạo đội trong giải này</Button>
            </div>

            <div className="rounded-2xl border border-border bg-background p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Search className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-black">Tìm đội</h2>
              <p className="mt-2 text-sm text-muted-foreground">Xem danh sách đội trong giải, xem hồ sơ đội và gửi yêu cầu gia nhập.</p>
              <Button className="mt-6 w-full" variant="outline" render={<Link to={`/teams/find?tournament=${id}`} />}>Tìm đội trong giải này</Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TournamentRegistrationPage;
