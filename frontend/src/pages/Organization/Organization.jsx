import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Sidebar from './components/Sidebar';
import TournamentModal from './components/TournamentModal';

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
        <div className="flex min-h-screen bg-neutral-cream" style={{ display: 'flex', minHeight: '100vh', background: 'var(--neutral-cream)' }}>
            
            {/* TRUYỀN DỮ LIỆU CHO SIDEBAR */}
            <Sidebar 
                tournaments={tournaments} 
                currentPath={location.pathname} // Thay cho activeTab cũ
                onCreate={() => setShowModal('create')}
            />
            
            <main style={{ flex: 1, padding: '50px', overflowY: 'auto' }}>
                
               
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
    );
};

export default Organization;