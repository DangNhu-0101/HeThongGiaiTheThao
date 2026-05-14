import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Profile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/profile');
                if (res.data.success) setProfileData(res.data.data);
            } catch (err) { console.error("Lỗi lấy hồ sơ:", err); }
            finally { setLoading(false); }
        };
        fetchProfile();
    }, []);

    if (loading) return <div className="text-center py-20 text-teal-accent">ĐANG TẢI HỒ SƠ...</div>;

    // Dữ liệu fallback nếu DB chưa có chỉ số thi đấu
    const stats = profileData?.stats || { matches: 0, winRate: "0%", recentMatches: [] };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            {/* Hero Section */}
            <div style={{ 
                background: 'var(--dark-forest)', color: 'white', padding: '40px 20px', 
                borderRadius: '25px', textAlign: 'center', position: 'relative',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
            }}>
                <div style={{ 
                    width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--primary-lime)', 
                    margin: '0 auto 15px', border: '4px solid white', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' 
                }}>
                    {user?.gender === 'female' ? '👩‍' : '👨‍'}
                </div>
                <h2 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{user?.displayName}</h2>
                <div style={{ 
                    display: 'inline-block', backgroundColor: 'var(--primary-lime)', color: 'black', 
                    padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '10px' 
                }}>
                    LEVEL: {profileData?.skill || 'Chưa cập nhật'}
                </div>

                {/* NÚT QUẢN LÝ ĐỘI NẰM NGAY ĐÂY */}
                <button 
                    onClick={() => navigate('/my-teams')}
                    style={{
                        display: 'block', margin: '20px auto 0', padding: '10px 25px',
                        backgroundColor: 'rgb(48, 194, 220)', border: 'none',
                        color: 'white', fontSize: '0.9rem', textTransform: 'uppercase',
                        borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
                       
                    }}
                >
                    QUẢN LÝ ĐỘI CỦA TÔI
                </button>
            </div>

            {/* Thẻ thống kê */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Tỉ lệ thắng</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--teal-accent)' }}>{stats.winRate}</div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Tổng trận</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--teal-accent)' }}>{stats.matches}</div>
                </div>
            </div>

            {/* Lịch sử */}
            <h3 style={{ marginTop: '30px', color: 'var(--dark-forest)', fontSize: '1.1rem' }}>📜 LỊCH SỬ THI ĐẤU GẦN ĐÂY</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
                {stats.recentMatches.length > 0 ? stats.recentMatches.map((m, i) => (
                    <div key={i} style={{ background: 'white', padding: '15px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>vs {m.vs}</div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>Tỉ số: {m.score}</div>
                        </div>
                        <div style={{ color: m.result === 'Win' ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                            {m.result === 'Win' ? 'THẮNG' : 'THUA'}
                        </div>
                    </div>
                )) : (
                    <p style={{ textAlign: 'center', color: '#999', fontSize: '0.9rem', marginTop: '10px' }}>Chưa có dữ liệu thi đấu.</p>
                )}
            </div>
        </div>
    );
};

export default Profile;