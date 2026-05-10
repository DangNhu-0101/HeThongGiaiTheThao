import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
// Lưu ý: Không cần import api axios ở đây nữa vì AuthContext đã lo việc gọi API

// --- CÁC TRANG SHARED & PUBLIC ---
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
import ScheduleDrafts from './pages/ScheduleDrafts';
import RegisterTeam from './pages/RegisterTeam';
import TeamDetail from './pages/TeamDetail';
import Navbar from './components/Navbar';

// --- CÁC TRANG DÀNH RIÊNG CHO ORGANIZATION (ADMIN) ---
// Admin chính là component Organization (chứa Layout Sidebar + Outlet)
import Admin from './pages/Organization/Organization'; 

// Import đầy đủ các Views nằm trong thư mục Organization/views
import DashboardView from './pages/Organization/views/DashboardView';
import TournamentRulesView from './pages/Organization/views/TournamentRulesView'; // Chứa cái DynamicStageConfig hoặc RuleFormModal
import TournamentDetailView from './pages/Organization/views/TournamentDetailView';
import MatchView from './pages/Organization/views/MatchView';
import TeamView from './pages/Organization/views/TeamView';
import CourtView from './pages/Organization/views/CourtView';
import FinanceView from './pages/Organization/views/FinanceView';
import UserListView from './pages/Organization/views/UserListView';


// TẠO TRẠM KIỂM SOÁT BẢO MẬT ĐÃ ĐƯỢC TỐI ƯU (Dùng Global State)
const ProtectedRoute = ({ children, allowedRoles }) => {
  // Rút trích thông tin user và trạng thái loading trực tiếp từ AuthContext
  const { user, loading } = useAuth();

  // Đang kiểm tra token với server -> Hiện loading trạng thái mượt mà
  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-neutral-cream">
              <div className="p-10 text-center text-teal-accent font-title font-bold text-2xl animate-pulse">
                  Đang kiểm tra dữ liệu bảo mật...
              </div>
          </div>
      );
  }

  // 1. Không hợp lệ (Không có cookie/Token hết hạn hoặc user = null) -> Đá về Login
  if (!user) return <Navigate to="/login" replace />;

  // 2. Organization được quyền đi muôn nơi (Bypass mọi luật lệ)
  if (user.role === 'Organization') return children;

  // 3. Nếu route có yêu cầu Role cụ thể, mà User không có quyền -> Đá về Home
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  // 4. Hợp lệ -> Cho phép truy cập
  return children;
};

// COMPONENT TẠM THỜI CHO CÁC TRANG CHƯA LÀM
const ComingSoon = ({ title }) => (
  <div style={{ textAlign: 'center', padding: '50px' }}>
    <h2 className="text-2xl font-title text-dark-forest">{title}</h2>
    <p className="text-gray-500">Trang này đang được xây dựng...</p>
  </div>
);

function App() {
  return (
    // FIX CHÍNH: Bao bọc toàn bộ ứng dụng bằng AuthProvider để cấp phát Global State
    <AuthProvider>
      <Router>
        {/* Navbar hiển thị chung cho các trang ngoài Admin */}
        <Navbar />

        <Routes>
          {/* ==========================================
              CÁC TRANG PUBLIC (Không cần đăng nhập) 
          ========================================== */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/bracket" element={<Bracket />} />
          <Route path="/fixtures" element={<Fixtures />} />

          {/* ==========================================
              CÁC TRANG USER (Chỉ cần đăng nhập, không phân biệt Role)
          ========================================== */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
          {/* ==========================================
              CÁC TRANG DÀNH CHO PLAYER (VÀ ORG)
          ========================================== */}
          <Route path="/notifications" element={<ProtectedRoute allowedRoles={['Player', 'Referee']}><Notifications /></ProtectedRoute>} />
          <Route path="/register-team" element={<ProtectedRoute allowedRoles={['Player']}><RegisterTeam /></ProtectedRoute>} />
          <Route path="/my-teams" element={<ProtectedRoute allowedRoles={['Player']}><MyTeams /></ProtectedRoute>} />
          <Route path="/teams/:id" element={<ProtectedRoute allowedRoles={['Player']}><TeamDetail /></ProtectedRoute>} />
          {/* ==========================================
              CÁC TRANG DÀNH CHO REFEREE (VÀ ORG)
          =================================== ======= */}
          <Route path="/referee" element={<ProtectedRoute allowedRoles={['Referee']}><Referee /></ProtectedRoute>} />

          {/* ==========================================
              CÁC TRANG QUYỀN LỰC NHẤT DÀNH CHO ORGANIZATION (NESTED ROUTING)
          ========================================== */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['Organization']}>
                <Admin /> {/* Admin chính là Organization.jsx (Chứa Sidebar và <Outlet />) */}
              </ProtectedRoute>
            }
          >
              {/* Khi URL là "/admin", nó sẽ load DashboardView vào lỗ hổng <Outlet /> 
              */}
              <Route index element={<DashboardView />} />
                
              {/* Global admin routes */}
              <Route path="users" element={<UserListView />} />

              {/* ĐÃ FIX: Bổ sung Route gốc khi chọn 1 giải đấu cụ thể
              */}
              <Route path="tournament/:id" element={<DashboardView />} /> 
              
              <Route path="tournament/:id/rules" element={<TournamentRulesView />} />             
              <Route path="tournament/:id/settings" element={<TournamentDetailView />} />
              <Route path="tournament/:id/teams" element={<TeamView />} />
              <Route path="tournament/:id/matches" element={<MatchView />} />
              <Route path="tournament/:id/courts" element={<CourtView />} />
              <Route path="tournament/:id/finance" element={<FinanceView />} />
              
              {/* Route gốc của bạn chuyển thành Route con */}
              <Route path="schedule-drafts" element={<ScheduleDrafts />} />
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;