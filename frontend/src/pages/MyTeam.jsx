import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal';

const CATEGORY_MAPPER = {
    'MS': 'Đơn Nam', 'WS': 'Đơn Nữ', 'MD': 'Đôi Nam', 'WD': 'Đôi Nữ', 'XD': 'Đôi Nam Nữ'
};

const MyTeams = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('my-teams');
    const [teams, setTeams] = useState([]);
    const [sentInvites, setSentInvites] = useState([]);
    const [receivedInvites, setReceivedInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [teamsRes, sentRes, receivedRes] = await Promise.all([
                api.get('/teams/users'),
                api.get('/teams/users/sent-invitations'),
                api.get('/teams/users/invitations'),
            ]);

            console.log("Teams:", teamsRes.data);
            console.log("Sent:", sentRes.data);
            console.log("Received:", receivedRes.data);

            if (teamsRes.data.success) setTeams(teamsRes.data.data);
            if (sentRes.data.success) setSentInvites(sentRes.data.data);
            if (receivedRes.data.success) setReceivedInvites(receivedRes.data.data);
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAllData(); }, []);

    const handleOpenPayment = (team) => {
        setSelectedTeam(team);
        setPaymentModalOpen(true);
    };

    const handlePaymentSuccess = () => {
        fetchAllData();
    };

    const handleCancelInvite = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn thu hồi lời mời này?")) return;
        try {
            const res = await api.post(`/teams/invitations/${id}/reject`);
            if (res.data.success) setSentInvites(prev => prev.filter(i => i._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi thu hồi");
        }
    };

    const handleAcceptInvite = async (id) => {
        try {
            const res = await api.post(`/teams/invitations/${id}/accept`);
            if (res.data.success) {
                setReceivedInvites(prev => prev.filter(i => i._id !== id));
                fetchAllData();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi chấp nhận");
        }
    };

    const handleRejectInvite = async (id) => {
        try {
            const res = await api.post(`/teams/invitations/${id}/reject`);
            if (res.data.success) setReceivedInvites(prev => prev.filter(i => i._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi từ chối");
        }
    };

    const renderStatusBadge = (status) => {
        const styles = {
            'validated': 'bg-green-900/30 text-green-500 border-green-500',
            'pending': 'bg-yellow-900/30 text-yellow-500 border-yellow-500',
            'confirmed': 'bg-cyan-900/30 text-cyan-500 border-cyan-500',
        };
        const labels = {
            'validated': 'ĐÃ XÁC NHẬN',
            'pending': 'ĐANG CHỜ',
            'confirmed': 'ĐÃ DUYỆT',
        };
        return (
            <span className={`px-2 py-1 rounded text-[10px] font-black border ${styles[status] || 'border-gray-500 text-gray-400'}`}>
                {labels[status] || status?.toUpperCase()}
            </span>
        );
    };

    if (loading) return <div className="text-center py-20 text-cyan-400 font-black animate-pulse">ĐANG TẢI...</div>;

    return (
        <>
            <style>{`
                .myteams-container {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 24px;
                    animation: fadeIn 0.5s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 768px) {
                    .myteams-container {
                        padding: 20px;
                    }
                }

                @media (max-width: 640px) {
                    .myteams-container {
                        padding: 16px;
                    }
                }

                .myteams-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                    margin-bottom: 40px;
                    border-bottom: 1px solid #083344;
                    padding-bottom: 24px;
                }

                @media (max-width: 640px) {
                    .myteams-header {
                        flex-direction: column;
                        text-align: center;
                        margin-bottom: 24px;
                        padding-bottom: 16px;
                    }
                }

                .myteams-title {
                    font-size: 1.875rem;
                    font-weight: 900;
                    color: #22d3ee;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }

                @media (max-width: 768px) {
                    .myteams-title {
                        font-size: 1.5rem;
                    }
                }

                @media (max-width: 640px) {
                    .myteams-title {
                        font-size: 1.25rem;
                    }
                }

                .myteams-subtitle {
                    color: #64748b;
                    font-size: 0.7rem;
                    margin-top: 8px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .myteams-btn-primary {
                    background: #0891b2;
                    color: #fff;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 900;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                @media (max-width: 640px) {
                    .myteams-btn-primary {
                        padding: 12px 20px;
                        font-size: 0.65rem;
                    }
                }

                .myteams-tabs {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                }

                @media (max-width: 640px) {
                    .myteams-tabs {
                        gap: 12px;
                    }
                }

                .myteams-tab {
                    padding: 12px 24px;
                    border-radius: 40px;
                    font-weight: 900;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: #1e293b;
                    color: #94a3b8;
                    border: none;
                }

                @media (max-width: 640px) {
                    .myteams-tab {
                        padding: 10px 18px;
                        font-size: 0.65rem;
                    }
                }

                .myteams-tab-active {
                    background: #06b6d4;
                    color: #000;
                }

                .myteams-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 24px;
                }

                @media (max-width: 768px) {
                    .myteams-grid {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }
                }

                .myteams-card {
                    position: relative;
                    overflow: hidden;
                    background: #0f172a;
                    border: 1px solid #1e293b;
                    padding: 24px;
                    border-radius: 16px;
                    transition: all 0.2s;
                }

                @media (max-width: 640px) {
                    .myteams-card {
                        padding: 20px;
                    }
                }

                .myteams-card:hover {
                    border-color: #06b6d4;
                }

                .myteams-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .myteams-team-name {
                    font-size: 1.25rem;
                    font-weight: 900;
                    color: #fff;
                    text-transform: uppercase;
                    margin-bottom: 12px;
                }

                @media (max-width: 640px) {
                    .myteams-team-name {
                        font-size: 1rem;
                    }
                }

                .myteams-team-info {
                    margin-bottom: 24px;
                }

                .myteams-team-info p {
                    font-size: 0.7rem;
                    color: #94a3b8;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }

                .myteams-team-info span {
                    color: #e2e8f0;
                }

                .myteams-actions {
                    display: flex;
                    gap: 12px;
                }

                @media (max-width: 640px) {
                    .myteams-actions {
                        flex-direction: column;
                    }
                }

                .myteams-btn-outline {
                    flex: 1;
                    padding: 12px;
                    background: #1e293b;
                    color: #fff;
                    font-size: 0.6rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .myteams-btn-cyan {
                    flex: 1;
                    padding: 12px;
                    background: #0891b2;
                    color: #fff;
                    font-size: 0.6rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .myteams-empty {
                    padding: 80px 20px;
                    text-align: center;
                    border: 2px dashed #1e293b;
                    border-radius: 24px;
                    color: #475569;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .myteams-invite-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                    padding: 20px;
                    background: #0f172a;
                    border: 1px solid #166534;
                    border-radius: 12px;
                    transition: all 0.2s;
                }

                @media (max-width: 640px) {
                    .myteams-invite-card {
                        flex-direction: column;
                        text-align: center;
                    }
                }

                .myteams-invite-avatar {
                    width: 40px;
                    height: 40px;
                    background: rgba(34,197,94,0.3);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #4ade80;
                    font-weight: 700;
                }

                .myteams-invite-info {
                    flex: 1;
                }

                .myteams-invite-username {
                    color: #fff;
                    font-weight: 900;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                }

                .myteams-invite-team {
                    font-size: 0.6rem;
                    color: #64748b;
                    font-weight: 700;
                }

                .myteams-invite-actions {
                    display: flex;
                    gap: 12px;
                }

                .myteams-btn-green {
                    padding: 8px 16px;
                    background: #16a34a;
                    color: #fff;
                    font-size: 0.6rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                }

                .myteams-btn-red {
                    padding: 8px 16px;
                    background: transparent;
                    border: 1px solid #ef4444;
                    color: #ef4444;
                    font-size: 0.6rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    border-radius: 6px;
                    cursor: pointer;
                }
            `}</style>

            <div className="myteams-container">
                <div className="myteams-header">
                    <div>
                        <h1 className="myteams-title">🛡️ TRUNG TÂM ĐIỀU HÀNH ĐỘI</h1>
                        <p className="myteams-subtitle">Quản lý các nội dung thi đấu bạn đã tham gia</p>
                    </div>
                    <button 
                        onClick={() => navigate('/register-team')}
                        className="myteams-btn-primary"
                    >
                        + ĐĂNG KÝ GIẢI MỚI
                    </button>
                </div>

                <div className="myteams-tabs">
                    <button onClick={() => setActiveTab('my-teams')}
                        className={`myteams-tab ${activeTab === 'my-teams' ? 'myteams-tab-active' : ''}`}>
                        Đội của tôi ({teams.length})
                    </button>
                    <button onClick={() => setActiveTab('received')}
                        className={`myteams-tab ${activeTab === 'received' ? 'myteams-tab-active' : ''}`}>
                        Lời mời nhận ({receivedInvites.length})
                    </button>
                    <button onClick={() => setActiveTab('invites')}
                        className={`myteams-tab ${activeTab === 'invites' ? 'myteams-tab-active' : ''}`}>
                        Đã gửi ({sentInvites.length})
                    </button>
                </div>

                {activeTab === 'my-teams' && (
                    <div className="myteams-grid">
                        {teams.length === 0 ? (
                            <div className="myteams-empty">
                                <p>Bạn chưa tham gia đội nào</p>
                            </div>
                        ) : (
                            teams.map(team => (
                                <div key={team._id} className="myteams-card">
                                    <div className="myteams-card-header">
                                        {renderStatusBadge(team.status)}
                                        <span className="text-gray-600 text-[10px] font-bold">ID: {team._id.slice(-6).toUpperCase()}</span>
                                    </div>
                                    <h3 className="myteams-team-name">{team.name}</h3>
                                    <div className="myteams-team-info">
                                        <p>🏆 Giải: <span className="text-gray-200">{team.tournamentId?.name || 'N/A'}</span></p>
                                        <p>🏅 Môn: <span className="text-cyan-500">{team.sportCategory || 'N/A'}</span></p>
                                    </div>
                                    <div className="myteams-actions">
                                        <button onClick={() => navigate(`/team/detail/${team._id}`)}
                                            className="myteams-btn-outline">
                                            Chi tiết đội
                                        </button>
                                        <button onClick={() => handleOpenPayment(team)}
                                            className="myteams-btn-cyan">
                                            Thanh toán
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'received' && (
                    <div className="space-y-4">
                        {receivedInvites.length === 0 ? (
                            <div className="myteams-empty">
                                <p>Không có lời mời nào</p>
                            </div>
                        ) : (
                            receivedInvites.map(inv => (
                                <div key={inv._id} className="myteams-invite-card">
                                    <div className="flex items-center gap-4" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div className="myteams-invite-avatar">
                                            {inv.senderId?.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="myteams-invite-info">
                                            <p className="myteams-invite-username">{inv.senderId?.username}</p>
                                            <p className="myteams-invite-team">
                                                Mời vào: {inv.teamId?.name} | {inv.teamId?.sportCategory}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="myteams-invite-actions">
                                        <button onClick={() => handleAcceptInvite(inv._id)}
                                            className="myteams-btn-green">
                                            ✓ Nhận
                                        </button>
                                        <button onClick={() => handleRejectInvite(inv._id)}
                                            className="myteams-btn-red">
                                            ✕ Từ chối
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'invites' && (
                    <div className="space-y-4">
                        {sentInvites.length === 0 ? (
                            <div className="myteams-empty">
                                <p>Không có lời mời nào đang chờ</p>
                            </div>
                        ) : (
                            sentInvites.map(inv => (
                                <div key={inv._id} className="myteams-invite-card" style={{ borderColor: '#1e293b' }}>
                                    <div className="flex items-center gap-4" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div className="myteams-invite-avatar" style={{ background: 'rgba(6,182,212,0.3)', color: '#22d3ee' }}>
                                            {inv.receiverId?.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="myteams-invite-info">
                                            <p className="myteams-invite-username">{inv.receiverId?.username}</p>
                                            <p className="myteams-invite-team">
                                                Mời vào: {inv.teamId?.name} | {inv.teamId?.sportCategory}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleCancelInvite(inv._id)}
                                        className="myteams-btn-red">
                                        Thu hồi
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <PaymentModal 
                    isOpen={paymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    team={selectedTeam}
                    onSuccess={handlePaymentSuccess}
                />
            </div>
        </>
    );
};

export default MyTeams;