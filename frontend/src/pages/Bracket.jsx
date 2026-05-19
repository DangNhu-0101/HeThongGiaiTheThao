import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const teamName = (team, fallback) => team?.name || team?.teamName || team?.teamname || fallback;

const roundLabel = (match) => {
    if (match.matchName) return match.matchName;
    if (match.round === 1) return 'Tứ kết';
    if (match.round === 2) return 'Bán kết';
    if (match.round === 3) return 'Chung kết';
    return `Vòng ${match.round || '-'}`;
};

const Bracket = () => {
    const { id: urlTournamentId } = useParams();
    const tournamentId = urlTournamentId || localStorage.getItem('activeTournamentId');
    const [matches, setMatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBracketData = async () => {
            try {
                setIsLoading(true);
                const res = await api.get('/matches', {
                    params: tournamentId ? { tournamentId, matchType: 'knockout' } : { matchType: 'knockout' }
                });
                setMatches(res.data.data || []);
            } catch (error) {
                console.error('Lỗi Bracket:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBracketData();
    }, [tournamentId]);

    const rounds = useMemo(() => {
        const grouped = matches.reduce((acc, match) => {
            const round = match.round || 1;
            if (!acc[round]) acc[round] = [];
            acc[round].push(match);
            return acc;
        }, {});

        return Object.keys(grouped)
            .map(Number)
            .sort((a, b) => a - b)
            .map((round) => ({
                round,
                matches: grouped[round].sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0))
            }));
    }, [matches]);

    const MatchNode = ({ match }) => {
        const isFinal = roundLabel(match).toLowerCase().includes('chung') || rounds.at(-1)?.round === match.round;
        const timeValue = match.scheduledStartTime || match.actualStartTime;
        const winnerId = match.winnerTeamId?._id || match.winnerTeamId;
        const team1Id = match.team1?._id || match.team1;
        const team2Id = match.team2?._id || match.team2;

        return (
            <div className={`bracket-match-node ${isFinal ? 'bracket-match-node-final' : ''}`}>
                <div className={`bracket-match-header ${isFinal ? 'bracket-match-header-final' : ''}`}>
                    <span>{roundLabel(match)}</span>
                    <span>{match.courtId?.name || match.courtName || 'Chưa xếp sân'}</span>
                </div>
                <TeamBox team={teamName(match.team1, 'Đội 1')} score={match.status === 'COMPLETED' ? match.team1Score : '-'} isWinner={winnerId && winnerId === team1Id} />
                <TeamBox team={teamName(match.team2, 'Đội 2')} score={match.status === 'COMPLETED' ? match.team2Score : '-'} isWinner={winnerId && winnerId === team2Id} />
                <div className="bracket-match-time">
                    {timeValue ? new Date(timeValue).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'Chưa xếp lịch'}
                </div>
            </div>
        );
    };

    const TeamBox = ({ team, score, isWinner }) => (
        <div className={`bracket-team-box ${isWinner ? 'bracket-team-winner' : ''}`}>
            <span>{team}</span>
            <b>{score}</b>
        </div>
    );

    if (isLoading) return <div className="page-wrapper flex-center" style={{ minHeight: '80vh' }}><h2>Đang tải sơ đồ...</h2></div>;

    return (
        <>
            <style>{`
                .bracket-container { overflow-x: auto; padding: 40px 20px; background: #f8fafc; min-height: 100vh; }
                .bracket-title { text-align: center; color: var(--brick-red, #BD0014); margin-bottom: 50px; font-size: 2rem; }
                .bracket-empty { text-align: center; padding: 60px 20px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px; color: #64748b; }
                .bracket-grid { display: flex; gap: 50px; min-width: 760px; align-items: stretch; justify-content: center; }
                .bracket-column { display: flex; flex-direction: column; justify-content: space-around; gap: 36px; position: relative; }
                .bracket-round-title { text-align: center; color: #02457A; font-weight: 900; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 8px; }
                .bracket-match-wrapper { position: relative; }
                .bracket-match-node { background: #fff; border: 2px solid var(--teal-accent, #14b8a6); border-radius: 12px; width: 240px; box-shadow: 0 8px 6px rgba(0,0,0,0.05); overflow: hidden; }
                .bracket-match-node-final { border-color: var(--brick-red, #BD0014); }
                .bracket-match-header { background: var(--teal-accent, #14b8a6); color: #fff; padding: 6px 12px; display: flex; justify-content: space-between; gap: 10px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
                .bracket-match-header-final { background: var(--brick-red, #BD0014); }
                .bracket-team-box { width: 100%; display: flex; justify-content: space-between; gap: 10px; padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #02457A; }
                .bracket-team-winner { background: #ecfdf5; color: #047857; font-weight: 800; }
                .bracket-match-time { text-align: center; padding: 6px; font-size: 0.78rem; color: #666; background: #f8fafc; }
                @media (max-width: 768px) {
                    .bracket-container { padding: 20px 12px; }
                    .bracket-title { font-size: 1.35rem; margin-bottom: 30px; }
                    .bracket-grid { min-width: 620px; gap: 24px; }
                    .bracket-match-node { width: 200px; }
                }
            `}</style>

            <div className="bracket-container">
                <h1 className="bracket-title">SƠ ĐỒ VÒNG KNOCKOUT</h1>
                {rounds.length === 0 ? (
                    <div className="bracket-empty">Chưa có trận knockout để hiển thị.</div>
                ) : (
                    <div className="bracket-grid">
                        {rounds.map(({ round, matches: roundMatches }) => (
                            <div key={round} className="bracket-column">
                                <div className="bracket-round-title">Vòng {round}</div>
                                {roundMatches.map((match) => (
                                    <div key={match._id} className="bracket-match-wrapper">
                                        <MatchNode match={match} />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default Bracket;
