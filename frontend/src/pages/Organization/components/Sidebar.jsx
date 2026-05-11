import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

const Sidebar = ({ tournaments, onCreate }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Tự động lấy ID giải đấu từ thanh URL (nếu có)
    const { id: selectedTourId } = useParams(); 

    // Hàm nhận diện Tab nào đang sáng dựa vào URL hiện tại
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/rules')) return 'rules-library';
        if (selectedTourId) {
            if (path.includes('/matches')) return 'matches';
            if (path.includes('/teams')) return 'teams';
            if (path.includes('/courts')) return 'courts';
            if (path.includes('/finance')) return 'finance';
            return 'dashboard';
        }
        return 'global-users';
    };

    const activeTab = getActiveTab();

    // Xử lý khi chọn giải đấu trong thẻ Select
    const handleSelectTour = (id) => {
        if (id) {
            navigate(`/admin/tournament/${id}`);
        } else {
            navigate('/admin');
        }
    };

    return (
        <div style={{ width: '280px', background: 'var(--dark-forest)', height: '100vh', position: 'sticky', top: 0, padding: '40px 0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0 40px', marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--primary-lime)', fontSize: '1.8rem', margin: 0, fontFamily: 'var(--font-title)' }}>ITVTG HUB</h2>
            </div>

            {/* GLOBAL TOOLS */}
            <div style={{ padding: '0 25px', marginBottom: '20px' }}>
                <div className="sidebar-label">HỆ THỐNG</div>
                <button onClick={() => navigate('/admin/users')} className={`sidebar-btn ${activeTab === 'global-users' ? 'active' : ''}`}>NGƯỜI DÙNG</button>
                <button onClick={() => navigate('/admin/tournaments')} className={`sidebar-btn ${activeTab === 'rules-library' ? 'active' : ''}`}>GIẢI ĐẤU</button>
            </div>

            {/* TOURNAMENT SELECTOR */}
            <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <div className="sidebar-label" style={{color:'var(--primary-lime)'}}>GIẢI ĐẤU</div>
                <select value={selectedTourId || ""} onChange={(e) => handleSelectTour(e.target.value)} className="sidebar-select">
                    <option value="">-- CHỌN GIẢI --</option>
                    {tournaments.map(t => <option key={t._id} value={t._id} style={{color:'#000'}}>{t.displayName}</option>)}
                </select>
                <button onClick={onCreate} className="create-tour-btn">+ TẠO GIẢI MỚI</button>
            </div>

            {/* LOCAL TOOLS */}
            {selectedTourId && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="sidebar-label">ĐIỀU HÀNH</div>
                    {/* THÊM 'rules' VÀO MẢNG DƯỚI ĐÂY */}
                    {['dashboard', 'rules', 'matches', 'teams', 'courts', 'finance'].map(tabId => {
                        let targetPath = `/admin/tournament/${selectedTourId}`;
                        if (tabId !== 'dashboard') {
                            targetPath = `/admin/tournament/${selectedTourId}/${tabId}`;
                        }
                        
                        // Việt hóa text hiển thị trên Sidebar cho đẹp
                        const tabLabels = {
                            'dashboard': 'DASHBOARD',
                            'rules': 'VÒNG ĐẤU & LUẬT',
                            'matches': 'TRẬN ĐẤU',
                            'teams': 'ĐỘI TUYỂN',
                            'courts': 'SÂN BÃI',
                            'finance': 'TÀI CHÍNH'
                        };
                        
                        return (
                            <button key={tabId} onClick={() => navigate(targetPath)} className={`sidebar-btn sub ${activeTab === tabId ? 'active' : ''}`}>
                                {tabLabels[tabId]}
                            </button>
                        );
                    })}
                </div>
            )}

            <style>{`
                .sidebar-label { font-size: 0.65rem; color: rgba(255,255,255,0.3); margin-bottom: 10px; font-weight: bold; letter-spacing: 1px; padding: 0 25px; }
                .sidebar-btn { width: 100%; padding: 12px 25px; text-align: left; border: none; background: transparent; color: rgba(255,255,255,0.6); cursor: pointer; transition: 0.3s; font-family: var(--font-title); border-left: 4px solid transparent; }
                .sidebar-btn.sub { padding-left: 45px; font-size: 0.9rem; }
                .sidebar-btn.active { color: var(--primary-lime); background: rgba(255,255,255,0.05); border-left: 4px solid var(--primary-lime); }
                .sidebar-select { width: 100%; padding: 10px; border-radius: 8px; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.2); outline: none; }
                .create-tour-btn { width: 100%; margin-top: 10px; padding: 10px; background: var(--primary-lime); color: var(--dark-forest); border: none; border-radius: 8px; font-weight: 900; cursor: pointer; }
                
            `}</style>
        </div>
    );
};

export default Sidebar;