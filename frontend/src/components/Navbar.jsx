import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';

const NAV_LINKS = [
  { to: '/',          label: 'Trang chủ'     },
  { to: '/standings', label: 'Bảng xếp hạng' },
  { to: '/bracket',   label: 'Sơ đồ cây'     },
];

/* Menu dropdown theo role */
const USER_MENU = {
  player: [
    { to: '/profile',       label: 'Hồ sơ VĐV'   },
    { to: '/register-team', label: 'Đăng ký đội'  },
    { to: '/my-teams',      label: 'Quản lý đội'  },
  ],
  referee: [
    { to: '/profile',  label: 'Hồ sơ'             },
    { to: '/referee',  label: 'Khu vực Trọng tài'  },
  ],
  Organization: [
    { to: '/admin',    label: 'Tổ chức / Admin'    },
    { to: '/profile',  label: 'Hồ sơ'              },
  ],
};

const IMAGE_BASE = 'http://localhost:5001/';

/* Logo SVG mặc định */
const DEFAULT_LOGO = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='34' height='34' viewBox='0 0 34 34'%3E%3Crect width='34' height='34' rx='8' fill='%2302457A'/%3E%3Ccircle cx='17' cy='17' r='7' fill='none' stroke='%2397CADB' stroke-width='2'/%3E%3Ccircle cx='17' cy='17' r='2.5' fill='%2397CADB'/%3E%3Cline x1='17' y1='8' x2='17' y2='12.5' stroke='%2397CADB' stroke-width='1.5'/%3E%3Cline x1='17' y1='21.5' x2='17' y2='26' stroke='%2397CADB' stroke-width='1.5'/%3E%3Cline x1='8' y1='17' x2='12.5' y2='17' stroke='%2397CADB' stroke-width='1.5'/%3E%3Cline x1='21.5' y1='17' x2='26' y2='17' stroke='%2397CADB' stroke-width='1.5'/%3E%3C/svg%3E`;

const CSS = `
  :root {
    --ocean-deep:    #02457A;
    --ocean-mid:     #018ABE;
    --ocean-pale:    #97CADB;
    --sky-mist:      #D6E7EE;
    --logo-red:      #BD0014;
    --dark-base:     #18181C;
    --bg-white:      #FFFFFF;
  }

  .nb-wrap {
    position: sticky; top: 0; z-index: 200;
    background: var(--bg-white);
    border-bottom: 1px solid rgba(2,69,122,0.1);
    font-family: 'Be Vietnam Pro', 'Segoe UI', sans-serif;
  }
  .nb-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 0 24px; height: 60px;
    display: flex; align-items: center;
  }

  /* LOGO */
  .nb-logo {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none; flex-shrink: 0; margin-right: 28px;
  }
  .nb-logo-img {
    width: 34px; height: 34px; border-radius: 8px;
    object-fit: cover; border: 1px solid rgba(2,69,122,0.12);
    flex-shrink: 0;
  }
  .nb-logo-name { font-size: 15px; font-weight: 700; color: var(--ocean-deep); letter-spacing: 0.5px; }
  .nb-logo-sub  { font-size: 10px; color: var(--ocean-pale); font-weight: 500; margin-top: 1px; }

  /* NAV LINKS */
  .nb-links { display: flex; align-items: center; gap: 2px; flex: 1; }
  .nb-link {
    text-decoration: none; font-size: 13px; font-weight: 500;
    color: #5a6a7a; padding: 6px 12px; border-radius: 8px;
    transition: color .15s, background .15s; white-space: nowrap;
  }
  .nb-link:hover { color: var(--ocean-deep); background: rgba(2,69,122,.06); }
  .nb-link.act   { color: var(--ocean-deep); font-weight: 600; background: rgba(2,69,122,.06); }

  /* RIGHT ZONE */
  .nb-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  /* QUICK CHIPS (referee / org) */
  .nb-chip {
    text-decoration: none; font-size: 12px; font-weight: 600;
    padding: 6px 14px; border-radius: 8px; border: 1px solid transparent;
    white-space: nowrap; transition: opacity .15s, transform .15s;
  }
  .nb-chip:hover { opacity: .85; transform: translateY(-1px); }
  .nb-chip.warn { background: rgba(189,0,20,.08); color: var(--logo-red); border-color: rgba(189,0,20,.18); }
  .nb-chip.dang { background: rgba(189,0,20,.08); color: var(--logo-red); border-color: rgba(189,0,20,.18); }

  .nb-sep { width: 1px; height: 20px; background: rgba(2,69,122,.12); flex-shrink: 0; }

  /* ── BELL ── */
  .nb-bell-wrap { position: relative; flex-shrink: 0; }
  .nb-bell-btn {
    width: 36px; height: 36px; border-radius: 50%;
    border: 1px solid rgba(2,69,122,.14);
    background: var(--bg-white); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s, border-color .15s; position: relative;
  }
  .nb-bell-btn:hover { background: var(--sky-mist); border-color: var(--ocean-pale); }
  .nb-bell-svg { width: 16px; height: 16px; color: #5a6a7a; display: block; }
  .nb-bell-btn:hover .nb-bell-svg { color: var(--ocean-deep); }
  .nb-bell-badge {
    position: absolute; top: -3px; right: -3px;
    min-width: 16px; height: 16px;
    background: var(--logo-red); color: #fff;
    border-radius: 8px; font-size: 9px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    padding: 0 3px; border: 2px solid #fff; line-height: 1;
  }

  /* NOTIF DROPDOWN */
  .nb-notif-dd {
    position: absolute; top: calc(100% + 10px); right: 0;
    width: 310px; background: var(--bg-white);
    border: 1px solid rgba(2,69,122,.12); border-radius: 14px;
    box-shadow: 0 8px 28px rgba(2,69,122,.13); z-index: 300;
    overflow: hidden; animation: nbDrop .18s ease;
  }
  .nb-notif-head {
    display: flex; justify-content: space-between; align-items: center;
    padding: 11px 15px; border-bottom: 1px solid rgba(2,69,122,.08);
  }
  .nb-notif-ttl { font-size: 11px; font-weight: 700; color: var(--ocean-deep); text-transform: uppercase; letter-spacing: 1.5px; }
  .nb-notif-clear {
    font-size: 11px; font-weight: 600; color: var(--ocean-mid);
    background: none; border: none; cursor: pointer; font-family: inherit;
  }
  .nb-notif-clear:hover { text-decoration: underline; }
  .nb-notif-list { max-height: 260px; overflow-y: auto; }
  .nb-notif-list::-webkit-scrollbar { width: 3px; }
  .nb-notif-list::-webkit-scrollbar-thumb { background: var(--ocean-pale); border-radius: 3px; }
  .nb-notif-row {
    display: flex; gap: 10px; align-items: flex-start;
    padding: 11px 15px; border-bottom: 1px solid rgba(214,231,238,.6);
    cursor: pointer; transition: background .12s;
  }
  .nb-notif-row:last-child { border-bottom: none; }
  .nb-notif-row:hover { background: rgba(214,231,238,.35); }
  .nb-notif-row.unread { background: rgba(1,138,190,.04); }
  .nb-notif-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--ocean-mid); flex-shrink: 0; margin-top: 4px;
  }
  .nb-notif-dot.read { background: transparent; border: 1.5px solid #bbb; }
  .nb-notif-msg  { font-size: 12px; color: #3a4a5a; line-height: 1.55; flex: 1; }
  .nb-notif-time { font-size: 10px; color: #9aadba; margin-top: 2px; }
  .nb-notif-empty { padding: 28px 16px; text-align: center; font-size: 13px; color: #9aadba; }
  .nb-notif-foot {
    padding: 9px 15px; border-top: 1px solid rgba(2,69,122,.08); text-align: center;
  }
  .nb-notif-foot a { font-size: 12px; font-weight: 600; color: var(--ocean-mid); text-decoration: none; }
  .nb-notif-foot a:hover { text-decoration: underline; }

  /* ── USER BUTTON ── */
  .nb-user-wrap { position: relative; flex-shrink: 0; }
  .nb-user-btn {
    display: flex; align-items: center; gap: 8px;
    background: var(--sky-mist); border: 1px solid rgba(2,69,122,.1);
    border-radius: 20px; padding: 4px 10px 4px 4px; cursor: pointer;
    transition: border-color .15s, background .15s;
  }
  .nb-user-btn:hover { border-color: var(--ocean-pale); background: #c4dce8; }
  .nb-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--ocean-deep);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
    overflow: hidden;
  }
  .nb-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .nb-uname { font-size: 12px; font-weight: 600; color: var(--ocean-deep); line-height: 1.2; }
  .nb-urole { font-size: 10px; color: var(--ocean-mid); font-weight: 500; }
  .nb-caret-svg {
    width: 14px; height: 14px; color: #9aadba; flex-shrink: 0;
    transition: transform .2s;
  }
  .nb-caret-svg.open { transform: rotate(180deg); }

  /* USER DROPDOWN */
  .nb-user-dd {
    position: absolute; top: calc(100% + 10px); right: 0;
    width: 210px; background: var(--bg-white);
    border: 1px solid rgba(2,69,122,.12); border-radius: 14px;
    box-shadow: 0 8px 28px rgba(2,69,122,.13); z-index: 300;
    overflow: hidden; animation: nbDrop .18s ease;
  }
  @keyframes nbDrop { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }

  .nb-dd-head { padding: 13px 15px 11px; border-bottom: 1px solid rgba(2,69,122,.08); }
  .nb-dd-name { font-size: 13px; font-weight: 700; color: var(--ocean-deep); }
  .nb-dd-role {
    display: inline-block; margin-top: 4px;
    font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px;
    background: rgba(1,138,190,.1); color: var(--ocean-mid);
    text-transform: uppercase; letter-spacing: .5px;
  }
  .nb-dd-list { padding: 5px 0; }
  .nb-dd-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 15px; text-decoration: none;
    font-size: 13px; font-weight: 500; color: #3a4a5a;
    transition: background .12s, color .12s;
    cursor: pointer; border: none; background: none;
    width: 100%; text-align: left; font-family: inherit;
  }
  .nb-dd-item:hover { background: rgba(214,231,238,.5); color: var(--ocean-deep); }
  .nb-dd-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--ocean-pale); flex-shrink: 0; }
  .nb-dd-div { height: 1px; background: rgba(2,69,122,.07); margin: 4px 0; }
  .nb-dd-item.logout { color: var(--logo-red); }
  .nb-dd-item.logout .nb-dd-dot { background: rgba(189,0,20,.3); }
  .nb-dd-item.logout:hover { background: rgba(189,0,20,.06); color: var(--logo-red); }

  /* AUTH */
  .nb-login {
    text-decoration: none; font-size: 13px; font-weight: 600;
    color: var(--ocean-deep); padding: 6px 14px; border-radius: 8px;
    transition: background .15s;
  }
  .nb-login:hover { background: rgba(2,69,122,.06); }
  .nb-register {
    text-decoration: none; font-size: 13px; font-weight: 600;
    color: #fff; background: var(--ocean-mid); padding: 7px 18px;
    border-radius: 20px; transition: background .15s, transform .15s;
  }
  .nb-register:hover { background: #019fd8; transform: translateY(-1px); }

  /* MOBILE */
  .nb-toggle {
    display: none; background: none; border: none; cursor: pointer;
    padding: 6px; color: var(--ocean-deep); font-size: 18px;
    margin-left: auto; font-weight: 700;
  }
  .nb-mob { display: none; flex-direction: column; padding: 12px 16px 16px; gap: 4px; border-top: 1px solid rgba(2,69,122,.08); }
  .nb-mob.open { display: flex; }
  .nb-mob-link {
    text-decoration: none; font-size: 14px; font-weight: 500;
    color: #3a4a5a; padding: 10px 14px; border-radius: 8px; transition: background .12s;
  }
  .nb-mob-link:hover { background: rgba(2,69,122,.06); color: var(--ocean-deep); }
  .nb-mob-link.act { color: var(--ocean-deep); font-weight: 600; background: rgba(2,69,122,.06); }
  .nb-mob-div { height: 1px; background: rgba(2,69,122,.07); margin: 5px 0; }
  .nb-mob-logout {
    font-size: 13px; font-weight: 600; color: var(--logo-red);
    padding: 10px 14px; border-radius: 8px; background: none; border: none;
    font-family: inherit; cursor: pointer; text-align: left; width: 100%;
    transition: background .12s;
  }
  .nb-mob-logout:hover { background: rgba(189,0,20,.06); }

  @media (max-width: 768px) {
    .nb-links, .nb-right { display: none; }
    .nb-toggle { display: flex; }
  }
`;

/* SVG components */
const BellSVG = () => (
  <svg className="nb-bell-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const CaretSVG = ({ open }) => (
  <svg className={`nb-caret-svg${open ? ' open' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 6l4 4 4-4"/>
  </svg>
);

/* ════════════════════════════════════════════
   MAIN
════════════════════════════════════════════ */
export default function Navbar() {
  const { user, logout }      = useAuth();
  const location              = useLocation();
  const navigate              = useNavigate();

  const [mobOpen,     setMobOpen]     = useState(false);
  const [userOpen,    setUserOpen]    = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifs,      setNotifs]      = useState([]);
  const [logoSrc,     setLogoSrc]     = useState(null);
  const [playerName,  setPlayerName]  = useState('');

  const userRef  = useRef(null);
  const notifRef = useRef(null);

  const act = path => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  const unread = notifs.filter(n => !n.read).length;
  const menuItems = user ? (USER_MENU[user.role] || []) : [];

  /* load logo từ tournament */
  useEffect(() => {
    const fetchTournamentLogo = async () => {
      try {
        const stored = localStorage.getItem('activeTournamentLogo');
        if (stored) {
          setLogoSrc(IMAGE_BASE + stored.replace(/\\/g, '/'));
          return;
        }
        const res = await api.get('/tournaments');
        const tournaments = res.data?.data || [];
        const active = tournaments.find(t => t.status === 'upcoming') || tournaments[0];
        if (active?.logo) {
          const logoUrl = IMAGE_BASE + active.logo.replace(/\\/g, '/');
          setLogoSrc(logoUrl);
          localStorage.setItem('activeTournamentLogo', active.logo);
        }
      } catch (err) {
        console.error('Lỗi load logo:', err);
      }
    };
    fetchTournamentLogo();
  }, []);

  /* fetch player name nếu là player */
  useEffect(() => {
    if (!user || user.role !== 'player') return;
    api.get('/users/profile')
      .then(res => {
        if (res.data?.data?.name) {
          setPlayerName(res.data.data.name);
        }
      })
      .catch(() => {});
  }, [user]);

  /* fetch notifications */
  useEffect(() => {
    if (!user) return;
    api.get('/notifications?limit=10')
      .then(r => setNotifs(r.data?.data || []))
      .catch(() => {});
  }, [user]);

  /* outside click */
  useEffect(() => {
    const h = e => {
      if (userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const markAllRead = async () => {
    try { await api.patch('/notifications/mark-all-read'); } catch {}
    setNotifs(ns => ns.map(n => ({ ...n, read: true })));
  };

  const clickNotif = async n => {
    if (!n.read) {
      try { await api.patch(`/notifications/${n._id}/read`); } catch {}
      setNotifs(ns => ns.map(x => x._id === n._id ? { ...x, read: true } : x));
    }
    if (n.link) { navigate(n.link); setNotifOpen(false); }
  };

  const displayName = playerName || user?.username || 'Người dùng';

  return (
    <>
      <style>{CSS}</style>
      <nav className="nb-wrap">
        <div className="nb-inner">

          {/* LOGO */}
          <Link to="/" className="nb-logo">
            <img
              className="nb-logo-img"
              src={logoSrc || DEFAULT_LOGO}
              alt="Logo"
              onError={e => { e.currentTarget.src = DEFAULT_LOGO; }}
            />
            <div>
              <div className="nb-logo-name">ITVTG</div>
              <div className="nb-logo-sub">Pickleball 2025</div>
            </div>
          </Link>

          {/* NAV LINKS */}
          <div className="nb-links">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className={`nb-link${act(to) ? ' act' : ''}`}>{label}</Link>
            ))}
          </div>

          {/* RIGHT */}
          <div className="nb-right">

            {user?.role === 'Organization' && (
              <Link to="/admin" className="nb-chip dang">Tổ chức / Admin</Link>
            )}

            {user?.role === 'referee' && (
              <Link to="/referee" className="nb-chip warn">Khu vực Trọng tài</Link>
            )}

            {user && <div className="nb-sep" />}

            {!user ? (
              <>
                <Link to="/login"    className="nb-login">Đăng nhập</Link>
                <Link to="/register" className="nb-register">Đăng ký</Link>
              </>
            ) : (
              <>
                {/* BELL */}
                <div className="nb-bell-wrap" ref={notifRef}>
                  <button
                    className="nb-bell-btn"
                    onClick={() => { setNotifOpen(o => !o); setUserOpen(false); }}
                    aria-label="Thông báo"
                  >
                    <BellSVG />
                    {unread > 0 && (
                      <span className="nb-bell-badge">{unread > 99 ? '99+' : unread}</span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="nb-notif-dd">
                      <div className="nb-notif-head">
                        <span className="nb-notif-ttl">Thông báo</span>
                        {unread > 0 && (
                          <button className="nb-notif-clear" onClick={markAllRead}>
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                      <div className="nb-notif-list">
                        {notifs.length === 0 ? (
                          <div className="nb-notif-empty">Chưa có thông báo nào.</div>
                        ) : notifs.map(n => (
                          <div
                            key={n._id}
                            className={`nb-notif-row${!n.read ? ' unread' : ''}`}
                            onClick={() => clickNotif(n)}
                          >
                            <div className={`nb-notif-dot${n.read ? ' read' : ''}`} />
                            <div>
                              <div className="nb-notif-msg">{n.message || n.content}</div>
                              <div className="nb-notif-time">
                                {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="nb-notif-foot">
                        <Link to="/notifications" onClick={() => setNotifOpen(false)}>
                          Xem tất cả thông báo
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* USER DROPDOWN */}
                <div className="nb-user-wrap" ref={userRef}>
                  <button
                    className="nb-user-btn"
                    onClick={() => { setUserOpen(o => !o); setNotifOpen(false); }}
                  >
                    <div className="nb-avatar">
                      {user.avatar
                        ? <img
                            src={IMAGE_BASE + user.avatar.replace(/\\/g, '/')}
                            alt=""
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                        : (displayName || 'U').charAt(0).toUpperCase()
                      }
                    </div>
                    <div>
                      <div className="nb-uname">{displayName}</div>
                      <div className="nb-urole">{user.role}</div>
                    </div>
                    <CaretSVG open={userOpen} />
                  </button>

                  {userOpen && (
                    <div className="nb-user-dd">
                      <div className="nb-dd-head">
                        <div className="nb-dd-name">{displayName}</div>
                        <span className="nb-dd-role">{user.role}</span>
                      </div>
                      <div className="nb-dd-list">
                        {menuItems.map(({ to, label }) => (
                          <Link
                            key={to} to={to}
                            className="nb-dd-item"
                            onClick={() => setUserOpen(false)}
                          >
                            <span className="nb-dd-dot" />{label}
                          </Link>
                        ))}
                        <div className="nb-dd-div" />
                        <button
                          className="nb-dd-item logout"
                          onClick={() => { logout(); setUserOpen(false); }}
                        >
                          <span className="nb-dd-dot" />Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <button className="nb-toggle" onClick={() => setMobOpen(o => !o)} aria-label="Menu">
            {mobOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* MOBILE MENU */}
        <div className={`nb-mob${mobOpen ? ' open' : ''}`}>
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to}
              className={`nb-mob-link${act(to) ? ' act' : ''}`}
              onClick={() => setMobOpen(false)}>
              {label}
            </Link>
          ))}

          {user && (
            <>
              <div className="nb-mob-div" />
              {menuItems.map(({ to, label }) => (
                <Link key={to} to={to} className="nb-mob-link" onClick={() => setMobOpen(false)}>{label}</Link>
              ))}
              <Link to="/notifications" className="nb-mob-link" onClick={() => setMobOpen(false)}>
                Thông báo{unread > 0 ? ` (${unread})` : ''}
              </Link>
              <div className="nb-mob-div" />
              <button className="nb-mob-logout" onClick={() => { logout(); setMobOpen(false); }}>
                Đăng xuất
              </button>
            </>
          )}

          {!user && (
            <>
              <div className="nb-mob-div" />
              <Link to="/login"    className="nb-mob-link" onClick={() => setMobOpen(false)}>Đăng nhập</Link>
              <Link to="/register" className="nb-mob-link" onClick={() => setMobOpen(false)}>Đăng ký</Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
}