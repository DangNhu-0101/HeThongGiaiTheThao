import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { ProtectedRoute } from "./components/auth/protectedRoute";
import AdminLayout from "./components/layout/admin/AdminLayout";
import OrgLayout from "./components/layout/org/OrgLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminSportsConfigPage from "./pages/AdminSportsConfigPage";
import AdminUserMgmtPage from "./pages/AdminUserMgmtPage";
import HomePage from "./pages/homePage";
import { LoginPage } from "./pages/loginPage";
import MatchDetailPage from "./pages/MatchDetailPage";
import OrgDashboardPage from "./pages/OrgDashboardPage";
import OrgFinanceMgmtPage from "./pages/OrgFinanceMgmtPage";
import OrgResourceMgmtPage from "./pages/OrgResourceMgmtPage";
import OrgResultMgmtPage from "./pages/OrgResultMgmtPage";
import OrgScheduleMgmtPage from "./pages/OrgScheduleMgmtPage";
import OrgTeamMgmtPage from "./pages/OrgTeamMgmtPage";
import OrgTournamentMgmtPage from "./pages/OrgTournamentMgmtPage";
import ProfilePage from "./pages/ProfilePage";
import { RegisterPage } from "./pages/registerPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import TournamentDetailPage from "./pages/TournamentDetailPage";
import TournamentPage from "./pages/tournamentPage";

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/tournaments" element={<TournamentPage />} />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          <Route path="/teams/:id" element={<TeamDetailPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["org", "admin"]} />}>
            <Route path="/org" element={<OrgLayout />}>
              <Route path="dashboard" element={<OrgDashboardPage />} />
              <Route path="tournaments" element={<OrgTournamentMgmtPage />} />
              <Route path="teams" element={<OrgTeamMgmtPage />} />
              <Route path="resources" element={<OrgResourceMgmtPage />} />
              <Route path="results" element={<OrgResultMgmtPage />} />
              <Route path="schedule" element={<OrgScheduleMgmtPage />} />
              <Route path="finance" element={<OrgFinanceMgmtPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUserMgmtPage />} />
              <Route path="sports" element={<AdminSportsConfigPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
