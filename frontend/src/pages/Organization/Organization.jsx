import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Sidebar from './components/Sidebar';
import TournamentModal from './components/TournamentModal';

/* ─────────────────────────────────────────
   CSS RESPONSIVE CHO TRANG ORGANIZATION
   ───────────────────────────────────────── */
const orgStyles = `
  /* Container chính - responsive */
  .org-container {
    display: flex;
    min-height: 100vh;
    background: var(--neutral-cream, #f5f5f0);
  }

  /* Main content - responsive padding */
  .org-main {
    flex: 1;
    overflow-y: auto;
    padding: 50px;
    transition: padding 0.3s ease;
  }

  /* Tablet */
  @media (max-width: 1024px) {
    .org-main {
      padding: 30px;
    }
  }

  /* Mobile */
  @media (max-width: 768px) {
    .org-container {
      flex-direction: column;
    }

    .org-main {
      padding: 20px 16px;
      min-height: calc(100vh - auto);
    }
  }

  /* Mobile nhỏ */
  @media (max-width: 480px) {
    .org-main {
      padding: 16px 12px;
    }
  }

  /* Scrollbar đẹp */
  .org-main::-webkit-scrollbar {
    width: 6px;
  }

  .org-main::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.05);
    border-radius: 3px;
  }

  .org-main::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.2);
    border-radius: 3px;
  }

  .org-main::-webkit-scrollbar-thumb:hover {
    background: rgba(0,0,0,0.3);
  }
`;

const Organization = () => {
    const [tournaments, setTournaments] = useState([]);
    const [showModal, setShowModal] = useState(null); // 'create' hoặc 'edit'
    const location = useLocation(); // Hook này giúp Sidebar biết đang ở URL nào để bôi đậm Menu

    const fetchTournaments = async () => {
        try {
            const res = await api.get('/tournaments');
            setTournaments(res.data.data || []);
        } catch (e) { 
            console.error("Lỗi fetch giải đấu"); 
        }
    };

    useEffect(() => { 
        fetchTournaments(); 
    }, []);

    return (
        <>
            {/* Inject CSS responsive */}
            <style>{orgStyles}</style>
            
            <div className="org-container">
                
                {/* TRUYỀN DỮ LIỆU CHO SIDEBAR */}
                <Sidebar 
                    tournaments={tournaments} 
                    currentPath={location.pathname} // Thay cho activeTab cũ
                    onCreate={() => setShowModal('create')}
                />
                
                <main className="org-main">
                    {/* Trình duyệt tự động nhét DashboardView hoặc TournamentDetailView vào đây dựa theo URL */}
                    <Outlet />
                </main>

                {showModal && (
                    <TournamentModal 
                        mode={showModal} 
                        onClose={() => setShowModal(null)} 
                        onSuccess={() => { 
                            fetchTournaments(); 
                            setShowModal(null); 
                        }}
                    />
                )}
            </div>
        </>
    );
};

export default Organization;