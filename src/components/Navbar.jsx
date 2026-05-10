import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import Hook mới tạo

const Navbar = () => {
  // Lấy dữ liệu user và hàm logout trực tiếp từ Global State (Không dùng localStorage nữa)
  const { user, logout } = useAuth(); 

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 30px', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      {/* 1. PUBLIC ZONE */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/" style={{ fontWeight: 'bold', color: '#16a34a', textDecoration: 'none', fontSize: '1.2rem' }}>PTSC</Link>
        <Link to="/" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>Trang chủ</Link>
        <Link to="/standings" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>Bảng xếp hạng</Link>
        <Link to="/bracket" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>Sơ đồ cây</Link>
      </div>

      {/* 2. ROLE ZONE */}
      {user && (
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {user.role === 'Player' && (
            <>
              <Link to="/profile" style={{ padding: '6px 12px', background: '#e0f2fe', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold', color: '#0369a1' }}>Hồ sơ VĐV</Link>
              <Link to="/notifications" style={{ padding: '6px 12px', background: '#f3f4f6', borderRadius: '5px', textDecoration: 'none', color: '#374151' }}>Thông báo</Link>
              <Link to="/register-team" style={{ padding: '6px 12px', background: '#dcfce7', borderRadius: '5px', textDecoration: 'none', color: '#166534', fontWeight: 'bold' }}>Đăng ký đội</Link>
            </>
          )}

          {user.role === 'Referee' && (
            <>
              <Link to="/profile" style={{ padding: '6px 12px', background: '#e0f2fe', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold', color: '#0369a1' }}>Hồ sơ</Link>
              <Link to="/referee" style={{ padding: '6px 12px', background: '#fef3c7', borderRadius: '5px', textDecoration: 'none', color: '#b45309', fontWeight: 'bold' }}>Khu vực Trọng tài</Link>
            </>
          )}

          {user.role === 'Organization' && (
            <>
              <Link to="/admin" style={{ padding: '6px 12px', background: '#fee2e2', borderRadius: '5px', textDecoration: 'none', color: '#b91c1c', fontWeight: 'bold' }}>Tổ Chức / Admin</Link>
            </>
          )}
        </div>
      )}

      {/* 3. AUTH ZONE */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {!user ? (
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link to="/login" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Đăng nhập</Link>
            <Link to="/register" style={{ textDecoration: 'none', background: '#84cc16', color: '#fff', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold' }}>Đăng ký</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{user.displayName} ({user.role})</span>
            <button onClick={logout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Đăng xuất</button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;