import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard',       icon: '◈' },
  { id: 'rules',     label: 'Vòng đấu & luật', icon: '◉' },
  { id: 'matches',   label: 'Trận đấu',         icon: '⚡' },
  { id: 'teams',     label: 'Đội tuyển',         icon: '◎' },
  { id: 'courts',    label: 'Sân bãi',           icon: '▣' },
  { id: 'finance',   label: 'Tài chính',         icon: '◆' },
];

const Sidebar = ({ tournaments = [], onCreate }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { id: selectedTourId } = useParams();

  const getActiveTab = () => {
    const p = location.pathname;
    if (p.includes('/rules'))   return 'rules';
    if (p.includes('/users'))   return 'global-users';
    if (p.includes('/tournaments') && !selectedTourId) return 'global-tours';
    if (selectedTourId) {
      if (p.includes('/matches')) return 'matches';
      if (p.includes('/teams'))   return 'teams';
      if (p.includes('/courts'))  return 'courts';
      if (p.includes('/finance')) return 'finance';
      return 'dashboard';
    }
    return 'global-users';
  };

  const activeTab = getActiveTab();

  const handleSelectTour = (id) => {
    navigate(id ? `/admin/tournament/${id}` : '/admin');
  };

  const isActive = (tab) => activeTab === tab;

  return (
    <>
      <style>{`
        /* ─── SIDEBAR SHELL - RESPONSIVE ─── */
        .sb-wrap {
          width: 260px;
          min-width: 260px;
          background: var(--ocean-deep, #02457A);
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-right: 1px solid rgba(151,202,219,0.12);
          transition: all 0.3s ease;
        }

        /* Mobile: Sidebar chuyển thành top bar + drawer */
        @media (max-width: 768px) {
          .sb-wrap {
            width: 100%;
            min-width: 100%;
            height: auto;
            position: sticky;
            top: 0;
            z-index: 50;
            max-height: 70px;
            transition: max-height 0.3s ease;
          }
          
          .sb-wrap.mobile-open {
            max-height: 100vh;
            overflow-y: auto;
          }
          
          .sb-logo {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
          }
          
          .sb-logo::after {
            content: '☰';
            font-size: 24px;
            color: white;
            opacity: 0.8;
          }
          
          .sb-scroll {
            max-height: 0;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
          }
          
          .sb-wrap.mobile-open .sb-scroll {
            max-height: calc(100vh - 70px);
            opacity: 1;
            visibility: visible;
          }
          
          .sb-footer {
            display: none;
          }
          
          .sb-wrap.mobile-open .sb-footer {
            display: block;
          }
        }

        /* Tablet: Sidebar thu nhỏ */
        @media (max-width: 1024px) and (min-width: 769px) {
          .sb-wrap {
            width: 220px;
            min-width: 220px;
          }
          
          .sb-logo-title {
            font-size: 18px;
          }
          
          .sb-btn {
            padding: 8px 16px;
            font-size: 12px;
          }
          
          .sb-btn-sub {
            padding-left: 32px;
          }
        }

        /* Mobile nhỏ */
        @media (max-width: 480px) {
          .sb-logo {
            padding: 20px 20px;
          }
          
          .sb-logo-title {
            font-size: 18px;
          }
          
          .sb-logo-sub {
            font-size: 9px;
          }
        }

        /* ─── LOGO ─── */
        .sb-logo {
          padding: 28px 24px 20px;
          border-bottom: 1px solid rgba(151,202,219,0.1);
          flex-shrink: 0;
        }
        .sb-logo-title {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 1.5px;
          line-height: 1;
          font-family: 'Be Vietnam Pro', sans-serif;
        }
        .sb-logo-title span { color: var(--ocean-pale, #97CADB); }
        .sb-logo-sub {
          font-size: 10px;
          color: rgba(151,202,219,0.5);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 4px;
        }

        /* ─── SCROLL AREA ─── */
        .sb-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 8px 0 16px;
          scrollbar-width: thin;
        }
        .sb-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sb-scroll::-webkit-scrollbar-track {
          background: rgba(151,202,219,0.1);
        }
        .sb-scroll::-webkit-scrollbar-thumb {
          background: rgba(151,202,219,0.3);
          border-radius: 4px;
        }

        /* ─── SECTION LABEL ─── */
        .sb-section-label {
          font-size: 9px;
          font-weight: 700;
          color: rgba(151,202,219,0.4);
          text-transform: uppercase;
          letter-spacing: 2.5px;
          padding: 16px 24px 6px;
        }

        /* Tablet điều chỉnh section label */
        @media (max-width: 1024px) {
          .sb-section-label {
            padding: 12px 16px 4px;
          }
        }

        /* ─── NAV BUTTON ─── */
        .sb-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 24px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.55);
          cursor: pointer;
          transition: all 0.15s;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Be Vietnam Pro', sans-serif;
          text-align: left;
          position: relative;
          border-left: 3px solid transparent;
        }
        
        /* Mobile: nút to hơn để dễ chạm */
        @media (max-width: 768px) {
          .sb-btn {
            padding: 12px 24px;
            gap: 12px;
          }
          
          .sb-btn-icon {
            font-size: 18px;
          }
        }
        
        .sb-btn:hover {
          color: rgba(255,255,255,0.9);
          background: rgba(151,202,219,0.07);
        }
        .sb-btn.active {
          color: #fff;
          background: rgba(1,138,190,0.18);
          border-left-color: var(--ocean-pale, #97CADB);
        }
        .sb-btn-icon {
          font-size: 14px;
          width: 18px;
          text-align: center;
          flex-shrink: 0;
          opacity: 0.7;
        }
        .sb-btn.active .sb-btn-icon { opacity: 1; }

        /* ─── SUB BUTTON (indented) ─── */
        .sb-btn-sub {
          padding-left: 40px;
          font-size: 12.5px;
        }
        
        @media (max-width: 1024px) {
          .sb-btn-sub {
            padding-left: 32px;
          }
        }
        
        @media (max-width: 768px) {
          .sb-btn-sub {
            padding-left: 48px;
          }
        }

        /* ─── DIVIDER ─── */
        .sb-divider {
          height: 1px;
          background: rgba(151,202,219,0.1);
          margin: 8px 0;
        }

        /* ─── TOURNAMENT SELECTOR ─── */
        .sb-selector-wrap {
          padding: 8px 16px 12px;
        }
        
        @media (max-width: 768px) {
          .sb-selector-wrap {
            padding: 12px 20px;
          }
        }
        
        .sb-select {
          width: 100%;
          padding: 9px 12px;
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
          color: #fff;
          border: 1px solid rgba(151,202,219,0.2);
          outline: none;
          font-size: 12px;
          font-family: 'Be Vietnam Pro', sans-serif;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2397CADB' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 28px;
          transition: border-color 0.15s;
        }
        
        /* Mobile: select to hơn */
        @media (max-width: 768px) {
          .sb-select {
            padding: 12px 12px;
            font-size: 14px;
          }
        }
        
        .sb-select:focus { border-color: var(--ocean-pale, #97CADB); }
        .sb-select option { background: #02457A; color: #fff; }

        /* ─── CREATE BUTTON ─── */
        .sb-create-btn {
          width: 100%;
          margin-top: 8px;
          padding: 9px 12px;
          background: rgba(1,138,190,0.25);
          color: var(--ocean-pale, #97CADB);
          border: 1px dashed rgba(151,202,219,0.3);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'Be Vietnam Pro', sans-serif;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          letter-spacing: 0.5px;
        }
        
        /* Mobile: create button to hơn */
        @media (max-width: 768px) {
          .sb-create-btn {
            padding: 12px 12px;
            font-size: 14px;
            margin-top: 12px;
          }
        }
        
        .sb-create-btn:hover {
          background: rgba(1,138,190,0.4);
          border-color: var(--ocean-pale, #97CADB);
          color: #fff;
        }

        /* ─── active TOUR PILL ─── */
        .sb-tour-active {
          margin: 0 16px 4px;
          background: rgba(1,138,190,0.15);
          border: 1px solid rgba(1,138,190,0.3);
          border-radius: 8px;
          padding: 8px 12px;
        }
        
        @media (max-width: 768px) {
          .sb-tour-active {
            margin: 8px 20px;
            padding: 10px 14px;
          }
        }
        
        .sb-tour-active-label {
          font-size: 9px;
          font-weight: 700;
          color: rgba(151,202,219,0.5);
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 3px;
        }
        .sb-tour-active-name {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        @media (max-width: 768px) {
          .sb-tour-active-name {
            font-size: 14px;
          }
        }

        /* ─── FOOTER ─── */
        .sb-footer {
          padding: 14px 24px;
          border-top: 1px solid rgba(151,202,219,0.1);
          flex-shrink: 0;
        }
        .sb-footer-text {
          font-size: 10px;
          color: rgba(151,202,219,0.3);
          letter-spacing: 0.5px;
        }
      `}</style>

      {/* Thêm class mobile-open khi click vào logo trên mobile */}
      <div className="sb-wrap" id="sidebar-wrap">
        {/* LOGO - có thể click để toggle trên mobile */}
        <div className="sb-logo" onClick={(e) => {
          if (window.innerWidth <= 768) {
            const wrap = document.getElementById('sidebar-wrap');
            wrap.classList.toggle('mobile-open');
          }
        }}>
          <div>
            <div className="sb-logo-title">ITVTG <span>HUB</span></div>
            <div className="sb-logo-sub">Admin Dashboard</div>
          </div>
        </div>

        {/* SCROLL AREA */}
        <div className="sb-scroll">

          {/* HỆ THỐNG */}
          <div className="sb-section-label">Hệ thống</div>
          <button
            className={`sb-btn ${isActive('global-users') ? 'active' : ''}`}
            onClick={() => {
              navigate('/admin/users');
              // Đóng sidebar trên mobile sau khi chọn
              if (window.innerWidth <= 768) {
                document.getElementById('sidebar-wrap')?.classList.remove('mobile-open');
              }
            }}
          >
            <span className="sb-btn-icon">◈</span>
            Người dùng
          </button>
          <button
            className={`sb-btn ${isActive('global-tours') ? 'active' : ''}`}
            onClick={() => {
              navigate('/admin/tournaments');
              if (window.innerWidth <= 768) {
                document.getElementById('sidebar-wrap')?.classList.remove('mobile-open');
              }
            }}
          >
            <span className="sb-btn-icon">◉</span>
            Tất cả giải đấu
          </button>

          <div className="sb-divider" />

          {/* TOURNAMENT SELECTOR */}
          <div className="sb-section-label">Giải đấu</div>
          <div className="sb-selector-wrap">
            <select
              className="sb-select"
              value={selectedTourId || ''}
              onChange={(e) => {
                handleSelectTour(e.target.value);
                if (window.innerWidth <= 768) {
                  document.getElementById('sidebar-wrap')?.classList.remove('mobile-open');
                }
              }}
            >
              <option value="">— Chọn giải —</option>
              {tournaments.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
            <button className="sb-create-btn" onClick={() => {
              onCreate();
              if (window.innerWidth <= 768) {
                document.getElementById('sidebar-wrap')?.classList.remove('mobile-open');
              }
            }}>
              + Tạo giải mới
            </button>
          </div>

          {/* active TOUR + LOCAL NAV */}
          {selectedTourId && (() => {
            const activeTour = tournaments.find(t => t._id === selectedTourId);
            return (
              <>
                {activeTour && (
                  <div className="sb-tour-active">
                    <div className="sb-tour-active-label">Đang quản lý</div>
                    <div className="sb-tour-active-name">{activeTour.displayName}</div>
                  </div>
                )}

                <div className="sb-section-label" style={{ marginTop: 8 }}>Điều hành</div>
                {NAV_TABS.map(({ id, label, icon }) => {
                  const path = id === 'dashboard'
                    ? `/admin/tournament/${selectedTourId}`
                    : `/admin/tournament/${selectedTourId}/${id}`;
                  return (
                    <button
                      key={id}
                      className={`sb-btn sb-btn-sub ${isActive(id) ? 'active' : ''}`}
                      onClick={() => {
                        navigate(path);
                        if (window.innerWidth <= 768) {
                          document.getElementById('sidebar-wrap')?.classList.remove('mobile-open');
                        }
                      }}
                    >
                      <span className="sb-btn-icon">{icon}</span>
                      {label}
                    </button>
                  );
                })}
              </>
            );
          })()}

        </div>{/* end sb-scroll */}

        {/* FOOTER */}
        <div className="sb-footer">
          <div className="sb-footer-text">© 2025 IT Vũng Tàu Group</div>
        </div>

      </div>
    </>
  );
};

export default Sidebar;