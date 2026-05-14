import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api/axiosConfig';
import ImportTeams from '../../../components/ImportTeams';

const TeamView = ({ tourId: propTourId }) => {
    const { id: urlTourId } = useParams();
    const activeTourId = propTourId || urlTourId || localStorage.getItem('activeTournamentId');

    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTeams = useCallback(async () => {
        if (!activeTourId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await api.get(`/teams?tournamentId=${activeTourId}`);
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

    // DUYỆT đội (từ chờ duyệt → đã duyệt)
    const handleApproveTeam = async (teamId) => {
        try {
            await api.patch(`/teams/${teamId}/payment`, { status: 'confirmed' });
            setTeams(teams.map(t => t._id === teamId ? { ...t, status: 'confirmed' } : t));
        } catch (e) { 
            alert("Lỗi duyệt đội!"); 
        }
    };

    // HỦY DUYỆT (từ đã duyệt → chờ duyệt)
    const handleUnapproveTeam = async (teamId) => {
        try {
            await api.patch(`/teams/${teamId}/payment`, { status: 'validated' });
            setTeams(teams.map(t => t._id === teamId ? { ...t, status: 'validated' } : t));
        } catch (e) { 
            alert("Lỗi hủy duyệt!"); 
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm("Xóa đội này khỏi giải đấu?")) return;
        try {
            await api.delete(`/teams/delete/${teamId}`);
            setTeams(teams.filter(t => t._id !== teamId));
        } catch (e) {
            alert("Lỗi khi xóa đội!");
        }
    };

    if (isLoading) return <div className="tv-loading">Đang tải danh sách đội...</div>;

    const confirmedTeams = teams.filter(t => t.status === 'confirmed');
    const pendingTeams = teams.filter(t => t.status !== 'confirmed');

    const TeamCard = ({ t, isConfirmed }) => (
        <div className="tv-team-card">
            <div className="tv-team-avatar">
                {(t.name || 'T').charAt(0).toUpperCase()}
            </div>
            <div className="tv-team-info">
                <div className="tv-team-name">{t.name}</div>
                <div className="tv-team-meta">{t.sportCategory} | {t.memberCount || 0} thành viên</div>
                <div className="tv-team-actions">
                    <button onClick={() => handleDeleteTeam(t._id)} className="tv-delete-btn">Xóa</button>
                </div>
            </div>
            {isConfirmed ? (
                <button 
                    onClick={() => handleUnapproveTeam(t._id)}
                    className="tv-btn-confirmed">
                    ĐÃ DUYỆT
                </button>
            ) : (
                <button 
                    onClick={() => handleApproveTeam(t._id)}
                    className="tv-btn-pending">
                    DUYỆT ĐỘI
                </button>
            )}
        </div>
    );

    return (
        <div className="tv-container">
            <style>{`
                /* ──────────────────────────────────────────────────────────── */
                /* TEAM VIEW STYLES - inspired by TournamentModal & Sidebar   */
                /* ──────────────────────────────────────────────────────────── */

                .tv-container {
                    padding: 20px;
                    background: #fcfcfc;
                    min-height: 100vh;
                    font-family: 'Be Vietnam Pro', sans-serif;
                }

                /* LOADING */
                .tv-loading {
                    color: #018ABE;
                    font-weight: 800;
                    padding: 40px;
                    text-align: center;
                    font-size: 14px;
                    letter-spacing: 1px;
                }

                /* IMPORT SECTION (wrapper for ImportTeams component) */
                .tv-import-wrapper {
                    margin-bottom: 28px;
                }

                /* TEAM SECTION */
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

                /* TEAM CARD */
                .tv-team-card {
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    background: #F8FAFC;
                    border: 1px solid #EEF6FB;
                    border-radius: 16px;
                    transition: all 0.2s ease;
                    margin-bottom: 12px;
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
                }

                .tv-team-name {
                    font-weight: 800;
                    color: #02457A;
                    font-size: 16px;
                    margin-bottom: 4px;
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

                .tv-delete-btn:hover {
                    opacity: 0.7;
                    text-decoration: underline;
                }

                /* BUTTONS */
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
                    flex-shrink: 0;
                }

                .tv-btn-confirmed:hover {
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
                    flex-shrink: 0;
                }

                .tv-btn-pending:hover {
                    background: rgba(234,179,8,0.2);
                    border-color: #ca8a04;
                }

                /* GRID LAYOUT */
                .tv-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 12px;
                }

                /* EMPTY STATE */
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

                /* ANIMATION */
                @keyframes tv-fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .tv-container {
                    animation: tv-fade-in 0.3s ease-out;
                }

                /* RESPONSIVE */
                @media (min-width: 768px) {
                    .tv-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 16px;
                    }
                    
                    .tv-team-card {
                        margin-bottom: 0;
                    }
                }
            `}</style>

            <div className="tv-import-wrapper">
                <ImportTeams 
                    tournamentId={activeTourId} 
                    onRefresh={fetchTeams}
                />
            </div>
            
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