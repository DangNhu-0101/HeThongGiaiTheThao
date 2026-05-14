import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

const CATEGORY_MAPPER = {
  MS: 'Đơn Nam (MS)',
  WS: 'Đơn Nữ (WS)',
  MD: 'Đôi Nam (MD)',
  WD: 'Đôi Nữ (WD)',
  XD: 'Đôi Nam Nữ (XD)',
};

const CSS = `
  :root {
    --ocean-deep:    #02457A;
    --ocean-mid:     #018ABE;
    --ocean-pale:    #97CADB;
    --sky-mist:      #D6E7EE;
    --purple-accent: #A999DC;
    --logo-red:      #BD0014;
    --dark-base:     #18181C;
    --bg-white:      #FFFFFF;
  }

  .rg-page {
    min-height: 100vh;
    background: var(--sky-mist);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 48px 16px 64px;
    font-family: 'Be Vietnam Pro', 'Segoe UI', sans-serif;
  }
  .rg-card {
    background: var(--bg-white);
    border-radius: 20px;
    border: 1px solid rgba(2,69,122,0.1);
    box-shadow: 0 8px 32px rgba(2,69,122,0.10);
    width: 100%; max-width: 560px;
    overflow: visible;
  }

  /* CARD HEADER */
  .rg-card-header {
    background: var(--ocean-deep);
    padding: 28px 32px;
    position: relative;
    overflow: visible;
  }
  .rg-card-header::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 160px; height: 160px;
    border-radius: 50%;
    background: rgba(1,138,190,0.18);
  }
  .rg-card-header-tag {
    font-size: 10px; font-weight: 700;
    color: var(--ocean-pale);
    text-transform: uppercase; letter-spacing: 2.5px;
    margin-bottom: 6px;
    position: relative; z-index: 1;
  }
  .rg-card-header-title {
    font-size: 20px; font-weight: 700;
    color: #fff; margin: 0;
    position: relative; z-index: 1;
  }

  /* CARD BODY */
  .rg-card-body { padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; overflow: visible; }

  /* SECTION */
  .rg-section {
    border: 1px solid rgba(2,69,122,0.1);
    border-radius: 14px;
    overflow: visible;
    animation: rgFadeIn 0.25s ease;
  }
  @keyframes rgFadeIn { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }
  .rg-section-head {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 16px;
    background: rgba(214,231,238,0.5);
    border-bottom: 1px solid rgba(2,69,122,0.07);
  }
  .rg-section-num {
    width: 22px; height: 22px;
    border-radius: 50%;
    background: var(--ocean-mid);
    color: #fff;
    font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .rg-section-label {
    font-size: 11px; font-weight: 700;
    color: var(--ocean-deep);
    text-transform: uppercase; letter-spacing: 1.5px;
  }
  .rg-section-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow: visible; }

  /* FIELD */
  .rg-field { display: flex; flex-direction: column; gap: 5px; }
  .rg-label {
    font-size: 10px; font-weight: 700;
    color: var(--ocean-mid);
    text-transform: uppercase; letter-spacing: 1.5px;
  }
  .rg-input, .rg-select {
    width: 100%; box-sizing: border-box;
    padding: 10px 13px;
    border: 1px solid rgba(1,138,190,0.22);
    background: var(--sky-mist);
    color: var(--dark-base);
    border-radius: 9px;
    font-size: 13px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  }
  .rg-input:focus, .rg-select:focus {
    border-color: var(--ocean-mid);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(1,138,190,0.10);
  }
  .rg-select option { background: #fff; color: var(--dark-base); }

  /* TWO COL */
  .rg-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 480px) { .rg-grid-2 { grid-template-columns: 1fr; } }

  /* FEE STRIP */
  .rg-fee-strip {
    display: flex; justify-content: space-between; align-items: center;
    background: rgba(1,138,190,0.07);
    border: 1px solid rgba(1,138,190,0.18);
    border-radius: 9px;
    padding: 10px 14px;
  }
  .rg-fee-label { font-size: 12px; color: #7a8fa0; font-weight: 500; }
  .rg-fee-amount { font-size: 16px; font-weight: 700; color: var(--ocean-mid); }

  /* SEARCH */
  .rg-search-row { display: flex; gap: 8px; }
  .rg-search-btn {
    padding: 10px 18px;
    background: var(--ocean-mid);
    color: #fff;
    border: none; border-radius: 9px;
    font-size: 12px; font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .rg-search-btn:hover { background: #019fd8; }
  .rg-search-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* DROPDOWN */
  .rg-dropdown-wrap { position: relative; }
  .rg-dropdown {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0;
    background: #fff;
    border: 1px solid rgba(2,69,122,0.14);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(2,69,122,0.12);
    z-index: 20;
    overflow: visible;
    max-height: 220px;
    overflow-y: auto;
  }
  .rg-dropdown::-webkit-scrollbar { width: 3px; }
  .rg-dropdown::-webkit-scrollbar-thumb { background: var(--ocean-pale); border-radius: 3px; }
  .rg-dropdown-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 11px 14px;
    border-bottom: 1px solid rgba(214,231,238,0.8);
    transition: background 0.12s;
  }
  .rg-dropdown-item:last-child { border-bottom: none; }
  .rg-dropdown-item:hover { background: var(--sky-mist); }
  .rg-dropdown-name { font-size: 13px; font-weight: 600; color: var(--ocean-deep); }
  .rg-dropdown-sub  { font-size: 11px; color: #9aadba; margin-top: 2px; }
  .rg-invite-btn {
    padding: 5px 12px;
    background: var(--ocean-mid);
    color: #fff;
    border: none; border-radius: 6px;
    font-size: 11px; font-weight: 700;
    cursor: pointer; font-family: inherit;
    transition: background 0.12s;
    flex-shrink: 0;
  }
  .rg-invite-btn:hover { background: #019fd8; }

  /* MEMBER LIST */
  .rg-member-box {
    background: var(--sky-mist);
    border: 1px solid rgba(2,69,122,0.1);
    border-radius: 10px;
    overflow: visible;
  }
  .rg-member-head {
    padding: 8px 13px;
    font-size: 10px; font-weight: 700;
    color: var(--ocean-mid);
    text-transform: uppercase; letter-spacing: 1.5px;
    border-bottom: 1px solid rgba(2,69,122,0.08);
  }
  .rg-member-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 13px;
    border-bottom: 1px solid rgba(2,69,122,0.06);
    background: #fff;
  }
  .rg-member-row:last-child { border-bottom: none; }
  .rg-member-name { font-size: 13px; font-weight: 600; color: var(--ocean-deep); }
  .rg-remove-btn {
    font-size: 11px; font-weight: 600;
    color: var(--logo-red);
    background: rgba(189,0,20,0.07);
    border: 1px solid rgba(189,0,20,0.18);
    border-radius: 6px;
    padding: 4px 10px;
    cursor: pointer; font-family: inherit;
    transition: background 0.12s;
  }
  .rg-remove-btn:hover { background: rgba(189,0,20,0.14); }

  /* SUBMIT */
  .rg-submit-btn {
    width: 100%; padding: 14px;
    border-radius: 10px; border: none;
    background: var(--ocean-mid);
    color: #fff;
    font-size: 14px; font-weight: 700;
    font-family: inherit;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: background 0.15s, transform 0.12s;
  }
  .rg-submit-btn:hover:not(:disabled) { background: #019fd8; transform: translateY(-1px); }
  .rg-submit-btn:disabled { background: #a0b8c8; cursor: not-allowed; }

  /* ── RESULT SCREEN ── */
  .rg-result-page {
    min-height: 100vh;
    background: var(--sky-mist);
    display: flex; align-items: flex-start; justify-content: center;
    padding: 48px 16px 64px;
    font-family: 'Be Vietnam Pro', 'Segoe UI', sans-serif;
  }
  .rg-result-card {
    background: var(--bg-white);
    border-radius: 20px;
    border: 1px solid rgba(2,69,122,0.1);
    box-shadow: 0 8px 32px rgba(2,69,122,0.10);
    width: 100%; max-width: 480px;
    overflow: visible;
  }
  .rg-result-header {
    background: var(--ocean-deep);
    padding: 28px 32px;
    text-align: center;
    position: relative; overflow: visible;
  }
  .rg-result-header::before {
    content: '';
    position: absolute; top: -40px; right: -40px;
    width: 140px; height: 140px; border-radius: 50%;
    background: rgba(1,138,190,0.2);
  }
  .rg-result-tag {
    font-size: 10px; font-weight: 700;
    color: var(--ocean-pale);
    text-transform: uppercase; letter-spacing: 2.5px;
    margin-bottom: 6px;
    position: relative; z-index: 1;
  }
  .rg-result-title {
    font-size: 20px; font-weight: 700; color: #fff; margin: 0;
    position: relative; z-index: 1;
  }
  .rg-result-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 16px; }

  .rg-notice {
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 13px; line-height: 1.6;
  }
  .rg-notice.warn {
    background: rgba(234,88,12,0.08);
    border: 1px solid rgba(234,88,12,0.2);
    color: #9a3412;
  }
  .rg-notice-title { font-weight: 700; margin-bottom: 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }

  .rg-payment-box {
    border: 1px solid rgba(2,69,122,0.12);
    border-radius: 14px;
    overflow: visible;
  }
  .rg-payment-head {
    padding: 11px 16px;
    background: rgba(214,231,238,0.5);
    border-bottom: 1px solid rgba(2,69,122,0.08);
    font-size: 11px; font-weight: 700;
    color: var(--ocean-deep);
    text-transform: uppercase; letter-spacing: 1.5px;
  }
  .rg-payment-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .rg-qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .rg-qr-img {
    width: 160px; height: 160px;
    object-fit: cover;
    border-radius: 12px;
    border: 1px solid rgba(2,69,122,0.15);
    padding: 4px;
    background: #fff;
  }
  .rg-qr-hint { font-size: 10px; color: #9aadba; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; }
  .rg-qr-empty {
    text-align: center;
    padding: 14px;
    border: 1px dashed rgba(2,69,122,0.15);
    border-radius: 10px;
    font-size: 12px; color: #9aadba;
    font-style: italic;
  }
  .rg-info-rows { display: flex; flex-direction: column; gap: 8px; }
  .rg-info-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: 13px; }
  .rg-info-key { color: #7a8fa0; flex-shrink: 0; }
  .rg-info-val { font-weight: 600; color: var(--ocean-deep); text-align: right; }
  .rg-info-val.highlight { color: var(--ocean-mid); font-size: 17px; }
  .rg-transfer-code {
    display: inline-block;
    background: var(--sky-mist);
    border: 1px solid rgba(2,69,122,0.15);
    border-radius: 6px;
    padding: 2px 10px;
    font-family: monospace;
    font-size: 13px;
    font-weight: 700;
    color: var(--ocean-deep);
  }
  .rg-info-divider { height: 1px; background: rgba(2,69,122,0.08); }
  .rg-footnote { font-size: 11px; color: #9aadba; text-align: center; font-style: italic; }

  .rg-home-btn {
    width: 100%; padding: 13px;
    border-radius: 10px; border: none;
    background: var(--ocean-deep);
    color: #fff;
    font-size: 14px; font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
  }
  .rg-home-btn:hover { background: #02376b; }
`;

/* ════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════ */
const RegisterTeam = () => {
  const navigate = useNavigate();

  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [selectedTour,        setSelectedTour]        = useState(null);
  const [selectedSport,       setSelectedSport]       = useState(null);
  const [selectedCategory,    setSelectedCategory]    = useState(null);
  const [isSolo,              setIsSolo]              = useState(false);

  const [teamName,        setTeamName]        = useState('');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [searchResults,   setSearchResults]   = useState([]);
  const [invitedMembers,  setInvitedMembers]  = useState([]);

  const [isSearching, setIsSearching] = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);
  const [result,      setResult]      = useState(null);

  /* ── FETCH TOURNAMENTS ── */
  useEffect(() => {
    api.get('/tournaments')
      .then(res => {
        if (res.data?.data)
          setUpcomingTournaments(res.data.data.filter(t => t.status === 'upcoming'));
      })
      .catch(err => console.error(err));
  }, []);

  /* ── HANDLERS ── */
  const handleTourChange = async e => {
    const tourId = e.target.value;
    setSelectedSport(null); setSelectedCategory(null); setInvitedMembers([]);
    try {
      const res = await api.get(`/tournaments/${tourId}`);
      if (res.data?.success) setSelectedTour(res.data.data);
    } catch (err) { console.error(err); }
  };

  const handleCategoryChange = e => {
    const cat = e.target.value;
    setSelectedCategory(cat);
    setIsSolo(cat.includes('S'));
    setInvitedMembers([]);
  };

  const handleSearchUser = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.get(`/users/search?name=${searchQuery}`);
      setSearchResults(res.data?.data || []);
    } catch (err) {
      console.error(err); setSearchResults([]);
    } finally { setIsSearching(false); }
  };

  const addMember = user => {
    if (invitedMembers.find(m => m._id === user._id)) return;
    if (invitedMembers.length >= 1) { alert('Nội dung Đôi chỉ cho phép mời thêm 1 đồng đội!'); return; }
    setInvitedMembers([...invitedMembers, user]);
    setSearchResults([]); setSearchQuery('');
  };

  const removeMember = userId => setInvitedMembers(invitedMembers.filter(m => m._id !== userId));

  const getFee = () => selectedSport?.feePerAthlete || 0;

  const handleSubmit = async e => {
    e.preventDefault(); setIsSaving(true);
    try {
      const payload = {
        tournamentId: selectedTour._id,
        sport:        selectedSport.sport,
        categoryId:   selectedCategory,
        regMode:      isSolo ? 'solo' : 'create',
        teamName:     isSolo ? null : teamName,
        invitedUserIds: invitedMembers.map(m => m._id),
      };
      const res = await api.post('/teams/register-flow', payload);
      setResult({ ...res.data, fee: getFee() });
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi quá trình đăng ký, vui lòng thử lại!');
    } finally { setIsSaving(false); }
  };

  /* ════════════════════════════════════════════════
     RESULT SCREEN
  ════════════════════════════════════════════════ */
  if (result) {
    const hasPending = !isSolo && invitedMembers.length > 0;
    return (
      <>
        <style>{CSS}</style>
        <div className="rg-result-page">
          <div className="rg-result-card">

            <div className="rg-result-header">
              <div className="rg-result-tag">{hasPending ? 'Chờ xác nhận' : 'Hoàn tất'}</div>
              <h2 className="rg-result-title">
                {hasPending ? 'Đăng ký thành công — chờ đồng đội' : 'Đăng ký thành công'}
              </h2>
            </div>

            <div className="rg-result-body">

              {hasPending && (
                <div className="rg-notice warn">
                  <div className="rg-notice-title">Đội chưa hợp lệ</div>
                  Lời mời đã được gửi đến đồng đội. Đội chỉ đủ điều kiện thi đấu sau khi họ xác nhận tham gia.
                </div>
              )}

              <div className="rg-payment-box">
                <div className="rg-payment-head">Thông tin thanh toán lệ phí</div>
                <div className="rg-payment-body">

                  {selectedTour?.paymentQR ? (
                    <div className="rg-qr-wrap">
                      <img src={selectedTour.paymentQR} alt="QR thanh toán" className="rg-qr-img" />
                      <span className="rg-qr-hint">Quét mã để thanh toán</span>
                    </div>
                  ) : (
                    <div className="rg-qr-empty">Ban tổ chức chưa cập nhật mã QR cho giải đấu này.</div>
                  )}

                  <div className="rg-info-rows">
                    <div className="rg-info-row">
                      <span className="rg-info-key">Đơn vị tổ chức</span>
                      <span className="rg-info-val">{selectedTour?.Organization?.name || 'Ban tổ chức'}</span>
                    </div>
                    <div className="rg-info-row">
                      <span className="rg-info-key">Hạng mục</span>
                      <span className="rg-info-val">{selectedSport?.sport} — {CATEGORY_MAPPER[selectedCategory] || selectedCategory}</span>
                    </div>
                    <div className="rg-info-row">
                      <span className="rg-info-key">Địa điểm</span>
                      <span className="rg-info-val">{selectedTour?.location || '—'}</span>
                    </div>
                    <div className="rg-info-divider" />
                    <div className="rg-info-row">
                      <span className="rg-info-key">Số tiền</span>
                      <span className="rg-info-val highlight">{result.fee?.toLocaleString()} VNĐ</span>
                    </div>
                    <div className="rg-info-row">
                      <span className="rg-info-key">Nội dung chuyển khoản</span>
                      <span className="rg-transfer-code">DK {result.teamId?.slice(-6).toUpperCase() || 'CODE'}</span>
                    </div>
                  </div>

                  <p className="rg-footnote">Bạn có thể nộp ảnh biên lai trong phần Quản lý Đội sau.</p>
                </div>
              </div>

              <button className="rg-home-btn" onClick={() => navigate('/')}>
                Về trang chủ
              </button>

            </div>
          </div>
        </div>
      </>
    );
  }

  /* ════════════════════════════════════════════════
     REGISTRATION FORM
  ════════════════════════════════════════════════ */
  return (
    <>
      <style>{CSS}</style>
      <div className="rg-page">
        <div className="rg-card">

          {/* HEADER */}
          <div className="rg-card-header">
            <div className="rg-card-header-tag">Đăng ký tham gia</div>
            <h1 className="rg-card-header-title">Cổng đăng ký vận động viên</h1>
          </div>

          {/* BODY */}
          <div className="rg-card-body">
            <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:20}}>

              {/* ── SECTION 1: GIẢI & MÔN ── */}
              <div className="rg-section">
                <div className="rg-section-head">
                  <div className="rg-section-num">1</div>
                  <span className="rg-section-label">Chọn giải đấu & hạng mục</span>
                </div>
                <div className="rg-section-body">

                  <div className="rg-field">
                    <label className="rg-label">Giải đấu đang mở *</label>
                    <select className="rg-select" required defaultValue="" onChange={handleTourChange}>
                      <option value="" disabled>Chọn giải đấu bạn muốn tham gia...</option>
                      {upcomingTournaments.map(t => (
                        <option key={t._id} value={t._id}>{t.displayName || t.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedTour && (
                    <div className="rg-grid-2">
                      <div className="rg-field">
                        <label className="rg-label">Môn thi đấu *</label>
                        <select className="rg-select" required defaultValue=""
                          onChange={e => {
                            setSelectedSport(selectedTour.sportsConfig?.find(s => s.sport === e.target.value));
                            setSelectedCategory(null); setInvitedMembers([]);
                          }}>
                          <option value="" disabled>Chọn môn...</option>
                          {selectedTour.sportsConfig?.map((s, i) => (
                            <option key={i} value={s.sport}>{s.sport}</option>
                          ))}
                        </select>
                      </div>

                      {selectedSport && (
                        <div className="rg-field">
                          <label className="rg-label">Nội dung *</label>
                          <select className="rg-select" required defaultValue="" onChange={handleCategoryChange}>
                            <option value="" disabled>Chọn hạng mục...</option>
                            {selectedSport.categories?.map((cat, i) => (
                              <option key={i} value={cat}>{CATEGORY_MAPPER[cat] || cat}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedSport && selectedCategory && (
                    <div className="rg-fee-strip">
                      <span className="rg-fee-label">Lệ phí tham dự</span>
                      <span className="rg-fee-amount">{getFee().toLocaleString()} VNĐ</span>
                    </div>
                  )}

                </div>
              </div>

              {/* ── SECTION 2: LẬP ĐỘI (chỉ khi Đôi) ── */}
              {selectedCategory && !isSolo && (
                <div className="rg-section">
                  <div className="rg-section-head">
                    <div className="rg-section-num">2</div>
                    <span className="rg-section-label">Thông tin đội & đồng đội</span>
                  </div>
                  <div className="rg-section-body">

                    {/* TÊN ĐỘI */}
                    <div className="rg-field">
                      <label className="rg-label">Tên đội *</label>
                      <input className="rg-input" required
                        placeholder="Ví dụ: Vũng Tàu Smashers..."
                        value={teamName} onChange={e => setTeamName(e.target.value)} />
                    </div>

                    {/* TÌM ĐỒNG ĐỘI */}
                    <div className="rg-field">
                      <label className="rg-label">Mời đồng đội</label>
                      <div className="rg-dropdown-wrap">
                        <div className="rg-search-row">
                          <input className="rg-input" style={{flex:1}}
                            placeholder="Tìm theo tên hoặc email..."
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearchUser(); } }} />
                          <button type="button" className="rg-search-btn"
                            onClick={handleSearchUser} disabled={isSearching}>
                            {isSearching ? 'Đang tìm...' : 'Tìm kiếm'}
                          </button>
                        </div>

                        {searchResults.length > 0 && (
                          <div className="rg-dropdown">
                            {searchResults.map(user => (
                              <div key={user._id} className="rg-dropdown-item">
                                <div>
                                  <div className="rg-dropdown-name">
                                    {user.playerInfo?.name || user.username}
                                  </div>
                                  <div className="rg-dropdown-sub">
                                    Level: {user.playerInfo?.level || 'N/A'} &nbsp;·&nbsp; {user.email}
                                  </div>
                                </div>
                                <button type="button" className="rg-invite-btn" onClick={() => addMember(user)}>
                                  Mời
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DANH SÁCH ĐÃ MỜI */}
                    {invitedMembers.length > 0 && (
                      <div className="rg-member-box">
                        <div className="rg-member-head">Đồng đội chờ xác nhận</div>
                        {invitedMembers.map(member => (
                          <div key={member._id} className="rg-member-row">
                            <span className="rg-member-name">
                              {member.playerInfo?.name || member.username}
                            </span>
                            <button type="button" className="rg-remove-btn"
                              onClick={() => removeMember(member._id)}>
                              Xóa
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* ── SUBMIT ── */}
              {selectedCategory && (
                <button type="submit" className="rg-submit-btn"
                  disabled={isSaving || !selectedCategory}>
                  {isSaving ? 'Đang xử lý...' : 'Tiến hành đăng ký'}
                </button>
              )}

            </form>
          </div>

        </div>
      </div>
    </>
  );
};

export default RegisterTeam;