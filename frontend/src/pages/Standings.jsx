import React, { useState, useEffect } from "react";
import api from "../api/axiosConfig";

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
        <>
            <style>{`
                .standings-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    font-family: 'Inter', sans-serif;
                }

                @media (max-width: 768px) {
                    .standings-container {
                        padding: 30px 16px;
                    }
                }

                @media (max-width: 640px) {
                    .standings-container {
                        padding: 20px 12px;
                    }
                }

                .standings-title {
                    text-align: center;
                    margin-bottom: 40px;
                    font-size: 2rem;
                    color: #0f172a;
                }

                @media (max-width: 768px) {
                    .standings-title {
                        font-size: 1.5rem;
                        margin-bottom: 30px;
                    }
                }

                @media (max-width: 640px) {
                    .standings-title {
                        font-size: 1.25rem;
                    }
                }

                .standings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
                    gap: 30px;
                }

                @media (max-width: 768px) {
                    .standings-grid {
                        grid-template-columns: 1fr;
                        gap: 24px;
                    }
                }

                .standings-card {
                    border-top: 5px solid #84cc16;
                    background: #fff;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    border-radius: 8px;
                    overflow: hidden;
                }

                .standings-card-header {
                    padding: 15px 20px;
                    background: #f8fafc;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .standings-group-name {
                    margin: 0;
                    color: #166534;
                    font-size: 1.2rem;
                }

                .standings-toggle {
                    color: #16a34a;
                    font-weight: bold;
                    font-size: 0.8rem;
                }

                .standings-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: center;
                }

                .standings-table thead {
                    background: #f1f5f9;
                    font-weight: bold;
                    color: #475569;
                }

                .standings-table th {
                    padding: 12px 8px;
                    font-size: 0.7rem;
                }

                .standings-table td {
                    padding: 12px 8px;
                    border-bottom: 1px solid #eee;
                    font-size: 0.8rem;
                }

                @media (max-width: 640px) {
                    .standings-table th, .standings-table td {
                        padding: 8px 4px;
                        font-size: 0.7rem;
                    }
                }

                .standings-rank {
                    font-weight: bold;
                }

                .standings-rank-first {
                    color: #16a34a;
                }

                .standings-rank-other {
                    color: #64748b;
                }

                .standings-team-name {
                    text-align: left;
                    font-weight: bold;
                    color: #0f172a;
                }

                .standings-top-badge {
                    font-size: 0.6rem;
                    background: #dcfce7;
                    color: #16a34a;
                    padding: 2px 6px;
                    border-radius: 10px;
                    margin-left: 5px;
                }

                .standings-points {
                    font-weight: bold;
                    font-size: 1rem;
                    color: #166534;
                }

                .standings-score-diff-positive {
                    color: #16a34a;
                }

                .standings-score-diff-negative {
                    color: #ef4444;
                }

                .standings-matches-section {
                    padding: 15px;
                    background: #f8fafc;
                }

                .standings-matches-title {
                    color: #047857;
                    margin-bottom: 15px;
                    border-bottom: 1px solid #cbd5e1;
                    padding-bottom: 5px;
                    font-size: 0.9rem;
                }

                .standings-match-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #fff;
                    padding: 12px;
                    margin-bottom: 8px;
                    border-radius: 5px;
                    border: 1px solid #e2e8f0;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                @media (max-width: 640px) {
                    .standings-match-item {
                        flex-direction: column;
                        text-align: center;
                    }
                }

                .standings-match-time {
                    font-size: 0.7rem;
                    color: #64748b;
                    min-width: 100px;
                }

                .standings-match-court {
                    font-weight: bold;
                    color: #0f172a;
                }

                .standings-match-team {
                    flex: 1;
                    text-align: right;
                    padding-right: 15px;
                    font-weight: 500;
                    color: #0f172a;
                }

                .standings-match-team-left {
                    text-align: right;
                }

                .standings-match-team-right {
                    text-align: left;
                    padding-left: 15px;
                }

                .standings-match-score {
                    background: #f1f5f9;
                    padding: 4px 12px;
                    border-radius: 15px;
                    font-weight: bold;
                    min-width: 65px;
                    text-align: center;
                    font-size: 0.8rem;
                }

                .standings-match-score-finished {
                    background: #1e293b;
                    color: #84cc16;
                }

                .standings-match-score-pending {
                    background: #f1f5f9;
                    color: #94a3b8;
                }

                .standings-empty {
                    text-align: center;
                    padding: 100px 20px;
                    background: #f8fafc;
                    border-radius: 15px;
                    border: 2px dashed #cbd5e1;
                }

                .standings-empty-title {
                    color: #64748b;
                    font-size: 1.2rem;
                }

                .standings-empty-text {
                    color: #94a3b8;
                    margin-top: 8px;
                }
            `}</style>

            <div className="standings-container">
                <h1 className="standings-title">🏆 BẢNG VÀNG THÀNH TÍCH</h1>

                {Object.keys(standingsData).length === 0 ? (
                    <div className="standings-empty">
                        <h2 className="standings-empty-title">HỆ THỐNG ĐANG CHUẨN BỊ...</h2>
                        <p className="standings-empty-text">Lịch thi đấu và bảng xếp hạng vòng bảng sẽ hiển thị sau khi Ban tổ chức phê duyệt.</p>
                    </div>
                ) : (
                    <div className="standings-grid">
                        {Object.keys(standingsData).sort().map((groupName) => (
                            <div key={groupName} className="standings-card">
                                <div onClick={() => toggleGroup(groupName)} className="standings-card-header">
                                    <h2 className="standings-group-name">BẢNG {groupName}</h2>
                                    <span className="standings-toggle">
                                        {expandedGroups[groupName] ? '▲ Ẩn Lịch' : '▼ Xem Lịch'}
                                    </span>
                                </div>

                                <table className="standings-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th style={{ textAlign: 'left' }}>TÊN ĐỘI</th>
                                            <th>Trận</th><th>T</th><th>B</th><th>HS</th><th>Điểm</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {standingsData[groupName].map((item, idx) => (
                                            <tr key={item._id} style={{ background: idx === 0 ? '#f0fdf4' : '#fff' }}>
                                                <td className={`standings-rank ${idx === 0 ? 'standings-rank-first' : 'standings-rank-other'}`}>
                                                    {idx + 1}
                                                </td>
                                                <td className="standings-team-name">
                                                    {item.teamName || item.teamname} 
                                                    {idx === 0 && <span className="standings-top-badge">TOP</span>}
                                                </td>
                                                <td>{item.start?.matches || 0}</td>
                                                <td style={{ color: '#16a34a' }}>{item.start?.won || 0}</td>
                                                <td style={{ color: '#ef4444' }}>{item.start?.lost || 0}</td>
                                                <td className={(item.start?.scoreDiff || 0) > 0 ? 'standings-score-diff-positive' : 'standings-score-diff-negative'}>
                                                    {(item.start?.scoreDiff || 0) > 0 ? `+${item.start?.scoreDiff}` : item.start?.scoreDiff || 0}
                                                </td>
                                                <td className="standings-points">{item.start?.points || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {expandedGroups[groupName] && (
                                    <div className="standings-matches-section">
                                        <h4 className="standings-matches-title">Lịch Thi Đấu Bảng {groupName}</h4>
                                        {matchesData[groupName]?.map((match) => (
                                            <div key={match.id} className="standings-match-item">
                                                <div className="standings-match-time">
                                                    {match.time}<br/>
                                                    <b className="standings-match-court">{match.court}</b>
                                                </div>
                                                
                                                <span className="standings-match-team standings-match-team-left">
                                                    {match.team1}
                                                </span>
                                                
                                                <span className={`standings-match-score ${match.status === 'finished' ? 'standings-match-score-finished' : 'standings-match-score-pending'}`}>
                                                    {match.status === 'pending' ? 'VS' : `${match.result.t1} - ${match.result.t2}`}
                                                </span>

                                                <span className="standings-match-team standings-match-team-right">
                                                    {match.team2}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default Standings;