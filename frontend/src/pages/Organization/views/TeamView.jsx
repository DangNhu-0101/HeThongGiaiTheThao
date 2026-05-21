import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api/axiosConfig';

const TeamView = ({ tourId: propTourId }) => {
    const { id: urlTourId } = useParams();
    const activeTourId = propTourId || urlTourId || localStorage.getItem('activeTournamentId');

    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const fetchTeams = useCallback(async () => {
        if (!activeTourId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await api.get(`/teams/tournaments/${activeTourId}/teams`);
            if (res.data && res.data.success) {
                setTeams(res.data.data);
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách đội:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTourId]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    // DUYỆT đội (isPaid = true)
    const handleApproveTeam = async (teamId) => {
        setProcessingId(teamId);
        try {
            await api.patch(`/teams/${teamId}/payment`, { isPaid: true });
            setTeams(teams.map(t => t._id === teamId ? { ...t, isPaid: true } : t));
        } catch (e) { 
            alert("Lỗi duyệt đội!"); 
        } finally {
            setProcessingId(null);
        }
    };

    // HỦY DUYỆT đội (isPaid = false)
    const handleUnapproveTeam = async (teamId) => {
        setProcessingId(teamId);
        try {
            await api.patch(`/teams/${teamId}/payment`, { isPaid: false });
            setTeams(teams.map(t => t._id === teamId ? { ...t, isPaid: false } : t));
        } catch (e) { 
            alert("Lỗi hủy duyệt!"); 
        } finally {
            setProcessingId(null);
        }
    };

    // DUYỆT NHÀ TÀI TRỢ (isSponsor = true)
    const handleApproveSponsor = async (teamId) => {
        setProcessingId(teamId);
        try {
            await api.patch(`/teams/${teamId}/sponsor`, { isSponsor: true, isPaid: true });
            setTeams(teams.map(t => t._id === teamId ? { ...t, isSponsor: true, isPaid: true } : t));
        } catch (e) { 
            alert("Lỗi duyệt nhà tài trợ!"); 
        } finally {
            setProcessingId(null);
        }
    };

    // HỦY DUYỆT NHÀ TÀI TRỢ (isSponsor = false)
    const handleUnapproveSponsor = async (teamId) => {
        setProcessingId(teamId);
        try {
            await api.patch(`/teams/${teamId}/sponsor`, { isSponsor: false });
            setTeams(teams.map(t => t._id === teamId ? { ...t, isSponsor: false } : t));
        } catch (e) { 
            alert("Lỗi hủy duyệt nhà tài trợ!"); 
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm("Xóa đội này khỏi giải đấu?")) return;
        setProcessingId(teamId);
        try {
            await api.delete(`/teams/delete/${teamId}`);
            setTeams(teams.filter(t => t._id !== teamId));
        } catch (e) {
            alert("Lỗi khi xóa đội!");
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) return <div className="tv-loading">Đang tải danh sách đội...</div>;

    // Lọc: đội đã duyệt (isPaid = true hoặc isSponsor = true)
    const confirmedTeams = teams.filter(t => t.isPaid === true || t.isSponsor === true);
    // Lọc: đội chờ duyệt (chưa được duyệt và chưa là nhà tài trợ)
    const pendingTeams = teams.filter(t => t.isPaid !== true && t.isSponsor !== true);

    const TeamCard = ({ t, isConfirmed }) => {
        const isSponsor = t.isSponsor === true;
        const isPaid = t.isPaid === true;
        const isLoading = processingId === t._id;

        return (
            <div className="tv-team-card">
                <div className="tv-team-avatar">
                    {(t.teamName || t.name || 'T').charAt(0).toUpperCase()}
                </div>
                <div className="tv-team-info">
                    <div className="tv-team-name">
                        {t.teamName || t.name}
                        {isSponsor && <span className="tv-sponsor-badge">🏆 Nhà tài trợ</span>}
                        {isPaid && !isSponsor && <span className="tv-paid-badge">✓ Đã duyệt</span>}
                    </div>
                    <div className="tv-team-meta">
                        {t.sportType || t.sportCategory || 'Chưa phân môn'} | {t.memberCount || 0} thành viên
                    </div>
                    <div className="tv-team-actions">
                        <button 
                            onClick={() => handleDeleteTeam(t._id)} 
                            className="tv-delete-btn"
                            disabled={isLoading}
                        >
                            Xóa
                        </button>
                    </div>
                </div>
                <div className="tv-button-group">
                    {isSponsor ? (
                <button 
                    onClick={() => handleUnapproveSponsor(t._id)}
                    className="tv-btn-sponsor-confirmed"
                    disabled={isLoading}
                >
                    ★ NHÀ TÀI TRỢ GIẢI
                </button>
            ) : (
                // Chỉ hiện nút "NHÀ TÀI TRỢ ?" khi chưa phải sponsor VÀ chưa được duyệt
                !isPaid && (
                    <button 
                        onClick={() => handleApproveSponsor(t._id)}
                        className="tv-btn-sponsor-pending"
                        disabled={isLoading}
                    >
                        NHÀ TÀI TRỢ ?
                    </button>
                )
            )}
                    
                    {isPaid ? (
                    <button 
                        onClick={() => handleUnapproveTeam(t._id)}
                        className="tv-btn-confirmed"
                        disabled={isLoading}
                    >
                        ĐÃ DUYỆT
                    </button>
                ) : (
                    !isSponsor && (  // ← Thêm dòng này
                        <button 
                            onClick={() => handleApproveTeam(t._id)}
                            className="tv-btn-pending"
                            disabled={isLoading}
                        >
                            DUYỆT ĐỘI
                        </button>
                    )
                )}
                </div>
            </div>
        );
    };

    return (
        <div className="tv-container">
            <style>{`
                .tv-container {
                    padding: 20px;
                    background: #fcfcfc;
                    min-height: 100vh;
                    font-family: 'Be Vietnam Pro', sans-serif;
                }

                .tv-loading {
                    color: #018ABE;
                    font-weight: 800;
                    padding: 40px;
                    text-align: center;
                    font-size: 14px;
                    letter-spacing: 1px;
                }

                .tv-section {
                    border-radius: 20px;
                    padding: 20px;
                    margin-bottom: 24px;
                }

                .tv-section-confirmed {
                    background: #fff;
                    border: 1px solid rgba(1,138,190,0.15);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
                }

                .tv-section-pending {
                    background: #fff;
                    border: 1px solid rgba(100,116,139,0.12);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
                }

                .tv-section-title {
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    margin-bottom: 18px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .tv-section-title::before {
                    content: "";
                    width: 4px;
                    height: 14px;
                    background: #018ABE;
                    border-radius: 4px;
                }

                .tv-section-title-confirmed::before {
                    background: #018ABE;
                }

                .tv-section-title-confirmed {
                    color: #018ABE;
                }

                .tv-section-title-pending::before {
                    background: #64748b;
                }

                .tv-section-title-pending {
                    color: #64748b;
                }

                .tv-count-badge {
                    background: #F1F5F9;
                    padding: 2px 10px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #018ABE;
                    margin-left: 8px;
                }

                .tv-count-badge-pending {
                    color: #64748b;
                }

                .tv-team-card {
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    background: #F8FAFC;
                    border: 1px solid #EEF6FB;
                    border-radius: 16px;
                    transition: all 0.2s ease;
                    margin-bottom: 12px;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .tv-team-card:hover {
                    border-color: rgba(1,138,190,0.3);
                    box-shadow: 0 4px 12px rgba(1,138,190,0.08);
                }

                .tv-team-avatar {
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(1,138,190,0.12);
                    color: #018ABE;
                    font-weight: 800;
                    font-size: 20px;
                    border-radius: 50%;
                    margin-right: 16px;
                    flex-shrink: 0;
                }

                .tv-team-info {
                    flex: 1;
                    min-width: 150px;
                }

                .tv-team-name {
                    font-weight: 800;
                    color: #02457A;
                    font-size: 16px;
                    margin-bottom: 4px;
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .tv-sponsor-badge {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 20px;
                    letter-spacing: 0.5px;
                }

                .tv-paid-badge {
                    background: #10b981;
                    color: white;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 20px;
                    letter-spacing: 0.5px;
                }

                .tv-team-meta {
                    font-size: 11px;
                    color: #64748b;
                    font-weight: 500;
                }

                .tv-team-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 6px;
                }

                .tv-delete-btn {
                    background: transparent;
                    border: none;
                    color: #ef4444;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    padding: 0;
                    transition: opacity 0.2s;
                }

                .tv-delete-btn:hover:not(:disabled) {
                    opacity: 0.7;
                    text-decoration: underline;
                }

                .tv-delete-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .tv-button-group {
                    display: flex;
                    gap: 12px;
                    flex-shrink: 0;
                }

                .tv-btn-confirmed {
                    padding: 8px 18px;
                    border-radius: 12px;
                    font-weight: 800;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: 1.5px solid #10b981;
                    background: rgba(16,185,129,0.1);
                    color: #10b981;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tv-btn-confirmed:hover:not(:disabled) {
                    background: rgba(16,185,129,0.2);
                    border-color: #059669;
                }

                .tv-btn-pending {
                    padding: 8px 18px;
                    border-radius: 12px;
                    font-weight: 800;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: 1.5px solid #eab308;
                    background: rgba(234,179,8,0.1);
                    color: #eab308;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tv-btn-pending:hover:not(:disabled) {
                    background: rgba(234,179,8,0.2);
                    border-color: #ca8a04;
                }

                .tv-btn-pending:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .tv-btn-sponsor-confirmed {
                    padding: 8px 18px;
                    border-radius: 12px;
                    font-weight: 800;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: 1.5px solid #f59e0b;
                    background: rgba(245,158,11,0.1);
                    color: #f59e0b;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tv-btn-sponsor-confirmed:hover:not(:disabled) {
                    background: rgba(245,158,11,0.2);
                    border-color: #d97706;
                }

                .tv-btn-sponsor-pending {
                    padding: 8px 18px;
                    border-radius: 12px;
                    font-weight: 800;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: 1.5px solid #8b5cf6;
                    background: rgba(139,92,246,0.1);
                    color: #8b5cf6;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tv-btn-sponsor-pending:hover:not(:disabled) {
                    background: rgba(139,92,246,0.2);
                    border-color: #7c3aed;
                }

                .tv-btn-confirmed:disabled,
                .tv-btn-sponsor-confirmed:disabled,
                .tv-btn-sponsor-pending:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .tv-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 12px;
                }

                .tv-empty {
                    color: #94a3b8;
                    font-style: italic;
                    font-size: 13px;
                    padding: 24px;
                    text-align: center;
                    background: #F8FAFC;
                    border-radius: 16px;
                    border: 1px dashed #CBD5E1;
                }

                @keyframes tv-fade-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .tv-container {
                    animation: tv-fade-in 0.3s ease-out;
                }

                @media (min-width: 768px) {
                    .tv-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 16px;
                    }
                    .tv-team-card {
                        margin-bottom: 0;
                    }
                }

                @media (max-width: 640px) {
                    .tv-button-group {
                        width: 100%;
                        justify-content: flex-end;
                    }
                }
            `}</style>

            {/* ĐỘI ĐÃ DUYỆT */}
            <div className="tv-section tv-section-confirmed">
                <div className="tv-section-title tv-section-title-confirmed">
                    Đội đã duyệt
                    <span className="tv-count-badge">{confirmedTeams.length}</span>
                </div>
                <div className="tv-grid">
                    {confirmedTeams.map(t => <TeamCard key={t._id} t={t} isConfirmed={true} />)}
                    {confirmedTeams.length === 0 && <div className="tv-empty">Chưa có đội nào được duyệt.</div>}
                </div>
            </div>

            {/* ĐỘI CHỜ DUYỆT */}
            <div className="tv-section tv-section-pending">
                <div className="tv-section-title tv-section-title-pending">
                    Chờ duyệt
                    <span className="tv-count-badge tv-count-badge-pending">{pendingTeams.length}</span>
                </div>
                <div className="tv-grid">
                    {pendingTeams.map(t => <TeamCard key={t._id} t={t} isConfirmed={false} />)}
                    {pendingTeams.length === 0 && <div className="tv-empty">Không có đội chờ duyệt.</div>}
                </div>
            </div>
        </div>
    );
};

export default TeamView;