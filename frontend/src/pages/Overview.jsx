
/**
 * Overview.jsx - Gộp 3 trang: Standings, Bracket, Fixtures vào 1 trang
 * Đã sửa lỗi nuốt Skeleton khi API lỗi hoặc dữ liệu trả về bị rỗng.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';
import api from '../api/axiosConfig';

/* ─── Helpers (giữ nguyên từ code cũ) ─── */
const teamName = (team, fallback = "Đang chờ") => team?.name || team?.teamName || team?.teamname || fallback;

const emptyRow = (team) => ({
    teamId: team?._id || team,
    teamName: teamName(team),
    played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
});

const matchStatus = (s) => {
    if (s === 'IN_PROGRESS') return 'Live';
    if (s === 'COMPLETED') return 'Finished';
    if (s === 'CANCELED') return 'Canceled';
    if (s === 'POSTPONED') return 'Postponed';
    return 'Upcoming';
};

const roundLabel = (match) => {
    if (match.matchName) return match.matchName;
    if (match.round === 1) return 'Tứ kết';
    if (match.round === 2) return 'Bán kết';
    if (match.round === 3) return 'Chung kết';
    return `Vòng ${match.round || '-'}`;
};

/* ════════════════════════════════════════════
   COMPONENT 1: STANDINGS
════════════════════════════════════════════ */
const StandingsSection = ({ tournamentId }) => {
    const [standingsData, setStandingsData] = useState({});
    const [matchesData, setMatchesData] = useState({});
    const [expandedGroups, setExpandedGroups] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const toggleGroup = (groupName) => {
        setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const res = await api.get('/matches', {
                    params: tournamentId ? { tournamentId, matchType: "group" } : { matchType: "group" }
                });
                
                if (!isMounted) return;
                const matches = res?.data?.data || [];
                const nextStandings = {};
                const nextMatches = {};

                matches.forEach((match) => {
                    const groupName = match.groupId?.name || match.group || "Chưa phân bảng";
                    if (!nextStandings[groupName]) nextStandings[groupName] = {};
                    if (!nextMatches[groupName]) nextMatches[groupName] = [];

                    const team1Id = match.team1?._id || match.team1;
                    const team2Id = match.team2?._id || match.team2;
                    if (team1Id && !nextStandings[groupName][team1Id]) nextStandings[groupName][team1Id] = emptyRow(match.team1);
                    if (team2Id && !nextStandings[groupName][team2Id]) nextStandings[groupName][team2Id] = emptyRow(match.team2);

                    if (match.status === "COMPLETED") {
                        const row1 = nextStandings[groupName][team1Id];
                        const row2 = nextStandings[groupName][team2Id];
                        const score1 = match.team1Score ?? 0;
                        const score2 = match.team2Score ?? 0;

                        if (row1 && row2) {
                            row1.played += 1;
                            row2.played += 1;
                            row1.goalsFor += score1;
                            row1.goalsAgainst += score2;
                            row2.goalsFor += score2;
                            row2.goalsAgainst += score1;
                            row1.goalDifference = row1.goalsFor - row1.goalsAgainst;
                            row2.goalDifference = row2.goalsFor - row2.goalsAgainst;

                            if (score1 > score2) {
                                row1.wins += 1;
                                row2.losses += 1;
                                row1.points += 3;
                            } else if (score2 > score1) {
                                row2.wins += 1;
                                row1.losses += 1;
                                row2.points += 3;
                            } else {
                                row1.draws += 1;
                                row2.draws += 1;
                                row1.points += 1;
                                row2.points += 1;
                            }
                        }
                    }

                    const timeValue = match.scheduledStartTime || match.actualStartTime || match.createdAt;
                    nextMatches[groupName].push({
                        id: match._id,
                        team1: teamName(match.team1),
                        team2: teamName(match.team2),
                        court: match.courtId?.name || match.courtName || "Chưa xếp sân",
                        time: timeValue ? new Date(timeValue).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "Chưa xếp lịch",
                        status: match.status,
                        result: { t1: match.team1Score ?? 0, t2: match.team2Score ?? 0 }
                    });
                });

                const sortedStandings = {};
                Object.entries(nextStandings).forEach(([groupName, rows]) => {
                    sortedStandings[groupName] = Object.values(rows).sort((a, b) =>
                        b.points - a.points ||
                        b.goalDifference - a.goalDifference ||
                        b.goalsFor - a.goalsFor
                    );
                });

                setStandingsData(sortedStandings);
                setMatchesData(nextMatches);
                setExpandedGroups(Object.fromEntries(Object.keys(nextMatches).map((g) => [g, false])));
            } catch (error) {
                console.error("Lỗi tải dữ liệu bảng xếp hạng:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [tournamentId]);

    // Ép hiển thị Skeleton khi đang loading HOẶC API trả về rỗng/lỗi để tránh trang bị trống trơ
    if (isLoading || Object.keys(standingsData).length === 0) {
        return (
            <div className="standings-grid" style={{ marginTop: '20px' }}>
                {[1, 2].map(i => (
                    <div key={i} className="standings-card" style={{ borderTop: '5px solid #a3e635' }}>
                        <div className="standings-card-header">
                            <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '4px' }} />
                            <Skeleton variant="text" width={60} height={20} />
                        </div>
                        <div style={{ padding: '10px 15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                                <Skeleton variant="text" width="40%" height={20} />
                                <Skeleton variant="text" width="40%" height={20} />
                            </div>
                            {[1, 2, 3, 4].map(j => (
                                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '50%' }}>
                                        <Skeleton variant="text" width={15} height={20} />
                                        <Skeleton variant="text" width="80%" height={20} />
                                    </div>
                                    <Skeleton variant="text" width="40%" height={20} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            <style>{`
                .standings-container { max-width: 1200px; margin: 0 auto; padding: 0; font-family: 'Inter', sans-serif; }
                .standings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 30px; }
                .standings-card { border-top: 5px solid #84cc16; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
                .standings-card-header { padding: 15px 20px; background: #f8fafc; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; cursor: pointer; gap: 12px; }
                .standings-group-name { margin: 0; color: #166534; font-size: 1.2rem; font-weight: 700; }
                .standings-toggle { color: #16a34a; font-weight: 700; font-size: 0.8rem; }
                .standings-table { width: 100%; border-collapse: collapse; text-align: center; }
                .standings-table thead { background: #f1f5f9; font-weight: 700; color: #475569; }
                .standings-table th, .standings-table td { padding: 12px 8px; border-bottom: 1px solid #eee; font-size: 0.8rem; }
                .standings-team-name { text-align: left; font-weight: 700; color: #0f172a; }
                .standings-points { font-weight: 800; font-size: 1rem; color: #166534; }
                .standings-matches-section { padding: 15px; background: #f8fafc; }
                .standings-matches-title { color: #047857; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; font-size: 0.9rem; }
                .standings-match-item { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 12px; margin-bottom: 8px; border-radius: 5px; border: 1px solid #e2e8f0; gap: 12px; }
                .standings-match-time { font-size: 0.7rem; color: #64748b; min-width: 100px; }
                .standings-match-court { font-weight: 700; color: #0f172a; }
                .standings-match-team { flex: 1; font-weight: 500; color: #0f172a; }
                .standings-match-score { background: #f1f5f9; padding: 4px 12px; border-radius: 15px; font-weight: 700; min-width: 65px; text-align: center; font-size: 0.8rem; }
                .standings-match-score-finished { background: #1e293b; color: #84cc16; }
            `}</style>

            <div className="standings-grid">
                {Object.keys(standingsData).sort().map((groupName) => (
                    <div key={groupName} className="standings-card">
                        <div onClick={() => toggleGroup(groupName)} className="standings-card-header">
                            <h2 className="standings-group-name">{groupName}</h2>
                            <span className="standings-toggle">{expandedGroups[groupName] ? "▲ Ẩn Lịch" : "▼ Xem Lịch"}</span>
                        </div>

                        <table className="standings-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th style={{ textAlign: "left" }}>TÊN ĐỘI</th>
                                    <th>Trận</th><th>T</th><th>B</th><th>HS</th><th>Điểm</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standingsData[groupName].map((item, idx) => (
                                    <tr key={item.teamId} style={{ background: idx === 0 ? "#f0fdf4" : "#fff" }}>
                                        <td>{idx + 1}</td>
                                        <td className="standings-team-name">
                                            {item.teamName} {idx === 0 && <span style={{ fontSize: '0.65rem', background: '#22c55e', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }}>TOP</span>}
                                        </td>
                                        <td>{item.played}</td>
                                        <td>{item.wins}</td>
                                        <td>{item.losses}</td>
                                        <td>{item.goalDifference > 0 ? `+${item.goalDifference}` : item.goalDifference}</td>
                                        <td className="standings-points">{item.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {expandedGroups[groupName] && (
                            <div className="standings-matches-section">
                                <h4 className="standings-matches-title">LỊCH THI ĐẤU {groupName.toUpperCase()}</h4>
                                {matchesData[groupName]?.map((match) => (
                                    <div key={match.id} className="standings-match-item">
                                        <div className="standings-match-time">{match.time}<br /><b className="standings-match-court">{match.court}</b></div>
                                        <span className="standings-match-team" style={{ textAlign: 'right' }}>{match.team1}</span>
                                        <span className={`standings-match-score ${match.status === "COMPLETED" ? "standings-match-score-finished" : ""}`}>
                                            {match.status === "COMPLETED" ? `${match.result.t1} - ${match.result.t2}` : "VS"}
                                        </span>
                                        <span className="standings-match-team" style={{ textAlign: 'left' }}>{match.team2}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
};

/* ════════════════════════════════════════════
   COMPONENT 2: BRACKET
════════════════════════════════════════════ */
const BracketSection = ({ tournamentId }) => {
    const [matches, setMatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchBracketData = async () => {
            try {
                setIsLoading(true);
                const res = await api.get('/matches', {
                    params: tournamentId ? { tournamentId, matchType: 'knockout' } : { matchType: 'knockout' }
                });
                if (isMounted) setMatches(res?.data?.data || []);
            } catch (error) {
                console.error('Lỗi tải Bracket:', error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchBracketData();
        return () => { isMounted = false; };
    }, [tournamentId]);

    // Phân loại trận đấu dựa vào dữ liệu API (isLosersBracket, hoặc bạn có thể check theo groupId.name/matchName tùy DB)
    const { winnersRounds, losersRounds } = useMemo(() => {
        // Phân nhóm theo nhánh trước
        const winnersMatches = matches.filter(m => !m.isLosersBracket && !m.matchName?.toLowerCase().includes('nhánh thua'));
        const losersMatches = matches.filter(m => m.isLosersBracket || m.matchName?.toLowerCase().includes('nhánh thua'));

        // Hàm helper gom group theo Round
        const groupByRound = (matchList) => {
            const grouped = matchList.reduce((acc, match) => {
                const round = match.round || 1;
                if (!acc[round]) acc[round] = [];
                acc[round].push(match);
                return acc;
            }, {});
            return Object.keys(grouped).map(Number).sort((a, b) => a - b).map(round => ({
                round,
                matches: grouped[round].sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0))
            }));
        };

        return {
            winnersRounds: groupByRound(winnersMatches),
            losersRounds: groupByRound(losersMatches)
        };
    }, [matches]);

    const MatchNode = ({ match }) => {
        const timeValue = match.scheduledStartTime || match.actualStartTime;
        const winnerId = match.winnerTeamId?._id || match.winnerTeamId;
        const team1Id = match.team1?._id || match.team1;
        const team2Id = match.team2?._id || match.team2;

        return (
            <div className="bracket-match-node">
                <div className="bracket-match-header">
                    <span>{roundLabel(match).toUpperCase()}</span>
                    <span>{match.courtId?.name || match.courtName || 'Sân 1'}</span>
                </div>
                <div className={`bracket-team-box ${winnerId && winnerId === team1Id ? 'bracket-team-winner' : ''}`}>
                    <span>{teamName(match.team1, 'Đang chờ')}</span>
                    <b>{match.status === 'COMPLETED' ? match.team1Score : '0'}</b>
                </div>
                <div className={`bracket-team-box ${winnerId && winnerId === team2Id ? 'bracket-team-winner' : ''}`}>
                    <span>{teamName(match.team2, 'Đang chờ')}</span>
                    <b>{match.status === 'COMPLETED' ? match.team2Score : '0'}</b>
                </div>
                <div className="bracket-match-time">
                    ⏱️ {timeValue ? new Date(timeValue).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '15:19'}
                </div>
            </div>
        );
    };

    // LAYOUT SKELETON DOUBLE ELIMINATION: Vẽ cả 2 nhánh Thắng và Thua song song
    if (isLoading || matches.length === 0) {
        return (
            <div className="bracket-grid-wrapper">
                {/* Khối Nhánh Thắng Skeleton */}
                <div className="bracket-branch-section">
                    <div className="bracket-branch-badge winners">▲ NHÁNH THẮNG (WINNERS BRACKET)</div>
                    <div className="bracket-grid-flex">
                        {[2, 1, 1].map((count, colIdx) => (
                            <div key={colIdx} className="bracket-column-custom justify-center">
                                <Skeleton variant="text" width={90} height={20} sx={{ margin: '0 auto 10px' }} />
                                {Array.from({ length: count }).map((_, nodeIdx) => (
                                    <div key={nodeIdx} className="bracket-skeleton-node">
                                        <Skeleton variant="rectangular" width="100%" height={28} sx={{ borderTopLeftRadius: '10px', borderTopRightRadius: '10px', bgcolor: '#f0fdf4' }} />
                                        <div style={{ padding: '8px 10px' }}><Skeleton variant="text" width="80%" height={18} /></div>
                                        <div style={{ padding: '8px 10px' }}><Skeleton variant="text" width="60%" height={18} /></div>
                                        <Skeleton variant="text" width="30%" height={14} sx={{ margin: '2px auto' }} />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ height: '2px', background: '#e2e8f0', margin: '40px 0' }}></div>

                {/* Khối Nhánh Thua Skeleton */}
                <div className="bracket-branch-section">
                    <div className="bracket-branch-badge losers">▼ NHÁNH THUA (LOSERS BRACKET)</div>
                    <div className="bracket-grid-flex">
                        {[2, 1].map((count, colIdx) => (
                            <div key={colIdx} className="bracket-column-custom justify-center">
                                <Skeleton variant="text" width={90} height={20} sx={{ margin: '0 auto 10px' }} />
                                {Array.from({ length: count }).map((_, nodeIdx) => (
                                    <div key={nodeIdx} className="bracket-skeleton-node">
                                        <Skeleton variant="rectangular" width="100%" height={28} sx={{ borderTopLeftRadius: '10px', borderTopRightRadius: '10px', bgcolor: '#fee2e2' }} />
                                        <div style={{ padding: '8px 10px' }}><Skeleton variant="text" width="80%" height={18} /></div>
                                        <div style={{ padding: '8px 10px' }}><Skeleton variant="text" width="60%" height={18} /></div>
                                        <Skeleton variant="text" width="30%" height={14} sx={{ margin: '2px auto' }} />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                .bracket-grid-wrapper { width: 100%; overflow-x: auto; padding: 20px; background: #fafafa; border-radius: 12px; }
                .bracket-branch-section { margin-bottom: 30px; }
                .bracket-branch-badge { width: fit-content; padding: 6px 16px; border-radius: 20px; font-weight: 800; font-size: 0.8rem; margin-bottom: 20px; letter-spacing: 0.5px; }
                .bracket-branch-badge.winners { background: #e0f2fe; color: #0369a1; }
                .bracket-branch-badge.losers { background: #fee2e2; color: #b91c1c; }
                
                .bracket-grid-flex { display: flex; gap: 40px; min-width: 800px; padding: 10px 0; }
                .bracket-column-custom { display: flex; flex-direction: column; gap: 24px; width: 230px; }
                .bracket-column-custom.justify-center { justify-content: center; }
                
                .bracket-round-title { text-align: center; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 0.8rem; margin-bottom: 5px; }
                .bracket-match-node { background: #fff; border: 2px solid #64748b; border-radius: 12px; width: 100%; box-shadow: 0 4px 10px rgba(0,0,0,0.04); overflow: hidden; }
                .bracket-match-header { background: #64748b; color: #fff; padding: 6px 12px; display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 700; }
                .bracket-team-box { width: 100%; display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.8rem; }
                .bracket-team-winner { background: #f0fdf4; color: #166534; font-weight: 700; }
                .bracket-match-time { text-align: center; padding: 6px; font-size: 0.7rem; color: #64748b; background: #f8fafc; }
                
                .bracket-skeleton-node { background: #fff; border: 2px solid #e2e8f0; border-radius: 12px; width: 100%; display: flex; flex-direction: column; overflow: hidden; }
            `}</style>

            <div className="bracket-grid-wrapper">
                {/* RENDER NHÁNH THẮNG */}
                {winnersRounds.length > 0 && (
                    <div className="bracket-branch-section">
                        <div className="bracket-branch-badge winners">▲ NHÁNH THẮNG (WINNERS BRACKET)</div>
                        <div className="bracket-grid-flex">
                            {winnersRounds.map(({ round, matches: roundMatches }) => (
                                <div key={`win-${round}`} className="bracket-column-custom justify-center">
                                    <div className="bracket-round-title">Vòng {round}</div>
                                    {roundMatches.map((match) => (
                                        <MatchNode key={match._id} match={match} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {winnersRounds.length > 0 && losersRounds.length > 0 && (
                    <div style={{ height: '1px', background: '#e2e8f0', margin: '40px 0' }}></div>
                )}

                {/* RENDER NHÁNH THUA */}
                {losersRounds.length > 0 && (
                    <div className="bracket-branch-section">
                        <div className="bracket-branch-badge losers">▼ NHÁNH THUA (LOSERS BRACKET)</div>
                        <div className="bracket-grid-flex">
                            {losersRounds.map(({ round, matches: roundMatches }) => (
                                <div key={`lose-${round}`} className="bracket-column-custom justify-center">
                                    <div className="bracket-round-title">Vòng Thua {round}</div>
                                    {roundMatches.map((match) => (
                                        <MatchNode key={match._id} match={match} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

/* ════════════════════════════════════════════
   COMPONENT 3: FIXTURES
════════════════════════════════════════════ */
const FixturesSection = ({ tournamentId }) => {
    const [filter, setFilter] = useState('All');
    const [matches, setMatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchMatches = async () => {
            try {
                setIsLoading(true);
                const res = await api.get('/matches', {
                    params: tournamentId ? { tournamentId } : {}
                });

                if (!isMounted) return;
                const formattedMatches = (res?.data?.data || []).map((m) => {
                    const status = matchStatus(m.status);
                    const timeValue = m.scheduledStartTime || m.actualStartTime || m.createdAt;
                    const score = status === 'Live' || status === 'Finished'
                        ? `${m.team1Score ?? 0} - ${m.team2Score ?? 0}`
                        : 'VS';

                    return {
                        id: m._id,
                        stage: m.groupId?.name ? `Bảng ${m.groupId.name}` : (m.matchType === 'knockout' ? 'Vòng loại' : 'Vòng bảng'),
                        court: m.courtId?.name || m.courtName || 'Chưa xếp sân',
                        time: timeValue
                            ? new Date(timeValue).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
                            : 'Chưa xếp lịch',
                        teamA: teamName(m.team1),
                        teamB: teamName(m.team2),
                        status,
                        score
                    };
                });

                setMatches(formattedMatches);
            } catch (error) {
                console.error('Lỗi lấy danh sách trận đấu:', error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchMatches();
        return () => { isMounted = false; };
    }, [tournamentId]);

    const uniqueCourts = Array.from(new Set(matches.map(m => m.court).filter(c => c !== 'Chưa xếp sân')));
    const filterTabs = ['All', ...uniqueCourts, 'Live', 'Finished'];
    const filteredMatches = matches.filter((m) => filter === 'All' || m.status === filter || m.court === filter);

    const getBorderColor = (status) => {
        if (status === 'Live') return '#BD0014';
        if (status === 'Finished') return '#02457A';
        return '#14b8a6';
    };

    if (isLoading || filteredMatches.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '800px', margin: '0 auto' }}>
                {[1, 2].map(i => (
                    <div key={i} style={{ background: '#fff', padding: '20px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '6px solid #e2e8f0' }}>
                        <div style={{ width: '70%' }}>
                            <Skeleton variant="text" width="40%" height={16} sx={{ marginBottom: '8px' }} />
                            <Skeleton variant="text" width="80%" height={24} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%' }}>
                            <Skeleton variant="rectangular" width={50} height={28} sx={{ borderRadius: '15px', marginBottom: '4px' }} />
                            <Skeleton variant="text" width="100%" height={14} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            <style>{`
                .fixtures-container { max-width: 800px; margin: 0 auto; padding: 0; }
                .fixtures-grid { display: grid; gap: 15px; }
                .fixtures-card { background: white; padding: 20px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.03); gap: 16px; transition: transform 0.2s; }
                .fixtures-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); }
                .fixtures-info { flex: 1; }
                .fixtures-meta { font-size: 0.85rem; color: #888; font-weight: 600; }
                .fixtures-teams { font-weight: 800; font-size: 1.2rem; margin-top: 5px; color: #02457A; }
                .fixtures-score { text-align: right; }
                .fixtures-score-number { font-size: 1.8rem; font-weight: 900; line-height: 1; }
                .fixtures-status { font-size: 0.75rem; font-weight: 800; margin-top: 4px; letter-spacing: 1px; }
            `}</style>

            <div className="fixtures-container">
                <div className="fixtures-grid">
                    {filteredMatches.map(m => (
                        <div key={m.id} className="fixtures-card" style={{ borderLeft: `6px solid ${getBorderColor(m.status)}` }}>
                            <div className="fixtures-info">
                                <div className="fixtures-meta">{m.time} | {m.court} | {m.stage}</div>
                                <div className="fixtures-teams">{m.teamA} <span style={{ color: '#ccc', margin: '0 5px', fontWeight: 'normal' }}>VS</span> {m.teamB}</div>
                            </div>
                            <div className="fixtures-score">
                                <div className="fixtures-score-number" style={{ color: m.status === 'Live' ? '#BD0014' : '#02457A' }}>{m.score}</div>
                                <div className="fixtures-status" style={{ color: m.status === 'Live' ? '#BD0014' : '#888' }}>{m.status.toUpperCase()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

/* ════════════════════════════════════════════
   ROOT: GỘP KẾT HỢP TRÊN 1 TRANG
════════════════════════════════════════════ */
const Overview = () => {
    const { id: urlId } = useParams();
    const tournamentId = urlId || localStorage.getItem('activeTournamentId');

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '60px', background: '#e0f2fe' }}>
            
            {/* Khối Bảng vàng thành tích */}
            <div>
                <h1 style={{ textalign: 'center', color: '#02457A', fontfamily: 'sans-serif', fontweight: 'bold', marginbottom: '20px' }}>🥇 BẢNG VÀNG THÀNH TÍCH</h1>
                <StandingsSection tournamentId={tournamentId} />
            </div>

            {/* Khối Vòng Knockout */}
            <div style={{ background: '#fff', padding: '30px 10px', borderid: '1px solid #e2e8f0', borderborderRadius: '12px' }}>
                <h1 style={{ textalign: 'center', color: '#BD0014', fontfamily: 'sans-serif', fontweight: 'bold', marginbottom: '20px' }}>SƠ ĐỒ VÒNG KNOCKOUT</h1>
                <BracketSection tournamentId={tournamentId} />
            </div>

            {/* Khối Lịch thi đấu */}
            <div>
                <h1 style={{ textalign: 'center', color: '#02457A', fontfamily: 'sans-serif', fontweight: 'bold', marginbottom: '20px' }}>📅 LỊCH THI ĐẤU & KẾT QUẢ</h1>
                <div style={{ display: 'flex', gap: '10px', marginbottom: '20px', justifycontent: 'center' }}>
                    <button style={{ background: '#02457A', color: '#fff', border: 'none', padding: '8px 20px', borderborderRadius: '20px', fontweight: 'bold' }}>Tất cả</button>
                    <button style={{ background: '#fff', color: '#666', border: '1px solid #ddd', padding: '8px 20px', borderborderRadius: '20px', fontweight: 'bold' }}>Live</button>
                    <button style={{ background: '#fff', color: '#666', border: '1px solid #ddd', padding: '8px 20px', borderborderRadius: '20px', fontweight: 'bold' }}>Finished</button>
                </div>
                <FixturesSection tournamentId={tournamentId} />
            </div>

        </div>
    );
};

export default Overview;

