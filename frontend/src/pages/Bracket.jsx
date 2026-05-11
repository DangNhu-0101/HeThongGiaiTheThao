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
    const tournamentId = "64a1f8c9e1b2c8b5f0d1234"; // FIX: Thay bằng ID giải đấu thực tế từ DB

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

                // 1. LẤY ĐỘI NHẤT/NHÌ CÁC BẢNG ĐÃ XONG
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

                // Lọc bỏ Placeholder từ DB
                const isPlaceholder = (name) => !name || name.includes("Thắng") || name.includes("Nhất") || name.includes("Nhì") || name.includes("Đang chờ");

                // HÀM XÂY DỰNG NODE ĐƠN LẺ
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

                // Hàm nội bộ lấy tên Đội thắng của Node trước đó
                const getWinner = (node, fallbackText) => {
                    if (!node || !node.isFinished) return fallbackText;
                    return node.winner === 1 ? node.team1 : node.team2;
                };

                // 2. CHUỖI TÍNH TOÁN "THÁC NƯỚC" (CASCADE LOGIC)
                let quarters = []; let semis = []; let final = null;
                const hasQuarters = groups.length >= 3;

                if (hasQuarters) {
                    // Tầng 1: Tứ Kết (Lấy data từ Bảng)
                    const q1 = buildNode(getDbMatch("Tứ Kết 1"), "Tứ Kết 1", groupWinners['A'] || "Nhất Bảng A", groupRunnersUp['B'] || "Nhì Bảng B");
                    const q2 = buildNode(getDbMatch("Tứ Kết 2"), "Tứ Kết 2", groupWinners['C'] || "Nhất Bảng C", groupRunnersUp['D'] || "Nhì Bảng D");
                    const q3 = buildNode(getDbMatch("Tứ Kết 3"), "Tứ Kết 3", groupWinners['B'] || "Nhất Bảng B", groupRunnersUp['A'] || "Nhì Bảng A");
                    const q4 = buildNode(getDbMatch("Tứ Kết 4"), "Tứ Kết 4", groupWinners['D'] || "Nhất Bảng D", groupRunnersUp['C'] || "Nhì Bảng C");
                    quarters = [q1, q2, q3, q4];

                    // Tầng 2: Bán Kết (Lấy data từ Tứ Kết)
                    const s1 = buildNode(getDbMatch("Bán Kết 1"), "Bán Kết 1", getWinner(q1, "Thắng Tứ Kết 1"), getWinner(q2, "Thắng Tứ Kết 2"));
                    const s2 = buildNode(getDbMatch("Bán Kết 2"), "Bán Kết 2", getWinner(q3, "Thắng Tứ Kết 3"), getWinner(q4, "Thắng Tứ Kết 4"));
                    semis = [s1, s2];
                } else {
                    // Tầng 2: Bán Kết (Nếu giải nhỏ chỉ có 2 bảng, lấy thẳng data từ Bảng)
                    const s1 = buildNode(getDbMatch("Bán Kết 1"), "Bán Kết 1", groupWinners['A'] || "Nhất Bảng A", groupRunnersUp['B'] || "Nhì Bảng B");
                    const s2 = buildNode(getDbMatch("Bán Kết 2"), "Bán Kết 2", groupWinners['B'] || "Nhất Bảng B", groupRunnersUp['A'] || "Nhì Bảng A");
                    semis = [s1, s2];
                }

                // Tầng 3: Chung Kết (Lấy data từ Bán Kết)
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
        <div className="page-wrapper" style={{ overflowX: 'auto', padding: '40px 20px', background: '#f8fafc', minHeight: '100vh' }}>
            <h1 className="text-center text-red" style={{ marginBottom: '50px', color: 'var(--brick-red)' }}>SƠ ĐỒ VÒNG KNOCKOUT</h1>
            
            <div className="flex-center" style={{ gap: '50px', minWidth: '800px', alignItems: 'stretch', display: 'flex', justifyContent: 'center' }}>
                
                {bracketData.quarters.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '30px', position: 'relative' }}>
                        {bracketData.quarters.map((m, index) => (
                            <div key={m.id} style={{ position: 'relative' }}>
                                <MatchNode match={m} isFinal={false} />
                                <div style={{ position: 'absolute', right: '-25px', top: '50%', width: '25px', height: '2px', background: 'var(--teal-accent)' }}></div>
                                {index % 2 === 0 && <div style={{ position: 'absolute', right: '-25px', top: '50%', width: '2px', height: 'calc(100% + 30px)', background: 'var(--teal-accent)' }}></div>}
                            </div>
                        ))}
                    </div>
                )}

                {bracketData.semis.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '80px', position: 'relative' }}>
                        {bracketData.semis.map((m, index) => (
                            <div key={m.id} style={{ position: 'relative' }}>
                                {bracketData.quarters.length > 0 && <div style={{ position: 'absolute', left: '-25px', top: '50%', width: '25px', height: '2px', background: 'var(--teal-accent)' }}></div>}
                                <MatchNode match={m} isFinal={false} />
                                <div style={{ position: 'absolute', right: '-25px', top: '50%', width: '25px', height: '2px', background: 'var(--teal-accent)' }}></div>
                                {index === 0 && <div style={{ position: 'absolute', right: '-25px', top: '50%', width: '2px', height: 'calc(100% + 80px)', background: 'var(--teal-accent)' }}></div>}
                            </div>
                        ))}
                    </div>
                )}

                {bracketData.final && (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-25px', top: '50%', width: '25px', height: '2px', background: 'var(--brick-red)' }}></div>
                        <div style={{ textAlign: 'center', color: 'var(--brick-red)', fontWeight: '900', letterSpacing: '1px', marginBottom: '10px', fontSize: '1.5rem', fontFamily: 'var(--font-title)' }}>CHUNG KẾT</div>
                        <MatchNode match={bracketData.final} isFinal={true} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bracket;