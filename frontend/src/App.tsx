import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { ProtectedRoute } from "@/components/auth/protectedRoute";
import CreateTournamentModal from "@/components/tournament/CreateTournamentModal/CreateTournamentModal";
import TournamentDetail from "@/components/tournament/TournamentDetail";
import { CourtList } from "@/components/admin/court-list";
import { RefereeList } from "@/components/admin/referee-list";
import { TeamList } from "@/components/admin/team-list";
import FinanceDashboard from "@/components/admin/finance-management";
import { ImportManager as AdminImportManager } from "@/components/admin/ImportManager";
import { MatchScoringView } from "@/components/match/MatchScoringView";
import { HomePage } from "@/pages/homePage";
import { LoginPage } from "@/pages/loginPage";
import { MyTeamsPage } from "@/pages/myteamPage";
import OrgPage from "@/pages/orgPage";
import { RegisterPage } from "@/pages/registerPage";
import { TournamentPage } from "@/pages/tournamentPage";
import { TournamentAutomatorPage } from "@/pages/TournamentAutomatorPage";
import {SystemSettingsPage} from "@/pages/SystemSettingsPage";

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/tournaments/:id" element={<TournamentPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/my-teams" element={<MyTeamsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["org", "Organization", "ORGANIZER"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/org" element={<OrgPage />} />
              <Route path="/org/courts" element={<CourtList />} />
              <Route path="/org/referees" element={<RefereeList />} />
              <Route path="/org/teams" element={<TeamList />} />
              <Route path="/org/import" element={<AdminImportManager />} />

              <Route path="/tournaments/:id/dashboard" element={<TournamentDetail />} />
              <Route path="/tournaments/:id/rules" element={<TournamentAutomatorPage />} />
              <Route path="/tournaments/:id/matches" element={<MatchScoringView />} />
              <Route path="/tournaments/:id/courts" element={<CourtList />} />
              <Route path="/tournaments/:id/referees" element={<RefereeList />} />
              <Route path="/tournaments/:id/teams" element={<TeamList />} />
              <Route path="/tournaments/:id/finance" element={<FinanceDashboard />} />
              <Route path="/tournaments/:id/import" element={<AdminImportManager />} />
              <Route path="/settings" element={<SystemSettingsPage />} />

              <Route path="/create-tournament" element={<CreateTournamentModal><></></CreateTournamentModal>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
