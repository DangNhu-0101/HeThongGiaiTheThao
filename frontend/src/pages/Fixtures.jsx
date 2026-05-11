import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const Fixtures = () => {
  const [filter, setFilter] = useState('All');
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lấy dữ liệu thật từ Backend
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/matches/all');
        const rawMatches = res.data.data || [];

        // Map dữ liệu từ Backend sang định dạng Frontend cần hiển thị
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

  // Tự động tạo mảng các nút Filter sân dựa trên dữ liệu thực tế
  const uniqueCourts = Array.from(new Set(matches.map(m => m.court).filter(c => c !== 'Chưa xếp sân')));
  const filterTabs = ['All', ...uniqueCourts, 'Live', 'Finished'];

  // Logic lọc (Filter)
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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', minHeight: '80vh' }}>
      <h1 style={{ textAlign: 'center', color: 'var(--dark-forest)', marginBottom: '30px' }}>
        LỊCH THI ĐẤU & KẾT QUẢ
      </h1>
      
      {/* THANH BỘ LỌC (FILTER TABS) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' }}>
        {filterTabs.map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 20px', 
              borderRadius: '20px', 
              border: filter === f ? 'none' : '1px solid #ddd', 
              whiteSpace: 'nowrap',
              backgroundColor: filter === f ? 'var(--dark-forest)' : 'white',
              color: filter === f ? 'var(--primary-lime)' : '#666',
              fontWeight: 'bold', 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: filter === f ? '0 4px 10px rgba(19, 56, 9, 0.2)' : 'none'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* HIỂN THỊ DANH SÁCH TRẬN ĐẤU */}
      {filteredMatches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '15px', color: '#888' }}>
          Không có trận đấu nào khớp với bộ lọc "{filter}".
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredMatches.map(m => (
            <div 
              key={m.id} 
              style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '15px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderLeft: `6px solid ${getBorderColor(m.status)}`,
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                transition: 'transform 0.2s',
                cursor: 'default'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', color: '#888', fontWeight: '600' }}>
                  {m.time} | {m.court} | {m.stage}
                </div>
                <div style={{ fontWeight: '800', fontSize: '1.2rem', marginTop: '5px', color: 'var(--dark-forest)' }}>
                  {m.teamA} <span style={{ color: '#ccc', margin: '0 5px' }}>VS</span> {m.teamB}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontSize: '1.8rem', 
                  fontWeight: '900', 
                  color: m.status === 'Live' ? 'var(--brick-red)' : 'var(--dark-forest)',
                  lineHeight: '1'
                }}>
                  {m.score}
                </div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: m.status === 'Live' ? 'var(--brick-red)' : '#888', 
                  fontWeight: '800',
                  marginTop: '4px',
                  letterSpacing: '1px'
                }}>
                  {m.status.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Fixtures;