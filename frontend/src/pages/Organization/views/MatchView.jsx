import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from "../../../api/axiosConfig";

const MatchView = () => {
    const { id: tournamentId } = useParams();
    
    // State
    const [tournament, setTournament] = useState(null);
    const [stageRules, setStageRules] = useState([]);
    const [selectedStageRule, setSelectedStageRule] = useState("");
    const [sportType, setSportType] = useState("");
    const [method, setMethod] = useState("random");
    const [startTime, setStartTime] = useState("");
    const [courts, setCourts] = useState([]);
    const [draftMatches, setDraftMatches] = useState([]);
    const [qualifiedTeams, setQualifiedTeams] = useState(null);
    const [knockoutMatches, setKnockoutMatches] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!tournamentId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Lấy Tournament info
                const tournamentRes = await api.get(`/tournaments/${tournamentId}`)
                    .catch(() => ({ data: { data: null } }));
                const t = tournamentRes.data?.data || tournamentRes.data?.tournament || tournamentRes.data;
                if (t) {
                    setTournament(t);
                    setSportType(t.sportType?.[0] || t.sportsConfig?.[0]?.sport || '');
                }

                // 2. Lấy StageRules
                const stageRes = await api.get(`/stages/get-stages/${tournamentId}`)
                    .catch(() => ({ data: { data: [] } }));
                setStageRules(stageRes.data?.data || []);

                // 3. Lấy Courts
                const courtRes = await api.get(`/courts/tournaments/${tournamentId}/courts`)
                    .catch(() => ({ data: { data: [] } }));
                const names = (courtRes.data?.data || []).map(c => c.name).filter(Boolean);
                setCourts(names.length ? names : ["Sân 1", "Sân 2", "Sân 3"]);

            } catch (err) {
                console.error('Lỗi tải dữ liệu:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [tournamentId]);

    // Tự động clear alert
    useEffect(() => {
        if (error || success) {
            const t = setTimeout(() => { setError(""); setSuccess(""); }, 5000);
            return () => clearTimeout(t);
        }
    }, [error, success]);

    // ==================== KHỞI TẠO GIẢI ĐẤU ====================
const handleInitialize = async () => {
    if (!selectedStageRule || !startTime) {
        return setError("Vui lòng chọn cấu hình và giờ bắt đầu!");
    }

    setIsProcessing(true);
    setError("");
    setSuccess("");

    try {
        const res = await api.post(`/groups/initialize/${tournamentId}`, {
            stageRuleId: selectedStageRule,
            startTime: startTime,
            courts: courts,
            method: method
        });

        if (res.data.success) {
            setDraftMatches(res.data.data.matchList || []);
            setSuccess(`✅ ${res.data.message}`);
        }
    } catch (err) {
        setError("❌ " + (err.response?.data?.message || err.message));
    } finally {
        setIsProcessing(false);
    }
};

    // ==================== PUBLISH ====================
    const handlePublish = async () => {
        setIsProcessing(true);
        try {
            const res = await api.post('/matches/publish', { matches: draftMatches });
            if (res.data.success) {
                setSuccess("✅ Đã công khai lịch thi đấu!");
                setDraftMatches([]);
            }
        } catch (err) {
            setError("❌ " + (err.response?.data?.message || err.message));
        } finally {
            setIsProcessing(false);
        }
    };

    // ==================== DEMO: Xem đội đi tiếp ====================
    const handlePreviewQualified = () => {
        const rule = stageRules.find(r => r._id === selectedStageRule);
        if (!rule) return setError("Chưa chọn cấu hình");
        
        const q = {};
        if (rule.branches) {
            rule.branches.forEach((b, i) => {
                q[b.name || `Nhánh ${i+1}`] = [];
                for (let g = 1; g <= (b.numberOfGroups || 1); g++) {
                    (b.selectedRanks || [1,2]).forEach(rank => {
                        q[b.name || `Nhánh ${i+1}`].push({
                            teamName: `${b.name} - B${g} Hạng ${rank}`,
                            groupName: `${b.name} - Bảng ${g}`,
                            rank, isWildcard: false
                        });
                    });
                }
            });
        }
        setQualifiedTeams(q);
        setCurrentStep(2);
    };

    // ==================== DEMO: Tạo lịch knock-out ====================
    const handleKnockout = () => {
        const rule = stageRules.find(r => r._id === selectedStageRule);
        if (!rule) return;
        
        const matches = [];
        if (rule.substages) {
            rule.substages.forEach((ss, i) => {
                for (let j = 0; j < Math.floor((ss.totalTeamsIn || 8) / 2); j++) {
                    matches.push({
                        _id: `ko_${i}_${j}`,
                        round: ss.knockoutRound || ss.stageName,
                        team1: `Đội ${j*2+1}`, team2: `Đội ${j*2+2}`,
                        courtName: courts[j % courts.length] || 'Sân 1',
                        matchType: 'knockout'
                    });
                }
            });
        }
        setKnockoutMatches(matches);
        setSuccess("✅ Đã tạo lịch knock-out (demo)");
    };

    // ==================== HELPERS ====================
    const fmt = (d) => d ? new Date(d).toLocaleString('vi-VN', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' }) : '--:--';
    
    const stageInfo = (() => {
        const r = stageRules.find(s => s._id === selectedStageRule);
        if (!r) return null;
        return {
            name: r.stageName, type: r.type === 'GROUP_STAGE' ? 'Vòng bảng' : 'Knock-out',
            sport: r.sportType,
            groups: r.branches?.reduce((s,b) => s + (b.numberOfGroups||0), 0) || 0,
            branches: r.branches?.length || 0
        };
    })();

    // ==================== RENDER ====================
    if (isLoading) return <div style={{textAlign:'center',padding:40}}>⏳ Đang tải...</div>;

    return (
        <div style={{maxWidth:1100,margin:'0 auto',padding:24}}>
            {/* Header */}
            <div style={{background:'linear-gradient(135deg,#018ABE,#02457A)',color:'#fff',padding:24,borderRadius:16,marginBottom:24}}>
                <h2 style={{margin:0}}>🏆 Tự động xếp lịch</h2>
                {tournament && (
                    <div style={{marginTop:12,display:'flex',gap:24,flexWrap:'wrap',fontSize:14}}>
                        <span>📌 {tournament.name}</span>
                        <span>🎯 {sportType}</span>
                        <span>📅 {fmt(tournament.timeLine?.tournamentStart)}</span>
                    </div>
                )}
            </div>

            {/* Steps */}
            <div style={{display:'flex',gap:12,marginBottom:24}}>
                {[1,2].map(s => (
                    <div key={s} onClick={() => setCurrentStep(s)}
                        style={{flex:1,padding:16,borderRadius:12,textAlign:'center',cursor:'pointer',fontWeight:700,
                            background: currentStep===s ? '#018ABE' : currentStep>s ? '#14b8a6' : '#f1f5f9',
                            color: currentStep>=s ? '#fff' : '#64748b'}}>
                        {s===1?'📋 Vòng bảng':'🏅 Knock-out'}
                    </div>
                ))}
            </div>

            {/* Alerts */}
            {error && <div style={{padding:12,borderRadius:8,background:'#fef2f2',color:'#dc2626',marginBottom:16}}>❌ {error}</div>}
            {success && <div style={{padding:12,borderRadius:8,background:'#f0fdf4',color:'#16a34a',marginBottom:16}}>{success}</div>}

            {currentStep === 1 && (
                <>
                    {/* Form */}
                    <div style={{background:'#fff',borderRadius:16,padding:24,marginBottom:24,border:'1px solid #e2e8f0'}}>
                        <h3 style={{margin:'0 0 20px'}}>⚙️ Cấu hình</h3>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16}}>
                            <div>
                                <label style={{fontSize:12,fontWeight:700,color:'#64748b',display:'block',marginBottom:6}}>
                                    CẤU HÌNH VÒNG ĐẤU ({stageRules.length})
                                </label>
                                <select style={{width:'100%',padding:12,borderRadius:8,border:'2px solid #e2e8f0'}}
                                    value={selectedStageRule} onChange={e => setSelectedStageRule(e.target.value)}>
                                    <option value="">-- Chọn --</option>
                                    {stageRules.map(r => (
                                        <option key={r._id} value={r._id}>{r.stageName} - {r.sportType} ({r.type==='GROUP_STAGE'?'Vòng bảng':'Knock-out'})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{fontSize:12,fontWeight:700,color:'#64748b',display:'block',marginBottom:6}}>PHƯƠNG THỨC</label>
                                <select style={{width:'100%',padding:12,borderRadius:8,border:'2px solid #e2e8f0'}}
                                    value={method} onChange={e => setMethod(e.target.value)}>
                                    <option value="random">🎲 Ngẫu nhiên</option>
                                    <option value="skill">⭐ Kỹ năng</option>
                                    <option value="snake">🐍 Ziczac</option>
                                </select>
                            </div>
                            <div>
                                <label style={{fontSize:12,fontWeight:700,color:'#64748b',display:'block',marginBottom:6}}>GIỜ BẮT ĐẦU</label>
                                <input type="datetime-local" style={{width:'100%',padding:12,borderRadius:8,border:'2px solid #e2e8f0'}}
                                    value={startTime} onChange={e => setStartTime(e.target.value)} />
                            </div>
                            <div>
                                <label style={{fontSize:12,fontWeight:700,color:'#64748b',display:'block',marginBottom:6}}>SÂN ({courts.length})</label>
                                <input type="text" style={{width:'100%',padding:12,borderRadius:8,border:'2px solid #e2e8f0'}}
                                    value={courts.join(', ')} onChange={e => setCourts(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} />
                            </div>
                        </div>
                        {stageInfo && (
                            <div style={{marginTop:16,padding:12,background:'#f0f9ff',borderRadius:8,display:'flex',gap:16,flexWrap:'wrap',fontSize:13}}>
                                <span>📌 {stageInfo.name}</span><span>🏷️ {stageInfo.type}</span><span>📊 {stageInfo.groups} bảng</span><span>🔀 {stageInfo.branches} nhánh</span>
                            </div>
                        )}
                        <button onClick={handleInitialize} disabled={isProcessing || !selectedStageRule || !startTime}
                            style={{width:'100%',marginTop:20,padding:16,background:'linear-gradient(135deg,#018ABE,#02457A)',color:'#fff',border:'none',borderRadius:12,fontWeight:700,fontSize:16,cursor:'pointer'}}>
                            {isProcessing ? '⏳ Đang xử lý...' : '🚀 KHỞI TẠO GIẢI ĐẤU'}
                        </button>
                    </div>

                    {/* Draft Matches */}
                    {draftMatches.length > 0 && (
                        <div style={{background:'#fff',borderRadius:16,padding:24,border:'1px solid #e2e8f0'}}>
                            <h3>📅 Lịch dự kiến ({draftMatches.length} trận)</h3>
                            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
                                {draftMatches.map((m,i) => (
                                    <div key={i} style={{background:'linear-gradient(135deg,#02457A,#018ABE)',color:'#fff',padding:16,borderRadius:12}}>
                                        <div style={{fontSize:11,color:'#14b8a6',marginBottom:4}}>BẢNG {m.group || m.groupName || '-'}</div>
                                        <div style={{fontWeight:700}}>{m.team1Name||m.team1||'TBD'} VS {m.team2Name||m.team2||'TBD'}</div>
                                        <div style={{fontSize:12,opacity:.8,marginTop:4}}>🕐 {fmt(m.timestart||m.scheduledStartTime)} • 🏟️ {m.court||m.courtName}</div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handlePublish} style={{width:'100%',marginTop:20,padding:14,background:'#14b8a6',color:'#fff',border:'none',borderRadius:12,fontWeight:700,cursor:'pointer'}}>
                                ✅ CÔNG KHAI LỊCH
                            </button>
                        </div>
                    )}

                    {draftMatches.length > 0 && (
                        <div style={{textAlign:'center',marginTop:24}}>
                            <button onClick={handlePreviewQualified} style={{padding:'16px 32px',background:'#f59e0b',color:'#fff',border:'none',borderRadius:12,fontWeight:700,cursor:'pointer',fontSize:16}}>
                                ➡️ Xem đội đi tiếp & Knock-out
                            </button>
                        </div>
                    )}
                </>
            )}

            {currentStep === 2 && (
                <>
                    {qualifiedTeams && (
                        <div style={{background:'#fff',borderRadius:16,padding:24,border:'1px solid #e2e8f0',marginBottom:24}}>
                            <h3>🏅 Đội đi tiếp <span style={{fontSize:11,background:'#fef3c7',padding:'2px 8px',borderRadius:10}}>DEMO</span></h3>
                            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:16}}>
                                {Object.entries(qualifiedTeams).map(([name,teams]) => (
                                    <div key={name} style={{background:'#f8fafc',padding:16,borderRadius:12}}>
                                        <h4 style={{margin:'0 0 8px',color:'#018ABE'}}>📌 {name}</h4>
                                        {teams.map((t,i) => (
                                            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0'}}>
                                                <span>{t.teamName}</span>
                                                <span style={{fontSize:11,background:'#e0e7ff',padding:'2px 8px',borderRadius:10}}>Hạng {t.rank}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleKnockout} style={{width:'100%',marginTop:16,padding:14,background:'#14b8a6',color:'#fff',border:'none',borderRadius:12,fontWeight:700,cursor:'pointer'}}>
                                🏆 TẠO LỊCH KNOCK-OUT
                            </button>
                        </div>
                    )}

                    {knockoutMatches.length > 0 && (
                        <div style={{background:'#fff',borderRadius:16,padding:24,border:'1px solid #e2e8f0'}}>
                            <h3>⚔️ Lịch Knock-out ({knockoutMatches.length} trận) <span style={{fontSize:11,background:'#fef3c7',padding:'2px 8px',borderRadius:10}}>DEMO</span></h3>
                            {[...new Set(knockoutMatches.map(m=>m.round))].map(round => (
                                <div key={round} style={{marginBottom:16}}>
                                    <h4 style={{color:'#018ABE',margin:'0 0 8px'}}>{round}</h4>
                                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:12}}>
                                        {knockoutMatches.filter(m=>m.round===round).map((m,i) => (
                                            <div key={i} style={{background:'linear-gradient(135deg,#02457A,#018ABE)',color:'#fff',padding:16,borderRadius:12}}>
                                                <div style={{fontSize:11,color:'#14b8a6',marginBottom:4}}>{m.round}</div>
                                                <div style={{fontWeight:700}}>{m.team1} VS {m.team2}</div>
                                                <div style={{fontSize:12,opacity:.8,marginTop:4}}>🏟️ {m.courtName}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{textAlign:'center',marginTop:24}}>
                        <button onClick={() => setCurrentStep(1)} style={{padding:12,background:'#fff',border:'2px solid #018ABE',color:'#018ABE',borderRadius:12,fontWeight:700,cursor:'pointer'}}>
                            ⬅️ Quay lại
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default MatchView;