import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const Fixtures = () => {
  const [filter, setFilter] = useState('All');
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/matches/all');
        const rawMatches = res.data.data || [];

        const formattedMatches = rawMatches.map(m => {
          const tA = m.team1?.teamName || m.team1?.teamname || "Đang chờ";
          const tB = m.team2?.teamName || m.team2?.teamname || "Đang chờ";
          
          let displayStatus = 'Upcoming';
          if (m.matchStatus === 'playing') displayStatus = 'Live';
          if (m.matchStatus === 'finished') displayStatus = 'Finished';

          let displayScore = 'VS';
          if (displayStatus === 'Live' || displayStatus === 'Finished') {
            displayScore = `${m.result?.team1Score || 0} - ${m.result?.team2Score || 0}`;
          }

          const timeString = new Date(m.timestart).toLocaleString("vi-VN", {
              hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
          });

          return {
            id: m._id,
            stage: m.group ? `Bảng ${m.group}` : (m.matchType === 'knockout' ? 'Vòng loại' : ''),
            court: m.court || 'Chưa xếp sân',
            time: timeString,
            teamA: tA,
            teamB: tB,
            status: displayStatus,
            score: displayScore
          };
        });

        setMatches(formattedMatches);
      } catch (error) {
        console.error("Lỗi lấy danh sách trận đấu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const uniqueCourts = Array.from(new Set(matches.map(m => m.court).filter(c => c !== 'Chưa xếp sân')));
  const filterTabs = ['All', ...uniqueCourts, 'Live', 'Finished'];

  const filteredMatches = matches.filter(m => {
    if (filter === 'All') return true;
    if (filter === 'Live' || filter === 'Finished') return m.status === filter;
    return m.court === filter;
  });

  const getBorderColor = (status) => {
    if (status === 'Live') return 'var(--brick-red)';
    if (status === 'Finished') return 'var(--dark-forest)';
    return 'var(--teal-accent)'; 
  };

  if (isLoading) return <div className="text-center mt-5">Đang tải lịch thi đấu... ⏳</div>;

  return (
    <>
      <style>{`
        .fixtures-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          min-height: 80vh;
        }

        @media (max-width: 768px) {
          .fixtures-container {
            padding: 30px 16px;
          }
        }

        @media (max-width: 640px) {
          .fixtures-container {
            padding: 20px 12px;
          }
        }

        .fixtures-title {
          text-align: center;
          color: var(--dark-forest, #02457A);
          margin-bottom: 30px;
          font-size: 2rem;
        }

        @media (max-width: 768px) {
          .fixtures-title {
            font-size: 1.5rem;
            margin-bottom: 24px;
          }
        }

        @media (max-width: 640px) {
          .fixtures-title {
            font-size: 1.25rem;
          }
        }

        .fixtures-filter-bar {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          overflow-x: auto;
          padding-bottom: 10px;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 640px) {
          .fixtures-filter-bar {
            gap: 8px;
            margin-bottom: 20px;
          }
        }

        .fixtures-filter-btn {
          padding: 8px 20px;
          border-radius: 20px;
          white-space: nowrap;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
          border: 1px solid #ddd;
          color: #666;
        }

        @media (max-width: 640px) {
          .fixtures-filter-btn {
            padding: 8px 16px;
            font-size: 0.8rem;
          }
        }

        .fixtures-filter-btn-active {
          background: var(--dark-forest, #02457A);
          border: none;
          color: var(--primary-lime, #cef15f);
          box-shadow: 0 4px 10px rgba(19, 56, 9, 0.2);
        }

        .fixtures-empty {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 15px;
          color: #888;
        }

        @media (max-width: 640px) {
          .fixtures-empty {
            padding: 30px 20px;
          }
        }

        .fixtures-grid {
          display: grid;
          gap: 15px;
        }

        .fixtures-card {
          background: white;
          padding: 20px;
          border-radius: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          transition: transform 0.2s;
          cursor: default;
        }

        @media (max-width: 640px) {
          .fixtures-card {
            padding: 16px;
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }
        }

        .fixtures-card:hover {
          transform: translateY(-2px);
        }

        .fixtures-info {
          flex: 1;
        }

        @media (max-width: 640px) {
          .fixtures-info {
            width: 100%;
          }
        }

        .fixtures-meta {
          font-size: 0.85rem;
          color: #888;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .fixtures-meta {
            font-size: 0.7rem;
          }
        }

        .fixtures-teams {
          font-weight: 800;
          font-size: 1.2rem;
          margin-top: 5px;
          color: var(--dark-forest, #02457A);
        }

        @media (max-width: 640px) {
          .fixtures-teams {
            font-size: 1rem;
          }
        }

        .fixtures-score {
          text-align: right;
        }

        @media (max-width: 640px) {
          .fixtures-score {
            text-align: center;
          }
        }

        .fixtures-score-number {
          font-size: 1.8rem;
          font-weight: 900;
          line-height: 1;
        }

        @media (max-width: 640px) {
          .fixtures-score-number {
            font-size: 1.5rem;
          }
        }

        .fixtures-status {
          font-size: 0.75rem;
          font-weight: 800;
          margin-top: 4px;
          letter-spacing: 1px;
        }
      `}</style>

      <div className="fixtures-container">
        <h1 className="fixtures-title">LỊCH THI ĐẤU & KẾT QUẢ</h1>
        
        <div className="fixtures-filter-bar">
          {filterTabs.map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`fixtures-filter-btn ${filter === f ? 'fixtures-filter-btn-active' : ''}`}
            >
              {f}
            </button>
          ))}
        </div>

        {filteredMatches.length === 0 ? (
          <div className="fixtures-empty">
            Không có trận đấu nào khớp với bộ lọc "{filter}".
          </div>
        ) : (
          <div className="fixtures-grid">
            {filteredMatches.map(m => (
              <div 
                key={m.id} 
                className="fixtures-card"
                style={{ borderLeft: `6px solid ${getBorderColor(m.status)}` }}
              >
                <div className="fixtures-info">
                  <div className="fixtures-meta">
                    {m.time} | {m.court} | {m.stage}
                  </div>
                  <div className="fixtures-teams">
                    {m.teamA} <span style={{ color: '#ccc', margin: '0 5px' }}>VS</span> {m.teamB}
                  </div>
                </div>
                <div className="fixtures-score">
                  <div className="fixtures-score-number" style={{ color: m.status === 'Live' ? 'var(--brick-red)' : 'var(--dark-forest)' }}>
                    {m.score}
                  </div>
                  <div className="fixtures-status" style={{ color: m.status === 'Live' ? 'var(--brick-red)' : '#888' }}>
                    {m.status.toUpperCase()}
                  </div>
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