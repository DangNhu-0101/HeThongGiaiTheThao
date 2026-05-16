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
                if (res.data.success) {
                    console.log("Profile data:", res.data.data);
                    setProfileData(res.data.data);
                }
            } catch (err) { console.error("Lỗi lấy hồ sơ:", err); }
            finally { setLoading(false); }
        };
        fetchProfile();
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--teal-accent)', fontWeight: 'bold', fontSize: '1.2rem' }}>ĐANG TẢI HỒ SƠ...</div>;

    // Lấy dữ liệu thật từ API
    const username = profileData?.username || user?.username || 'Người dùng';
    const email = profileData?.email || user?.email || '';
    const role = profileData?.role || user?.role || 'player';
    const phoneNumber = profileData?.phoneNumber || '';
const level = profileData?.sports?.[0]?.level || profileData?.level || profileData?.skill || 'Chưa cập nhật';    const name = profileData?.name || profileData?.displayName || username;
    
    // Thống kê (nếu có từ Player model)
    const stats = {
        matches: profileData?.stats?.matches || profileData?.totalMatches || 0,
        wins: profileData?.stats?.wins || 0,
        winRate: profileData?.stats?.matches > 0 
            ? Math.round((profileData.stats.wins || 0) / profileData.stats.matches * 100) + '%' 
            : '0%',
        recentMatches: profileData?.recentMatches || []
    };

    // Mapper role sang tiếng Việt
    const roleLabel = {
        'player': 'Vận động viên',
        'Player': 'Vận động viên',
        'referee': 'Trọng tài',
        'Referee': 'Trọng tài',
        'Organization': 'Ban tổ chức',
        'organization': 'Ban tổ chức',
        'coach': 'Huấn luyện viên',
    }[role] || role;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            {/* Hero Section */}
            <div style={{ 
                background: 'var(--dark-forest, #02457A)', color: 'white', padding: '40px 20px', 
                borderRadius: '25px', textAlign: 'center', position: 'relative',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
            }}>
                <div style={{ 
                    width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--primary-lime, #97CADB)', 
                    margin: '0 auto 15px', border: '4px solid white', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' 
                }}>
                    {profileData?.gender === 'female' ? '👩‍' : '👨‍'}
                </div>
                <h2 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{name}</h2>
                <p style={{ margin: '5px 0 0', fontSize: '0.85rem', opacity: 0.8 }}>{email}</p>
                {phoneNumber && <p style={{ margin: '3px 0 0', fontSize: '0.8rem', opacity: 0.7 }}> {phoneNumber}</p>}
                
                <div style={{ 
                    display: 'inline-block', backgroundColor: 'var(--primary-lime, #97CADB)', color: 'var(--dark-forest, #02457A)', 
                    padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '10px' 
                }}>
                    {roleLabel} · LEVEL: {level}
                </div>

                {/* NÚT QUẢN LÝ ĐỘI */}
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
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--teal-accent, #018ABE)' }}>{stats.winRate}</div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Tổng trận</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--teal-accent, #018ABE)' }}>{stats.matches}</div>
                </div>
            </div>

            {/* Thông tin chi tiết */}
            <h3 style={{ marginTop: '30px', color: 'var(--dark-forest, #02457A)', fontSize: '1.1rem' }}> THÔNG TIN CHI TIẾT</h3>
            <div style={{ background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>Tên đăng nhập</span>
                    <span style={{ fontWeight: 'bold', color: '#02457A' }}>{username}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>Email</span>
                    <span style={{ fontWeight: 'bold', color: '#02457A' }}>{email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>Vai trò</span>
                    <span style={{ fontWeight: 'bold', color: '#02457A' }}>{roleLabel}</span>
                </div>
                {phoneNumber && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                        <span style={{ color: '#888', fontSize: '0.85rem' }}>Số điện thoại</span>
                        <span style={{ fontWeight: 'bold', color: '#02457A' }}>{phoneNumber}</span>
                    </div>
                )}
                {profileData?.sports && profileData.sports.length > 0 && (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
        <span style={{ color: '#888', fontSize: '0.85rem' }}>Môn thể thao</span>
        <span style={{ fontWeight: 'bold', color: '#02457A' }}>
            {profileData.sports.map(s => `${s.category || s} (${s.level || 'N/A'})`).join(', ')}
        </span>
    </div>
)}
            </div>

            {/* Lịch sử thi đấu */}
            <h3 style={{ marginTop: '30px', color: 'var(--dark-forest, #02457A)', fontSize: '1.1rem' }}> LỊCH SỬ THI ĐẤU GẦN ĐÂY</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
                {stats.recentMatches.length > 0 ? stats.recentMatches.map((m, i) => (
                    <div key={i} style={{ background: 'white', padding: '15px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>vs {m.vs || m.opponent || 'Đối thủ'}</div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>Tỉ số: {m.score || `${m.team1Score || 0} - ${m.team2Score || 0}`}</div>
                        </div>
                        <div style={{ color: m.result === 'Win' || m.winnerId === user?._id ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                            {m.result === 'Win' || m.winnerId === user?._id ? 'THẮNG' : 'THUA'}
                        </div>
                    </div>
                )) : (
                    <p style={{ textAlign: 'center', color: '#999', fontSize: '0.9rem', marginTop: '10px' }}>
                        Chưa có dữ liệu thi đấu.
                    </p>
                )}
            </div>
        </div>
    );
};

export default Profile;
