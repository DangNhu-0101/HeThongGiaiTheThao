import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const sortTeams = (teams) => {
    return [...teams].sort((a, b) => {
        const ptsA = a.start?.points || 0; const ptsB = b.start?.points || 0;
        const diffA = a.start?.scoreDiff || 0; const diffB = b.start?.scoreDiff || 0;
        if (ptsB !== ptsA) return ptsB - ptsA;
        if (diffB !== diffA) return diffB - diffA;
        return 0;
    });
};

const Bracket = () => {
    const [bracketData, setBracketData] = useState({ quarters: [], semis: [], final: null });
    const [isLoading, setIsLoading] = useState(true);
    const tournamentId = "64a1f8c9e1b2c8b5f0d1234";

    useEffect(() => {
        const fetchBracketData = async () => {
            try {
                setIsLoading(true);
                const [teamRes, matchRes] = await Promise.all([
                    api.get(`/teams/tournament/${tournamentId}`),
                    api.get("/matches/all"),
                ]);

                const teams = teamRes.data.data || [];
                const publishedMatches = matchRes.data.data || [];

                const groups = [...new Set(teams.map(t => t.group).filter(Boolean))].sort();
                const groupWinners = {}; const groupRunnersUp = {};
                
                groups.forEach(gName => {
                    const mGroup = publishedMatches.filter(m => m.group === gName && m.stage !== 'knockout');
                    const tGroup = teams.filter(t => t.group === gName);
                    const isFinished = mGroup.length > 0 && mGroup.every(m => m.matchStatus === 'finished');
                    
                    if (isFinished) {
                        const sorted = sortTeams(tGroup);
                        groupWinners[gName] = sorted[0]?.teamName || sorted[0]?.teamname;
                        groupRunnersUp[gName] = sorted[1]?.teamName || sorted[1]?.teamname;
                    }
                });

                const dbKnockouts = publishedMatches.filter(m => m.stage === 'knockout');
                const getDbMatch = (name) => dbKnockouts.find(m => m.matchName?.toLowerCase() === name.toLowerCase());

                const isPlaceholder = (name) => !name || name.includes("Thắng") || name.includes("Nhất") || name.includes("Nhì") || name.includes("Đang chờ");

                const buildNode = (dbMatch, defaultName, defaultT1, defaultT2) => {
                    const isFinished = dbMatch?.matchStatus === 'finished';
                    const s1 = dbMatch?.result?.team1Score ?? 0;
                    const s2 = dbMatch?.result?.team2Score ?? 0;
                    
                    return {
                        id: dbMatch?._id || Math.random(),
                        name: dbMatch?.matchName || defaultName,
                        time: dbMatch?.timestart ? new Date(dbMatch.timestart).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit'}) : null,
                        court: dbMatch?.court || null,
                        team1: !isPlaceholder(dbMatch?.team1Name || dbMatch?.team1?.teamName) ? (dbMatch?.team1Name || dbMatch?.team1?.teamName) : defaultT1,
                        team2: !isPlaceholder(dbMatch?.team2Name || dbMatch?.team2?.teamName) ? (dbMatch?.team2Name || dbMatch?.team2?.teamName) : defaultT2,
                        score1: dbMatch?.result?.team1Score ?? "-",
                        score2: dbMatch?.result?.team2Score ?? "-",
                        isFinished: isFinished,
                        winner: isFinished ? (s1 > s2 ? 1 : 2) : null
                    };
                };

                const getWinner = (node, fallbackText) => {
                    if (!node || !node.isFinished) return fallbackText;
                    return node.winner === 1 ? node.team1 : node.team2;
                };

                let quarters = []; let semis = []; let final = null;
                const hasQuarters = groups.length >= 3;

                if (hasQuarters) {
                    const q1 = buildNode(getDbMatch("Tứ Kết 1"), "Tứ Kết 1", groupWinners['A'] || "Nhất Bảng A", groupRunnersUp['B'] || "Nhì Bảng B");
                    const q2 = buildNode(getDbMatch("Tứ Kết 2"), "Tứ Kết 2", groupWinners['C'] || "Nhất Bảng C", groupRunnersUp['D'] || "Nhì Bảng D");
                    const q3 = buildNode(getDbMatch("Tứ Kết 3"), "Tứ Kết 3", groupWinners['B'] || "Nhất Bảng B", groupRunnersUp['A'] || "Nhì Bảng A");
                    const q4 = buildNode(getDbMatch("Tứ Kết 4"), "Tứ Kết 4", groupWinners['D'] || "Nhất Bảng D", groupRunnersUp['C'] || "Nhì Bảng C");
                    quarters = [q1, q2, q3, q4];

                    const s1 = buildNode(getDbMatch("Bán Kết 1"), "Bán Kết 1", getWinner(q1, "Thắng Tứ Kết 1"), getWinner(q2, "Thắng Tứ Kết 2"));
                    const s2 = buildNode(getDbMatch("Bán Kết 2"), "Bán Kết 2", getWinner(q3, "Thắng Tứ Kết 3"), getWinner(q4, "Thắng Tứ Kết 4"));
                    semis = [s1, s2];
                } else {
                    const s1 = buildNode(getDbMatch("Bán Kết 1"), "Bán Kết 1", groupWinners['A'] || "Nhất Bảng A", groupRunnersUp['B'] || "Nhì Bảng B");
                    const s2 = buildNode(getDbMatch("Bán Kết 2"), "Bán Kết 2", groupWinners['B'] || "Nhất Bảng B", groupRunnersUp['A'] || "Nhì Bảng A");
                    semis = [s1, s2];
                }

                final = buildNode(getDbMatch("Chung Kết"), "Chung Kết", getWinner(semis[0], "Thắng Bán Kết 1"), getWinner(semis[1], "Thắng Bán Kết 2"));

                setBracketData({ quarters, semis, final });
            } catch (error) { console.error("Lỗi Bracket:", error); } 
            finally { setIsLoading(false); }
        };

        fetchBracketData();
    }, [tournamentId]);

    const TeamBox = ({ team, score, isWinner }) => {
        const isPlaceholder = team && (team.includes("Thắng") || team.includes("Nhất") || team.includes("Nhì"));
        return (
            <div className={`team-box ${isWinner ? 'winner' : 'loser'}`} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.9rem', fontStyle: isPlaceholder ? 'italic' : 'normal', color: isPlaceholder ? '#888' : 'var(--dark-forest)', fontWeight: isPlaceholder ? 'normal' : 'bold' }}>
                    {team}
                </span>
                <span className="text-teal fw-black" style={{fontWeight: 'bold', color: 'var(--teal-accent)'}}>{score}</span>
            </div>
        );
    };

    const MatchNode = ({ match, isFinal }) => (
        <div style={{ background: '#fff', border: `2px solid ${isFinal ? 'var(--brick-red)' : 'var(--teal-accent)'}`, borderRadius: '12px', width: '240px', boxShadow: '0 8px 6px rgba(0,0,0,0.05)', position: 'relative', zIndex: 1 }}>
            <div style={{ background: isFinal ? 'var(--brick-red)' : 'var(--teal-accent)', color: '#fff', padding: '6px 12px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                <span style={{ textTransform: 'uppercase' }}>{match.name}</span>
                <span>{match.court || 'Chưa xếp sân'}</span>
            </div>
            <div style={{ padding: '0px' }}>
                <TeamBox team={match.team1} score={match.score1} isWinner={match.winner === 1} />
                <TeamBox team={match.team2} score={match.score2} isWinner={match.winner === 2} />
            </div>
            <div style={{ textAlign: 'center', padding: '5px', fontSize: '0.8rem', color: '#666', background: 'var(--neutral-cream)', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px' }}>
                🕒 {match.time || 'Chưa xếp lịch'}
            </div>
        </div>
    );

    if (isLoading) return <div className="page-wrapper flex-center" style={{minHeight: '80vh'}}><h2 className="text-muted">Đang tải sơ đồ...</h2></div>;

    return (
        <>
            <style>{`
                .bracket-container {
                    overflow-x: auto;
                    padding: 40px 20px;
                    background: #f8fafc;
                    min-height: 100vh;
                }

                @media (max-width: 768px) {
                    .bracket-container {
                        padding: 20px 12px;
                    }
                }

                .bracket-title {
                    text-align: center;
                    color: var(--brick-red, #BD0014);
                    margin-bottom: 50px;
                    font-size: 2rem;
                }

                @media (max-width: 768px) {
                    .bracket-title {
                        font-size: 1.5rem;
                        margin-bottom: 30px;
                    }
                }

                @media (max-width: 640px) {
                    .bracket-title {
                        font-size: 1.25rem;
                    }
                }

                .bracket-grid {
                    display: flex;
                    gap: 50px;
                    min-width: 800px;
                    align-items: stretch;
                    justify-content: center;
                }

                @media (max-width: 900px) {
                    .bracket-grid {
                        min-width: 700px;
                        gap: 30px;
                    }
                }

                @media (max-width: 768px) {
                    .bracket-grid {
                        min-width: 600px;
                        gap: 20px;
                    }
                }

                .bracket-column {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-around;
                    position: relative;
                }

                .bracket-quarter-col {
                    gap: 30px;
                }

                .bracket-semi-col {
                    gap: 80px;
                }

                @media (max-width: 768px) {
                    .bracket-quarter-col {
                        gap: 20px;
                    }
                    .bracket-semi-col {
                        gap: 50px;
                    }
                }

                .bracket-final-col {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    position: relative;
                }

                .bracket-match-wrapper {
                    position: relative;
                }

                .bracket-match-node {
                    background: #fff;
                    border: 2px solid var(--teal-accent, #14b8a6);
                    border-radius: 12px;
                    width: 240px;
                    box-shadow: 0 8px 6px rgba(0,0,0,0.05);
                    position: relative;
                    z-index: 1;
                }

                @media (max-width: 768px) {
                    .bracket-match-node {
                        width: 200px;
                    }
                }

                .bracket-match-node-final {
                    border-color: var(--brick-red, #BD0014);
                }

                .bracket-match-header {
                    background: var(--teal-accent, #14b8a6);
                    color: #fff;
                    padding: 6px 12px;
                    border-top-left-radius: 8px;
                    border-top-right-radius: 8px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    font-weight: bold;
                }

                .bracket-match-header-final {
                    background: var(--brick-red, #BD0014);
                }

                .bracket-connector-right {
                    position: absolute;
                    right: -25px;
                    top: 50%;
                    width: 25px;
                    height: 2px;
                    background: var(--teal-accent, #14b8a6);
                }

                .bracket-connector-vertical {
                    position: absolute;
                    right: -25px;
                    top: 50%;
                    width: 2px;
                    background: var(--teal-accent, #14b8a6);
                }

                .bracket-connector-left {
                    position: absolute;
                    left: -25px;
                    top: 50%;
                    width: 25px;
                    height: 2px;
                    background: var(--teal-accent, #14b8a6);
                }

                .bracket-connector-final-left {
                    position: absolute;
                    left: -25px;
                    top: 50%;
                    width: 25px;
                    height: 2px;
                    background: var(--brick-red, #BD0014);
                }

                .bracket-final-label {
                    text-align: center;
                    color: var(--brick-red, #BD0014);
                    font-weight: 900;
                    letter-spacing: 1px;
                    margin-bottom: 10px;
                    font-size: 1.5rem;
                }

                @media (max-width: 768px) {
                    .bracket-final-label {
                        font-size: 1rem;
                    }
                }
            `}</style>

            <div className="bracket-container">
                <h1 className="bracket-title">SƠ ĐỒ VÒNG KNOCKOUT</h1>
                
                <div className="bracket-grid">
                    
                    {bracketData.quarters.length > 0 && (
                        <div className="bracket-column bracket-quarter-col">
                            {bracketData.quarters.map((m, index) => (
                                <div key={m.id} className="bracket-match-wrapper">
                                    <MatchNode match={m} isFinal={false} />
                                    <div className="bracket-connector-right"></div>
                                    {index % 2 === 0 && (
                                        <div className="bracket-connector-vertical" style={{ height: 'calc(100% + 30px)' }}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {bracketData.semis.length > 0 && (
                        <div className="bracket-column bracket-semi-col">
                            {bracketData.semis.map((m, index) => (
                                <div key={m.id} className="bracket-match-wrapper">
                                    {bracketData.quarters.length > 0 && <div className="bracket-connector-left"></div>}
                                    <MatchNode match={m} isFinal={false} />
                                    <div className="bracket-connector-right"></div>
                                    {index === 0 && (
                                        <div className="bracket-connector-vertical" style={{ height: 'calc(100% + 80px)' }}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {bracketData.final && (
                        <div className="bracket-final-col">
                            <div className="bracket-connector-final-left"></div>
                            <div className="bracket-final-label">CHUNG KẾT</div>
                            <MatchNode match={bracketData.final} isFinal={true} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Bracket;