import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const getTeamName = (team) => team?.name || team?.teamName || team?.teamname || 'Đang chờ';

const toDisplayStatus = (status) => {
  if (status === 'IN_PROGRESS') return 'Live';
  if (status === 'COMPLETED') return 'Finished';
  if (status === 'CANCELED') return 'Canceled';
  if (status === 'POSTPONED') return 'Postponed';
  return 'Upcoming';
};

const Fixtures = () => {
  const { id: urlTournamentId } = useParams();
  const tournamentId = urlTournamentId || localStorage.getItem('activeTournamentId');
  const [filter, setFilter] = useState('All');
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/matches', {
          params: tournamentId ? { tournamentId } : {}
        });

        const formattedMatches = (res.data.data || []).map((m) => {
          const status = toDisplayStatus(m.status);
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
            teamA: getTeamName(m.team1),
            teamB: getTeamName(m.team2),
            status,
            score
          };
        });

        setMatches(formattedMatches);
      } catch (error) {
        console.error('Lỗi lấy danh sách trận đấu:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [tournamentId]);

  const uniqueCourts = Array.from(new Set(matches.map(m => m.court).filter(c => c !== 'Chưa xếp sân')));
  const filterTabs = ['All', ...uniqueCourts, 'Live', 'Finished'];
  const filteredMatches = matches.filter((m) => filter === 'All' || m.status === filter || m.court === filter);

  const getBorderColor = (status) => {
    if (status === 'Live') return 'var(--brick-red, #BD0014)';
    if (status === 'Finished') return 'var(--dark-forest, #02457A)';
    return 'var(--teal-accent, #14b8a6)';
  };

  if (isLoading) return <div className="text-center mt-5">Đang tải lịch thi đấu...</div>;

  return (
    <>
      <style>{`
        .fixtures-container { max-width: 800px; margin: 0 auto; padding: 40px 20px; min-height: 80vh; }
        .fixtures-title { text-align: center; color: var(--dark-forest, #02457A); margin-bottom: 30px; font-size: 2rem; }
        .fixtures-filter-bar { display: flex; gap: 10px; margin-bottom: 30px; overflow-x: auto; padding-bottom: 10px; }
        .fixtures-filter-btn { padding: 8px 20px; border-radius: 20px; white-space: nowrap; font-weight: 700; cursor: pointer; background: white; border: 1px solid #ddd; color: #666; }
        .fixtures-filter-btn-active { background: var(--dark-forest, #02457A); border-color: var(--dark-forest, #02457A); color: var(--primary-lime, #cef15f); }
        .fixtures-empty { text-align: center; padding: 40px; background: white; border-radius: 15px; color: #888; }
        .fixtures-grid { display: grid; gap: 15px; }
        .fixtures-card { background: white; padding: 20px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.03); gap: 16px; }
        .fixtures-info { flex: 1; }
        .fixtures-meta { font-size: 0.85rem; color: #888; font-weight: 600; }
        .fixtures-teams { font-weight: 800; font-size: 1.2rem; margin-top: 5px; color: var(--dark-forest, #02457A); }
        .fixtures-score { text-align: right; }
        .fixtures-score-number { font-size: 1.8rem; font-weight: 900; line-height: 1; }
        .fixtures-status { font-size: 0.75rem; font-weight: 800; margin-top: 4px; letter-spacing: 1px; }
        @media (max-width: 640px) {
          .fixtures-container { padding: 20px 12px; }
          .fixtures-title { font-size: 1.25rem; }
          .fixtures-card { padding: 16px; flex-direction: column; text-align: center; }
          .fixtures-score { text-align: center; }
          .fixtures-teams { font-size: 1rem; }
        }
      `}</style>

      <div className="fixtures-container">
        <h1 className="fixtures-title">LỊCH THI ĐẤU & KẾT QUẢ</h1>
        <div className="fixtures-filter-bar">
          {filterTabs.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`fixtures-filter-btn ${filter === f ? 'fixtures-filter-btn-active' : ''}`}>
              {f}
            </button>
          ))}
        </div>

        {filteredMatches.length === 0 ? (
          <div className="fixtures-empty">Không có trận đấu nào khớp với bộ lọc "{filter}".</div>
        ) : (
          <div className="fixtures-grid">
            {filteredMatches.map(m => (
              <div key={m.id} className="fixtures-card" style={{ borderLeft: `6px solid ${getBorderColor(m.status)}` }}>
                <div className="fixtures-info">
                  <div className="fixtures-meta">{m.time} | {m.court} | {m.stage}</div>
                  <div className="fixtures-teams">{m.teamA} <span style={{ color: '#ccc', margin: '0 5px' }}>VS</span> {m.teamB}</div>
                </div>
                <div className="fixtures-score">
                  <div className="fixtures-score-number" style={{ color: m.status === 'Live' ? 'var(--brick-red, #BD0014)' : 'var(--dark-forest, #02457A)' }}>{m.score}</div>
                  <div className="fixtures-status" style={{ color: m.status === 'Live' ? 'var(--brick-red, #BD0014)' : '#888' }}>{m.status.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Fixtures;
