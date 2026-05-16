import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const TeamDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');

    const fetchTeamDetail = async () => {
        try {
            const res = await api.get(`/teams/users/${id}`);
            if (res.data.success) {
                setTeam(res.data.data);
                setNewName(res.data.data.name);
            }
        } catch (err) { 
            console.error(err); 
            alert("Không thể tải thông tin đội bóng");
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchTeamDetail(); }, [id]);

    const handleUpdateName = async () => {
        if (!newName.trim()) return alert("Tên đội không được để trống");
        try {
            await api.put(`/teams/edit/${id}`, { name: newName });
            setIsEditing(false);
            fetchTeamDetail();
        } catch (err) { alert("Lỗi cập nhật tên đội"); }
    };

    const handleDeleteTeam = async () => {
        if (!window.confirm("CẢNH BÁO: Bạn có chắc muốn HỦY ĐĂNG KÝ?")) return;
        try {
            await api.delete(`/teams/delete/${id}`);
            navigate('/my-teams');
        } catch (err) { alert("Lỗi khi xóa đội"); }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm("Bạn có chắc muốn xóa thành viên này?")) return;
        try {
            await api.delete(`/teams/${id}/members/${memberId}`);
            fetchTeamDetail();
        } catch (err) { alert("Lỗi thao tác"); }
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ color: '#22d3ee', fontWeight: 900, fontSize: '1.2rem' }}>⚡ ĐANG TẢI...</div>
        </div>
    );
    
    if (!team) return (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ color: '#ef4444', fontWeight: 900 }}>❌ KHÔNG TÌM THẤY</div>
        </div>
    );

    return (
        <>
            <style>{`
                .td-container {
                    max-width: 896px;
                    margin: 0 auto;
                    padding: 16px;
                    animation: fadeIn 0.4s ease-out;
                }

                @media (max-width: 768px) {
                    .td-container {
                        padding: 12px;
                    }
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .td-header-card {
                    background: #0f172a;
                    border: 1px solid #1e293b;
                    padding: 24px 32px;
                    border-radius: 24px;
                    margin-bottom: 24px;
                }

                @media (max-width: 640px) {
                    .td-header-card {
                        padding: 20px;
                        border-radius: 20px;
                    }
                }

                .td-header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .td-team-name-section {
                    flex: 1;
                }

                .td-team-name {
                    font-size: 1.875rem;
                    font-weight: 900;
                    color: #fff;
                    text-transform: uppercase;
                }

                @media (max-width: 768px) {
                    .td-team-name {
                        font-size: 1.5rem;
                    }
                }

                @media (max-width: 640px) {
                    .td-team-name {
                        font-size: 1.25rem;
                    }
                }

                .td-edit-btn {
                    color: #06b6d4;
                    font-size: 0.8rem;
                    background: none;
                    border: none;
                    cursor: pointer;
                    margin-left: 12px;
                }

                .td-badge-group {
                    display: flex;
                    gap: 12px;
                    margin-top: 12px;
                    flex-wrap: wrap;
                }

                .td-badge {
                    font-size: 0.65rem;
                    font-weight: 700;
                    padding: 4px 12px;
                    border-radius: 20px;
                }

                .td-badge-cyan {
                    background: rgba(6,182,212,0.2);
                    color: #22d3ee;
                }

                .td-badge-green {
                    background: rgba(34,197,94,0.2);
                    color: #4ade80;
                }

                .td-badge-yellow {
                    background: rgba(234,179,8,0.2);
                    color: #facc15;
                }

                .td-delete-btn {
                    background: rgba(239,68,68,0.2);
                    border: 1px solid #ef4444;
                    color: #f87171;
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-size: 0.65rem;
                    font-weight: 900;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .td-delete-btn:hover {
                    background: #ef4444;
                    color: #fff;
                }

                .td-members-card {
                    background: #0f172a;
                    border: 1px solid #1e293b;
                    padding: 24px;
                    border-radius: 24px;
                }

                @media (max-width: 640px) {
                    .td-members-card {
                        padding: 20px;
                    }
                }

                .td-members-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .td-members-title {
                    font-size: 1.25rem;
                    font-weight: 900;
                    color: #fff;
                    text-transform: uppercase;
                }

                .td-members-count {
                    color: #06b6d4;
                    font-weight: 700;
                }

                .td-members-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .td-member-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: rgba(30,41,59,0.5);
                    border: 1px solid rgba(51,65,85,0.5);
                    border-radius: 16px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                @media (max-width: 640px) {
                    .td-member-item {
                        flex-direction: column;
                        text-align: center;
                    }
                }

                .td-member-info {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                .td-member-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: rgba(6,182,212,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 900;
                    color: #fff;
                    font-size: 1.25rem;
                }

                .td-member-name {
                    color: #fff;
                    font-weight: 700;
                }

                .td-member-role {
                    font-size: 0.6rem;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 12px;
                    background: #facc15;
                    color: #000;
                    margin-left: 8px;
                }

                .td-member-status {
                    font-size: 0.6rem;
                    font-weight: 700;
                    padding: 4px 8px;
                    border-radius: 20px;
                }

                .td-member-status-active {
                    background: rgba(34,197,94,0.4);
                    color: #4ade80;
                }

                .td-member-status-pending {
                    background: rgba(234,179,8,0.4);
                    color: #facc15;
                }

                .td-remove-btn {
                    background: none;
                    border: none;
                    color: #f87171;
                    font-size: 0.7rem;
                    font-weight: 700;
                    cursor: pointer;
                }

                .td-edit-form {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    align-items: center;
                }

                .td-edit-input {
                    background: #1e293b;
                    border: 1px solid #06b6d4;
                    color: #fff;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 700;
                    outline: none;
                }

                @media (max-width: 640px) {
                    .td-edit-input {
                        width: 100%;
                    }
                }

                .td-edit-save {
                    background: #16a34a;
                    color: #fff;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: 700;
                    border: none;
                    cursor: pointer;
                }

                .td-edit-cancel {
                    background: #475569;
                    color: #fff;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: 700;
                    border: none;
                    cursor: pointer;
                }
            `}</style>

            <div className="td-container">
                <div className="td-header-card">
                    <div className="td-header-content">
                        <div className="td-team-name-section">
                            {isEditing ? (
                                <div className="td-edit-form">
                                    <input 
                                        className="td-edit-input"
                                        value={newName} 
                                        onChange={(e) => setNewName(e.target.value)} 
                                        autoFocus
                                    />
                                    <button onClick={handleUpdateName} className="td-edit-save">LƯU</button>
                                    <button onClick={() => {setIsEditing(false); setNewName(team.name)}} className="td-edit-cancel">HỦY</button>
                                </div>
                            ) : (
                                <div>
                                    <h1 className="td-team-name">
                                        {team.name}
                                        <button onClick={() => setIsEditing(true)} className="td-edit-btn">✎ Sửa</button>
                                    </h1>
                                </div>
                            )}
                            
                            <div className="td-badge-group">
                                <span className="td-badge td-badge-cyan">
                                    {team.sportCategory} | {team.tournamentId?.name || "N/A"}
                                </span>
                                <span className={`td-badge ${team.status === 'validated' ? 'td-badge-green' : 'td-badge-yellow'}`}>
                                    {team.status === 'validated' ? 'ĐÃ XÁC NHẬN' : 'CHỜ DUYỆT'}
                                </span>
                            </div>
                        </div>
                        
                        <button onClick={handleDeleteTeam} className="td-delete-btn">
                            HỦY ĐĂNG KÝ
                        </button>
                    </div>
                </div>

                <div className="td-members-card">
                    <div className="td-members-header">
                        <h2 className="td-members-title">Thành viên</h2>
                        <span className="td-members-count">{team.members?.length || 0} người</span>
                    </div>

                    <div className="td-members-grid">
                        {team.members?.map((m) => (
                            <div key={m._id} className="td-member-item">
                                <div className="td-member-info">
                                    <div className="td-member-avatar">
                                        {m.userId?.username?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="td-member-name">
                                            {m.userId?.username || "N/A"} 
                                            {m.role === 'Captain' && <span className="td-member-role">⭐ CAPTAIN</span>}
                                        </p>
                                        <span className={`td-member-status ${m.status === 'active' ? 'td-member-status-active' : 'td-member-status-pending'}`}>
                                            {m.status === 'active' ? 'Thành viên' : 'Đang chờ'}
                                        </span>
                                    </div>
                                </div>
                                
                                {m.role !== 'Captain' && (
                                    <button onClick={() => handleRemoveMember(m._id)} className="td-remove-btn">
                                        Xóa
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default TeamDetail;