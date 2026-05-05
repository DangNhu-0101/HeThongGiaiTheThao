import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig'; 

const Referee = () => {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gọi API lấy danh sách trận đấu cho trọng tài
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
    // Khôi phục tỉ số hiện tại nếu trận đấu đang đá dở (playing)
    setScoreA(m.result?.team1Score || 0);
    setScoreB(m.result?.team2Score || 0);
  };

  const handleFinish = async () => {
    if (!window.confirm(`Bạn chốt tỉ số là ${scoreA} - ${scoreB} và kết thúc trận đấu?`)) return;
    
    try {
      setIsSubmitting(true);
      // Gọi API cập nhật điểm
      const payload = { team1Score: scoreA, team2Score: scoreB };
      await api.put(`/matches/${selectedMatch._id}/score`, payload);
      
      alert(`Trận đấu kết thúc! Tỉ số ${scoreA} - ${scoreB} đã được lưu.`);
      
      // Reset state và tải lại danh sách trận đấu
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
    <div className="referee-bg">
      {!selectedMatch ? (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 className="text-primary text-center">DANH SÁCH ĐIỀU KHIỂN</h1>
          
          {matches.length === 0 ? (
            <div className="text-center mt-4" style={{ color: '#888' }}>Hiện không có trận đấu nào cần điều khiển.</div>
          ) : (
          <div style={{ marginTop: '30px', display: 'grid', gap: '15px' }}>
              {matches.map(m => {
                const timeString = new Date(m.timestart).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit' });
                const tA = m.team1?.teamName || m.team1?.teamname || "Đang chờ";
                const tB = m.team2?.teamName || m.team2?.teamname || "Đang chờ";

                return (
                  <div key={m._id} onClick={() => handleSelectMatch(m)} style={{ background: '#1a1a1a', padding: '20px', borderRadius: '15px', border: '1px solid #333', cursor: 'pointer' }}>
                    <div className="text-primary flex-between" style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{timeString} - {m.court}</span>
                      {m.matchStatus === 'playing' && <span style={{ color: 'var(--brick-red)', fontWeight: 'bold' }}>LIVE</span>}
                    </div>
                    <div className="fw-bold" style={{ fontSize: '1.2rem', marginTop: '5px' }}>{tA} VS {tB}</div>
                  </div>
                );
              })}
          </div>
          )}
        </div>
      ) : (
        <div>
          <div className="text-center" style={{ marginBottom: '20px' }}>
            <button onClick={() => setSelectedMatch(null)} style={{ background: 'none', border: '1px solid #444', color: '#888', padding: '5px 15px', borderRadius: '20px', marginBottom: '10px', cursor: 'pointer' }}>← Đổi trận</button>
            <h2 className="text-primary" style={{ margin: 0 }}>
              {selectedMatch.team1?.teamName || selectedMatch.team1?.teamname} <span style={{color: '#666'}}>VS</span> {selectedMatch.team2?.teamName || selectedMatch.team2?.teamname}
            </h2>
            <p style={{ color: '#666' }}>{selectedMatch.court} - ĐANG NHẬP ĐIỂM</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', height: '65vh' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => setScoreA(scoreA + 1)} className="score-btn teal" style={{ flex: 1, fontSize: '3rem', cursor: 'pointer' }}>{scoreA}</button>
              <button onClick={() => setScoreA(Math.max(0, scoreA - 1))} className="minus-btn" style={{ padding: '15px', cursor: 'pointer' }}>- 1</button>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => setScoreB(scoreB + 1)} className="score-btn red" style={{ flex: 1, fontSize: '3rem', cursor: 'pointer' }}>{scoreB}</button>
              <button onClick={() => setScoreB(Math.max(0, scoreB - 1))} className="minus-btn" style={{ padding: '15px', cursor: 'pointer' }}>- 1</button>
            </div>
          </div>
          <button 
            onClick={handleFinish} 
            disabled={isSubmitting}
            className="auth-button" 
            style={{ marginTop: '20px', fontSize: '1.4rem', background: isSubmitting ? '#555' : 'var(--primary-lime)', width: '100%', padding: '15px', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isSubmitting ? "ĐANG LƯU..." : "KẾT THÚC & LƯU KẾT QUẢ"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Referee;