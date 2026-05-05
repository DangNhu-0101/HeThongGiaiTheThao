import React from 'react';

const Profile = () => {
  const player = {
    name: "Long",
    level: "3.5",
    matches: 24,
    winRate: "75%",
    recentMatches: [
      { vs: "Team A", result: "Thắng", score: "11-5" },
      { vs: "Team B", result: "Thua", score: "9-11" },
    ]
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {/* Hero Section */}
      <div style={{ 
        background: 'var(--dark-forest)', color: 'white', padding: '40px 20px', 
        borderRadius: '25px', textAlign: 'center', position: 'relative' 
      }}>
        <div style={{ 
          width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--primary-lime)', 
          margin: '0 auto 15px', border: '4px solid white', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', fontSize: '2rem' 
        }}>🎾</div>
        <h2 style={{ margin: 0 }}>{player.name}</h2>
        <div style={{ 
          display: 'inline-block', backgroundColor: 'var(--primary-lime)', color: 'black', 
          padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '10px' 
        }}>LEVEL: {player.level}</div>
      </div>

      {/* Thẻ thống kê */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>Tỉ lệ thắng</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--teal-accent)' }}>{player.winRate}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>Tổng trận</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--teal-accent)' }}>{player.matches}</div>
        </div>
      </div>

      {/* Lịch sử */}
      <h3 style={{ marginTop: '30px' }}>LỊCH SỬ THI ĐẤU</h3>
      <div style={{ display: 'grid', gap: '10px' }}>
        {player.recentMatches.map((m, i) => (
          <div key={i} style={{ background: 'white', padding: '15px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>vs {m.vs}</div>
              <div style={{ fontSize: '0.8rem', color: '#888' }}>Tỉ số: {m.score}</div>
            </div>
            <div style={{ color: m.result === 'Thắng' ? 'green' : 'red', fontWeight: 'bold' }}>{m.result}</div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Profile;