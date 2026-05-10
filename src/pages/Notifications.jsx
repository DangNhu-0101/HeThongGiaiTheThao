import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeQR, setActiveQR] = useState(null);

    // 1. LẤY DANH SÁCH THÔNG BÁO
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notifications/me');
            if (res.data?.success) {
                setNotifications(res.data.data);
            }
        } catch (error) {
            console.error("Lỗi đồng bộ thông báo:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // 2. XỬ LÝ PHẢN HỒI LỜI MỜI (CHẤP NHẬN/TỪ CHỐI)
    const handleInviteAction = async (notifId, teamId, action) => {
        try {
            const res = await api.post('/teams/respond-invitation', {
                notificationId: notifId,
                teamId: teamId,
                action: action
            });

            if (res.data.success) {
                alert(action === 'accept' ? '🎉 Gia nhập đội thành công!' : 'Đã từ chối lời mời.');
                // Xóa thông báo đã xử lý khỏi danh sách hiển thị
                setNotifications(prev => prev.filter(n => n._id !== notifId));
                if (action === 'accept') navigate('/my-teams');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Thao tác thất bại.');
        }
    };

    // 3. ĐỊNH DẠNG THỜI GIAN
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
        });
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64 text-teal-accent font-black animate-pulse">
            🔄 ĐANG ĐỒNG BỘ DỮ LIỆU...
        </div>
    );

    return (
        <div className="page-wrapper" style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-forest" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px' }}>
                    THÔNG BÁO
                </h1>
                <button 
                    onClick={() => navigate('/my-teams')}
                    className="bg-slate-100 hover:bg-white text-dark-forest px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all"
                >
                    🛡️ QUẢN LÝ ĐỘI
                </button>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
                {notifications.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase tracking-widest">Hộp thư của bạn đang trống</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div 
                            key={notif._id} 
                            className="card animate-fade-in" 
                            style={{ 
                                padding: '25px', 
                                borderLeft: notif.type === 'PAYMENT' ? '6px solid #e11d48' : '6px solid var(--teal-accent)',
                                borderRadius: '20px',
                                background: 'white',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
                            }}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 style={{ color: 'var(--dark-forest)', margin: 0, fontWeight: 800 }}>{notif.title}</h3>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">{formatDate(notif.createdAt)}</span>
                            </div>
                            
                            <p style={{ color: '#444', lineHeight: '1.6', fontSize: '0.95rem' }}>{notif.message}</p>

                            {/* CASE 1: THÔNG BÁO LỜI MỜI (INVITATION) */}
                            {notif.type === 'INVITATION' && (
                                <div className="mt-5 flex gap-3">
                                    <button 
                                        onClick={() => handleInviteAction(notif._id, notif.metadata?.teamId, 'accept')} 
                                        className="bg-teal-500 text-white px-6 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest hover:bg-teal-600 transition-all"
                                    >
                                        CHẤP NHẬN
                                    </button>
                                    <button 
                                        onClick={() => handleInviteAction(notif._id, notif.metadata?.teamId, 'reject')} 
                                        className="bg-gray-100 text-gray-500 px-6 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                                    >
                                        TỪ CHỐI
                                    </button>
                                </div>
                            )}

                            {/* CASE 2: THÔNG BÁO THANH TOÁN (PAYMENT) */}
                            {notif.type === 'PAYMENT' && (
                                <div style={{ background: '#fff1f2', padding: '20px', borderRadius: '15px', marginTop: '15px', border: '1px solid #fecdd3' }}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-red-600 font-black">SỐ TIỀN: {notif.metadata?.amount?.toLocaleString()} VNĐ</span>
                                        <button 
                                            onClick={() => setActiveQR(activeQR === notif._id ? null : notif._id)}
                                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter"
                                        >
                                            {activeQR === notif._id ? 'ĐÓNG MÃ' : 'QUÉT MÃ QR'}
                                        </button>
                                    </div>

                                    {activeQR === notif._id && (
                                        <div className="text-center mt-5 pt-5 border-t border-red-200">
                                            <div className="inline-block bg-white p-3 rounded-2xl shadow-inner">
                                                <img 
                                                    src={notif.metadata?.paymentQR || `https://img.vietqr.io/image/mbbank-0901234567-compact.png?amount=${notif.metadata?.amount}&addInfo=${notif.metadata?.paymentContent}`} 
                                                    alt="QR Thanh Toán" 
                                                    style={{ width: '200px', height: '200px', objectFit: 'contain' }}
                                                />
                                            </div>
                                            <p className="mt-3 text-[11px] text-red-800 font-bold">
                                                NỘI DUNG: <span className="bg-white px-2 py-1 rounded border border-red-200">{notif.metadata?.paymentContent || 'DK GIAI DAU'}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* CASE 3: THÔNG BÁO HỆ THỐNG (SYSTEM) */}
                            {(notif.type === 'SYSTEM' || notif.type === 'MATCH') && (
                                <div className="mt-4">
                                    <button 
                                        onClick={() => navigate('/my-teams')}
                                        className="text-teal-accent text-[11px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline"
                                    >
                                        TRUY CẬP QUẢN LÝ ĐỘI 🛡️ →
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
            
            <style>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default Notifications;