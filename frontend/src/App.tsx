
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { LoginPage } from "./pages/loginPage";
import { RegisterPage } from "./pages/registerPage";
import OrgPage  from "./pages/orgPage";
import { ProtectedRoute } from "./components/auth/protectedRoute";
import {TournamentPage} from "./pages/tournamentPage";
import CreateTournamentModal from "./components/tournament/CreateTournamentModal/CreateTournamentModal";
import { MyTeamsPage } from "./pages/myteamPage";
import TournamentDetail from "@/components/tournament/TournamentDetail";
import {HomePage} from "./pages/homePage";
import { PublicLayout } from "@/layouts/PublicLayout";
import { CourtList } from "@/components/admin/court-list";
import { RefereeList } from "@/components/admin/referee-list";
import { TeamList } from "@/components/admin/team-list";
import FinanceDashboard from "@/components/admin/finance-management";







function App() {


  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
            <Routes>
        {/* Các trang KHÔNG CÓ LAYOUT (Auth) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 1. Các trang PUBLIC thường - CÓ NAVBAR VÀ FOOTER */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tournaments/:id" element={<TournamentPage />} />
        </Route>

        {/* 2. Các trang ADMIN - CÓ SIDEBAR (Bọc trong DashboardLayout) */}
        <Route element={<DashboardLayout />}>

         
          <Route path="/org" element={<OrgPage />} />
          <Route path="/org/courts" element={<CourtList />} />
          <Route path="/org/referees" element={<RefereeList />} />
          <Route path="/org/teams" element={<TeamList />} />
          
          {/* Routes sử dụng chung Component nhưng dành riêng cho từng giải đấu */}
          <Route path="/tournaments/:id/dashboard" element={<TournamentDetail />} />
          <Route path="/tournaments/:id/courts" element={<CourtList />} />
          <Route path="/tournaments/:id/referees" element={<RefereeList />} />
          <Route path="/tournaments/:id/teams" element={<TeamList />} />
          <Route path="/tournaments/:id/finance" element={<FinanceDashboard />} />

          <Route path="/create-tournament" element={<CreateTournamentModal><></></CreateTournamentModal>} />
          
          <Route path="/my-teams" element={<MyTeamsPage />} />
        </Route>

        {/* 3. Các trang BẢO MẬT - PHẢI ĐĂNG NHẬP (Bọc trong ProtectedRoute) */}
        <Route element={<ProtectedRoute />}>
          {/* Nếu có trang admin nào cần bắt đăng nhập + có cả sidebar, bạn có thể lồng tiếp ở đây */}
          {/* <Route element={<DashboardLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Route> */}
        </Route>
      </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
