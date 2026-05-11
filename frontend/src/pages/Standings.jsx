import React, { useState, useEffect } from "react";
import api from "../api/axiosConfig";

// Hàm hỗ trợ sắp xếp đội bóng theo luật: Điểm -> Hiệu số -> Skill
const sortTeams = (teams) => {
    return [...teams].sort((a, b) => {
        const ptsA = a.start?.points || 0;
        const ptsB = b.start?.points || 0;
        const diffA = a.start?.scoreDiff || 0;
        const diffB = b.start?.scoreDiff || 0;

        if (ptsB !== ptsA) return ptsB - ptsA;
        if (diffB !== diffA) return diffB - diffA;

        const skillA = a.members?.reduce((sum, p) => sum + (p.skill || 0), 0) || 0;
        const skillB = b.members?.reduce((sum, p) => sum + (p.skill || 0), 0) || 0;
        return skillB - skillA;
    });
};

const Standings = () => {
    const [standingsData, setStandingsData] = useState({});
    const [matchesData, setMatchesData] = useState({});
    const [expandedGroups, setExpandedGroups] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const tournamentId = "662000000000000000000001"; 

    const toggleGroup = (groupName) => {
        setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [teamRes, matchRes] = await Promise.all([
                    api.get(`/teams/tournament/${tournamentId}`),
                    api.get("/matches/all"), 
                ]);

                const rawTeams = teamRes.data.data || [];
                const publishedMatches = matchRes.data.data || [];

                const groupedMatches = {};
                
                publishedMatches.forEach((match) => {
                    if (match.group && match.stage !== 'knockout') {
                        const matchInfo = {
                            id: match._id,
                            team1: match.team1?.teamName || match.team1?.teamname || "Đang chờ",
                            team2: match.team2?.teamName || match.team2?.teamname || "Đang chờ",
                            court: match.court || "Chưa xếp sân",
                            time: new Date(match.timestart).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }),
                            status: match.matchStatus,
                            result: { t1: match.result?.team1Score || 0, t2: match.result?.team2Score || 0 }
                        };
                        if (!groupedMatches[match.group]) groupedMatches[match.group] = [];
                        groupedMatches[match.group].push(matchInfo);
                    }
                });

                const groupedTeams = {};
                const publishedGroupNames = Object.keys(groupedMatches);

                rawTeams.forEach((team) => {
                    if (team.group && publishedGroupNames.includes(team.group)) {
                        if (!groupedTeams[team.group]) groupedTeams[team.group] = [];
                        groupedTeams[team.group].push(team);
                    }
                });

                Object.keys(groupedTeams).forEach((g) => {
                    groupedTeams[g] = sortTeams(groupedTeams[g]);
                });

                const initialExpanded = {};
                publishedGroupNames.forEach((g) => (initialExpanded[g] = false));

                setStandingsData(groupedTeams);
                setMatchesData(groupedMatches);
                setExpandedGroups(initialExpanded);
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [tournamentId]);

    if (isLoading) return <h2 style={{textAlign: 'center', marginTop: '50px', color: '#64748b'}}>Đang cập nhật Bảng xếp hạng... ⏳</h2>;

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px", fontFamily: '"Inter", sans-serif' }}>
            <h1 style={{ textAlign: "center", marginBottom: "40px", fontSize: '2.2rem', color: '#0f172a' }}>🏆 BẢNG VÀNG THÀNH TÍCH</h1>

            {Object.keys(standingsData).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px', background: '#f8fafc', borderRadius: '15px', border: '2px dashed #cbd5e1' }}>
                    <h2 style={{ color: '#64748b' }}>HỆ THỐNG ĐANG CHUẨN BỊ...</h2>
                    <p style={{ color: '#94a3b8' }}>Lịch thi đấu và bảng xếp hạng vòng bảng sẽ hiển thị sau khi Ban tổ chức phê duyệt.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "30px" }}>
                    {Object.keys(standingsData).sort().map((groupName) => (
                        <div key={groupName} style={{ borderTop: "5px solid #84cc16", background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                            <div onClick={() => toggleGroup(groupName)} style={{ padding: "15px 20px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb", display: 'flex', justifyContent: 'space-between', cursor: "pointer" }}>
                                <h2 style={{ margin: 0, color: '#166534', fontSize: '1.2rem' }}>BẢNG {groupName}</h2>
                                <span style={{color: '#16a34a', fontWeight: 'bold'}}>{expandedGroups[groupName] ? '▲ Ẩn Lịch' : '▼ Xem Lịch'}</span>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                                <thead style={{ background: '#f1f5f9', fontWeight: 'bold', color: '#475569' }}>
                                    <tr>
                                        <th style={{ padding: '12px 10px' }}>#</th>
                                        <th style={{ textAlign: 'left' }}>TÊN ĐỘI</th>
                                        <th>Trận</th><th>T</th><th>B</th><th>HS</th><th>Điểm</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standingsData[groupName].map((item, idx) => (
                                        <tr key={item._id} style={{ borderBottom: '1px solid #eee', background: idx === 0 ? '#f0fdf4' : '#fff' }}>
                                            <td style={{ padding: '12px 10px', fontWeight: 'bold', color: idx === 0 ? '#16a34a' : '#64748b' }}>{idx + 1}</td>
                                            <td style={{ textAlign: 'left', fontWeight: 'bold', color: '#0f172a' }}>
                                                {item.teamName || item.teamname} {idx === 0 && <span style={{fontSize: '0.7rem', background: '#dcfce7', color: '#16a34a', padding: '2px 6px', borderRadius: '10px', marginLeft: '5px'}}>TOP</span>}
                                            </td>
                                            <td>{item.start?.matches || 0}</td>
                                            <td style={{color: '#16a34a'}}>{item.start?.won || 0}</td>
                                            <td style={{color: '#ef4444'}}>{item.start?.lost || 0}</td>
                                            <td style={{ color: (item.start?.scoreDiff || 0) > 0 ? '#16a34a' : '#ef4444', fontWeight: '500' }}>
                                                {(item.start?.scoreDiff || 0) > 0 ? `+${item.start?.scoreDiff}` : item.start?.scoreDiff || 0}
                                            </td>
                                            <td style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#166534' }}>{item.start?.points || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {expandedGroups[groupName] && (
                                <div style={{ padding: "15px", background: "#f8fafc" }}>
                                    <h4 style={{ color: '#047857', marginBottom: '15px', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>Lịch Thi Đấu Bảng {groupName}</h4>
                                    {matchesData[groupName]?.map((match) => (
                                        <div key={match.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', padding: '12px', marginBottom: '8px', borderRadius: '5px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#64748b', width: '100px', lineHeight: '1.4' }}>{match.time}<br/><b style={{color: '#0f172a'}}>{match.court}</b></span>
                                            <span style={{ fontWeight: match.status === 'finished' && match.result.t1 > match.result.t2 ? '900' : '500', flex: 1, textAlign: 'right', paddingRight: '15px', color: '#0f172a' }}>{match.team1}</span>
                                            
                                            <span style={{ background: match.status === 'finished' ? '#1e293b' : '#f1f5f9', color: match.status === 'finished' ? '#84cc16' : '#94a3b8', padding: '4px 12px', borderRadius: '15px', fontWeight: 'bold', minWidth: '65px', textAlign: 'center', fontSize: '0.9rem' }}>
                                                {match.status === 'pending' ? 'VS' : `${match.result.t1} - ${match.result.t2}`}
                                            </span>

                                            <span style={{ fontWeight: match.status === 'finished' && match.result.t2 > match.result.t1 ? '900' : '500', flex: 1, textAlign: 'left', paddingLeft: '15px', color: '#0f172a' }}>{match.team2}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Standings;