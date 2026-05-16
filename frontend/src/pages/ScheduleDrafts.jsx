import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const ScheduleDrafts = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const hasIncomingData = !!location.state?.draftMatches;
    
    const [drafts, setDrafts] = useState(location.state?.draftMatches || []);
    const [isLoading, setIsLoading] = useState(!hasIncomingData);

    useEffect(() => {
        if (!hasIncomingData) {
            api.get('/api/matches/editable-list')
                .then(res => {
                    setDrafts(res.data.data || []);
                })
                .catch(err => console.error("Lỗi lấy lịch sửa:", err))
                .finally(() => setIsLoading(false));
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

    if (isLoading) return (
        <div className="page-wrapper flex-center">
            <h2 className="text-muted">🔄 Đang tải dữ liệu lịch đấu...</h2>
        </div>
    );

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
        <>
            <style>{`
                .sd-container {
                    padding: 40px 20px;
                    min-height: 100vh;
                    background: #f8fafc;
                }

                @media (max-width: 768px) {
                    .sd-container {
                        padding: 30px 16px;
                    }
                }

                @media (max-width: 640px) {
                    .sd-container {
                        padding: 20px 12px;
                    }
                }

                .sd-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .sd-header {
                    text-align: center;
                    margin-bottom: 40px;
                }

                .sd-title {
                    font-size: 2rem;
                    color: #0f172a;
                    margin: 0;
                }

                @media (max-width: 768px) {
                    .sd-title {
                        font-size: 1.5rem;
                    }
                }

                @media (max-width: 640px) {
                    .sd-title {
                        font-size: 1.25rem;
                    }
                }

                .sd-subtitle {
                    color: #14b8a6;
                    font-weight: 700;
                    margin-top: 8px;
                }

                .sd-card {
                    background: #fff;
                    border-radius: 16px;
                    border-top: 6px solid #BD0014;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                    overflow: hidden;
                }

                .sd-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 2px solid #f1f5f9;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                @media (max-width: 640px) {
                    .sd-card-header {
                        flex-direction: column;
                        text-align: center;
                    }
                }

                .sd-card-title {
                    color: #BD0014;
                    margin: 0;
                    font-size: 1.25rem;
                }

                .sd-match-list {
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .sd-match-item {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                    background: #f8fafc;
                    padding: 15px 20px;
                    border-radius: 12px;
                    border-left: 5px solid #14b8a6;
                    flex-wrap: wrap;
                }

                .sd-match-item-knockout {
                    border-left-color: #BD0014;
                }

                @media (max-width: 768px) {
                    .sd-match-item {
                        flex-direction: column;
                        align-items: stretch;
                    }
                }

                .sd-match-info {
                    flex: 1;
                }

                .sd-match-badge {
                    font-size: 0.7rem;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 20px;
                    display: inline-block;
                    text-transform: uppercase;
                }

                .sd-match-badge-group {
                    background: #e6f4ea;
                    color: #14b8a6;
                }

                .sd-match-badge-knockout {
                    background: #fce8e8;
                    color: #BD0014;
                }

                .sd-match-teams {
                    margin-top: 8px;
                    font-weight: 900;
                    color: #0f172a;
                    font-size: 1rem;
                }

                @media (max-width: 640px) {
                    .sd-match-teams {
                        font-size: 0.9rem;
                    }
                }

                .sd-match-field {
                    min-width: 150px;
                }

                .sd-match-field-time {
                    min-width: 220px;
                }

                @media (max-width: 768px) {
                    .sd-match-field, .sd-match-field-time {
                        width: 100%;
                    }
                }

                .sd-field-label {
                    display: block;
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #64748b;
                    margin-bottom: 5px;
                }

                .sd-input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    outline: none;
                }

                @media (max-width: 640px) {
                    .sd-input {
                        padding: 10px;
                        font-size: 16px;
                    }
                }

                .sd-input:focus {
                    border-color: #14b8a6;
                }

                .sd-publish-btn {
                    margin: 20px;
                    padding: 14px;
                    background: #14b8a6;
                    color: #fff;
                    font-weight: 900;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                @media (max-width: 640px) {
                    .sd-publish-btn {
                        margin: 16px;
                        padding: 12px;
                        font-size: 0.8rem;
                    }
                }

                .sd-publish-btn:hover {
                    background: #0d9488;
                }
            `}</style>

            <div className="sd-container">
                <div className="sd-inner">
                    <div className="sd-header">
                        <h1 className="sd-title">🛠 XÁC NHẬN & SỬA LỊCH ĐẤU</h1>
                        <p className="sd-subtitle">Kiểm tra và điều chỉnh thông tin trước khi công bố cho Khán giả</p>
                    </div>

                    <div className="sd-card">
                        <div className="sd-card-header">
                            <h2 className="sd-card-title">✍️ ĐIỀU CHỈNH SÂN VÀ GIỜ</h2>
                        </div>
                        
                        <div className="sd-match-list">
                            {drafts.map((match, i) => {
                                const isKnockout = match.stage === 'knockout';
                                return (
                                    <div key={i} className={`sd-match-item ${isKnockout ? 'sd-match-item-knockout' : ''}`}>
                                        
                                        <div className="sd-match-info">
                                            <span className={`sd-match-badge ${isKnockout ? 'sd-match-badge-knockout' : 'sd-match-badge-group'}`}>
                                                {isKnockout ? match.matchName : `Bảng ${match.group}`}
                                            </span>
                                            <div className="sd-match-teams">
                                                {match.team1Name || match.team1?.teamName} 
                                                <span style={{ color: '#94a3b8', margin: '0 5px' }}>vs</span> 
                                                {match.team2Name || match.team2?.teamName}
                                            </div>
                                        </div>
                                        
                                        <div className="sd-match-field">
                                            <label className="sd-field-label">SÂN THI ĐẤU</label>
                                            <input 
                                                type="text" 
                                                className="sd-input"
                                                value={match.court || ""} 
                                                onChange={(e) => handleCourtChange(i, e.target.value)} 
                                            />
                                        </div>

                                        <div className="sd-match-field-time">
                                            <label className="sd-field-label">THỜI GIAN</label>
                                            <input 
                                                type="datetime-local" 
                                                className="sd-input"
                                                value={
                                                    match.timestart && !isNaN(new Date(match.timestart)) 
                                                    ? new Date(new Date(match.timestart).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                                                    : "" 
                                                } 
                                                onChange={(e) => handleTimeChange(i, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <button onClick={handlePublish} className="sd-publish-btn">
                            🚀 XÁC NHẬN LƯU & CÔNG KHAI LỊCH ĐẤU
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ScheduleDrafts;