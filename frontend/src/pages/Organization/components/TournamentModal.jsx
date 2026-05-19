import React, { useState, useEffect } from 'react';
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

const TournamentModal = ({ mode, tourId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    slogan: '',
    targetParticipants: '',
    location: '',
    description: '',
    prizes: '',
    organizer: ''
  });

  const [contactPerson, setContactPerson] = useState({ name: '', phone: '' });

  const [timeLine, setTimeLine] = useState({
    registrationStart: '',
    registrationEnd: '',
    tournamentStart: '',
    tournamentEnd: ''
  });

  const [sportsConfig, setSportsConfig] = useState(
    SPORTS_LIST.reduce((acc, sport) => {
      acc[sport] = { selected: false, feePerAthlete: '', maxTeams: '', categories: [] };
      return acc;
    }, {})
  );

  const [galaConfig, setGalaConfig] = useState({
    hasGala: false,
    time: '',
    location: '',
    description: ''
  });

  const [files, setFiles] = useState({ logo: null, paymentQR: null, banners: [] });
  const [previews, setPreviews] = useState({ logo: null, paymentQR: null, banners: [] });

  useEffect(() => {
    api.get('/users/organizations')
      .then(res => {
        const orgList = res.data?.data?.data || res.data?.data || res.data?.org || [];
        setOrganizations(orgList);
      })
      .catch(err => {
        console.error("Lỗi tải danh sách tổ chức:", err);
        setOrganizations([]);
      });

    if (mode === 'edit' && tourId) {
      setLoading(true);
      api.get(`/tournaments/${tourId}`)
        .then(res => {
          const d = res.data.data;
          if (!d) return;
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

          const fp = p => p ? (p.startsWith('http') ? p : IMAGE_BASE_URL + p.replace(/\\/g, '/')) : null;
          setPreviews({
            logo: fp(d.logo),
            paymentQR: fp(d.paymentQR),
            banners: Array.isArray(d.banners) ? d.banners.map(b => fp(b)) : []
          });
        })
        .finally(() => setLoading(false));
    }
  }, [mode, tourId]);

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
    setLoading(true);
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

    if (activeSports.length === 0) { alert("Vui lòng chọn ít nhất 1 môn thi đấu!"); setLoading(false); return; }
    payload.append('sportsConfig', JSON.stringify(activeSports));
    payload.append('sportType', JSON.stringify(activeSports.map(s => s.sport)));

    if (files.logo) payload.append('logo', files.logo);
    if (files.paymentQR) payload.append('paymentQR', files.paymentQR);
    files.banners.forEach(b => payload.append('banners', b));

    try {
      const ep = mode === 'create' ? '/tournaments/createTournament' : `/tournaments/${tourId}`;
      await api[mode === 'create' ? 'post' : 'put'](ep, payload);
      alert("Xử lý giải đấu thành công!");
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi hệ thống');
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        .tm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2,30,55,0.85);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          padding: 20px;
        }

        .tm-dialog {
          background: #fff;
          border-radius: 24px;
          width: 100%;
          max-width: 850px;
          max-height: 95vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0,0,0,0.3);
          font-family: 'Be Vietnam Pro', sans-serif;
        }

        @media (max-width: 640px) {
          .tm-dialog {
            max-width: 95%;
            border-radius: 16px;
          }
        }

        .tm-header {
          padding: 20px 30px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        @media (max-width: 640px) {
          .tm-header {
            padding: 16px 20px;
          }
          
          .tm-header h2 {
            font-size: 18px;
          }
        }

        .tm-body {
          flex: 1;
          overflow-y: auto;
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: #fcfcfc;
        }

        @media (max-width: 640px) {
          .tm-body {
            padding: 16px;
            gap: 16px;
          }
        }

        .tm-section {
          border: 1px solid rgba(1,138,190,0.1);
          border-radius: 20px;
          padding: 20px;
          background: #fff;
        }

        @media (max-width: 640px) {
          .tm-section {
            padding: 14px;
            border-radius: 16px;
          }
        }

        .tm-label-sec {
          font-size: 11px;
          font-weight: 800;
          color: #018ABE;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tm-label-sec::before {
          content: "";
          width: 4px;
          height: 14px;
          background: #018ABE;
          border-radius: 4px;
        }

        .tm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        @media (max-width: 768px) {
          .tm-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        .tm-full {
          grid-column: 1 / -1;
        }

        .tm-input, .tm-select, .tm-textarea {
          width: 100%;
          padding: 12px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          transition: 0.2s;
          font-family: inherit;
        }

        @media (max-width: 640px) {
          .tm-input, .tm-select, .tm-textarea {
            padding: 10px;
            font-size: 16px;
          }
        }

        .tm-input:focus, .tm-select:focus, .tm-textarea:focus {
          border-color: #018ABE;
          box-shadow: 0 0 0 4px rgba(1,138,190,0.08);
        }

        .tm-sport-tag {
          padding: 8px 18px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          background: #fff;
          color: #64748b;
          transition: all 0.2s;
        }

        @media (max-width: 640px) {
          .tm-sport-tag {
            padding: 10px 16px;
            font-size: 14px;
          }
        }

        .tm-sport-tag.sel {
          background: #018ABE;
          color: #fff;
          border-color: #018ABE;
        }

        .tm-cat-card {
          border: 1px solid #EEF6FB;
          border-radius: 16px;
          padding: 18px;
          background: #F8FAFC;
          margin-bottom: 10px;
        }

        @media (max-width: 640px) {
          .tm-cat-card {
            padding: 12px;
          }
        }

        .tm-upload-box {
          border: 2px dashed #CBD5E1;
          border-radius: 16px;
          height: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          background: #F1F5F9;
        }

        @media (max-width: 640px) {
          .tm-upload-box {
            height: 90px;
          }
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
          margin-top: 10px;
        }

        @media (max-width: 640px) {
          .tm-banner-wrap {
            grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
            gap: 8px;
          }
        }

        .tm-banner-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #ddd;
        }

        .tm-remove {
          position: absolute;
          top: 2px;
          right: 2px;
          background: rgba(220,38,38,0.9);
          color: #fff;
          border: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          font-size: 10px;
          cursor: pointer;
        }

        .tm-footer {
          padding: 20px 30px;
          border-top: 1px solid #f0f0f0;
          display: flex;
          gap: 12px;
          background: #fff;
        }

        @media (max-width: 640px) {
          .tm-footer {
            padding: 16px 20px;
            flex-direction: column;
          }
        }

        .tm-btn-submit {
          flex: 1;
          background: #018ABE;
          color: #fff;
          border: none;
          padding: 14px;
          border-radius: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        @media (max-width: 640px) {
          .tm-btn-submit {
            padding: 12px;
          }
        }

        .tm-btn-submit:hover {
          background: #02457A;
        }

        .tm-cancel-btn {
          padding: 12px 25px;
          border-radius: 14px;
          border: 1.5px solid #E2E8F0;
          background: #fff;
          cursor: pointer;
          font-weight: 600;
          color: #64748b;
        }

        @media (max-width: 640px) {
          .tm-cancel-btn {
            padding: 12px;
          }
        }
      `}</style>

      <div className="tm-overlay">
        <div className="tm-dialog">
          <div className="tm-header">
            <h2 style={{ margin: 0, color: '#02457A', fontSize: '20px', fontWeight: 800 }}>
              {mode === 'create' ? '🏆 KHỞI TẠO GIẢI ĐẤU' : '🔧 CHỈNH SỬA GIẢI ĐẤU'}
            </h2>
            <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
          </div>

          <div className="tm-body">
            <form id="tour-form" onSubmit={handleSubmit}>

              <div className="tm-section">
                <div className="tm-label-sec">Thông tin định danh</div>
                <div className="tm-grid">
                  <div className="tm-field tm-full">
                    <input name="name" className="tm-input" required value={formData.name} onChange={handleTextChange} placeholder="Tên giải đấu chính thức *" />
                  </div>
                  <div className="tm-field">
                    <input name="slogan" className="tm-input" value={formData.slogan} onChange={handleTextChange} placeholder="Slogan giải đấu" />
                  </div>
                  <div className="tm-field">
                    <select name="organizer" className="tm-select" required value={formData.organizer} onChange={handleTextChange}>
                      <option value="">-- Chọn Đơn vị tổ chức --</option>
                      {organizations.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                    </select>
                  </div>
                  <div className="tm-field">
                    <input name="targetParticipants" className="tm-input" value={formData.targetParticipants} onChange={handleTextChange} placeholder="Đối tượng tham gia (VD: Sinh viên, IT...)" />
                  </div>
                  <div className="tm-field">
                    <input name="location" className="tm-input" value={formData.location} onChange={handleTextChange} placeholder="Địa điểm tổ chức" />
                  </div>
                  <div className="tm-field tm-full">
                    <textarea name="description" className="tm-textarea" value={formData.description} onChange={handleTextChange} placeholder="Mô tả ngắn gọn về giải đấu..." />
                  </div>
                </div>
              </div>

              <div className="tm-section">
                <div className="tm-label-sec">Lịch trình & Liên hệ</div>
                <div className="tm-grid">
                  <div className="tm-field"><input name="name" className="tm-input" value={contactPerson.name} onChange={handleContactChange} placeholder="Người phụ trách liên hệ" /></div>
                  <div className="tm-field"><input name="phone" className="tm-input" value={contactPerson.phone} onChange={handleContactChange} placeholder="Hotline/Zalo liên hệ" /></div>
                  <div className="tm-field"><label style={{fontSize:9, fontWeight:700, color:'#94a3b8'}}>MỞ ĐĂNG KÝ</label><input type="datetime-local" name="registrationStart" className="tm-input" required value={timeLine.registrationStart} onChange={handleTimeChange} /></div>
                  <div className="tm-field"><label style={{fontSize:9, fontWeight:700, color:'#94a3b8'}}>ĐÓNG ĐĂNG KÝ</label><input type="datetime-local" name="registrationEnd" className="tm-input" required value={timeLine.registrationEnd} onChange={handleTimeChange} /></div>
                  <div className="tm-field"><label style={{fontSize:9, fontWeight:700, color:'#94a3b8'}}>KHAI MẠC</label><input type="datetime-local" name="tournamentStart" className="tm-input" required value={timeLine.tournamentStart} onChange={handleTimeChange} /></div>
                  <div className="tm-field"><label style={{fontSize:9, fontWeight:700, color:'#94a3b8'}}>BẾ MẠC</label><input type="datetime-local" name="tournamentEnd" className="tm-input" required value={timeLine.tournamentEnd} onChange={handleTimeChange} /></div>
                </div>
              </div>

              <div className="tm-section">
                <div className="tm-label-sec">Môn thi đấu & Nội dung</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 15 }}>
                  {SPORTS_LIST.map(s => (
                    <div key={s} className={`tm-sport-tag ${sportsConfig[s].selected ? 'sel' : ''}`} onClick={() => toggleSport(s)}>{s}</div>
                  ))}
                </div>
                {SPORTS_LIST.filter(s => sportsConfig[s].selected).map(s => (
                  <div key={s} className="tm-cat-card">
                    <div style={{ fontWeight: 800, color: '#018ABE', marginBottom: 12, fontSize: 12 }}>MÔN {s.toUpperCase()}</div>
                    <div className="tm-grid">
                      <input type="number" className="tm-input" placeholder="Lệ phí / 1 VĐV (VNĐ)" value={sportsConfig[s].feePerAthlete} onChange={e => handleSportFieldChange(s, 'feePerAthlete', e.target.value)} />
                      <input type="number" className="tm-input" placeholder="Giới hạn số đội (Để trống = KGH)" value={sportsConfig[s].maxTeams} onChange={e => handleSportFieldChange(s, 'maxTeams', e.target.value)} />
                    </div>
                    <div style={{ marginTop: 15 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>NỘI DUNG TỔ CHỨC:</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                        {CATEGORIES_LIST.map(cat => {
                          const isSel = sportsConfig[s].categories.includes(cat.id);
                          return (
                            <button type="button" key={cat.id} onClick={() => toggleCategory(s, cat.id)}
                              style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: isSel ? '#018ABE' : '#fff', color: isSel ? '#fff' : '#64748b', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="tm-section">
                <div className="tm-label-sec">Sự kiện Gala Dinner</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15, cursor: 'pointer', flexWrap: 'wrap' }}>
                  <input type="checkbox" name="hasGala" checked={galaConfig.hasGala} onChange={handleGalaChange} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#02457A' }}>Có tổ chức Gala Dinner tổng kết & trao giải</span>
                </label>
                {galaConfig.hasGala && (
                  <div className="tm-grid">
                    <input type="datetime-local" name="time" className="tm-input" value={galaConfig.time} onChange={handleGalaChange} />
                    <input name="location" className="tm-input" value={galaConfig.location} onChange={handleGalaChange} placeholder="Địa điểm tổ chức Gala" />
                    <textarea name="description" className="tm-textarea tm-full" value={galaConfig.description} onChange={handleGalaChange} placeholder="Mô tả Gala (Dresscode, kịch bản...)" />
                  </div>
                )}
              </div>

              <div className="tm-section">
                <div className="tm-label-sec">Hình ảnh & Giải thưởng</div>
                <div className="tm-grid">
                  <textarea name="prizes" className="tm-textarea tm-full" value={formData.prizes} onChange={handleTextChange} placeholder="Cơ cấu giải thưởng (VD: Nhất 5tr, Nhì 3tr...)" />
                  
                  <div className="tm-field">
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>LOGO GIẢI</label>
                    <div className="tm-upload-box">
                      {previews.logo && <img src={previews.logo} alt="" />}
                      <input type="file" name="logo" accept="image/*" onChange={handleFileChange} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                      {!previews.logo && <span style={{ fontSize: 10, color: '#018ABE', fontWeight: 800 }}>+ TẢI LOGO</span>}
                    </div>
                  </div>

                  <div className="tm-field">
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>QR THANH TOÁN</label>
                    <div className="tm-upload-box">
                      {previews.paymentQR && <img src={previews.paymentQR} alt="" />}
                      <input type="file" name="paymentQR" accept="image/*" onChange={handleFileChange} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                      {!previews.paymentQR && <span style={{ fontSize: 10, color: '#018ABE', fontWeight: 800 }}>+ TẢI QR</span>}
                    </div>
                  </div>

                  <div className="tm-field tm-full">
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>BANNER GIẢI (CHỌN NHIỀU ẢNH)</label>
                    <div className="tm-upload-box" style={{ height: 60 }}>
                      <input type="file" name="banners" accept="image/*" multiple onChange={handleFileChange} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                      <span style={{ fontSize: 11, color: '#018ABE', fontWeight: 800 }}>+ BẤM ĐỂ CHỌN NHIỀU BANNER</span>
                    </div>
                    <div className="tm-banner-wrap">
                      {previews.banners.map((url, i) => (
                        <div key={i} className="tm-banner-item">
                          <img src={url} alt="" />
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
            <button type="button" onClick={onClose} className="tm-cancel-btn">Hủy bỏ</button>
            <button type="submit" form="tour-form" className="tm-btn-submit" disabled={loading}>
              {loading ? 'Đang xử lý dữ liệu...' : mode === 'create' ? '🚀 KHỞI TẠO GIẢI ĐẤU' : '🔧 LƯU THAY ĐỔI'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TournamentModal;
