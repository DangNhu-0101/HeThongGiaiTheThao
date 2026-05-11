import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const ScheduleDrafts = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Kiểm tra xem có phải đang nhận data nháp từ AI bốc thăm truyền sang không
    const hasIncomingData = !!location.state?.draftMatches;
    
    const [drafts, setDrafts] = useState(location.state?.draftMatches || []);
    
    // NẾU KHÔNG CÓ DATA TRUYỀN SANG -> BẮT BUỘC BẬT LOADING LÊN TRUE NGAY LẬP TỨC
    const [isLoading, setIsLoading] = useState(!hasIncomingData);

    useEffect(() => {
        // Chỉ gọi API nếu người dùng tự bấm nút "Sửa Lịch Đấu" (không có data truyền sang)
        if (!hasIncomingData) {
            api.get('/api/matches/editable-list')
                .then(res => {
                    setDrafts(res.data.data || []);
                })
                .catch(err => console.error("Lỗi lấy lịch sửa:", err))
                .finally(() => setIsLoading(false)); // Kéo data xong mới tắt Loading
        }
    }, [hasIncomingData]);

    const handleTimeChange = (index, newTimeStr) => {
        const updated = [...drafts];
        updated[index].timestart = new Date(newTimeStr).getTime();
        setDrafts(updated);
    };

    const handleCourtChange = (index, newCourt) => {
        const updated = [...drafts];
        updated[index].court = newCourt;
        setDrafts(updated);
    };

    const handlePublish = async () => {
        try {
            await api.post('/api/matches/publish', { matches: drafts });
            alert("🎉 Đã lưu và cập nhật Lịch thi đấu thành công!");
            navigate('/admin');
        } catch (error) {
            alert("Lỗi khi lưu lịch!");
        }
    };

    // UI LOADING & EMPTY STATE
    if (isLoading) return <div className="page-wrapper flex-center"><h2 className="text-muted">🔄 Đang tải dữ liệu lịch đấu...</h2></div>;

    if (drafts.length === 0) {
        return (
            <div className="page-wrapper flex-center">
                <div className="card text-center" style={{ maxWidth: '500px', padding: '40px' }}>
                    <h2 className="text-forest" style={{ marginBottom: '20px' }}>Không có lịch đấu chờ xử lý</h2>
                    <p className="text-muted" style={{ marginBottom: '30px' }}>Hiện tại không có trận đấu nào ở dạng bản nháp hoặc đang chờ diễn ra.</p>
                    <button onClick={() => navigate('/admin')} className="auth-button">Quay lại Điều Hành</button>
                </div>
            </div>
        );
    }


    // GOM NHÓM THEO BẢNG HOẶC KNOCKOUT
    const groupedDrafts = drafts.reduce((acc, match) => {
        const groupName = match.stage === 'knockout' ? 'KNOCKOUT' : (match.group || "KHÁC");
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(match);
        return acc;
    }, {});

    Object.keys(groupedDrafts).forEach(key => {
        groupedDrafts[key].sort((a, b) => new Date(a.timestart) - new Date(b.timestart));
    });

    return (
        <div className="page-wrapper">
            <div className="page-container" style={{ maxWidth: '1200px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 className="text-forest" style={{ fontSize: '2.5rem', margin: 0 }}>🛠 XÁC NHẬN & SỬA LỊCH ĐẤU</h1>
                    <p className="text-teal fw-bold">Kiểm tra và điều chỉnh thông tin trước khi công bố cho Khán giả</p>
                </div>

                <div className="card" style={{ borderTop: '6px solid var(--brick-red)' }}>
                    <div className="flex-between" style={{ borderBottom: '2px solid var(--neutral-cream)', paddingBottom: '10px', marginBottom: '20px' }}>
                        <h2 className="text-red" style={{ margin: 0, fontSize: '1.5rem' }}>✍️ ĐIỀU CHỈNH SÂN VÀ GIỜ</h2>
                    </div>
                    
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {drafts.map((match, i) => {
                            const isKnockout = match.stage === 'knockout';
                            return (
                                <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'var(--neutral-cream)', padding: '15px 20px', borderRadius: '12px', borderLeft: `5px solid ${isKnockout ? 'var(--brick-red)' : 'var(--teal-accent)'}` }}>
                                    
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isKnockout ? 'var(--brick-red)' : 'var(--teal-accent)', background: isKnockout ? '#fce8e8' : '#e6f4ea', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                                            {isKnockout ? match.matchName : `Bảng ${match.group}`}
                                        </span>
                                        <div className="text-forest fw-black" style={{ marginTop: '8px', fontSize: '1.1rem' }}>
                                            {match.team1Name || match.team1?.teamName} <span className="text-muted fw-bold" style={{fontSize: '0.9rem', margin: '0 5px'}}>vs</span> {match.team2Name || match.team2?.teamName}
                                        </div>
                                    </div>
                                    
                                    <div style={{ width: '150px' }}>
                                        <label className="text-muted fw-bold" style={{ display: 'block', fontSize: '0.75rem', marginBottom: '5px' }}>SÂN THI ĐẤU</label>
                                        <input 
                                            type="text" 
                                            className="auth-input"
                                            value={match.court || ""} 
                                            onChange={(e) => handleCourtChange(i, e.target.value)} 
                                            style={{ padding: '10px', margin: 0, fontSize: '0.9rem' }}
                                        />
                                    </div>

                                    <div style={{ width: '220px' }}>
                                        <label className="text-muted fw-bold" style={{ display: 'block', fontSize: '0.75rem', marginBottom: '5px' }}>THỜI GIAN</label>
                                        <input 
                                            type="datetime-local" 
                                            className="auth-input"
                                            value={
                                                match.timestart && !isNaN(new Date(match.timestart)) 
                                                ? new Date(new Date(match.timestart).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                                                : "" 
                                            } 
                                            onChange={(e) => handleTimeChange(i, e.target.value)}
                                            style={{ padding: '10px', margin: 0, fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <button onClick={handlePublish} className="auth-button" style={{ marginTop: '40px' }}>
                        🚀 XÁC NHẬN LƯU & CÔNG KHAI LỊCH ĐẤU
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleDrafts;