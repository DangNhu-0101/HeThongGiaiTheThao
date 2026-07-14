import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { useAuthStore } from "./stores/useAuthStore";

// ==========================================
// 1. LAYOUTS & COMPONENTS
// ==========================================
import { ProtectedRoute } from "./components/auth/protectedRoute";
import OrgLayout from "./components/layout/org/OrgLayout";
import AdminLayout from "./components/layout/admin/AdminLayout";

// ==========================================
// 2. PUBLIC PAGES (Dành cho mọi người)
// ==========================================
import { LoginPage } from "./pages/loginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { RegisterPage } from "./pages/registerPage";
import HomePage from "./pages/homePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import NewsPage from "./pages/NewsPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import TournamentPage from "./pages/tournamentPage";
import TournamentDetailPage from "./pages/TournamentDetailPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import MatchDetailPage from "./pages/MatchDetailPage";
import ProfilePage from "./pages/ProfilePage";
import TournamentRegistrationPage from "./pages/TournamentRegistrationPage";
import CreateTeamPage from "./pages/CreateTeamPage";
import FindTeamPage from "./pages/FindTeamPage";
import MyTeamsPage from "./pages/MyTeamsPage";

// ==========================================
// 3. ORG PAGES (Dành cho Ban Tổ Chức)
// ==========================================
import OrgDashboardPage from "./pages/OrgDashboardPage";
import OrgTournamentMgmtPage from "./pages/OrgTournamentMgmtPage";
import OrgTournamentDashboardPage from "./pages/OrgTournamentDashboardPage";
import OrgTeamMgmtPage from "./pages/OrgTeamMgmtPage";
import OrgResourceMgmtPage from "./pages/OrgResourceMgmtPage";
import OrgResultMgmtPage from "./pages/OrgResultMgmtPage";
import OrgScheduleMgmtPage from "./pages/OrgScheduleMgmtPage";
import OrgFinanceMgmtPage from "./pages/OrgFinanceMgmtPage";
import OrgCompetitionFormatPage from "./pages/OrgCompetitionFormatPage";

// ==========================================
// 4. ADMIN PAGES (Dành cho Quản trị viên)
// ==========================================
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUserMgmtPage from "./pages/AdminUserMgmtPage";
import AdminSportsConfigPage from "./pages/AdminSportsConfigPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminBackendFeaturesPage from "./pages/AdminBackendFeaturesPage";
import AdminOrganizationsPage from "./pages/AdminOrganizationsPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AdminNewsMgmtPage from "./pages/AdminNewsMgmtPage";

function App() {
  const initialized = useAuthStore((state) => state.initialized);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    if (!initialized) void restoreSession();
  }, [initialized, restoreSession]);

  return (
    <>
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          classNames: {
            toast: "rounded-lg border border-border bg-card text-foreground shadow-[var(--shadow-panel)]",
            title: "font-bold",
            description: "text-muted-foreground",
            actionButton: "rounded-lg bg-primary text-primary-foreground",
            cancelButton: "rounded-lg bg-muted text-foreground",
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          
          {/* === PUBLIC ROUTES === */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:slug" element={<NewsDetailPage />} />
          <Route path="/tournaments" element={<TournamentPage />} />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          <Route path="/teams/:id" element={<TeamDetailPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />

          {/* === ORG ROUTES (BAN TỔ CHỨC) === */}
          {/* 
            Bảo vệ các route của Ban tổ chức. Yêu cầu:
            1. Đã đăng nhập.
            2. Có vai trò 'org' hoặc 'admin'.
            3. Nếu là 'org', phải có profile tổ chức đã được kích hoạt.
            Lưu ý: Bạn cần tạo component ProfileRequiredRoute để xử lý logic kiểm tra profile.
          */}
          <Route element={<ProtectedRoute allowedRoles={["org", "organization", "admin"]} />}>
              <Route path="/org" element={<OrgLayout />}>
                <Route path="dashboard" element={<OrgDashboardPage />} />
                <Route path="tournaments" element={<OrgTournamentMgmtPage />} />
                <Route path="tournament" element={<OrgTournamentDashboardPage />} />
                <Route path="competition-formats" element={<OrgCompetitionFormatPage />} />
                <Route path="schedule" element={<OrgScheduleMgmtPage />} />
                <Route path="results" element={<OrgResultMgmtPage />} />
                <Route path="teams" element={<OrgTeamMgmtPage />} />
                <Route path="resources" element={<OrgResourceMgmtPage />} />
                <Route path="finance" element={<OrgFinanceMgmtPage />} />
                <Route path="reports" element={<OrgTournamentDashboardPage />} />
                {/* Các route con khác của org... */}
              </Route>
          </Route>

          {/* === ADMIN ROUTES (QUẢN TRỊ HỆ THỐNG) === */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="organizations" element={<AdminOrganizationsPage />} />
              <Route path="users" element={<AdminUserMgmtPage />} />
              <Route path="sports" element={<AdminSportsConfigPage />} />
              <Route path="news" element={<AdminNewsMgmtPage />} />
              <Route path="backend-features" element={<AdminBackendFeaturesPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["player", "organization"]} />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-teams" element={<MyTeamsPage />} />
            <Route path="/teams/create" element={<CreateTeamPage />} />
            <Route path="/teams/find" element={<FindTeamPage />} />
            <Route path="/tournaments/:id/register" element={<TournamentRegistrationPage />} />
          </Route>

    

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
