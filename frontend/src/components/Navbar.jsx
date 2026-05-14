import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/',          label: 'Trang chủ'    },
  { to: '/standings', label: 'Bảng xếp hạng' },
  { to: '/bracket',   label: 'Sơ đồ cây'    },
];

const ROLE_ACTIONS = {
  player: [
    { to: '/profile',       label: 'Hồ sơ VĐV',  variant: 'ghost'   },
    { to: '/notifications', label: 'Thông báo',   variant: 'ghost'   },
    { to: '/register-team', label: 'Đăng ký đội', variant: 'primary' },
  ],
  referee: [
    { to: '/profile',  label: 'Hồ sơ',           variant: 'ghost'   },
    { to: '/referee',  label: 'Khu vực Trọng tài', variant: 'warning' },
  ],
  Organization: [
    { to: '/admin', label: 'Tổ chức', variant: 'danger' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      <style>{`
        /* ── SHELL ── */
        .nb-wrap {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--bg-white, #fff);
          border-bottom: 1px solid rgba(2,69,122,0.1);
          font-family: 'Be Vietnam Pro', 'Segoe UI', sans-serif;
        }
        .nb-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 60px;
          display: flex;
          align-items: center;
          gap: 0;
        }

        /* ── LOGO ── */
        .nb-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
          margin-right: 32px;
        }
        .nb-logo-mark {
          width: 32px; height: 32px;
          background: var(--ocean-deep, #02457A);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: #fff;
          letter-spacing: -0.5px;
          flex-shrink: 0;
        }
        .nb-logo-text {
          font-size: 15px;
          font-weight: 700;
          color: var(--ocean-deep, #02457A);
          letter-spacing: 0.5px;
        }

        /* ── PUBLIC LINKS ── */
        .nb-links {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
        }
        .nb-link {
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          color: #5a6a7a;
          padding: 6px 12px;
          border-radius: 8px;
          transition: color 0.15s, background 0.15s;
          white-space: nowrap;
        }
        .nb-link:hover { color: var(--ocean-deep, #02457A); background: rgba(2,69,122,0.06); }
        .nb-link.active { color: var(--ocean-deep, #02457A); font-weight: 600; background: rgba(2,69,122,0.06); }

        /* ── RIGHT ZONE ── */
        .nb-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        /* ── ROLE ACTION CHIPS ── */
        .nb-chip {
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid transparent;
          white-space: nowrap;
          transition: opacity 0.15s, transform 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .nb-chip:hover { opacity: 0.85; transform: translateY(-1px); }
        .nb-chip.ghost   { background: rgba(2,69,122,0.07); color: var(--ocean-deep, #02457A); border-color: rgba(2,69,122,0.12); }
        .nb-chip.primary { background: var(--ocean-mid, #018ABE); color: #fff; }
        .nb-chip.warning { background: rgba(189,0,20,0.08); color: var(--logo-red, #BD0014); border-color: rgba(189,0,20,0.15); }
        .nb-chip.danger  { background: rgba(189,0,20,0.08); color: var(--logo-red, #BD0014); border-color: rgba(189,0,20,0.15); }

        /* ── DIVIDER ── */
        .nb-sep {
          width: 1px;
          height: 20px;
          background: rgba(2,69,122,0.12);
          margin: 0 4px;
          flex-shrink: 0;
        }

        /* ── USER PILL ── */
        .nb-user-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--sky-mist, #D6E7EE);
          border-radius: 20px;
          padding: 4px 14px 4px 5px;
        }
        .nb-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: var(--ocean-deep, #02457A);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }
        .nb-user-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--ocean-deep, #02457A);
        }
        .nb-user-role {
          font-size: 10px;
          color: var(--ocean-mid, #018ABE);
          font-weight: 500;
        }

        /* ── LOGOUT ── */
        .nb-logout {
          background: none;
          border: 1px solid rgba(189,0,20,0.2);
          color: var(--logo-red, #BD0014);
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s;
        }
        .nb-logout:hover { background: rgba(189,0,20,0.07); }

        /* ── AUTH BUTTONS ── */
        .nb-login {
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          color: var(--ocean-deep, #02457A);
          padding: 6px 14px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .nb-login:hover { background: rgba(2,69,122,0.06); }
        .nb-register {
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          background: var(--ocean-mid, #018ABE);
          padding: 7px 18px;
          border-radius: 20px;
          transition: background 0.15s, transform 0.15s;
        }
        .nb-register:hover { background: #019fd8; transform: translateY(-1px); }

        /* ── MOBILE TOGGLE ── */
        .nb-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          color: var(--ocean-deep, #02457A);
          font-size: 20px;
          margin-left: auto;
        }

        /* ── MOBILE MENU ── */
        .nb-mobile-menu {
          display: none;
          flex-direction: column;
          padding: 12px 16px 16px;
          border-top: 1px solid rgba(2,69,122,0.08);
          gap: 6px;
        }
        .nb-mobile-menu.open { display: flex; }
        .nb-mobile-link {
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          color: #3a4a5a;
          padding: 10px 14px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .nb-mobile-link:hover { background: rgba(2,69,122,0.06); color: var(--ocean-deep, #02457A); }
        .nb-mobile-link.active { color: var(--ocean-deep, #02457A); font-weight: 600; background: rgba(2,69,122,0.06); }

        @media (max-width: 768px) {
          .nb-links { display: none; }
          .nb-right  { display: none; }
          .nb-toggle { display: flex; }
        }
      `}</style>

      <nav className="nb-wrap">
        <div className="nb-inner">

          {/* LOGO */}
          <Link to="/" className="nb-logo">
            <div className="nb-logo-mark">PB</div>
            <span className="nb-logo-text">ITVTG</span>
          </Link>

          {/* PUBLIC LINKS */}
          <div className="nb-links">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className={`nb-link ${isActive(to) ? 'active' : ''}`}>
                {label}
              </Link>
            ))}
          </div>

          {/* RIGHT ZONE */}
          <div className="nb-right">

            {/* ROLE ACTIONS */}
            {user && ROLE_ACTIONS[user.role]?.map(({ to, label, variant }) => (
              <Link key={to} to={to} className={`nb-chip ${variant}`}>
                {label}
              </Link>
            ))}

            {user && <div className="nb-sep" />}

            {/* AUTH / USER */}
            {!user ? (
              <>
                <Link to="/login" className="nb-login">Đăng nhập</Link>
                <Link to="/register" className="nb-register">Đăng ký</Link>
              </>
            ) : (
              <>
                <div className="nb-user-pill">
                  <div className="nb-avatar">
                    {(user.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="nb-user-name">{user.displayName}</div>
                    <div className="nb-user-role">{user.role}</div>
                  </div>
                </div>
                <button className="nb-logout" onClick={logout}>Đăng xuất</button>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <button
            className="nb-toggle"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Mở menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>

        </div>

        {/* MOBILE MENU */}
        <div className={`nb-mobile-menu ${menuOpen ? 'open' : ''}`}>
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`nb-mobile-link ${isActive(to) ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}

          {user && ROLE_ACTIONS[user.role]?.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="nb-mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}

          {!user ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Link to="/login" className="nb-mobile-link" onClick={() => setMenuOpen(false)}>Đăng nhập</Link>
              <Link to="/register" className="nb-register" style={{ flex: 1, textAlign: 'center' }} onClick={() => setMenuOpen(false)}>Đăng ký</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, padding: '8px 14px', background: 'rgba(2,69,122,0.05)', borderRadius: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ocean-deep, #02457A)' }}>
                {user.displayName} · {user.role}
              </span>
              <button className="nb-logout" onClick={() => { logout(); setMenuOpen(false); }}>Đăng xuất</button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}