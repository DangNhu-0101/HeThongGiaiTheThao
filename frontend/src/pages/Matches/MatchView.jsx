import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from "../../api/axiosConfig";
import MatchCard from './components/MatchCard';
import MatchEditModal from './components/MatchEditModal';
import GroupsDisplay from './components/GroupsDisplay';
import QualifiedTeams from './components/QualifiedTeams';
import KnockoutBracket from './components/KnockoutBracket';

const MatchView = () => {
    const { id: tournamentId } = useParams();
    const [tournament, setTournament] = useState(null);
    const [stageRules, setStageRules] = useState([]);
    const [selectedStageRule, setSelectedStageRule] = useState("");
    const [sportType, setSportType] = useState("");
    const [method, setMethod] = useState("random");
    const [startTime, setStartTime] = useState("");
    const [courts, setCourts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [draftMatches, setDraftMatches] = useState([]);
    const [knockoutMatches, setKnockoutMatches] = useState([]);
    const [qualifiedTeams, setQualifiedTeams] = useState(null);
    const [step1Done, setStep1Done] = useState(() => localStorage.getItem(`step1_${tournamentId}`) === 'true');
    const [step2Done, setStep2Done] = useState(() => localStorage.getItem(`step2_${tournamentId}`) === 'true');
    const [step3Done, setStep3Done] = useState(() => localStorage.getItem(`step3_${tournamentId}`) === 'true');
    const [currentStep, setCurrentStep] = useState(() => parseInt(localStorage.getItem(`step_${tournamentId}`)) || 1);
    const [editingMatch, setEditingMatch] = useState(null);
    const [editForm, setEditForm] = useState({ scheduledStartTime: '', courtName: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Lưu state
    useEffect(() => { localStorage.setItem(`step1_${tournamentId}`, step1Done); }, [step1Done]);
    useEffect(() => { localStorage.setItem(`step2_${tournamentId}`, step2Done); }, [step2Done]);
    useEffect(() => { localStorage.setItem(`step3_${tournamentId}`, step3Done); }, [step3Done]);
    useEffect(() => { localStorage.setItem(`step_${tournamentId}`, currentStep); }, [currentStep]);
    useEffect(() => { if (error || success) { const t = setTimeout(() => { setError(""); setSuccess(""); }, 5000); return () => clearTimeout(t); } }, [error, success]);

    useEffect(() => { if (!tournamentId) return; fetchData(); }, [tournamentId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const tRes = await api.get(`/tournaments/${tournamentId}`).catch(() => ({ data: {} }));
            const t = tRes.data?.data || tRes.data?.tournament || tRes.data;
            const sport = t?.sportType?.[0] || t?.sportsConfig?.[0]?.sport || '';
            if (t) { setTournament(t); setSportType(sport); }

            const [sRes, cRes, mRes, gRes] = await Promise.all([
                api.get(`/stages/get-stages/${tournamentId}`).catch(() => ({ data: { data: [] } })),
                api.get(`/courts/tournaments/${tournamentId}/courts`).catch(() => ({ data: { data: [] } })),
                api.get(`/matches?tournamentId=${tournamentId}`).catch(() => ({ data: { data: [] } })),
                api.get(`/groups?tournamentId=${tournamentId}&sport=${sport}`).catch(() => ({ data: { data: [] } }))
            ]);
            setStageRules(sRes.data?.data || []);
            setCourts((cRes.data?.data || []).map(c => c.name).filter(Boolean) || ["Sân 1", "Sân 2"]);
            
            const gData = Array.isArray(gRes.data?.data) ? gRes.data.data : Array.isArray(gRes.data) ? gRes.data : [];
            const mData = Array.isArray(mRes.data?.data) ? mRes.data.data : Array.isArray(mRes.data) ? mRes.data : [];
            if (gData.length > 0) { setGroups(gData); setStep1Done(true); }
            const groupM = mData.filter(m => m.matchType === 'group');
            const koM = mData.filter(m => m.matchType === 'knockout');
            if (groupM.length > 0) { setDraftMatches(groupM); setStep2Done(true); }
            if (koM.length > 0) { setKnockoutMatches(koM); setStep3Done(true); }
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    };

    const handleInitialize = async () => {
        if (!selectedStageRule || !startTime) return setError("Vui lòng chọn đầy đủ!");
        setIsProcessing(true);
        try {
            const res = await api.post(`/groups/initialize/${tournamentId}`, { stageRuleId: selectedStageRule, startTime, courts, method });
            if (res.data.success) { setGroups(res.data.data?.groups || []); setDraftMatches(res.data.data?.matchList || []); setStep1Done(true); setCurrentStep(2); setSuccess("✅ OK!"); }
        } catch (err) { setError("❌ " + (err.response?.data?.message || err.message)); }
        finally { setIsProcessing(false); }
    };

    const openEdit = (match) => { setEditingMatch(match); setEditForm({ scheduledStartTime: match.scheduledStartTime?.slice(0,16) || '', courtName: match.courtName || '' }); };
    const saveEdit = async () => {
        if (!editingMatch) return;
        setIsProcessing(true);
        try {
            await api.put(`/matches/${editingMatch._id}`, { scheduledStartTime: editForm.scheduledStartTime, courtName: editForm.courtName });
            setDraftMatches(prev => prev.map(m => m._id === editingMatch._id ? { ...m, ...editForm } : m));
            setEditingMatch(null); setSuccess("✅ Đã cập nhật!");
        } catch (err) { setError("❌ " + (err.response?.data?.message || err.message)); }
        finally { setIsProcessing(false); }
    };

    const handlePublish = async () => {
        setIsProcessing(true);
        try { await api.post('/matches/publish', { matches: draftMatches }); setStep2Done(true); setCurrentStep(3); setSuccess("✅ OK!"); }
        catch (err) { setError("❌ " + (err.response?.data?.message || err.message)); }
        finally { setIsProcessing(false); }
    };

    const handlePreviewQualified = async () => {
        setIsProcessing(true);
        try {
            const gRes = await api.get(`/groups?tournamentId=${tournamentId}&sport=${sportType}`);
            const groupsData = gRes.data?.data || [];
            const rule = stageRules.find(r => r._id === selectedStageRule);
            if (rule?.branches && groupsData.length) {
                const q = {};
                rule.branches.forEach((b, i) => {
                    q[b.name || `Nhánh ${i+1}`] = [];
                    groupsData.filter(g => g.name?.startsWith(b.name)).forEach(g => {
                        const sorted = (g.standings||[]).sort((a,b)=>(b.points||0)-(a.points||0)||(b.goalDifference||0)-(a.goalDifference||0));
                        (b.selectedRanks||[1,2]).forEach(r => { const t = sorted[r-1]; if (t) q[b.name||`Nhánh ${i+1}`].push({ teamId: t.teamId, teamName: `Đội ${t.teamId}`, groupName: g.name, rank: r }); });
                    });
                });
                setQualifiedTeams(q);
            }
            setSuccess("✅ OK!");
        } catch (err) { setError("❌ " + (err.response?.data?.message || err.message)); }
        finally { setIsProcessing(false); }
    };

    const handleCreateKnockout = () => {
        const rule = stageRules.find(r => r._id === selectedStageRule);
        const matches = [];
        if (rule?.substages) {
            let n = 1;
            rule.substages.forEach(ss => {
                for (let j = 0; j < Math.floor((ss.totalTeamsIn||8)/2); j++)
                    matches.push({ _id: `ko_${n}`, round: ss.knockoutRound||ss.stageName, team1: `Đội ${j*2+1}`, team2: `Đội ${j*2+2}`, courtName: courts[j%courts.length]||'Sân 1', matchType:'knockout', matchNumber:n++, status:'SCHEDULED' });
            });
        }
        setKnockoutMatches(matches); setStep3Done(true); setSuccess(`✅ ${matches.length} trận!`);
    };

    if (isLoading) return <div style={{textAlign:'center',padding:40}}>⏳ Đang tải...</div>;

    const steps = [
        { step: 1, label: 'Phân bảng & Xếp lịch', done: step1Done },
        { step: 2, label: 'Công khai vòng bảng', done: step2Done },
        { step: 3, label: 'Knock-out', done: step3Done }
    ];

    return (
        <div style={{maxWidth:1200,margin:'0 auto',padding:24}}>
            <div style={{background:'linear-gradient(135deg,#018ABE,#02457A)',color:'#fff',padding:24,borderRadius:16,marginBottom:24}}>
                <h2 style={{margin:0}}>🏆 Tự động hóa giải đấu</h2>
                {tournament && <div style={{marginTop:12,display:'flex',gap:24,fontSize:14}}><span>📌 {tournament.name}</span><span>🎯 {sportType}</span></div>}
            </div>

            <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
                {steps.map(s => (
                    <div key={s.step} onClick={() => setCurrentStep(s.step)}
                        style={{flex:1,minWidth:120,padding:12,borderRadius:10,textAlign:'center',cursor:'pointer',fontWeight:700,fontSize:13,
                            background: currentStep===s.step?'#018ABE':s.done?'#14b8a6':'#f1f5f9',
                            color: currentStep===s.step||s.done?'#fff':'#94a3b8'}}>
                        {s.done?'✅ ':''}{s.label}
                    </div>
                ))}
            </div>

            {error && <div style={{padding:12,borderRadius:8,background:'#fef2f2',color:'#dc2626',marginBottom:16}}>❌ {error}</div>}
            {success && <div style={{padding:12,borderRadius:8,background:'#f0fdf4',color:'#16a34a',marginBottom:16}}>{success}</div>}

            <div style={{background:'#fff',borderRadius:16,padding:24,marginBottom:24,border:'1px solid #e2e8f0'}}>
                <h3 style={{margin:'0 0 16px'}}>⚙️ Cấu hình</h3>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
                    <div><label style={{fontSize:11,fontWeight:700,color:'#64748b'}}>CẤU HÌNH</label><select style={{width:'100%',padding:10,borderRadius:8,border:'2px solid #e2e8f0'}} value={selectedStageRule} onChange={e=>setSelectedStageRule(e.target.value)} disabled={step1Done}><option value="">-- Chọn --</option>{stageRules.map(r=><option key={r._id} value={r._id}>{r.stageName}-{r.sportType}</option>)}</select></div>
                    <div><label style={{fontSize:11,fontWeight:700,color:'#64748b'}}>PHƯƠNG THỨC</label><select style={{width:'100%',padding:10,borderRadius:8,border:'2px solid #e2e8f0'}} value={method} onChange={e=>setMethod(e.target.value)} disabled={step1Done}><option value="random">🎲 Ngẫu nhiên</option><option value="skill">⭐ Kỹ năng</option><option value="snake">🐍 Snake</option></select></div>
                    <div><label style={{fontSize:11,fontWeight:700,color:'#64748b'}}>GIỜ BẮT ĐẦU</label><input type="datetime-local" style={{width:'100%',padding:10,borderRadius:8,border:'2px solid #e2e8f0'}} value={startTime} onChange={e=>setStartTime(e.target.value)} disabled={step1Done}/></div>
                    <div><label style={{fontSize:11,fontWeight:700,color:'#64748b'}}>SÂN</label><input type="text" style={{width:'100%',padding:10,borderRadius:8,border:'2px solid #e2e8f0'}} value={courts.join(', ')} onChange={e=>setCourts(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} disabled={step1Done}/></div>
                </div>
            </div>

            {currentStep === 1 && (
                <div style={{background:'#fff',borderRadius:16,padding:24,border:'1px solid #e2e8f0',marginBottom:24}}>
                    <h3>📋 Bước 1: Phân bảng & Xếp lịch</h3>
                    {!step1Done ? (
                        <button onClick={handleInitialize} disabled={isProcessing||!selectedStageRule||!startTime}
                            style={{width:'100%',padding:16,marginTop:12,background:'linear-gradient(135deg,#018ABE,#02457A)',color:'#fff',border:'none',borderRadius:12,fontWeight:700,fontSize:16,cursor:'pointer'}}>
                            {isProcessing?'⏳ Đang xử lý...':'🚀 KHỞI TẠO GIẢI ĐẤU'}
                        </button>
                    ) : <div style={{padding:16,background:'#f0fdf4',borderRadius:8,marginTop:12,color:'#16a34a',fontWeight:700}}>✅ Đã khởi tạo!</div>}
                    <GroupsDisplay groups={groups} />
                    {draftMatches.length > 0 && (
                        <div style={{marginTop:20}}>
                            <h4>📅 Lịch vòng bảng ({draftMatches.length} trận)</h4>
                            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
                                {draftMatches.map(m => <MatchCard key={m._id||m.matchNumber} match={m} onEdit={openEdit} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {currentStep === 2 && (
                <div style={{background:'#fff',borderRadius:16,padding:24,border:'1px solid #e2e8f0',marginBottom:24}}>
                    <h3>📢 Bước 2: Công khai</h3>
                    {!step2Done ? (
                        <button onClick={handlePublish} disabled={isProcessing||draftMatches.length===0}
                            style={{width:'100%',padding:16,marginTop:12,background:'#14b8a6',color:'#fff',border:'none',borderRadius:12,fontWeight:700,fontSize:16,cursor:'pointer'}}>📢 CÔNG KHAI</button>
                    ) : <div style={{padding:16,background:'#f0fdf4',borderRadius:8,marginTop:12,color:'#16a34a',fontWeight:700}}>✅ Đã công khai!</div>}
                </div>
            )}

            {currentStep === 3 && (
                <div style={{background:'#fff',borderRadius:16,padding:24,border:'1px solid #e2e8f0'}}>
                    <h3>🏆 Bước 3: Knock-out</h3>
                    <div style={{display:'flex',gap:12,marginTop:12,flexWrap:'wrap'}}>
                        <button onClick={handlePreviewQualified} disabled={isProcessing} style={{flex:1,minWidth:150,padding:14,background:'#f59e0b',color:'#fff',border:'none',borderRadius:12,fontWeight:700,cursor:'pointer'}}>🔍 XEM ĐỘI ĐI TIẾP</button>
                        <button onClick={handleCreateKnockout} disabled={!step2Done} style={{flex:1,minWidth:150,padding:14,background:'#8b5cf6',color:'#fff',border:'none',borderRadius:12,fontWeight:700,cursor:'pointer'}}>🏆 TẠO LỊCH KNOCK-OUT</button>
                    </div>
                    <QualifiedTeams qualifiedTeams={qualifiedTeams} />
                    <KnockoutBracket matches={knockoutMatches} onEdit={openEdit} />
                    {step3Done && <div style={{padding:16,background:'#f0fdf4',borderRadius:8,marginTop:12,color:'#16a34a',fontWeight:700}}>✅ Hoàn tất!</div>}
                </div>
            )}

            <MatchEditModal match={editingMatch} editForm={editForm} setEditForm={setEditForm} onSave={saveEdit} onCancel={() => setEditingMatch(null)} isProcessing={isProcessing} />
        </div>
    );
};

export default MatchView;