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
        <div className="max-w-6xl mx-auto p-6 animate-fade-in custom-scrollbar">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-10 border-b border-cyan-900 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-cyan-400 uppercase tracking-widest">
                        🛡️ TRUNG TÂM ĐIỀU HÀNH ĐỘI
                    </h1>
                    <p className="text-gray-500 text-xs mt-2 uppercase font-bold tracking-widest">
                        Quản lý các nội dung thi đấu bạn đã tham gia
                    </p>
                </div>
                <button 
                    onClick={() => navigate('/register-team')}
                    className="bg-cyan-600 text-white px-6 py-3 rounded-lg font-black text-sm uppercase tracking-widest hover:bg-cyan-500 transition-all"
                >
                    + ĐĂNG KÝ GIẢI MỚI
                </button>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-4 mb-8 flex-wrap">
                <button onClick={() => setActiveTab('my-teams')}
                    className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'my-teams' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}>
                    Đội của tôi ({teams.length})
                </button>
                <button onClick={() => setActiveTab('received')}
                    className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'received' ? 'bg-green-500 text-black' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}>
                    Lời mời nhận ({receivedInvites.length})
                </button>
                <button onClick={() => setActiveTab('invites')}
                    className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'invites' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}>
                    Đã gửi ({sentInvites.length})
                </button>
            </div>

            {/* TAB: MY TEAMS */}
            {activeTab === 'my-teams' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {teams.length === 0 ? (
                        <div className="col-span-2 py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                            <p className="text-gray-600 font-bold uppercase tracking-widest">Bạn chưa tham gia đội nào</p>
                        </div>
                    ) : (
                        teams.map(team => (
                            <div key={team._id} className="group relative overflow-hidden bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-cyan-500 transition-all shadow-xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-900/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-cyan-500/20 transition-all"></div>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    {renderStatusBadge(team.status)}
                                    <span className="text-gray-600 text-[10px] font-bold">ID: {team._id.slice(-6).toUpperCase()}</span>
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">{team.name}</h3>
                                <div className="space-y-2 mb-6">
                                    <p className="text-xs text-gray-400 font-bold uppercase">🏆 Giải: <span className="text-gray-200">{team.tournamentId?.name || 'N/A'}</span></p>
                                    <p className="text-xs text-gray-400 font-bold uppercase">🏅 Môn: <span className="text-cyan-500">{team.sportCategory || 'N/A'}</span></p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => navigate(`/team/detail/${team._id}`)}
                                        className="flex-1 py-3 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-700 transition-all">
                                        Chi tiết đội
                                    </button>
                                    <button onClick={() => handleOpenPayment(team)}
                                        className="flex-1 py-3 bg-cyan-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-cyan-500 transition-all">
                                        Thanh toán
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* TAB: RECEIVED INVITES */}
            {activeTab === 'received' && (
                <div className="space-y-4">
                    {receivedInvites.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                            <p className="text-gray-600 font-bold uppercase tracking-widest">Không có lời mời nào</p>
                        </div>
                    ) : (
                        receivedInvites.map(inv => (
                            <div key={inv._id} className="flex justify-between items-center p-5 bg-slate-900 border border-green-800/50 rounded-xl hover:border-green-500/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-green-900/30 rounded-full flex items-center justify-center text-green-400 font-bold">
                                        {inv.senderId?.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-black text-sm uppercase tracking-wide">
                                            {inv.senderId?.username}
                                        </p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">
                                            Mời vào: {inv.teamId?.name} | {inv.teamId?.sportCategory}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleAcceptInvite(inv._id)}
                                        className="px-4 py-2 bg-green-600 text-white text-[10px] font-black uppercase rounded hover:bg-green-500 transition-all">
                                        ✓ Nhận
                                    </button>
                                    <button onClick={() => handleRejectInvite(inv._id)}
                                        className="px-4 py-2 border border-red-500 text-red-500 text-[10px] font-black uppercase rounded hover:bg-red-500 hover:text-white transition-all">
                                        ✕ Từ chối
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* TAB: SENT INVITES */}
            {activeTab === 'invites' && (
                <div className="space-y-4">
                    {sentInvites.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                            <p className="text-gray-600 font-bold uppercase tracking-widest">Không có lời mời nào đang chờ</p>
                        </div>
                    ) : (
                        sentInvites.map(inv => (
                            <div key={inv._id} className="flex justify-between items-center p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-red-500/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-cyan-900/30 rounded-full flex items-center justify-center text-cyan-400 font-bold">
                                        {inv.receiverId?.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-black text-sm uppercase">{inv.receiverId?.username}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">
                                            Mời vào: {inv.teamId?.name} | {inv.teamId?.sportCategory}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => handleCancelInvite(inv._id)}
                                    className="px-5 py-2 border border-red-500 text-red-500 text-[10px] font-black uppercase rounded hover:bg-red-500 hover:text-white transition-all">
                                    Thu hồi
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* PAYMENT MODAL */}
            <PaymentModal 
                isOpen={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                team={selectedTeam}
                onSuccess={handlePaymentSuccess}
            />

            <style>{`
                .animate-fade-in { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div> 
    );
};

export default MyTeams;