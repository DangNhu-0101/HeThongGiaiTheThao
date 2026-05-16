import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeQR, setActiveQR] = useState(null);

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

    const handleInviteAction = async (notifId, teamId, action) => {
        try {
            const res = await api.post('/teams/invitations/respond', {
                notificationId: notifId,
                teamId: teamId,
                action: action
            });

            if (res.data.success) {
                alert(action === 'accept' ? '🎉 Gia nhập đội thành công!' : 'Đã từ chối lời mời.');
                setNotifications(prev => prev.filter(n => n._id !== notifId));
                if (action === 'accept') navigate('/my-teams');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Thao tác thất bại.');
        }
    };

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
        <>
            <style>{`
                .notify-container {
                    max-width: 800px;
                    margin: 40px auto;
                    padding: 0 20px;
                }

                @media (max-width: 768px) {
                    .notify-container {
                        margin: 24px auto;
                        padding: 0 16px;
                    }
                }

                @media (max-width: 640px) {
                    .notify-container {
                        margin: 16px auto;
                        padding: 0 12px;
                    }
                }

                .notify-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                    margin-bottom: 40px;
                }

                @media (max-width: 640px) {
                    .notify-header {
                        flex-direction: column;
                        text-align: center;
                        margin-bottom: 24px;
                    }
                }

                .notify-title {
                    font-size: 2.5rem;
                    font-weight: 900;
                    letter-spacing: -1px;
                    color: var(--dark-forest, #02457A);
                }

                @media (max-width: 768px) {
                    .notify-title {
                        font-size: 2rem;
                    }
                }

                @media (max-width: 640px) {
                    .notify-title {
                        font-size: 1.5rem;
                    }
                }

                .notify-btn-manage {
                    background: #f1f5f9;
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 900;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .notify-btn-manage:hover {
                    background: #fff;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }

                .notify-grid {
                    display: grid;
                    gap: 20px;
                }

                @media (max-width: 640px) {
                    .notify-grid {
                        gap: 16px;
                    }
                }

                .notify-card {
                    padding: 25px;
                    border-radius: 20px;
                    background: white;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
                    animation: fadeIn 0.4s ease-out;
                }

                @media (max-width: 640px) {
                    .notify-card {
                        padding: 18px;
                    }
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .notify-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 8px;
                }

                .notify-card-title {
                    color: var(--dark-forest, #02457A);
                    font-weight: 800;
                    font-size: 1.1rem;
                }

                @media (max-width: 640px) {
                    .notify-card-title {
                        font-size: 1rem;
                    }
                }

                .notify-date {
                    font-size: 0.6rem;
                    color: #94a3b8;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .notify-message {
                    color: #444;
                    line-height: 1.6;
                    font-size: 0.9rem;
                    margin-bottom: 12px;
                }

                @media (max-width: 640px) {
                    .notify-message {
                        font-size: 0.85rem;
                    }
                }

                .notify-delete-btn {
                    background: none;
                    border: none;
                    color: #ef4444;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    padding: 0;
                }

                .notify-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                }

                .notify-btn-accept {
                    background: #14b8a6;
                    color: #fff;
                    padding: 8px 24px;
                    border-radius: 8px;
                    font-size: 0.65rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: none;
                    cursor: pointer;
                }

                .notify-btn-reject {
                    background: #f1f5f9;
                    color: #64748b;
                    padding: 8px 24px;
                    border-radius: 8px;
                    font-size: 0.65rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: none;
                    cursor: pointer;
                }

                .notify-payment-box {
                    background: #fff1f2;
                    padding: 20px;
                    border-radius: 15px;
                    margin-top: 15px;
                    border: 1px solid #fecdd3;
                }

                @media (max-width: 640px) {
                    .notify-payment-box {
                        padding: 16px;
                    }
                }

                .notify-payment-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .notify-payment-amount {
                    color: #e11d48;
                    font-weight: 900;
                }

                .notify-btn-qr {
                    background: #e11d48;
                    color: #fff;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.6rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    border: none;
                    cursor: pointer;
                }

                .notify-qr-container {
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #fecdd3;
                }

                .notify-qr-img {
                    width: 200px;
                    height: 200px;
                    object-fit: contain;
                    background: #fff;
                    padding: 12px;
                    border-radius: 16px;
                }

                @media (max-width: 640px) {
                    .notify-qr-img {
                        width: 160px;
                        height: 160px;
                    }
                }

                .notify-payment-content {
                    margin-top: 12px;
                    font-size: 0.65rem;
                    color: #be123c;
                    font-weight: 700;
                }

                .notify-empty {
                    text-align: center;
                    padding: 80px 20px;
                    background: #f8fafc;
                    border-radius: 24px;
                    border: 2px dashed #e2e8f0;
                    color: #94a3b8;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                @media (max-width: 640px) {
                    .notify-empty {
                        padding: 60px 16px;
                    }
                }
            `}</style>

            <div className="notify-container">
                <div className="notify-header">
                    <h1 className="notify-title">THÔNG BÁO</h1>
                    <button 
                        onClick={() => navigate('/my-teams')}
                        className="notify-btn-manage"
                    >
                        🛡️ QUẢN LÝ ĐỘI
                    </button>
                </div>

                <div className="notify-grid">
                    {notifications.length === 0 ? (
                        <div className="notify-empty">
                            <p>Hộp thư của bạn đang trống</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div 
                                key={notif._id} 
                                className="notify-card"
                                style={{ borderLeft: notif.type === 'PAYMENT' ? '6px solid #e11d48' : '6px solid #14b8a6' }}
                            >
                                <div className="notify-card-header">
                                    <h3 className="notify-card-title">{notif.title}</h3>
                                    <span className="notify-date">{formatDate(notif.createdAt)}</span>
                                </div>
                                
                                <p className="notify-message">{notif.message}</p>
                              
                                <button 
                                    onClick={async () => {
                                        if (window.confirm('Bạn có chắc muốn xóa thông báo này?')) {
                                            try {
                                                const res = await api.delete(`/notifications/${notif._id}`);
                                                if (res.data.success) {
                                                    setNotifications(notifications.filter(n => n._id !== notif._id));
                                                }
                                            } catch (error) {
                                                console.error("Lỗi xóa thông báo:", error);
                                            }
                                        }
                                    }}
                                    className="notify-delete-btn"
                                >
                                    Xóa thông báo
                                </button>

                                {notif.type === 'INVITATION' && (
                                    <div className="notify-actions">
                                        <button 
                                            onClick={() => handleInviteAction(notif._id, notif.metadata?.teamId, 'accept')} 
                                            className="notify-btn-accept"
                                        >
                                            CHẤP NHẬN
                                        </button>
                                        <button 
                                            onClick={() => handleInviteAction(notif._id, notif.metadata?.teamId, 'reject')} 
                                            className="notify-btn-reject"
                                        >
                                            TỪ CHỐI
                                        </button>
                                    </div>
                                )}

                                {notif.type === 'PAYMENT' && (
                                    <div className="notify-payment-box">
                                        <div className="notify-payment-header">
                                            <span className="notify-payment-amount">
                                                SỐ TIỀN: {notif.metadata?.amount?.toLocaleString()} VNĐ
                                            </span>
                                            <button 
                                                onClick={() => setActiveQR(activeQR === notif._id ? null : notif._id)}
                                                className="notify-btn-qr"
                                            >
                                                {activeQR === notif._id ? 'ĐÓNG MÃ' : 'QUÉT MÃ QR'}
                                            </button>
                                        </div>

                                        {activeQR === notif._id && (
                                            <div className="notify-qr-container">
                                                <img 
                                                    src={notif.metadata?.paymentQR || `https://img.vietqr.io/image/mbbank-0901234567-compact.png?amount=${notif.metadata?.amount}&addInfo=${notif.metadata?.paymentContent}`} 
                                                    alt="QR Thanh Toán" 
                                                    className="notify-qr-img"
                                                />
                                                <p className="notify-payment-content">
                                                    NỘI DUNG: <span style={{ background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #fecdd3' }}>{notif.metadata?.paymentContent || 'DK GIAI DAU'}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(notif.type === 'SYSTEM' || notif.type === 'MATCH') && (
                                    <div className="notify-actions">
                                        <button 
                                            onClick={() => navigate('/my-teams')}
                                            className="notify-btn-accept"
                                            style={{ background: '#0891b2' }}
                                        >
                                            TRUY CẬP QUẢN LÝ ĐỘI 🛡️ →
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default Notifications;