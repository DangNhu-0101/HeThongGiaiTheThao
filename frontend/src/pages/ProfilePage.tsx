import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getRoleLabel } from "@/libs/auth";
import { useAuthStore } from "@/stores/useAuthStore";

const ProfilePage = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="border border-border bg-card rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xl font-black">
              {(user?.username || "U").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black">{user?.username || "Tai khoan"}</h1>
              <p className="text-sm text-muted-foreground uppercase font-bold">{getRoleLabel(user?.role)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Email</p>
              <p className="font-semibold">{user?.email || "Backend chua tra email"}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">So dien thoai</p>
              <p className="font-semibold">{user?.phoneNumber || "Backend chua tra so dien thoai"}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">User ID</p>
              <p className="font-semibold break-all">{user?._id || "Backend chua tra id"}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Vai tro</p>
              <p className="font-semibold">{user?.role || "user"}</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
