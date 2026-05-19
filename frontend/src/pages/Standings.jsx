import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axiosConfig";

const teamName = (team) => team?.name || team?.teamName || team?.teamname || "Đang chờ";

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

const Standings = () => {
    const { id: urlTournamentId } = useParams();
    const tournamentId = urlTournamentId || localStorage.getItem("activeTournamentId");
    const [standingsData, setStandingsData] = useState({});
    const [matchesData, setMatchesData] = useState({});
    const [expandedGroups, setExpandedGroups] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const toggleGroup = (groupName) => {
        setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const res = await api.get("/matches", {
                    params: tournamentId ? { tournamentId, matchType: "group" } : { matchType: "group" }
                });
                const matches = res.data.data || [];
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
                console.error("Lỗi tải dữ liệu:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [tournamentId]);

    if (isLoading) return <h2 style={{ textAlign: "center", marginTop: "50px", color: "#64748b" }}>Đang cập nhật bảng xếp hạng...</h2>;

    return (
        <>
            <style>{`
                .standings-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: 'Inter', sans-serif; }
                .standings-title { text-align: center; margin-bottom: 40px; font-size: 2rem; color: #0f172a; }
                .standings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 30px; }
                .standings-card { border-top: 5px solid #84cc16; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
                .standings-card-header { padding: 15px 20px; background: #f8fafc; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; cursor: pointer; gap: 12px; }
                .standings-group-name { margin: 0; color: #166534; font-size: 1.2rem; }
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
                .standings-empty { text-align: center; padding: 100px 20px; background: #f8fafc; border-radius: 15px; border: 2px dashed #cbd5e1; }
                @media (max-width: 768px) { .standings-grid { grid-template-columns: 1fr; } .standings-match-item { flex-direction: column; text-align: center; } }
            `}</style>

            <div className="standings-container">
                <h1 className="standings-title">BẢNG XẾP HẠNG</h1>
                {Object.keys(standingsData).length === 0 ? (
                    <div className="standings-empty">Chưa có lịch thi đấu vòng bảng để hiển thị.</div>
                ) : (
                    <div className="standings-grid">
                        {Object.keys(standingsData).sort().map((groupName) => (
                            <div key={groupName} className="standings-card">
                                <div onClick={() => toggleGroup(groupName)} className="standings-card-header">
                                    <h2 className="standings-group-name">{groupName}</h2>
                                    <span className="standings-toggle">{expandedGroups[groupName] ? "Ẩn lịch" : "Xem lịch"}</span>
                                </div>

                                <table className="standings-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th style={{ textAlign: "left" }}>Tên đội</th>
                                            <th>Trận</th><th>T</th><th>H</th><th>B</th><th>HS</th><th>Điểm</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {standingsData[groupName].map((item, idx) => (
                                            <tr key={item.teamId} style={{ background: idx === 0 ? "#f0fdf4" : "#fff" }}>
                                                <td>{idx + 1}</td>
                                                <td className="standings-team-name">{item.teamName}</td>
                                                <td>{item.played}</td>
                                                <td>{item.wins}</td>
                                                <td>{item.draws}</td>
                                                <td>{item.losses}</td>
                                                <td>{item.goalDifference > 0 ? `+${item.goalDifference}` : item.goalDifference}</td>
                                                <td className="standings-points">{item.points}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {expandedGroups[groupName] && (
                                    <div className="standings-matches-section">
                                        <h4 className="standings-matches-title">Lịch thi đấu {groupName}</h4>
                                        {matchesData[groupName]?.map((match) => (
                                            <div key={match.id} className="standings-match-item">
                                                <div className="standings-match-time">{match.time}<br /><b className="standings-match-court">{match.court}</b></div>
                                                <span className="standings-match-team">{match.team1}</span>
                                                <span className={`standings-match-score ${match.status === "COMPLETED" ? "standings-match-score-finished" : ""}`}>
                                                    {match.status === "COMPLETED" ? `${match.result.t1} - ${match.result.t2}` : "VS"}
                                                </span>
                                                <span className="standings-match-team">{match.team2}</span>
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
