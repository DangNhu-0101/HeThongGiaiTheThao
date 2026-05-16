import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const IMAGE_BASE_URL = "http://localhost:5001/";

const styles = `
  :root {
    --ocean-deep:    #02457A;
    --ocean-mid:     #018ABE;
    --ocean-pale:    #97CADB;
    --sky-mist:      #D6E7EE;
    --purple-accent: #A999DC;
    --logo-red:      #BD0014;
    --dark-base:     #18181C;
    --bg-light:      #D6E7EE;
    --bg-white:      #FFFFFF;
  }
  *, *::before, *::after { box-sizing: border-box; }
  .home-wrap {
    background: var(--sky-mist);
    font-family: 'Be Vietnam Pro', 'Segoe UI', sans-serif;
    color: var(--dark-base);
    min-height: 100vh;
  }

  /* ── HERO ── */
  .hero {
    background: linear-gradient(160deg, rgba(2,69,122,0.97) 0%, rgba(1,57,106,0.95) 60%, rgba(1,138,190,0.85) 100%);
    padding: 64px 24px 72px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .hero::after {
    content: '';
    position: absolute;
    bottom: -2px; left: 50%;
    transform: translateX(-50%);
    width: 200%; height: 64px;
    background: var(--sky-mist);
    border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  }
  .hero-badge {
    display: inline-block;
    background: var(--logo-red);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    padding: 5px 18px;
    border-radius: 20px;
    margin-bottom: 22px;
  }
  .hero h1 {
    font-size: clamp(24px, 5.5vw, 44px);
    font-weight: 700;
    color: #fff;
    line-height: 1.2;
    letter-spacing: 1px;
    margin: 0 0 8px;
  }
  .hero-sub {
    font-size: 13px;
    color: var(--ocean-pale);
    letter-spacing: 2px;
    margin-bottom: 40px;
  }

  /* ── COUNTDOWN ── */
  .countdown {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 40px;
  }
  .cd-box {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(151,202,219,0.25);
    border-radius: 14px;
    padding: 16px 20px;
    min-width: 76px;
    text-align: center;
    backdrop-filter: blur(6px);
  }
  .cd-num {
    font-size: 30px;
    font-weight: 700;
    color: #fff;
    line-height: 1;
    margin-bottom: 4px;
  }
  .cd-label {
    font-size: 10px;
    color: var(--ocean-pale);
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }
  .hero-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--ocean-mid);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 15px 38px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s, transform 0.15s;
  }
  .hero-cta:hover { background: #019fd8; transform: translateY(-1px); }

  /* ── SPONSOR ── */
  .sponsor-strip {
    background: var(--bg-white);
    border-bottom: 1px solid rgba(2,69,122,0.08);
    padding: 14px 0;
    overflow: hidden;
  }
  .sponsor-track {
    display: flex;
    gap: 40px;
    animation: marquee 20s linear infinite;
    width: max-content;
  }
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .sponsor-chip {
    font-size: 11px;
    font-weight: 600;
    color: var(--ocean-mid);
    letter-spacing: 2px;
    text-transform: uppercase;
    border: 1px solid rgba(1,138,190,0.2);
    border-radius: 20px;
    padding: 5px 18px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ── MAIN ── */
  .home-main {
    max-width: 1000px;
    margin: 0 auto;
    padding: 44px 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .sec-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  .sec-head-text {
    font-size: 11px;
    font-weight: 700;
    color: var(--ocean-mid);
    text-transform: uppercase;
    letter-spacing: 2px;
    white-space: nowrap;
  }
  .sec-head-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--ocean-pale), transparent);
  }

  /* ── ABOUT ── */
  .about-card {
    background: var(--bg-white);
    border-radius: 20px;
    padding: 32px;
    border: 1px solid rgba(2,69,122,0.1);
  }
  .about-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 28px;
  }
  .about-title {
    font-size: 26px;
    font-weight: 700;
    color: var(--ocean-deep);
    line-height: 1.2;
  }
  .about-title span { color: var(--ocean-mid); }
  .about-desc {
    font-size: 14px;
    color: #5a6a7a;
    line-height: 1.75;
    margin-top: 10px;
    max-width: 520px;
  }
  .about-courts {
    background: linear-gradient(135deg, var(--ocean-deep), var(--ocean-mid));
    border-radius: 14px;
    padding: 16px 24px;
    text-align: center;
    flex-shrink: 0;
  }
  .about-courts-num {
    font-size: 36px;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }
  .about-courts-label {
    font-size: 11px;
    color: rgba(255,255,255,0.75);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-top: 4px;
  }

  /* ── INFO GRID ── */
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 32px;
  }
  .info-item {
    background: var(--sky-mist);
    border-radius: 14px;
    padding: 18px;
    border: 1px solid rgba(1,138,190,0.12);
    transition: border-color 0.2s;
  }
  .info-item:hover { border-color: var(--ocean-mid); }
  .info-icon {
    width: 38px; height: 38px;
    background: var(--ocean-deep);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    margin-bottom: 12px;
  }
  .info-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--ocean-mid);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 4px;
  }
  .info-val {
    font-size: 14px;
    font-weight: 600;
    color: var(--ocean-deep);
  }
  .info-sub {
    font-size: 12px;
    color: #7a8fa0;
    margin-top: 3px;
  }
  .info-link {
    display: inline-block;
    font-size: 11px;
    color: var(--ocean-mid);
    text-decoration: none;
    margin-top: 6px;
    border-bottom: 1px solid transparent;
    transition: border-color 0.15s;
  }
  .info-link:hover { border-color: var(--ocean-mid); }

  /* ── TIMELINE ── */
  .timeline-wrap {
    position: relative;
    display: flex;
    justify-content: space-between;
  }
  .timeline-wrap::before {
    content: '';
    position: absolute;
    top: 7px; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, var(--ocean-pale), var(--ocean-mid), var(--ocean-pale));
  }
  .tl-item { text-align: center; flex: 1; position: relative; }
  .tl-dot {
    width: 16px; height: 16px;
    border-radius: 50%;
    background: var(--ocean-mid);
    border: 3px solid var(--bg-white);
    outline: 2px solid var(--ocean-mid);
    margin: 0 auto 12px;
    position: relative; z-index: 1;
  }
  .tl-time {
    font-size: 16px;
    font-weight: 700;
    color: var(--ocean-deep);
  }
  .tl-name {
    font-size: 12px;
    color: #7a8fa0;
    margin-top: 3px;
  }

  /* ── TWO COL ── */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  @media (max-width: 640px) { .two-col { grid-template-columns: 1fr; } }

  /* ── FORMAT ── */
  .format-card {
    background: var(--bg-white);
    border-radius: 20px;
    padding: 28px;
    border: 1px solid rgba(2,69,122,0.1);
  }
  .format-card-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--ocean-deep);
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .format-text {
    font-size: 13px;
    color: #5a6a7a;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  /* ── PRIZE ── */
  .prize-card {
    background: var(--ocean-deep);
    border-radius: 20px;
    padding: 28px;
    position: relative;
    overflow: hidden;
  }
  .prize-card::before {
    content: '';
    position: absolute;
    top: -50px; right: -50px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: rgba(1,138,190,0.2);
  }
  .prize-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--ocean-pale);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 6px;
    position: relative; z-index: 1;
  }
  .prize-text {
    font-size: 14px;
    color: rgba(255,255,255,0.85);
    line-height: 1.7;
    white-space: pre-wrap;
    position: relative; z-index: 1;
  }

  /* ── VIDEO ── */
  .video-wrap {
    background: var(--bg-white);
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid rgba(2,69,122,0.1);
  }
  .video-ratio {
    position: relative;
    width: 100%;
    padding-top: 56.25%;
  }
  .video-ratio iframe {
    position: absolute;
    inset: 0;
    width: 100%; height: 100%;
    border: none;
  }

  /* ── STANDINGS ── */
  .standings-card {
    background: var(--bg-white);
    border-radius: 20px;
    border: 1px solid rgba(2,69,122,0.1);
    overflow: hidden;
  }
  .standing-row {
    display: flex;
    align-items: center;
    padding: 14px 22px;
    gap: 14px;
    border-bottom: 1px solid rgba(214,231,238,0.8);
    transition: background 0.15s;
  }
  .standing-row:hover { background: rgba(214,231,238,0.4); }
  .standing-row:last-of-type { border-bottom: none; }
  .srank {
    width: 30px; height: 30px;
    border-radius: 50%;
    background: var(--sky-mist);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: var(--ocean-deep);
    flex-shrink: 0;
  }
  .srank.gold { background: rgba(255,215,0,0.18); color: #b8860b; }
  .srank.silver { background: rgba(192,192,192,0.2); color: #708090; }
  .sname {
    font-size: 14px;
    font-weight: 600;
    color: var(--ocean-deep);
    flex: 1;
  }
  .sgroup {
    font-size: 12px;
    color: #9aadba;
  }
  .spts {
    font-size: 15px;
    font-weight: 700;
    color: var(--ocean-mid);
    min-width: 70px;
    text-align: right;
  }
  .sdiff {
    font-size: 12px;
    color: #9aadba;
    min-width: 40px;
    text-align: right;
  }
  .standings-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 15px;
    background: var(--sky-mist);
    color: var(--ocean-mid);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-decoration: none;
    transition: background 0.15s;
  }
  .standings-more:hover { background: #c4dde8; }

  /* ── LIVE ── */
  .live-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
  }
  .live-dot {
    width: 9px; height: 9px;
    border-radius: 50%;
    background: var(--logo-red);
    animation: blink 1.3s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
  .live-tag {
    font-size: 11px;
    font-weight: 700;
    color: var(--logo-red);
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .live-refresh {
    margin-left: auto;
    font-size: 11px;
    color: #aaa;
  }
  .match-card-wrap {
    background: var(--bg-white);
    border-radius: 16px;
    border: 1px solid rgba(2,69,122,0.1);
    overflow: hidden;
    margin-bottom: 12px;
  }
  .match-top-bar {
    background: var(--sky-mist);
    padding: 9px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .match-court-name {
    font-size: 11px;
    font-weight: 700;
    color: var(--ocean-mid);
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .match-group-tag {
    font-size: 11px;
    color: #9aadba;
  }
  .match-body {
    padding: 24px 28px;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 16px;
  }
  .match-side { text-align: center; }
  .match-team-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--ocean-deep);
    margin-bottom: 6px;
  }
  .match-score-num {
    font-size: 44px;
    font-weight: 700;
    color: var(--ocean-deep);
    line-height: 1;
  }
  .match-vs {
    font-size: 13px;
    font-weight: 600;
    color: #c5d5de;
    text-align: center;
  }
  .match-empty {
    background: var(--bg-white);
    border-radius: 16px;
    border: 1px solid rgba(2,69,122,0.1);
    padding: 48px;
    text-align: center;
    color: #9aadba;
    font-size: 14px;
  }

  /* ── FOOTER ── */
  .home-footer {
    background: var(--ocean-deep);
    padding: 52px 24px 36px;
    text-align: center;
    margin-top: 16px;
  }
  .footer-sponsor-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--ocean-pale);
    text-transform: uppercase;
    letter-spacing: 2.5px;
    margin-bottom: 24px;
  }
  .footer-tiers {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 44px;
  }
  .tier-chip {
    border-radius: 10px;
    padding: 10px 22px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    border: 1px solid;
  }
  .tier-special  { color: #FFD700; border-color: rgba(255,215,0,0.25); background: rgba(255,215,0,0.07); }
  .tier-diamond  { color: var(--ocean-pale); border-color: rgba(151,202,219,0.25); background: rgba(151,202,219,0.07); }
  .tier-gold     { color: #d4a017; border-color: rgba(212,160,23,0.25); background: rgba(212,160,23,0.07); }
  .footer-copy {
    font-size: 12px;
    color: rgba(151,202,219,0.45);
    border-top: 1px solid rgba(151,202,219,0.12);
    padding-top: 22px;
  }
  .footer-links {
    display: flex;
    justify-content: center;
    gap: 28px;
    margin-top: 10px;
  }
  .footer-links a {
    font-size: 12px;
    color: rgba(151,202,219,0.7);
    text-decoration: none;
    letter-spacing: 0.5px;
    transition: color 0.15s;
  }
  .footer-links a:hover { color: var(--ocean-pale); }

  .skeleton {
    background: linear-gradient(90deg, #dce8ee 25%, #c4d8e2 50%, #dce8ee 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
  }
  @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
`;

const SPONSORS = ['Nhà Tài Trợ Đặc Biệt', 'Nhà Tài Trợ Kim Cương', 'Nhà Tài Trợ Vàng', 'Đối Tác Truyền Thông', 'Đối Tác Thiết Bị'];

export default function Home() {
  const [timeLeft, setTimeLeft]   = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams]         = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ── Countdown ── */
  useEffect(() => {
    const tick = () => {
      if (!tournament?.timeLine?.tournamentStart) return;
      const target = new Date(tournament.timeLine.tournamentStart).getTime();
      const dist = target - Date.now();
      if (dist <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days:    Math.floor(dist / 86400000),
        hours:   Math.floor((dist % 86400000) / 3600000),
        minutes: Math.floor((dist % 3600000) / 60000),
        seconds: Math.floor((dist % 60000) / 1000),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [tournament]);

  /* ── Fetch data ── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tournamentsRes, teamsRes] = await Promise.all([
          api.get('/tournaments'),
          api.get('/teams'),
        ]);

        // Lấy tournament upcoming đầu tiên
        const tournaments = tournamentsRes.data?.data || [];
        const upcoming = tournaments.find(t => t.status === 'upcoming') || tournaments[0];

        if (upcoming) {
          const detailRes = await api.get(`/tournaments/${upcoming._id}`);
          if (detailRes.data?.data) {
            setTournament(detailRes.data.data);
          }
        }

        // Teams
        const teamsData = teamsRes.data?.data || [];
        const sorted = [...teamsData].sort((a, b) => (b.points || 0) - (a.points || 0));
        setTeams(sorted);

      } catch (err) {
        console.error('Home fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const pad = n => String(n).padStart(2, '0');
  const top5 = teams.slice(0, 5);
  const rankClass = i => i === 0 ? 'gold' : i === 1 ? 'silver' : '';

  const formatImagePath = (path) => {
    if (!path) return '';
    return IMAGE_BASE_URL + path.replace(/\\/g, '/').replace(/^\/+/, '');
  };

  // Format timeline từ tournament
  const timelineEvents = tournament?.timeLine ? [
    { time: formatTime(tournament.timeLine.registrationStart), name: 'Mở đăng ký' },
    { time: formatTime(tournament.timeLine.tournamentStart),   name: 'Khai mạc' },
    { time: formatTime(tournament.timeLine.tournamentEnd),     name: 'Bế mạc' },
    ...(tournament.galaConfig?.hasGala ? [{ time: formatTime(tournament.galaConfig.time), name: 'Gala Dinner' }] : []),
  ] : [];

  function formatTime(dateStr) {
    if (!dateStr) return '--:--';
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  return (
    <>
      <style>{styles}</style>
      <div className="home-wrap">

        {/* ═══════════ HERO ═══════════ */}
        <section className="hero">
          <div className="hero-badge">
            {tournament?.sportType?.join(' · ') || 'Giải Pickleball Nội Bộ'}
          </div>
          <h1>{tournament?.name || 'ITVTG PICKLEBALL TOURNAMENT 2025'}</h1>
          <div className="hero-sub">
            {tournament?.slogan || 'IT Vũng Tàu Group'} &nbsp;·&nbsp;
            {tournament?.timeLine?.tournamentStart
              ? new Date(tournament.timeLine.tournamentStart).toLocaleDateString('vi-VN')
              : '26.10.2025'}
          </div>

          <div className="countdown">
            {[
              { val: timeLeft.days,    label: 'Ngày'  },
              { val: timeLeft.hours,   label: 'Giờ'   },
              { val: timeLeft.minutes, label: 'Phút'  },
              { val: timeLeft.seconds, label: 'Giây'  },
            ].map(({ val, label }) => (
              <div className="cd-box" key={label}>
                <div className="cd-num">{pad(val)}</div>
                <div className="cd-label">{label}</div>
              </div>
            ))}
          </div>

          <Link to="/register-team" className="hero-cta">
            ✦ Đăng ký tham gia ngay
          </Link>
        </section>

        {/* ═══════════ SPONSOR MARQUEE ═══════════ */}
        <div className="sponsor-strip">
          <div className="sponsor-track">
            {[...SPONSORS, ...SPONSORS].map((s, i) => (
              <span className="sponsor-chip" key={i}>{s}</span>
            ))}
          </div>
        </div>

        {/* ═══════════ MAIN ═══════════ */}
        <div className="home-main">

          {/* ── ABOUT ── */}
          <div className="about-card">
            <div className="about-header">
              <div>
                <div className="about-title">
                  {tournament?.name ? (
                    <>Về <span>Giải Đấu</span></>
                  ) : (
                    'Đang tải...'
                  )}
                </div>
                <p className="about-desc">
                  {tournament?.description || 'Đang tải thông tin giải đấu...'}
                </p>
              </div>
              <div className="about-courts">
                <div className="about-courts-num">
                  {tournament?.sportsConfig?.length || '03'}
                </div>
                <div className="about-courts-label">Môn thi đấu</div>
              </div>
            </div>

            {/* INFO GRID */}
            <div className="info-grid">
              <div className="info-item">
                <div className="info-icon">🏢</div>
                <div className="info-label">Ban tổ chức</div>
                <div className="info-val">{tournament?.organizer?.name || 'IT Vũng Tàu Group'}</div>
                <div className="info-sub">
                  {tournament?.timeLine?.tournamentStart
                    ? new Date(tournament.timeLine.tournamentStart).toLocaleDateString('vi-VN')
                    : '26-10-2025'} · {formatTime(tournament?.timeLine?.tournamentStart)}
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">🏟️</div>
                <div className="info-label">Địa điểm thi đấu</div>
                <div className="info-val">{tournament?.location || 'Đang cập nhật'}</div>
                <div className="info-sub">{tournament?.targetParticipants || ''}</div>
              </div>
              <div className="info-item">
                <div className="info-icon">👥</div>
                <div className="info-label">Đối tượng tham gia</div>
                <div className="info-val">{tournament?.targetParticipants || 'Tất cả thành viên'}</div>
                <div className="info-sub">Liên hệ: {tournament?.contactPerson?.name || '—'} · {tournament?.contactPerson?.phone || '—'}</div>
              </div>
              <div className="info-item">
                <div className="info-icon">🏅</div>
                <div className="info-label">Môn thi đấu</div>
                <div className="info-val">
                  {tournament?.sportsConfig?.map(s => s.sport).join(', ') || 'Pickleball'}
                </div>
                <div className="info-sub">
                  {tournament?.sportsConfig?.map(s => s.categories?.join(', ')).join(' | ') || ''}
                </div>
              </div>
            </div>

            {/* TIMELINE */}
            {timelineEvents.length > 0 && (
              <>
                <div className="info-label" style={{ marginBottom: '16px' }}>Lịch trình</div>
                <div className="timeline-wrap">
                  {timelineEvents.map(({ time, name }) => (
                    <div className="tl-item" key={name}>
                      <div className="tl-dot" />
                      <div className="tl-time">{time}</div>
                      <div className="tl-name">{name}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── FORMAT + PRIZE ── */}
          <div className="two-col">
            <div className="format-card">
              <div className="format-card-title">🏓 Thể thức & Luật thi đấu</div>
              <div className="format-text">
                {tournament?.description || 'Đang cập nhật thể thức thi đấu...\n\nVui lòng xem điều lệ giải để biết thêm chi tiết.'}
              </div>
            </div>

            <div className="prize-card">
              <div className="prize-label">Cơ cấu giải thưởng</div>
              <div className="prize-text">
                {tournament?.prizes || 'Đang cập nhật cơ cấu giải thưởng...'}
              </div>
            </div>
          </div>

          {/* ── VIDEO ── */}
          <div>
            <div className="sec-head">
              <span className="sec-head-text">🎥 Trailer giải đấu</span>
              <div className="sec-head-line" />
            </div>
            <div className="video-wrap">
              <div className="video-ratio">
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="Pickleball Tournament Trailer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          {/* ── LIVE SCORES ── */}
          <div>
            <div className="live-bar">
              <div className="live-dot" />
              <span className="live-tag">Đang thi đấu</span>
              <span className="live-refresh">Cập nhật mỗi 10 giây</span>
            </div>
            {isLoading ? (
              <div style={{ height: 100 }} className="skeleton" />
            ) : liveMatches.length === 0 ? (
              <div className="match-empty">
                ⏱ Hiện chưa có trận nào đang diễn ra.
              </div>
            ) : (
              liveMatches.map(match => (
                <div className="match-card-wrap" key={match._id}>
                  <div className="match-top-bar">
                    <span className="match-court-name">🔴 {match.courtId?.name || 'Sân chưa xếp'}</span>
                    <span className="match-group-tag">{match.round ? `Vòng ${match.round}` : ''}</span>
                  </div>
                  <div className="match-body">
                    <div className="match-side">
                      <div className="match-team-name">{match.team1?.name || 'Đội 1'}</div>
                      <div className="match-score-num">{match.team1Score ?? 0}</div>
                    </div>
                    <div className="match-vs">VS</div>
                    <div className="match-side">
                      <div className="match-team-name">{match.team2?.name || 'Đội 2'}</div>
                      <div className="match-score-num">{match.team2Score ?? 0}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── STANDINGS ── */}
          <div>
            <div className="sec-head">
              <span className="sec-head-text">🏆 Bảng xếp hạng</span>
              <div className="sec-head-line" />
            </div>
            <div className="standings-card">
              {isLoading ? (
                <div style={{ padding: 20 }}>
                  {[1,2,3].map(i => (
                    <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8 }} />
                  ))}
                </div>
              ) : top5.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '24px', color: '#9aadba', fontSize: 14 }}>
                  Chưa có dữ liệu đội thi đấu.
                </p>
              ) : (
                <>
                  {top5.map((team, i) => (
                    <div className="standing-row" key={team._id || i}>
                      <div className={`srank ${rankClass(i)}`}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div className="sname">{team.name || team.teamCode || `Đội ${i + 1}`}</div>
                        <div className="sgroup">{team.sportCategory || ''}</div>
                      </div>
                      <div className="spts">{team.points || 0} điểm</div>
                    </div>
                  ))}
                  <Link to="/standings" className="standings-more">
                    Xem toàn bộ bảng xếp hạng →
                  </Link>
                </>
              )}
            </div>
          </div>

        </div>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="home-footer">
          <div className="footer-sponsor-label">Đối tác & nhà tài trợ chiến lược</div>
          <div className="footer-tiers">
            <div className="tier-chip tier-special">Tài trợ đặc biệt · 40 triệu</div>
            <div className="tier-chip tier-diamond">Tài trợ kim cương · 30 triệu</div>
            <div className="tier-chip tier-gold">Tài trợ vàng · 20 triệu</div>
          </div>
          <div className="footer-copy">
            © 2025 IT Vũng Tàu Group Tournament
            <div className="footer-links">
              <a href="#">Điều lệ giải</a>
              <a href="#">Liên hệ BTC</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
