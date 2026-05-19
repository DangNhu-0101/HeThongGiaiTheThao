import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api/axiosConfig';

const SPORTS_LIST = ["Pickleball", "Tennis", "Badminton", "Table Tennis", "Football", "Volleyball"];
const CATEGORIES_LIST = [
  { id: 'MS', label: 'Đơn Nam (MS)' },
  { id: 'WS', label: 'Đơn Nữ (WS)' },
  { id: 'MD', label: 'Đôi Nam (MD)' },
  { id: 'WD', label: 'Đôi Nữ (WD)' },
  { id: 'XD', label: 'Đôi Nam Nữ (XD)' },
];

const IMAGE_BASE_URL = "http://localhost:5001/";

const TournamentDetailView = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [tournament, setTournament] = useState(null);

  const [formData, setFormData] = useState({
    name: '', slogan: '', targetParticipants: '', location: '', description: '', prizes: '', organizer: ''
  });

  const [contactPerson, setContactPerson] = useState({ name: '', phone: '' });
  const [timeLine, setTimeLine] = useState({
    registrationStart: '', registrationEnd: '', tournamentStart: '', tournamentEnd: ''
  });

  const [sportsConfig, setSportsConfig] = useState(
    SPORTS_LIST.reduce((acc, sport) => {
      acc[sport] = { selected: false, feePerAthlete: '', maxTeams: '', categories: [] };
      return acc;
    }, {})
  );

  const [galaConfig, setGalaConfig] = useState({ hasGala: false, time: '', location: '', description: '' });
  const [files, setFiles] = useState({ logo: null, paymentQR: null, banners: [] });
  const [previews, setPreviews] = useState({ logo: null, paymentQR: null, banners: [] });

  const formatPath = (path) => path ? IMAGE_BASE_URL + path.replace(/\\/g, '/') : null;

  useEffect(() => {
    api.get('/users/organizations')
      .then(res => {
        const orgList = res.data?.data?.data || res.data?.data || res.data?.organizations || [];
        setOrganizations(orgList);
      })
      .catch(() => setOrganizations([]));

    if (id) {
      setLoading(true);
      api.get(`/tournaments/${id}`)
        .then(res => {
          const d = res.data?.data;
          if (!d) return;
          setTournament(d);
          setFormData({
            name: d.name || '',
            slogan: d.slogan || '',
            targetParticipants: d.targetParticipants || '',
            location: d.location || '',
            description: d.description || '',
            prizes: d.prizes || '',
            organizer: d.organizer?._id || d.organizer || ''
          });
          setContactPerson({ name: d.contactPerson?.name || '', phone: d.contactPerson?.phone || '' });
          setTimeLine({
            registrationStart: d.timeLine?.registrationStart?.slice(0, 16) || '',
            registrationEnd: d.timeLine?.registrationEnd?.slice(0, 16) || '',
            tournamentStart: d.timeLine?.tournamentStart?.slice(0, 16) || '',
            tournamentEnd: d.timeLine?.tournamentEnd?.slice(0, 16) || '',
          });

          const newSports = { ...sportsConfig };
          d.sportsConfig?.forEach(item => {
            if (newSports[item.sport]) {
              newSports[item.sport] = {
                selected: true,
                feePerAthlete: item.feePerAthlete || '',
                maxTeams: item.maxTeams || '',
                categories: item.categories || []
              };
            }
          });
          setSportsConfig(newSports);

          if (d.galaConfig) setGalaConfig({ ...d.galaConfig, time: d.galaConfig.time?.slice(0, 16) || '' });

          setPreviews({
            logo: formatPath(d.logo),
            paymentQR: formatPath(d.paymentQR),
            banners: Array.isArray(d.banners) ? d.banners.map(b => formatPath(b)) : []
          });
        })
        .catch(err => console.error("Lỗi tải giải đấu:", err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleTextChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleContactChange = e => setContactPerson(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleTimeChange = e => setTimeLine(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleGalaChange = e => setGalaConfig(p => ({ ...p, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleFileChange = e => {
    const { name, files: f } = e.target;
    if (name === 'banners') {
      const arr = Array.from(f);
      setFiles(p => ({ ...p, banners: [...p.banners, ...arr] }));
      setPreviews(p => ({ ...p, banners: [...p.banners, ...arr.map(x => URL.createObjectURL(x))] }));
    } else {
      if (f[0]) {
        setFiles(p => ({ ...p, [name]: f[0] }));
        setPreviews(p => ({ ...p, [name]: URL.createObjectURL(f[0]) }));
      }
    }
  };

  const removeBanner = (index) => {
    setFiles(p => ({ ...p, banners: p.banners.filter((_, i) => i !== index) }));
    setPreviews(p => ({ ...p, banners: p.banners.filter((_, i) => i !== index) }));
  };

  const toggleSport = sport => setSportsConfig(p => ({ ...p, [sport]: { ...p[sport], selected: !p[sport].selected } }));
  const handleSportFieldChange = (sport, field, val) => setSportsConfig(p => ({ ...p, [sport]: { ...p[sport], [field]: val } }));
  const toggleCategory = (sport, catId) => setSportsConfig(p => {
    const cats = p[sport].categories;
    const newCats = cats.includes(catId) ? cats.filter(c => c !== catId) : [...cats, catId];
    return { ...p, [sport]: { ...p[sport], categories: newCats } };
  });

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    const payload = new FormData();

    payload.append('displayName', formData.name);
    payload.append('venue', formData.location);
    payload.append('targetAudience', formData.targetParticipants);
    payload.append('description', formData.description);
    payload.append('prizes', formData.prizes);
    payload.append('contactPerson', JSON.stringify(contactPerson));
    payload.append('timeRegister', timeLine.registrationStart);
    payload.append('timeCloseRegister', timeLine.registrationEnd);
    payload.append('timeOpen', timeLine.tournamentStart);
    payload.append('timeClose', timeLine.tournamentEnd);
    payload.append('galaConfig', JSON.stringify(galaConfig));

    const activeSports = Object.keys(sportsConfig)
      .filter(k => sportsConfig[k].selected)
      .map(k => ({
        sport: k,
        feePerAthlete: Number(sportsConfig[k].feePerAthlete) || 0,
        maxTeams: sportsConfig[k].maxTeams ? Number(sportsConfig[k].maxTeams) : null,
        categories: sportsConfig[k].categories
      }));

    if (activeSports.length === 0) { alert("Vui lòng chọn ít nhất 1 môn!"); setSaving(false); return; }
    payload.append('sportsConfig', JSON.stringify(activeSports));
    payload.append('sportType', JSON.stringify(activeSports.map(s => s.sport)));

    if (files.logo) payload.append('logo', files.logo);
    if (files.paymentQR) payload.append('paymentQR', files.paymentQR);
    files.banners.forEach(b => payload.append('banners', b));

    try {
      await api.put(`/tournaments/${id}`, payload);
      alert("Cập nhật giải đấu thành công!");
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi hệ thống');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'var(--bg-light)',
      color: 'var(--ocean-mid)',
      fontFamily: 'var(--font-title)',
      fontSize: '1.25rem',
      fontWeight: 'bold'
    }}>
      ĐANG TẢI DỮ LIỆU...
    </div>
  );

  if (!tournament) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'var(--bg-light)',
      color: 'var(--logo-red)',
      fontFamily: 'var(--font-title)',
      fontSize: '1.25rem',
      fontWeight: 'bold'
    }}>
      KHÔNG TÌM THẤY GIẢI ĐẤU
    </div>
  );

  return (
    <>
      <style>{`
        .tm-container {
          min-height: 100vh;
          background: var(--bg-light);
          padding: 40px 20px;
        }

        .tm-dialog {
          max-width: 1000px;
          margin: 0 auto;
          background: var(--bg-white);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(2, 69, 122, 0.1);
          font-family: 'Be Vietnam Pro', 'Segoe UI', sans-serif;
        }

        @media (max-width: 640px) {
          .tm-dialog { border-radius: 16px; }
        }

        .tm-header {
          padding: 24px 30px;
          background: linear-gradient(135deg, var(--ocean-deep), var(--ocean-mid));
          color: white;
        }

        @media (max-width: 640px) {
          .tm-header { padding: 20px; }
        }

        .tm-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .tm-status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          margin-top: 8px;
        }

        .tm-status-upcoming { background: rgba(255, 193, 7, 0.2); color: #856404; }
        .tm-status-ongoing { background: rgba(40, 167, 69, 0.2); color: #155724; }
        .tm-status-completed { background: rgba(108, 117, 125, 0.2); color: #4a5568; }

        .tm-body {
          padding: 30px;
          background: var(--bg-white);
        }

        @media (max-width: 640px) {
          .tm-body { padding: 20px; }
        }

        .tm-section {
          background: var(--bg-white);
          border: 1px solid var(--ocean-pale);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
        }

        @media (max-width: 640px) {
          .tm-section { padding: 16px; margin-bottom: 16px; }
        }

        .tm-label-sec {
          font-size: 11px;
          font-weight: 800;
          color: var(--ocean-mid);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tm-label-sec::before {
          content: "";
          width: 4px;
          height: 16px;
          background: var(--ocean-mid);
          border-radius: 4px;
        }

        .tm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 768px) {
          .tm-grid { grid-template-columns: 1fr; gap: 12px; }
        }

        .tm-full { grid-column: 1 / -1; }

        .tm-input, .tm-select, .tm-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid var(--ocean-pale);
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
          font-family: inherit;
          background: var(--bg-white);
        }

        .tm-input:focus, .tm-select:focus, .tm-textarea:focus {
          border-color: var(--ocean-mid);
          box-shadow: 0 0 0 3px rgba(1, 138, 190, 0.1);
        }

        .tm-sport-tag {
          padding: 8px 18px;
          border-radius: 30px;
          border: 1.5px solid var(--ocean-pale);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          background: var(--bg-white);
          color: var(--ocean-deep);
          transition: all 0.2s;
        }

        .tm-sport-tag:hover {
          border-color: var(--ocean-mid);
        }

        .tm-sport-tag.sel {
          background: var(--ocean-mid);
          color: white;
          border-color: var(--ocean-mid);
        }

        .tm-cat-card {
          border: 1px solid var(--ocean-pale);
          border-radius: 16px;
          padding: 20px;
          background: var(--bg-light);
          margin-bottom: 12px;
        }

        @media (max-width: 640px) {
          .tm-cat-card { padding: 14px; }
        }

        .tm-upload-box {
          border: 2px dashed var(--ocean-pale);
          border-radius: 16px;
          height: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          background: var(--bg-light);
          transition: all 0.2s;
        }

        .tm-upload-box:hover {
          border-color: var(--ocean-mid);
        }

        .tm-upload-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
        }

        .tm-banner-wrap {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 10px;
          margin-top: 12px;
        }

        .tm-banner-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid var(--ocean-pale);
        }

        .tm-remove {
          position: absolute;
          top: 4px;
          right: 4px;
          background: var(--logo-red);
          color: white;
          border: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tm-footer {
          padding: 20px 30px;
          background: var(--bg-white);
          border-top: 1px solid var(--ocean-pale);
          display: flex;
          justify-content: flex-end;
        }

        @media (max-width: 640px) {
          .tm-footer { padding: 16px 20px; }
        }

        .tm-btn-submit {
          background: linear-gradient(90deg, var(--ocean-deep), var(--ocean-mid));
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tm-btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(1, 138, 190, 0.3);
        }

        .tm-btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      <div className="tm-container">
        <div className="tm-dialog">
          <div className="tm-header">
            <h2>🔧 CHỈNH SỬA GIẢI ĐẤU</h2>
            <div>
              <span className={`tm-status-badge tm-status-${tournament.status || 'upcoming'}`}>
                {tournament.status === 'upcoming' ? 'Sắp diễn ra' : 
                 tournament.status === 'ongoing' ? 'Đang diễn ra' : 
                 tournament.status === 'completed' ? 'Đã kết thúc' : 'Đang cập nhật'}
              </span>
              <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 12 }}>
                ID: {tournament._id?.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="tm-body">
            <form id="tour-form" onSubmit={handleSubmit}>

              <div className="tm-section">
                <div className="tm-label-sec">Thông tin định danh</div>
                <div className="tm-grid">
                  <div className="tm-full">
                    <input name="name" className="tm-input" required value={formData.name} onChange={handleTextChange} placeholder="Tên giải đấu chính thức *" />
                  </div>
                  <div><input name="slogan" className="tm-input" value={formData.slogan} onChange={handleTextChange} placeholder="Slogan giải đấu" /></div>
                  <div>
                    <select name="organizer" className="tm-select" required value={formData.organizer} onChange={handleTextChange}>
                      <option value="">-- Chọn Đơn vị tổ chức --</option>
                      {organizations.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                    </select>
                  </div>
                  <div><input name="targetParticipants" className="tm-input" value={formData.targetParticipants} onChange={handleTextChange} placeholder="Đối tượng tham gia" /></div>
                  <div><input name="location" className="tm-input" value={formData.location} onChange={handleTextChange} placeholder="Địa điểm tổ chức" /></div>
                  <div className="tm-full">
                    <textarea name="description" className="tm-textarea" rows="3" value={formData.description} onChange={handleTextChange} placeholder="Mô tả giải đấu..." />
                  </div>
                </div>
              </div>

              <div className="tm-section">
                <div className="tm-label-sec">Lịch trình & Liên hệ</div>
                <div className="tm-grid">
                  <div><input name="name" className="tm-input" value={contactPerson.name} onChange={handleContactChange} placeholder="Người phụ trách liên hệ" /></div>
                  <div><input name="phone" className="tm-input" value={contactPerson.phone} onChange={handleContactChange} placeholder="Hotline/Zalo liên hệ" /></div>
                  <div><label style={{fontSize:10, fontWeight:700, color:'var(--ocean-mid)'}}>MỞ ĐĂNG KÝ</label><input type="datetime-local" name="registrationStart" className="tm-input" required value={timeLine.registrationStart} onChange={handleTimeChange} /></div>
                  <div><label style={{fontSize:10, fontWeight:700, color:'var(--ocean-mid)'}}>ĐÓNG ĐĂNG KÝ</label><input type="datetime-local" name="registrationEnd" className="tm-input" required value={timeLine.registrationEnd} onChange={handleTimeChange} /></div>
                  <div><label style={{fontSize:10, fontWeight:700, color:'var(--ocean-mid)'}}>KHAI MẠC</label><input type="datetime-local" name="tournamentStart" className="tm-input" required value={timeLine.tournamentStart} onChange={handleTimeChange} /></div>
                  <div><label style={{fontSize:10, fontWeight:700, color:'var(--ocean-mid)'}}>BẾ MẠC</label><input type="datetime-local" name="tournamentEnd" className="tm-input" required value={timeLine.tournamentEnd} onChange={handleTimeChange} /></div>
                </div>
              </div>

              <div className="tm-section">
                <div className="tm-label-sec">Môn thi đấu & Nội dung</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                  {SPORTS_LIST.map(s => (
                    <div key={s} className={`tm-sport-tag ${sportsConfig[s].selected ? 'sel' : ''}`} onClick={() => toggleSport(s)}>{s}</div>
                  ))}
                </div>
                {SPORTS_LIST.filter(s => sportsConfig[s].selected).map(s => (
                  <div key={s} className="tm-cat-card">
                    <div style={{ fontWeight: 800, color: 'var(--ocean-mid)', marginBottom: 12, fontSize: 13 }}>MÔN {s.toUpperCase()}</div>
                    <div className="tm-grid">
                      <input type="number" className="tm-input" placeholder="Lệ phí / 1 VĐV (VNĐ)" value={sportsConfig[s].feePerAthlete} onChange={e => handleSportFieldChange(s, 'feePerAthlete', e.target.value)} />
                      <input type="number" className="tm-input" placeholder="Giới hạn số đội (Để trống = KGH)" value={sportsConfig[s].maxTeams} onChange={e => handleSportFieldChange(s, 'maxTeams', e.target.value)} />
                    </div>
                    <div style={{ marginTop: 15 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ocean-mid)' }}>NỘI DUNG TỔ CHỨC:</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                        {CATEGORIES_LIST.map(cat => {
                          const isSel = sportsConfig[s].categories.includes(cat.id);
                          return (
                            <button type="button" key={cat.id} onClick={() => toggleCategory(s, cat.id)}
                              style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid var(--ocean-pale)', background: isSel ? 'var(--ocean-mid)' : 'var(--bg-white)', color: isSel ? 'white' : 'var(--ocean-deep)', fontSize: 11, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {SPORTS_LIST.filter(s => sportsConfig[s].selected).length === 0 && (
                  <p style={{ textAlign: 'center', padding: 20, color: '#7a8fa0' }}>Vui lòng chọn ít nhất 1 môn thi đấu</p>
                )}
              </div>

              <div className="tm-section">
                <div className="tm-label-sec">Sự kiện Gala Dinner</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15, cursor: 'pointer' }}>
                  <input type="checkbox" name="hasGala" checked={galaConfig.hasGala} onChange={handleGalaChange} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ocean-deep)' }}>Có tổ chức Gala Dinner tổng kết & trao giải</span>
                </label>
                {galaConfig.hasGala && (
                  <div className="tm-grid">
                    <input type="datetime-local" name="time" className="tm-input" value={galaConfig.time} onChange={handleGalaChange} />
                    <input name="location" className="tm-input" value={galaConfig.location} onChange={handleGalaChange} placeholder="Địa điểm tổ chức Gala" />
                    <textarea name="description" className="tm-textarea tm-full" rows="2" value={galaConfig.description} onChange={handleGalaChange} placeholder="Mô tả Gala (Dresscode, kịch bản...)" />
                  </div>
                )}
              </div>

              <div className="tm-section">
                <div className="tm-label-sec">Hình ảnh & Giải thưởng</div>
                <div className="tm-grid">
                  <textarea name="prizes" className="tm-textarea tm-full" rows="3" value={formData.prizes} onChange={handleTextChange} placeholder="Cơ cấu giải thưởng (VD: Nhất 5tr, Nhì 3tr...)" />
                  
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ocean-mid)' }}>LOGO GIẢI</label>
                    <div className="tm-upload-box">
                      {previews.logo && <img src={previews.logo} alt="" />}
                      <input type="file" name="logo" accept="image/*" onChange={handleFileChange} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                      {!previews.logo && <span style={{ fontSize: 10, color: 'var(--ocean-mid)', fontWeight: 800 }}>+ TẢI LOGO</span>}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ocean-mid)' }}>QR THANH TOÁN</label>
                    <div className="tm-upload-box">
                      {previews.paymentQR && <img src={previews.paymentQR} alt="" />}
                      <input type="file" name="paymentQR" accept="image/*" onChange={handleFileChange} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                      {!previews.paymentQR && <span style={{ fontSize: 10, color: 'var(--ocean-mid)', fontWeight: 800 }}>+ TẢI QR</span>}
                    </div>
                  </div>

                  <div className="tm-full">
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ocean-mid)' }}>BANNER GIẢI (CHỌN NHIỀU ẢNH)</label>
                    <div className="tm-upload-box" style={{ height: 70 }}>
                      <input type="file" name="banners" accept="image/*" multiple onChange={handleFileChange} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                      <span style={{ fontSize: 12, color: 'var(--ocean-mid)', fontWeight: 800 }}>+ BẤM ĐỂ CHỌN NHIỀU BANNER</span>
                    </div>
                    <div className="tm-banner-wrap">
                      {previews.banners.map((url, i) => (
                        <div key={i} className="tm-banner-item">
                          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" className="tm-remove" onClick={() => removeBanner(i)}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </form>
          </div>

          <div className="tm-footer">
            <button type="submit" form="tour-form" className="tm-btn-submit" disabled={saving}>
              {saving ? '⏳ Đang lưu...' : '💾 LƯU THAY ĐỔI'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TournamentDetailView;