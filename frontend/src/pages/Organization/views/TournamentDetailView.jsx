import React, { useState, useEffect } from 'react';
import api from '../../../api/axiosConfig';

const SPORTS_LIST = ["Pickleball", "Tennis", "Badminton", "Table Tennis", "Football", "Volleyball"];
const CATEGORIES_LIST = [
    { id: 'MS', label: 'Đơn Nam (MS)' },
    { id: 'WS', label: 'Đơn Nữ (WS)' },
    { id: 'MD', label: 'Đôi Nam (MD)' },
    { id: 'WD', label: 'Đôi Nữ (WD)' },
    { id: 'XD', label: 'Đôi Nam Nữ (XD)' }
];

const TournamentDetailView = ({ mode, tourId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const IMAGE_BASE_URL = "http://localhost:5001/";

    const [formData, setFormData] = useState({
        displayName: "", slogan: "", contactPerson: "", targetAudience: "",
        venue: "", description: "", prizes: "",
        timeRegister: "", timeCloseRegister: "", timeOpen: "", timeClose: ""
    });

    const getInitialSports = () => SPORTS_LIST.reduce((acc, sport) => {
        acc[sport] = { selected: false, playerEntryFee: "", maxTeams: "", categories: [] };
        return acc;
    }, {});
    const [sportsConfig, setSportsConfig] = useState(getInitialSports());

    const [galaConfig, setGalaConfig] = useState({ hasGala: false, time: "", venue: "", description: "" });

    const [files, setFiles] = useState({ logo: null, banner: null, paymentQR: null });
    const [previews, setPreviews] = useState({ logo: null, banner: null, paymentQR: null });

    useEffect(() => {
        if (mode === 'edit' && tourId) {
            setLoading(true);
            api.get(`/tournaments/getTournament/${tourId}`)
                .then(res => {
                    const d = res.data.data;
                    if (!d) return;

                    setFormData({
                        displayName: d.displayName || "",
                        slogan: d.slogan || "",
                        contactPerson: d.contactPerson || "",
                        targetAudience: d.targetAudience || "",
                        venue: d.venue || "",
                        description: d.description || "",
                        prizes: d.prizes || "",
                        timeRegister: d.timeLine?.timeRegiter ? d.timeLine.timeRegiter.slice(0, 16) : "",
                        timeCloseRegister: d.timeLine?.timeCloseRegister ? d.timeLine.timeCloseRegister.slice(0, 16) : "",
                        timeOpen: d.timeLine?.timeOpen ? d.timeLine.timeOpen.slice(0, 16) : "",
                        timeClose: d.timeLine?.timeClose ? d.timeLine.timeClose.slice(0, 16) : "",
                    });

                    const newSports = getInitialSports();
                    d.sportsConfig?.forEach(item => {
                        if (newSports[item.sport]) {
                            newSports[item.sport] = {
                                selected: true,
                                playerEntryFee: item.playerEntryFee,
                                maxTeams: item.maxTeams || "",
                                categories: item.categories || []
                            };
                        }
                    });
                    setSportsConfig(newSports);

                    if (d.galaConfig) {
                        setGalaConfig({
                            hasGala: d.galaConfig.hasGala || false,
                            time: d.galaConfig.time ? d.galaConfig.time.slice(0, 16) : "",
                            venue: d.galaConfig.venue || "",
                            description: d.galaConfig.description || ""
                        });
                    }

                    const formatP = (path) => path ? IMAGE_BASE_URL + path.replace(/\\/g, '/') : null;
                    setPreviews({
                        logo: formatP(d.logo),
                        banner: formatP(d.banner),
                        paymentQR: formatP(d.paymentQR)
                    });
                })
                .catch(err => console.error("Lỗi tải data edit:", err))
                .finally(() => setLoading(false));
        }
    }, [mode, tourId]);

    const handleTextChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGalaChange = (e) => {
        const { name, value, type, checked } = e.target;
        setGalaConfig(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        const file = selectedFiles[0];
        if (file) {
            setFiles(prev => ({ ...prev, [name]: file }));
            setPreviews(prev => ({ ...prev, [name]: URL.createObjectURL(file) }));
        }
    };

    const toggleSport = (sport) => {
        setSportsConfig(prev => ({
            ...prev, [sport]: { ...prev[sport], selected: !prev[sport].selected }
        }));
    };

    const handleSportSettingChange = (sport, field, value) => {
        setSportsConfig(prev => ({
            ...prev, [sport]: { ...prev[sport], [field]: value }
        }));
    };

    const toggleCategory = (sport, categoryId) => {
        setSportsConfig(prev => {
            const currentCats = prev[sport].categories;
            const newCats = currentCats.includes(categoryId) ? currentCats.filter(c => c !== categoryId) : [...currentCats, categoryId];
            return { ...prev, [sport]: { ...prev[sport], categories: newCats } };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key]) payload.append(key, formData[key]);
        });

        const activeSportsArray = Object.keys(sportsConfig)
            .filter(key => sportsConfig[key].selected)
            .map(key => ({
                sport: key,
                playerEntryFee: Number(sportsConfig[key].playerEntryFee) || 0,
                maxTeams: sportsConfig[key].maxTeams ? Number(sportsConfig[key].maxTeams) : null,
                categories: sportsConfig[key].categories
            }));

        if (activeSportsArray.length === 0) {
            alert("Vui lòng chọn ít nhất 1 môn thi đấu!");
            setLoading(false);
            return;
        }
        payload.append('sportsConfig', JSON.stringify(activeSportsArray));
        payload.append('galaConfig', JSON.stringify(galaConfig));

        if (files.logo) payload.append('logo', files.logo);
        if (files.banner) payload.append('banner', files.banner);
        if (files.paymentQR) payload.append('paymentQR', files.paymentQR);

        try {
            const endpoint = mode === 'create' ? '/tournaments/createTournament' : `/tournaments/editTournament/${tourId}`;
            const method = mode === 'create' ? 'post' : 'patch';
            await api[method](endpoint, payload);
            alert(mode === 'create' ? "Khởi tạo thành công!" : "Cập nhật thành công!");
            onSuccess();
        } catch (err) {
            alert(err.response?.data?.message || "LỖI HỆ THỐNG");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                .tm2-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(7, 11, 20, 0.95);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                    padding: 20px;
                }

                .tm2-container {
                    background: #0F172A;
                    border: 1px solid #00F0FF;
                    padding: 25px;
                    width: 100%;
                    max-width: 800px;
                    max-height: 95vh;
                    overflow-y: auto;
                    border-radius: 12px;
                }

                @media (max-width: 768px) {
                    .tm2-container {
                        padding: 20px;
                    }
                }

                @media (max-width: 640px) {
                    .tm2-container {
                        padding: 16px;
                        max-width: 95%;
                    }
                }

                .tm2-header {
                    border-bottom: 1px solid rgba(0,240,255,0.3);
                    padding-bottom: 12px;
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .tm2-header h2 {
                    font-size: 1.25rem;
                    font-weight: 900;
                    color: #22d3ee;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }

                @media (max-width: 640px) {
                    .tm2-header h2 {
                        font-size: 1rem;
                    }
                }

                .tm2-close {
                    color: #f87171;
                    background: none;
                    border: none;
                    font-weight: 700;
                    cursor: pointer;
                }

                .tm2-section {
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid #1e293b;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                }

                @media (max-width: 640px) {
                    .tm2-section {
                        padding: 12px;
                        margin-bottom: 16px;
                    }
                }

                .tm2-section-title {
                    color: #fff;
                    font-size: 1rem;
                    font-weight: 900;
                    margin-bottom: 12px;
                    border-left: 4px solid #00F0FF;
                    padding-left: 10px;
                }

                @media (max-width: 640px) {
                    .tm2-section-title {
                        font-size: 0.875rem;
                    }
                }

                .tm2-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                }

                @media (max-width: 768px) {
                    .tm2-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                }

                .tm2-full {
                    grid-column: 1 / -1;
                }

                .tm2-label {
                    color: #00F0FF;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    font-weight: 700;
                    margin-bottom: 4px;
                    display: block;
                }

                .tm2-input, .tm2-select, .tm2-textarea {
                    width: 100%;
                    padding: 10px;
                    background: #0f172a;
                    border: 1px solid #1e293b;
                    border-radius: 6px;
                    color: #fff;
                    font-size: 0.875rem;
                    outline: none;
                }

                @media (max-width: 640px) {
                    .tm2-input, .tm2-select, .tm2-textarea {
                        padding: 10px;
                        font-size: 16px;
                    }
                }

                .tm2-input:focus, .tm2-select:focus, .tm2-textarea:focus {
                    border-color: #00F0FF;
                }

                .tm2-sport-tag {
                    padding: 6px 12px;
                    border: 1px solid #00F0FF;
                    border-radius: 4px;
                    cursor: pointer;
                    color: #94a3b8;
                    font-size: 0.8rem;
                    transition: 0.2s;
                }

                @media (max-width: 640px) {
                    .tm2-sport-tag {
                        padding: 8px 12px;
                        font-size: 0.75rem;
                    }
                }

                .tm2-sport-tag.active {
                    background: #00F0FF;
                    color: #000;
                    box-shadow: 0 0 10px rgba(0,240,255,0.4);
                }

                .tm2-sport-config {
                    padding: 16px;
                    border: 1px solid #0891b2;
                    border-radius: 8px;
                    background: rgba(15,23,42,0.5);
                    margin-bottom: 16px;
                }

                @media (max-width: 640px) {
                    .tm2-sport-config {
                        padding: 12px;
                    }
                }

                .tm2-preview-box {
                    position: relative;
                    height: 96px;
                    border: 1px dashed #0891b2;
                    border-radius: 8px;
                    background: #1e293b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    cursor: pointer;
                }

                @media (max-width: 640px) {
                    .tm2-preview-box {
                        height: 80px;
                    }
                }

                .tm2-preview-box img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .tm2-preview-box input {
                    position: absolute;
                    inset: 0;
                    opacity: 0;
                    cursor: pointer;
                }

                .tm2-actions {
                    display: flex;
                    gap: 16px;
                    margin-top: 16px;
                }

                @media (max-width: 640px) {
                    .tm2-actions {
                        flex-direction: column;
                        gap: 12px;
                    }
                }

                .tm2-btn-cancel {
                    background: transparent;
                    border: 1px solid #ef4444;
                    color: #ef4444;
                    padding: 12px;
                    border-radius: 8px;
                    font-weight: 700;
                    cursor: pointer;
                    width: 33%;
                }

                .tm2-btn-submit {
                    background: #0891b2;
                    border: none;
                    color: #fff;
                    padding: 12px;
                    border-radius: 8px;
                    font-weight: 700;
                    cursor: pointer;
                    flex: 1;
                }

                @media (max-width: 640px) {
                    .tm2-btn-cancel, .tm2-btn-submit {
                        width: 100%;
                        padding: 12px;
                    }
                }

                .tm2-btn-submit:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .tm2-sports-wrap {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .tm2-categories-wrap {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-top: 12px;
                }

                .tm2-category-check {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.75rem;
                    color: #94a3b8;
                    cursor: pointer;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .animate-fade-in {
                    animation: fadeIn 0.3s ease;
                }
            `}</style>

            <div className="tm2-overlay">
                <div className="tm2-container">
                    <div className="tm2-header">
                        <h2>{mode === 'create' ? "🏆 KHỞI TẠO GIẢI ĐẤU" : "🔧 HIỆU CHỈNH DỮ LIỆU GỐC"}</h2>
                        <button onClick={onClose} className="tm2-close">✕ ĐÓNG</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="tm2-section">
                            <h3 className="tm2-section-title">📌 THÔNG TIN CƠ BẢN</h3>
                            <div className="tm2-grid">
                                <div className="tm2-full">
                                    <label className="tm2-label">Tên giải đấu (*)</label>
                                    <input name="displayName" className="tm2-input" required value={formData.displayName} onChange={handleTextChange} />
                                </div>
                                <div>
                                    <label className="tm2-label">Slogan</label>
                                    <input name="slogan" className="tm2-input" value={formData.slogan} onChange={handleTextChange} />
                                </div>
                                <div>
                                    <label className="tm2-label">Người liên hệ</label>
                                    <input name="contactPerson" className="tm2-input" value={formData.contactPerson} onChange={handleTextChange} />
                                </div>
                                <div>
                                    <label className="tm2-label">Đối tượng</label>
                                    <input name="targetAudience" className="tm2-input" value={formData.targetAudience} onChange={handleTextChange} />
                                </div>
                                <div>
                                    <label className="tm2-label">Địa điểm (Venue)</label>
                                    <input name="venue" className="tm2-input" value={formData.venue} onChange={handleTextChange} />
                                </div>
                                <div className="tm2-full">
                                    <label className="tm2-label">Mô tả</label>
                                    <textarea name="description" className="tm2-textarea" rows="3" value={formData.description} onChange={handleTextChange} />
                                </div>
                            </div>
                        </div>

                        <div className="tm2-section">
                            <h3 className="tm2-section-title">⏱️ LỊCH TRÌNH</h3>
                            <div className="tm2-grid">
                                <div><label className="tm2-label">Mở đăng ký</label><input type="datetime-local" name="timeRegister" className="tm2-input" value={formData.timeRegister} onChange={handleTextChange} /></div>
                                <div><label className="tm2-label">Đóng đăng ký</label><input type="datetime-local" name="timeCloseRegister" className="tm2-input" value={formData.timeCloseRegister} onChange={handleTextChange} /></div>
                                <div><label className="tm2-label">Khai mạc (*)</label><input type="datetime-local" name="timeOpen" className="tm2-input" required value={formData.timeOpen} onChange={handleTextChange} /></div>
                                <div><label className="tm2-label">Bế mạc</label><input type="datetime-local" name="timeClose" className="tm2-input" value={formData.timeClose} onChange={handleTextChange} /></div>
                            </div>
                        </div>

                        <div className="tm2-section">
                            <h3 className="tm2-section-title">🏅 MÔN THI ĐẤU</h3>
                            <div className="tm2-sports-wrap">
                                {SPORTS_LIST.map(sport => (
                                    <div key={sport} className={`tm2-sport-tag ${sportsConfig[sport].selected ? 'active' : ''}`} onClick={() => toggleSport(sport)}>
                                        {sportsConfig[sport].selected ? '✅ ' : ''}{sport}
                                    </div>
                                ))}
                            </div>
                            <div>
                                {SPORTS_LIST.filter(sport => sportsConfig[sport].selected).map(sport => (
                                    <div key={sport} className="tm2-sport-config animate-fade-in">
                                        <h4 style={{ color: '#22d3ee', fontWeight: 700, marginBottom: 12, fontSize: '0.875rem' }}>{sport}</h4>
                                        <div className="tm2-grid">
                                            <div><label className="tm2-label">Lệ phí</label><input type="number" className="tm2-input" value={sportsConfig[sport].playerEntryFee} onChange={(e) => handleSportSettingChange(sport, 'playerEntryFee', e.target.value)} /></div>
                                            <div><label className="tm2-label">Giới hạn Đội</label><input type="number" className="tm2-input" value={sportsConfig[sport].maxTeams} onChange={(e) => handleSportSettingChange(sport, 'maxTeams', e.target.value)} /></div>
                                        </div>
                                        <div className="tm2-categories-wrap">
                                            {CATEGORIES_LIST.map(cat => (
                                                <label key={cat.id} className="tm2-category-check">
                                                    <input type="checkbox" checked={sportsConfig[sport].categories.includes(cat.id)} onChange={() => toggleCategory(sport, cat.id)} className="accent-cyan-500" />
                                                    {cat.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="tm2-section">
                            <h3 className="tm2-section-title">📸 MEDIA & GALA</h3>
                            <div className="tm2-grid">
                                <div>
                                    <label className="tm2-label">Logo</label>
                                    <div className="tm2-preview-box">
                                        {previews.logo && <img src={previews.logo} alt="Logo" />}
                                        <input type="file" name="logo" onChange={handleFileChange} accept="image/*" />
                                        {!previews.logo && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>+ LOGO</span>}
                                    </div>
                                </div>
                                <div>
                                    <label className="tm2-label">Banner</label>
                                    <div className="tm2-preview-box">
                                        {previews.banner && <img src={previews.banner} alt="Banner" />}
                                        <input type="file" name="banner" onChange={handleFileChange} accept="image/*" />
                                        {!previews.banner && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>+ BANNER</span>}
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <label className="tm2-category-check">
                                    <input type="checkbox" checked={galaConfig.hasGala} onChange={(e) => setGalaConfig(p => ({ ...p, hasGala: e.target.checked }))} className="accent-cyan-500" />
                                    CÓ TỔ CHỨC GALA DINNER
                                </label>
                            </div>
                        </div>

                        <div className="tm2-actions">
                            <button type="button" onClick={onClose} className="tm2-btn-cancel">TERMINATE</button>
                            <button type="submit" className="tm2-btn-submit" disabled={loading}>
                                {loading ? "PROCESSING..." : mode === 'create' ? "🚀 KHỞI TẠO GIẢI" : "💾 LƯU THAY ĐỔI"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default TournamentDetailView;