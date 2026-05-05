import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const Home = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [liveMatches, setLiveMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Logic Đếm ngược (Countdown)
  useEffect(() => {
    const targetDate = new Date("2025-10-26T14:00:00").getTime(); 

    const timer = setInterval(() => {
      const distance = targetDate - new Date().getTime();

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Lấy dữ liệu THẬT từ API

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Dùng Promise.all để gọi 2 API song song, giúp trang load nhanh gấp đôi
        const [matchesRes, teamsRes] = await Promise.all([
            api.get('/tournament/'), 
            api.get('/teams/all')
        ]);
        
        // Gán dữ liệu trận đấu (Dùng đúng biến matchesRes)
        const allMatches = matchesRes.data.data || [];
        setLiveMatches(allMatches.filter(m => m.matchStatus === 'playing'));
        
        // Gán dữ liệu đội bóng và sắp xếp (Dùng đúng biến teamsRes)
        let fetchedTeams = teamsRes.data.data || [];
        
        // FIX LỖI SCHEMA: Đổi từ start.ponits sang stats.points theo cấu trúc Database mới
        fetchedTeams.sort((a, b) => (b.stats?.points || 0) - (a.stats?.points || 0));
        
        setTeams(fetchedTeams);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu trang chủ:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Auto-refresh mỗi 10 giây để cập nhật tỷ số Real-time
    const interval = setInterval(fetchData, 10000); 
    return () => clearInterval(interval);
  }, []);

  const topTeamsPreview = teams.slice(0, 5); // Lấy Top 5 đội

  return (
    <div className="home-wrapper">
      
      {/* --- 1. HERO SECTION (Tông Xanh Lá/Vàng Chanh) --- */}
      <section className="hero-section" style={{ 
        background: 'linear-gradient(rgba(19, 56, 9, 0.85), rgba(19, 56, 9, 0.85)), url("https://images.unsplash.com/photo-1626225443592-349806440788?q=80&w=2070&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <h1>ITVTG PICKLEBALL TOURNAMENT 2025</h1>
        <div className="countdown-text">
          Khai mạc sau: {timeLeft.days} ngày : {timeLeft.hours} giờ : {timeLeft.minutes} phút : {timeLeft.seconds} giây
        </div>
        <Link to="/signup">
          <button className="auth-button shadow-hover" style={{ maxWidth: '320px', margin: '40px auto' }}>ĐĂNG KÝ THAM GIA NGAY</button>
        </Link>
      </section>

      {/* --- 2. SPONSOR MARQUEE --- */}
      <div style={{ background: '#fff', padding: '20px 0', borderBottom: '1px solid #eee', overflow: 'hidden' }}>
        <div className="sponsor-track">
          {[1,2,3,4,5,1,2,3,4,5].map((i, idx) => (
            <div key={idx} style={{ width: '250px', flexShrink: 0, textAlign: 'center', fontWeight: '800', color: '#ccc', fontSize: '1.2rem' }}>
               SPONSOR {i} LOGO
            </div>
          ))}
        </div>
      </div>

      {/* --- 3. BỐ CỤC 3 CỘT (MAIN CONTENT) --- */}
      <div className="home-main-layout">
        
        {/* CỘT TRÁI: BANNER TÀI TRỢ */}
        <aside className="side-banner">
          <h4 className="text-muted" style={{ marginBottom: '15px' }}>TÀI TRỢ VÀNG</h4>
          <img src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&q=80" alt="Sponsor" className="shadow-hover" />
          <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300&q=80" alt="Sponsor" className="shadow-hover" />
        </aside>

        {/* CỘT GIỮA: NỘI DUNG CHÍNH */}
        <main>
          
          {/* A. KHỐI ABOUT TOURNAMENT */}
          <div className="about-unified-container-v2">
            <h2 style={{ fontSize: '2.5rem', marginBottom: '15px', color: 'var(--primary-lime)' }}>ABOUT TOURNAMENT</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.6, opacity: 0.85, marginBottom: '35px' }}>
              Với quy mô <strong>03 Sân</strong> kích thước chuẩn thi đấu, có hệ thống mái che làm mát hàng đầu. 
              Khu vực nghỉ ngơi cho VĐV cùng các dịch vụ đi kèm nhằm tạo trải nghiệm tuyệt vời nhất cho người tham dự.
            </p>

            {/* Thẻ thông tin */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              <div className="about-info-item-v2">
                <div className="icon-wrapper">🏢</div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary-lime)', fontWeight: 800, letterSpacing: '1px' }}>Ban Tổ Chức</div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginTop: '2px' }}>IT Vũng Tàu Group</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '2px' }}>Date: 26-10-2025 (14:00)</div>
                </div>
              </div>

              <div className="about-info-item-v2">
                <div className="icon-wrapper">🏟️</div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary-lime)', fontWeight: 800, letterSpacing: '1px' }}>Địa điểm thi đấu</div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginTop: '2px' }}>HM Sport Pickleball</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '2px' }}>195 Võ Thị Sáu, Vũng Tàu</div>
                  <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="about-link" style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '5px', display: 'inline-block' }}>➡ Mở Google Map</a>
                </div>
              </div>

              <div className="about-info-item-v2">
                <div className="icon-wrapper">🍻</div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary-lime)', fontWeight: 800, letterSpacing: '1px' }}>Tiệc tri ân (18:30)</div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginTop: '2px' }}>Quán nhậu Thống Nhất</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '2px' }}>56 Thống Nhất, Vũng Tàu</div>
                  <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="about-link" style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '5px', display: 'inline-block' }}>➡ Mở Google Map</a>
                </div>
              </div>

              <div className="about-info-item-v2">
                <div className="icon-wrapper">📸</div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary-lime)', fontWeight: 800, letterSpacing: '1px' }}>Góc Khoảnh Khắc</div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginTop: '2px' }}>Photo Album Giải</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '2px' }}>Cập nhật liên tục</div>
                  <a href="#" target="_blank" rel="noreferrer" className="about-link" style={{ color: 'var(--primary-lime)', fontSize: '0.8rem', marginTop: '5px', display: 'inline-block' }}>📁 Mở thư mục Drive</a>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="timeline-container-v2">
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div className="timeline-dot-v2"></div>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-lime)' }}>14:00</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Tập trung</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div className="timeline-dot-v2"></div>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-lime)' }}>14:30</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Khai mạc</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div className="timeline-dot-v2"></div>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-lime)' }}>15:00</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Thi đấu</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div className="timeline-dot-v2"></div>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-lime)' }}>18:30</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Gala Dinner</div>
              </div>
            </div>
          </div>

          {/* B. THỂ THỨC & GIẢI THƯỞNG (HIỆN ĐẠI & SANG TRỌNG) */}
          <div className="modern-grid">
            {/* Cột Thể thức */}
            <div className="modern-card">
              <h3 className="text-teal text-center mb-4">THỂ THỨC THI ĐẤU</h3>
            
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '15px' }}>
                <div className="fw-bold text-forest mb-1" style={{ fontSize: '1.1rem' }}>VÒNG BẢNG</div>
                <div className="text-muted" style={{ fontSize: '0.9rem' }}>Thi đấu chạm 11 điểm (6 điểm đổi sân)</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
                <div className="fw-bold text-forest mb-1" style={{ fontSize: '1.1rem' }}>LOẠI TRỰC TIẾP</div>
                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                  <span style={{ display: 'block', marginBottom: '5px' }}>Tứ kết, Bán kết: Chạm 11 điểm</span>
                  <span>Chung kết: Chạm 15 điểm</span>
                </div>
              </div>
            </div>

            {/* Cột Giải thưởng (VIP Gold) */}
            <div className="prize-card-vip">
              <div className="text-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '20px' }}>
                <div style={{ fontSize: '1.1rem', letterSpacing: '1px', opacity: 0.8, fontWeight: 600 }}>TỔNG GIÁ TRỊ GIẢI THƯỞNG</div>
                <div className="prize-amount-gold">50 TRIỆU</div>
                <div style={{ letterSpacing: '2px', opacity: 0.8 }}>VNĐ</div>
              </div>
              <div>
                <div style={{ color: 'var(--primary-lime)', fontWeight: 800, marginBottom: '15px' }}>Cơ cấu giải từng nội dung:</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.95rem', opacity: 0.9, lineHeight: 1.8 }}>
                  <li><span style={{ color: '#FFD700', marginRight: '8px' }}>🥇</span> <b>Giải Nhất:</b> Cúp + 10.000.000đ</li>
                  <li><span style={{ color: '#C0C0C0', marginRight: '8px' }}>🥈</span> <b>Giải Nhì:</b> Cúp + 7.000.000đ</li>
                  <li><span style={{ color: '#CD7F32', marginRight: '8px' }}>🥉</span> <b>Đồng hạng Ba:</b> Cúp + 5.000.000đ</li>
                  <li style={{ marginTop: '10px' }}>🌟 <b>Giải phụ:</b> Best Iconic & Cặp đôi ăn ý</li>
                </ul>
              </div>
            </div>
          </div>

          {/* C. VIDEO HIGHLIGHT / TRAILER */}
          <h2 className="section-title text-forest">🎥 TRAILER GIẢI ĐẤU</h2>
          <div className="video-container">
            <iframe 
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
              title="Pickleball Tournament Trailer" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen>
            </iframe>
          </div>

          {/* D. TRẠM PHÁT SÓNG TRỰC TIẾP (LIVE SCORE) */}
          <h2 className="section-title"><span className="live-dot"></span> ĐANG THI ĐẤU</h2>
          {isLoading ? (
            <p className="text-center text-muted">Đang tải...</p>
          ) : liveMatches.length === 0 ? (
            <div className="card text-center text-muted" style={{ padding: '40px', marginBottom: '40px' }}>Hiện chưa có trận nào diễn ra.</div>
          ) : (
            <div style={{ display: 'grid', gap: '20px', marginBottom: '40px' }}>
              {liveMatches.map(match => (
                <div key={match._id} className="match-card-premium">
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#ccc' }}>
                    <span className="text-primary fw-bold">🔴 {match.court || 'Sân chưa xếp'}</span>
                    <span>BẢNG {match.group || '-'}</span>
                  </div>
                  <div className="flex-between" style={{ padding: '30px 20px' }}>
                    <div className="text-center" style={{ flex: 1 }}>
                      <div className="team-name">{match.team1?.teamname || 'Đội 1'}</div>
                      <div className="score-neon">{match.score1 || 0}</div>
                    </div>
                    <div className="fw-black text-muted" style={{ fontSize: '1.5rem' }}>VS</div>
                    <div className="text-center" style={{ flex: 1 }}>
                      <div className="team-name">{match.team2?.teamname || 'Đội 2'}</div>
                      <div className="score-neon">{match.score2 || 0}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* E. BẢNG XẾP HẠNG TOP ĐỘI */}
          <h2 className="section-title text-forest">🏆 BẢNG XẾP HẠNG TOP ĐỘI</h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '40px' }}>
            {isLoading ? (
              <p className="text-center text-muted" style={{ padding: '20px' }}>Đang tải bảng xếp hạng...</p>
            ) : topTeamsPreview.length === 0 ? (
              <p className="text-center text-muted" style={{ padding: '20px' }}>Chưa có dữ liệu đội thi đấu.</p>
            ) : (
              <div>
                {topTeamsPreview.map((team, index) => (
                  <div key={team._id || index} className={`mini-standing-row ${index === 0 ? 'top-1' : index === 1 ? 'top-2' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div className="mini-standing-rank">{index + 1}</div>
                      <div>
                        <div className="fw-bold text-forest" style={{ fontSize: '1.1rem' }}>{team.teamname || team.teamCode}</div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Bảng {team.group || '?'}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="fw-black text-teal" style={{ fontSize: '1.2rem' }}>{team.start?.ponits || 0} Điểm</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>HS: {team.start?.scoreDiff > 0 ? `+${team.start.scoreDiff}` : team.start?.scoreDiff || 0}</div>
                    </div>
                  </div>
                ))}
                <Link to="/standings" style={{ display: 'block', textAlign: 'center', padding: '15px', background: '#f5f5f5', color: 'var(--teal-accent)', fontWeight: 'bold', textDecoration: 'none' }}>
                  XEM TOÀN BỘ BẢNG XẾP HẠNG ➡
                </Link>
              </div>
            )}
          </div>

        </main>

        {/* CỘT PHẢI: BANNER TÀI TRỢ */}
        <aside className="side-banner">
          <h4 className="text-muted" style={{ marginBottom: '15px' }}>TÀI TRỢ BẠC</h4>
          <img src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=300&q=80" alt="Sponsor" className="shadow-hover" />
        </aside>

      </div>

      {/* --- 4. FOOTER SPONSORS --- */}
      <footer style={{ backgroundColor: '#0a1d05', color: '#555', padding: '60px 20px', textAlign: 'center', marginTop: '40px' }}>
        <h3 style={{ color: 'var(--primary-lime)', marginBottom: '30px' }}>ĐỐI TÁC & NHÀ TÀI TRỢ CHIẾN LƯỢC</h3>
        <div className="footer-sponsor-grid">
          <div className="footer-sponsor-item" style={{ borderColor: '#FFD700', color: '#FFD700' }}>TÀI TRỢ ĐẶC BIỆT: 40 TRIỆU</div>
          <div className="footer-sponsor-item" style={{ borderColor: '#00FFFF', color: '#00FFFF' }}>TÀI TRỢ KIM CƯƠNG: 30 TRIỆU</div>
          <div className="footer-sponsor-item" style={{ borderColor: '#C0C0C0', color: '#C0C0C0' }}>TÀI TRỢ VÀNG: 20 TRIỆU</div>
        </div>
        
        <div style={{ marginTop: '50px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <p style={{ color: '#888', fontWeight: 'bold' }}>© 2025 IT VŨNG TÀU GROUP TOURNAMENT</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '10px' }}>
            <a href="#" style={{ color: 'var(--teal-accent)', textDecoration: 'none', fontWeight: 'bold' }}>Điều lệ giải</a>
            <a href="#" style={{ color: 'var(--teal-accent)', textDecoration: 'none', fontWeight: 'bold' }}>Liên hệ BTC</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;