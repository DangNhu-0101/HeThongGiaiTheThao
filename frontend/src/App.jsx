import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// --- CÁC TRANG SHARED & PUBLIC ---
import TournamentsList from './pages/TournamentsList';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Standings from './pages/Standings';
import Referee from './pages/Referee';
import Profile from './pages/Profile';
import Bracket from './pages/Bracket';
import Fixtures from './pages/Fixtures';
import Notifications from './pages/Notifications';
import MyTeams from './pages/MyTeam';
import Payment from './pages/Payment';
import ScheduleDrafts from './pages/ScheduleDrafts';
import RegisterTeam from './pages/RegisterTeam';
import TeamDetail from './pages/TeamDetail';
import Navbar from './components/Navbar';

// --- CÁC TRANG DÀNH RIÊNG CHO Organization (ADMIN) ---
import Admin from './pages/Organization/Organization';

// Import đầy đủ các Views nằm trong thư mục Organization/views
import ImportManager from './pages/Organization/views/ImportManager';
import DashboardView from './pages/Organization/views/DashboardView';
import TournamentManagementView from './pages/Organization/views/TournamentManagementView';
import TournamentRulesView from './pages/Organization/views/TournamentRulesView';
import TournamentDetailView from './pages/Organization/views/TournamentDetailView';
import MatchView from './pages/Organization/views/MatchView';
import TeamView from './pages/Organization/views/TeamView';
import CourtView from './pages/Organization/views/CourtView';
import FinanceView from './pages/Organization/views/FinanceView';
import UserListView from './pages/Organization/views/UserListView';


// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-light)' }}>
        <div className="p-10 text-center">
          <div className="skeleton" style={{ width: 200, height: 200, borderRadius: '50%', margin: '0 auto 20px' }} />
          <p style={{ color: 'var(--ocean-deep)', fontFamily: 'var(--font-title)' }}>
            Đang tải dữ liệu ...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'Organization') return children;

  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

// Component cho các trang đang phát triển
const ComingSoon = ({ title }) => (
  <div className="page-container" style={{ textAlign: 'center', padding: '50px' }}>
    <h2 style={{ color: 'var(--ocean-deep)', marginBottom: 16 }}>{title}</h2>
    <p style={{ color: '#5a6a7a' }}>Trang này đang được xây dựng...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* ==========================================
              CÁC TRANG PUBLIC (Không cần đăng nhập)
          ========================================== */}
          <Route path="/" element={<TournamentsList />} />
          <Route path="/admin/import" element={<ImportManager />} />
          <Route path="/tournaments/:tournamentId" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/bracket" element={<Bracket />} />
          <Route path="/fixtures" element={<Fixtures />} />

          {/* ==========================================
              CÁC TRANG USER (Chỉ cần đăng nhập)
          ========================================== */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* ==========================================
              CÁC TRANG DÀNH CHO player
          ========================================== */}
          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={['player', 'Referee']}>
              <Notifications />
            </ProtectedRoute>
          } />
          
          <Route path="/register-team" element={
            <ProtectedRoute allowedRoles={['player']}>
              <RegisterTeam />
            </ProtectedRoute>
          } />
          
          <Route path="/my-teams" element={
            <ProtectedRoute allowedRoles={['player']}>
              <MyTeams />
            </ProtectedRoute>
          } />
          
          <Route path="/team/detail/:id" element={
            <ProtectedRoute allowedRoles={['player']}>
              <TeamDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/payment/:id" element={<Payment />} />

          {/* ==========================================
              CÁC TRANG DÀNH CHO REFEREE
          ========================================== */}
          <Route path="/referee" element={
            <ProtectedRoute allowedRoles={['Referee']}>
              <Referee />
            </ProtectedRoute>
          } />

          {/* ==========================================
              CÁC TRANG DÀNH CHO Organization (ADMIN)
          ========================================== */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['Organization']}>
                <Admin />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardView />} />
            <Route path="users" element={<UserListView />} />
            <Route path="tournaments" element={<TournamentManagementView />} />
            <Route path="tournament/:id" element={<DashboardView />} />
            <Route path="tournament/:id/rules" element={<TournamentRulesView />} />
            <Route path="tournament/:id/settings" element={<TournamentDetailView />} />
            <Route path="tournament/:id/teams" element={<TeamView />} />
            <Route path="tournament/:id/matches" element={<MatchView />} />
            <Route path="tournament/:id/courts" element={<CourtView />} />
            <Route path="tournament/:id/finance" element={<FinanceView />} />
            <Route path="schedule-drafts" element={<ScheduleDrafts />} />
          </Route>

          {/* Fallback route - 404 */}
          <Route path="*" element={<ComingSoon title="404 - Không tìm thấy trang" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;