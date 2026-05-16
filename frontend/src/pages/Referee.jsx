import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig'; 

const Referee = () => {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRefereeMatches = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/matches/referee');
      setMatches(res.data.data || []);
    } catch (error) {
      console.error("Lỗi tải trận đấu trọng tài:", error);
      alert("Không thể tải dữ liệu trận đấu!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRefereeMatches();
  }, []);

  const handleSelectMatch = (m) => {
    setSelectedMatch(m);
    setScoreA(m.result?.team1Score || 0);
    setScoreB(m.result?.team2Score || 0);
  };

  const handleFinish = async () => {
    if (!window.confirm(`Bạn chốt tỉ số là ${scoreA} - ${scoreB} và kết thúc trận đấu?`)) return;
    
    try {
      setIsSubmitting(true);
      const payload = { team1Score: scoreA, team2Score: scoreB };
      await api.put(`/matches/${selectedMatch._id}/score`, payload);
      
      alert(`Trận đấu kết thúc! Tỉ số ${scoreA} - ${scoreB} đã được lưu.`);
      
      setSelectedMatch(null); 
      setScoreA(0); 
      setScoreB(0);
      fetchRefereeMatches(); 

    } catch (error) {
      console.error("Lỗi lưu điểm:", error);
      alert(error.response?.data?.message || "Lỗi hệ thống khi lưu điểm");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="text-center text-primary mt-5">Đang tải dữ liệu trận đấu...</div>;

  return (
    <>
      <style>{`
        .referee-container {
          min-height: 100vh;
          background: linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 100%);
          padding: 40px 20px;
        }

        @media (max-width: 768px) {
          .referee-container {
            padding: 30px 16px;
          }
        }

        @media (max-width: 640px) {
          .referee-container {
            padding: 20px 12px;
          }
        }

        .referee-match-list {
          max-width: 600px;
          margin: 0 auto;
        }

        .referee-title {
          text-align: center;
          color: #22d3ee;
          font-size: 1.5rem;
          margin-bottom: 30px;
        }

        @media (max-width: 640px) {
          .referee-title {
            font-size: 1.2rem;
            margin-bottom: 20px;
          }
        }

        .referee-empty {
          text-align: center;
          color: #666;
          margin-top: 20px;
        }

        .referee-match-card {
          background: #1a1a1a;
          padding: 20px;
          border-radius: 15px;
          border: 1px solid #333;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 15px;
        }

        @media (max-width: 640px) {
          .referee-match-card {
            padding: 16px;
          }
        }

        .referee-match-card:hover {
          border-color: #22d3ee;
          transform: translateX(4px);
        }

        .referee-match-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }

        @media (max-width: 640px) {
          .referee-match-header {
            font-size: 0.7rem;
          }
        }

        .referee-match-live {
          color: #ef4444;
          font-weight: bold;
        }

        .referee-match-teams {
          font-weight: bold;
          font-size: 1.1rem;
          margin-top: 5px;
        }

        @media (max-width: 640px) {
          .referee-match-teams {
            font-size: 0.9rem;
          }
        }

        .referee-scoreboard {
          max-width: 800px;
          margin: 0 auto;
        }

        .referee-back-btn {
          background: none;
          border: 1px solid #444;
          color: #888;
          padding: 8px 20px;
          border-radius: 20px;
          margin-bottom: 20px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .referee-score-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .referee-score-title {
          color: #22d3ee;
          margin: 0;
          font-size: 1.3rem;
        }

        @media (max-width: 640px) {
          .referee-score-title {
            font-size: 1rem;
          }
        }

        .referee-score-sub {
          color: #666;
          font-size: 0.8rem;
        }

        .referee-score-buttons {
          display: flex;
          gap: 10px;
          min-height: 60vh;
        }

        @media (max-width: 640px) {
          .referee-score-buttons {
            flex-direction: column;
            gap: 16px;
          }
        }

        .referee-score-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .referee-score-number {
          flex: 1;
          font-size: 3rem;
          background: #2a2a2a;
          border: none;
          border-radius: 16px;
          color: #22d3ee;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
          padding: 40px;
        }

        @media (max-width: 640px) {
          .referee-score-number {
            font-size: 2rem;
            padding: 30px;
          }
        }

        .referee-score-number-teal {
          background: #0d3b3a;
          color: #14b8a6;
        }

        .referee-score-number-red {
          background: #3d1a1a;
          color: #ef4444;
        }

        .referee-minus-btn {
          padding: 15px;
          background: #2a2a2a;
          border: none;
          border-radius: 12px;
          color: #888;
          font-weight: bold;
          cursor: pointer;
          font-size: 1rem;
        }

        .referee-finish-btn {
          margin-top: 20px;
          width: 100%;
          padding: 16px;
          background: #cef15f;
          border: none;
          border-radius: 12px;
          font-weight: bold;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        @media (max-width: 640px) {
          .referee-finish-btn {
            padding: 14px;
            font-size: 1rem;
          }
        }

        .referee-finish-btn:disabled {
          background: #555;
          cursor: not-allowed;
        }
      `}</style>

      <div className="referee-container">
        {!selectedMatch ? (
          <div className="referee-match-list">
            <h1 className="referee-title">DANH SÁCH ĐIỀU KHIỂN</h1>
            
            {matches.length === 0 ? (
              <div className="referee-empty">Hiện không có trận đấu nào cần điều khiển.</div>
            ) : (
              matches.map(m => {
                const timeString = new Date(m.timestart).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit' });
                const tA = m.team1?.teamName || m.team1?.teamname || "Đang chờ";
                const tB = m.team2?.teamName || m.team2?.teamname || "Đang chờ";

                return (
                  <div key={m._id} onClick={() => handleSelectMatch(m)} className="referee-match-card">
                    <div className="referee-match-header">
                      <span>{timeString} - {m.court}</span>
                      {m.matchStatus === 'playing' && <span className="referee-match-live">LIVE</span>}
                    </div>
                    <div className="referee-match-teams">{tA} VS {tB}</div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="referee-scoreboard">
            <button onClick={() => setSelectedMatch(null)} className="referee-back-btn">
              ← Đổi trận
            </button>
            
            <div className="referee-score-header">
              <h2 className="referee-score-title">
                {selectedMatch.team1?.teamName || selectedMatch.team1?.teamname} 
                <span style={{ color: '#666' }}> VS </span> 
                {selectedMatch.team2?.teamName || selectedMatch.team2?.teamname}
              </h2>
              <p className="referee-score-sub">{selectedMatch.court} - ĐANG NHẬP ĐIỂM</p>
            </div>

            <div className="referee-score-buttons">
              <div className="referee-score-col">
                <button onClick={() => setScoreA(scoreA + 1)} className={`referee-score-number referee-score-number-teal`}>
                  {scoreA}
                </button>
                <button onClick={() => setScoreA(Math.max(0, scoreA - 1))} className="referee-minus-btn">
                  - 1
                </button>
              </div>
              <div className="referee-score-col">
                <button onClick={() => setScoreB(scoreB + 1)} className={`referee-score-number referee-score-number-red`}>
                  {scoreB}
                </button>
                <button onClick={() => setScoreB(Math.max(0, scoreB - 1))} className="referee-minus-btn">
                  - 1
                </button>
              </div>
            </div>

            <button 
              onClick={handleFinish} 
              disabled={isSubmitting}
              className="referee-finish-btn"
            >
              {isSubmitting ? "ĐANG LƯU..." : "KẾT THÚC & LƯU KẾT QUẢ"}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Referee;