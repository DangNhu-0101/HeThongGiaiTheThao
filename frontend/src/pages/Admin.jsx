import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

// 1. THÊM HÀM SẮP XẾP ĐỂ TÌM ĐỘI NHẤT/NHÌ BẢNG
const sortTeams = (teams) => {
    return [...teams].sort((a, b) => {
        const ptsA = a.start?.points || 0; const ptsB = b.start?.points || 0;
        const diffA = a.start?.scoreDiff || 0; const diffB = b.start?.scoreDiff || 0;
        if (ptsB !== ptsA) return ptsB - ptsA;
        if (diffB !== diffA) return diffB - diffA;
        return 0;
    });
};

const Admin = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [startTime, setStartTime] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // --- STATE DỮ LIỆU ---
    const [teams, setTeams] = useState([]);
    const [referees, setReferees] = useState([]);
    const [publishedMatches, setPublishedMatches] = useState([]);
    const [courts, setCourts] = useState([]);

    const [filterStage, setFilterStage] = useState('group'); // 'group' hoặc 'knockout'
    const tournamentId = "662000000000000000000001";

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [teamRes, userRes, matchRes, courtRes] = await Promise.all([
                api.get(`/api/teams/tournament/${tournamentId}`),
                api.get('/api/users/all'),
                api.get('/api/matches/all'),
                api.get(`/api/courts/tournament/${tournamentId}`)
            ]);

            setTeams(teamRes.data.data || []);
            const allUsers = userRes.data.data || [];
            setReferees(allUsers.filter(u => u.role === 'Referee'));
            setPublishedMatches(matchRes.data.data || []);
            setCourts(courtRes.data.data || []);
        } catch (error) { console.error("Lỗi load dữ liệu:", error); } 
        finally { setLoading(false); }
    };

    const handleAddCourt = async () => {
        const newCourtName = `Sân ${courts.length + 1}`;
        try {
            const res = await api.post('/api/courts/add', { name: newCourtName, tournamentId });
            setCourts([...courts, res.data.data]);
        } catch (error) { alert("Lỗi khi thêm sân!"); }
    };

    const toggleCourtStatus = async (courtId, currentStatus) => {
        const newStatus = currentStatus === 'empty' ? 'busy' : 'empty';
        try {
            const res = await api.patch(`/api/courts/${courtId}/status`, { status: newStatus });
            setCourts(courts.map(c => c._id === courtId ? res.data.data : c));
        } catch (error) { alert("Lỗi cập nhật sân!"); }
    };

    const handleAutoDrawGroup = async () => {
        if (!startTime) return alert("Vui lòng chọn giờ bắt đầu!");
        const availableCourts = courts.filter(c => c.status === 'empty').map(c => c.name);
        if (availableCourts.length === 0) return alert("Không có sân nào rảnh!");

        try {
            const res = await api.post(`/api/matches/auto-draw/${tournamentId}`, { startTime, courts: availableCourts });
            navigate('/admin/schedule-drafts', { state: { draftMatches: res.data.data } });
        } catch (e) { alert("Lỗi bốc thăm: " + (e.response?.data?.message || e.message)); }
    };

    const handleGenerateKnockout = async () => {
        if (!startTime) return alert("Vui lòng chọn GIỜ BẮT ĐẦU cho lịch Knockout!");
        const availableCourts = courts.filter(c => c.status === 'empty').map(c => c.name);
        if (availableCourts.length === 0) return alert("Không có sân nào rảnh!");

        try {
            const res = await api.post(`/api/matches/generate-knockout/${tournamentId}`, { startTime, courts: availableCourts });
            navigate('/admin/schedule-drafts', { state: { draftMatches: res.data.data } });
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi tạo vòng Knockout.");
        }
    };

    const handleSelectReferee = (matchId, refId) => {
        const selectedRef = referees.find(r => r._id === refId);
        setPublishedMatches(publishedMatches.map(m => 
            m._id === matchId ? { ...m, refereeId: refId, refereeName: selectedRef?.displayName } : m
        ));
    };

    const handleAutoAssignReferees = async () => {
        try {
            setIsSaving(true);
            const res = await api.post('/api/matches/auto-assign-referees');
            alert(res.data.message);
            fetchInitialData(); 
        } catch (error) { alert(error.response?.data?.message || "Lỗi phân công!"); } 
        finally { setIsSaving(false); }
    };

    const handleSaveAssignment = async () => {
        try {
            setIsSaving(true);
            await api.post('/api/matches/save-referees', { matches: publishedMatches });
            alert("✅ Đã lưu phân công lên hệ thống!");
        } catch (e) { alert("Lỗi lưu dữ liệu"); } 
        finally { setIsSaving(false); }
    };


    // ==========================================
    // 2. LOGIC TÌM TÊN ĐỘI THẬT (GIẢI MÃ PLACEHOLDER)
    // ==========================================
    
    // Tìm trước các đội Nhất/Nhì bảng
    const groups = [...new Set(teams.map(t => t.group).filter(Boolean))];
    const groupWinners = {}; const groupRunnersUp = {};
    
    groups.forEach(g => {
        const mGroup = publishedMatches.filter(m => m.group === g && m.stage !== 'knockout');
        const tGroup = teams.filter(t => t.group === g);
        const isFinished = mGroup.length > 0 && mGroup.every(m => m.matchStatus === 'finished');
        if (isFinished) {
            const sorted = sortTeams(tGroup);
            groupWinners[g] = sorted[0]?.teamName;
            groupRunnersUp[g] = sorted[1]?.teamName;
        }
    });

    // Hàm Đệ Quy: Dịch chữ "Thắng Tứ Kết 1" -> Tên Đội thật
    const getRealTeamName = (placeholder) => {
        if (!placeholder) return "Đang chờ";
        
        // 2.1: Giải mã vòng Bảng
        if (placeholder.includes("Nhất Bảng")) {
            const g = placeholder.replace("Nhất Bảng ", "").trim();
            return groupWinners[g] || placeholder;
        }
        if (placeholder.includes("Nhì Bảng")) {
            const g = placeholder.replace("Nhì Bảng ", "").trim();
            return groupRunnersUp[g] || placeholder;
        }

        // 2.2: Giải mã vòng Knockout (Đệ quy tìm đội thắng trận trước)
        if (placeholder.includes("Thắng")) {
            const prevMatchName = placeholder.replace("Thắng ", "").trim();
            const prevMatch = publishedMatches.find(m => m.matchName?.toLowerCase() === prevMatchName.toLowerCase());
            
            if (prevMatch && prevMatch.matchStatus === 'finished') {
                const s1 = prevMatch.result?.team1Score || 0;
                const s2 = prevMatch.result?.team2Score || 0;
                
                // Lấy tên thật của 2 đội trong trận trước
                const realT1 = getRealTeamName(prevMatch.team1Name);
                const realT2 = getRealTeamName(prevMatch.team2Name);
                
                return s1 > s2 ? realT1 : realT2;
            }
        }
        return placeholder;
    };
    // ==========================================


    const displayedMatches = publishedMatches.filter(m => filterStage === 'group' ? m.stage !== 'knockout' : m.stage === 'knockout');

    if (loading) return <div className="page-wrapper flex-center"><h2 className="text-muted">🔄 Đang đồng bộ...</h2></div>;

    return (
        <div className="page-wrapper">
            <div className="page-container" style={{ maxWidth: '1400px', paddingTop: '0' }}>
                <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                    <h1 className="text-forest" style={{ fontSize: '2.5rem', margin: 0 }}>⚙️ TRUNG TÂM ĐIỀU HÀNH</h1>
                    <p className="text-teal fw-bold">Quản lý Sân bãi - Trọng tài - Lịch thi đấu</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 320px', gap: '25px', alignItems: 'start' }}>
                    
                    {/* --- CỘT 1: TÀI NGUYÊN --- */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        <div className="card">
                            <div className="flex-between" style={{ borderBottom: '2px solid var(--neutral-cream)', paddingBottom: '10px', marginBottom: '15px' }}>
                                <h3 className="text-teal" style={{ margin: 0 }}>🏟️ QUẢN LÝ SÂN</h3>
                                <button onClick={handleAddCourt} style={{ background: 'var(--primary-lime)', border: 'none', borderRadius: '5px', width: '30px', height: '30px', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {courts.map(c => (
                                    <div key={c._id} onClick={() => toggleCourtStatus(c._id, c.status)}
                                        style={{ padding: '10px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: `2px solid ${c.status === 'empty' ? 'var(--teal-accent)' : 'var(--brick-red)'}`, background: c.status === 'empty' ? '#e6f4ea' : '#fce8e8' }}>
                                        <div className="fw-bold" style={{ color: c.status === 'empty' ? 'var(--teal-accent)' : 'var(--brick-red)' }}>{c.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{c.status === 'empty' ? 'RẢNH' : 'ĐANG BẬN'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="text-teal" style={{ margin: 0, borderBottom: '2px solid var(--neutral-cream)', paddingBottom: '10px', marginBottom: '15px' }}>⚖️ TRỌNG TÀI</h3>
                            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                {referees.map(r => {
                                    const count = publishedMatches.filter(m => m.refereeId === r._id || (m.refereeId && m.refereeId._id === r._id)).length;
                                    return (
                                        <div key={r._id} className="flex-between list-item">
                                            <span className="fw-bold text-forest">{r.displayName}</span>
                                            <span style={{ background: 'var(--neutral-cream)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{count} trận</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* --- CỘT 2: CHI TIẾT PHÂN CÔNG --- */}
                    <div className="card">
                        <div className="flex-between" style={{ borderBottom: '2px solid var(--neutral-cream)', paddingBottom: '10px', marginBottom: '20px' }}>
                            <h3 className="text-forest" style={{ margin: 0, fontSize: '1.5rem' }}>📋 BẢNG PHÂN CÔNG</h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={handleAutoAssignReferees} disabled={isSaving} style={{ padding: '8px 15px', background: 'var(--teal-accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>⚡ TỰ ĐỘNG</button>
                                <button onClick={handleSaveAssignment} disabled={isSaving} style={{ padding: '8px 15px', background: 'var(--primary-lime)', color: 'var(--dark-forest)', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>💾 LƯU LẠI</button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <button onClick={() => setFilterStage('group')} className={`tab-btn ${filterStage === 'group' ? 'active' : ''}`} style={{ flex: 1, padding: '10px' }}>VÒNG BẢNG</button>
                            <button onClick={() => setFilterStage('knockout')} className={`tab-btn ${filterStage === 'knockout' ? 'active' : ''}`} style={{ flex: 1, padding: '10px' }}>VÒNG KNOCKOUT</button>
                        </div>
                        
                        <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                            {displayedMatches.length > 0 ? displayedMatches.map((m) => {
                                const currentRefId = typeof m.refereeId === 'object' && m.refereeId !== null ? m.refereeId._id : m.refereeId;
                                const isKnockout = m.stage === 'knockout';
                                
                                // 3. GỌI HÀM GET REAL NAME ĐỂ HIỂN THỊ TÊN THẬT
                                const realTeam1 = getRealTeamName(m.team1Name);
                                const realTeam2 = getRealTeamName(m.team2Name);

                                // Kiểm tra xem tên có phải là Placeholder không để in nghiêng mờ
                                const isPlaceholder1 = realTeam1.includes("Nhất") || realTeam1.includes("Nhì") || realTeam1.includes("Thắng");
                                const isPlaceholder2 = realTeam2.includes("Nhất") || realTeam2.includes("Nhì") || realTeam2.includes("Thắng");

                                return (
                                    <div key={m._id} style={{ border: `1px solid ${isKnockout ? 'var(--brick-red)' : '#ccc'}`, padding: '15px', borderRadius: '12px', marginBottom: '15px', background: isKnockout ? '#fffafa' : '#fff' }}>
                                        <div className="flex-between" style={{ marginBottom: '10px' }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isKnockout ? 'var(--brick-red)' : 'var(--teal-accent)', textTransform: 'uppercase' }}>
                                                {m.matchName || `Bảng ${m.group}`}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>🕒 {m.timestart ? new Date(m.timestart).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'}) : 'Chưa xếp'} | 📍 {m.court}</div>
                                        </div>
                                        <div className="flex-between">
                                            
                                            {/* HIỂN THỊ TÊN ĐỘI SAU KHI ĐÃ ĐƯỢC GIẢI MÃ */}
                                            <div className="fw-black text-forest" style={{ fontSize: '1.1rem' }}>
                                                <span style={{ fontStyle: isPlaceholder1 ? 'italic' : 'normal', color: isPlaceholder1 ? '#aaa' : 'var(--dark-forest)' }}>{realTeam1}</span> 
                                                <span style={{color:'#ccc', fontWeight:'normal', margin: '0 8px'}}>vs</span> 
                                                <span style={{ fontStyle: isPlaceholder2 ? 'italic' : 'normal', color: isPlaceholder2 ? '#aaa' : 'var(--dark-forest)' }}>{realTeam2}</span>
                                            </div>

                                            <select value={currentRefId || ""} onChange={(e) => handleSelectReferee(m._id, e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }}>
                                                <option value="">-- Chọn Trọng tài --</option>
                                                {referees.map(r => <option key={r._id} value={r._id}>{r.displayName}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )
                            }) : <div className="text-center text-muted" style={{ padding: '40px', border: '2px dashed #ccc', borderRadius: '12px' }}>Chưa có lịch thi đấu.</div>}
                        </div>
                    </div>

                    {/* --- CỘT 3: TẠO LỊCH (ACTION) --- */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <div className="card" style={{ background: 'var(--dark-forest)', color: 'var(--neutral-cream)' }}>
                            <h3 className="text-primary" style={{ margin: 0, marginBottom: '15px' }}>⚙️ TẠO LỊCH ĐẤU </h3>
                            <label style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '5px', display: 'block' }}>Chọn giờ bắt đầu trước khi bốc thăm:</label>
                            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', marginBottom: '15px', boxSizing: 'border-box' }} />
                            
                            <button onClick={handleAutoDrawGroup} className="auth-button" style={{ margin: 0, fontSize: '1rem', padding: '12px', marginBottom: '10px' }}>BỐC THĂM VÒNG BẢNG</button>
                            <button onClick={handleGenerateKnockout} className="auth-button" style={{ margin: 0, fontSize: '1rem', padding: '12px', background: 'var(--brick-red)', color: '#fff' }}>BỐC THĂM KNOCKOUT</button>
                        </div>

                        <button onClick={() => navigate('/admin/schedule-drafts')} className="auth-button" style={{ background: '#fff', color: 'var(--teal-accent)', border: '2px solid var(--teal-accent)' }}>
                            ✏️ SỬA LỊCH ĐẤU
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;