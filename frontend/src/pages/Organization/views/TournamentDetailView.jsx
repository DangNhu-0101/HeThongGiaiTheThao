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

const TournamentModal = ({ mode, tourId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const IMAGE_BASE_URL = "http://localhost:5001/";

    // 1. STATE THÔNG TIN CƠ BẢN
    const [formData, setFormData] = useState({
        displayName: "", slogan: "", contactPerson: "", targetAudience: "",
        venue: "", description: "", prizes: "",
        timeRegister: "", timeCloseRegister: "", timeOpen: "", timeClose: ""
    });

    // 2. STATE MÔN THI ĐẤU
    const getInitialSports = () => SPORTS_LIST.reduce((acc, sport) => {
        acc[sport] = { selected: false, feeEntry: "", maxTeams: "", categories: [] };
        return acc;
    }, {});
    const [sportsConfig, setSportsConfig] = useState(getInitialSports());

    // 3. STATE GALA
    const [galaConfig, setGalaConfig] = useState({ hasGala: false, time: "", venue: "", description: "" });

    // 4. STATE FILES & PREVIEWS
    const [files, setFiles] = useState({ logo: null, banner: null, paymentQR: null });
    const [previews, setPreviews] = useState({ logo: null, banner: null, paymentQR: null });

    // --- EFFECT: LOAD DỮ LIỆU KHI EDIT ---
    useEffect(() => {
        if (mode === 'edit' && tourId) {
            setLoading(true);
            api.get(`/tournaments/getTournament/${tourId}`)
                .then(res => {
                    const d = res.data.data;
                    if (!d) return;

                    // Map thông tin cơ bản & timeline
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

                    // Map Sports Config (Chuyển từ Array của BE sang Object của FE)
                    const newSports = getInitialSports();
                    d.sportsConfig?.forEach(item => {
                        if (newSports[item.sport]) {
                            newSports[item.sport] = {
                                selected: true,
                                feeEntry: item.feeEntry,
                                maxTeams: item.maxTeams || "",
                                categories: item.categories || []
                            };
                        }
                    });
                    setSportsConfig(newSports);

                    // Map Gala
                    if (d.galaConfig) {
                        setGalaConfig({
                            hasGala: d.galaConfig.hasGala || false,
                            time: d.galaConfig.time ? d.galaConfig.time.slice(0, 16) : "",
                            venue: d.galaConfig.venue || "",
                            description: d.galaConfig.description || ""
                        });
                    }

                    // Map Previews từ Server
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

    // --- HANDLERS ---
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

    // --- SUBMIT ---
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
                feeEntry: Number(sportsConfig[key].feeEntry) || 0,
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
        <div className="modal-overlay">
            <div className="modal-container glass-card custom-scrollbar">
                <div className="modal-header border-b border-cyan-500/30 pb-3 mb-5 flex justify-between items-center">
                    <h2 className="text-xl font-black text-neon-cyan tracking-widest uppercase">
                        {mode === 'create' ? "🏆 KHỞI TẠO GIẢI ĐẤU" : "🔧 HIỆU CHỈNH DỮ LIỆU GỐC"}
                    </h2>
                   <button onClick={onClose} className="text-red-400 hover:text-red-300 font-bold">✕ ĐÓNG</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* SECTION 1: THÔNG TIN CƠ BẢN */}
                    <div className="section-block">
                        <h3 className="section-title">📌 THÔNG TIN CƠ BẢN</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group full-width">
                                <label className="info-label-tech">Tên giải đấu (*)</label>
                                <input name="displayName" className="auth-input w-full" required value={formData.displayName} onChange={handleTextChange} placeholder="Tên giải..." />
                            </div>
                            <div className="form-group">
                                <label className="info-label-tech">Slogan</label>
                                <input name="slogan" className="auth-input w-full" value={formData.slogan} onChange={handleTextChange} placeholder="Slogan..." />
                            </div>
                            <div className="form-group">
                                <label className="info-label-tech">Người liên hệ</label>
                                <input name="contactPerson" className="auth-input w-full" value={formData.contactPerson} onChange={handleTextChange} placeholder="Tên & SĐT..." />
                            </div>
                            <div className="form-group">
                                <label className="info-label-tech">Đối tượng</label>
                                <input name="targetAudience" className="auth-input w-full" value={formData.targetAudience} onChange={handleTextChange} />
                            </div>
                            <div className="form-group">
                                <label className="info-label-tech">Địa điểm (Venue)</label>
                                <input name="venue" className="auth-input w-full" value={formData.venue} onChange={handleTextChange} />
                            </div>
                            <div className="form-group full-width">
                                <label className="info-label-tech">Mô tả</label>
                                <textarea name="description" className="auth-input w-full min-h-[60px]" value={formData.description} onChange={handleTextChange} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: LỊCH TRÌNH */}
                    <div className="section-block">
                        <h3 className="section-title">⏱️ LỊCH TRÌNH</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="info-label-tech">Mở đăng ký</label>
                                <input type="datetime-local" name="timeRegister" className="auth-input w-full" value={formData.timeRegister} onChange={handleTextChange} />
                            </div>
                            <div className="form-group">
                                <label className="info-label-tech">Đóng đăng ký</label>
                                <input type="datetime-local" name="timeCloseRegister" className="auth-input w-full" value={formData.timeCloseRegister} onChange={handleTextChange} />
                            </div>
                            <div className="form-group">
                                <label className="info-label-tech">Khai mạc (*)</label>
                                <input type="datetime-local" name="timeOpen" className="auth-input w-full" required value={formData.timeOpen} onChange={handleTextChange} />
                            </div>
                            <div className="form-group">
                                <label className="info-label-tech">Bế mạc</label>
                                <input type="datetime-local" name="timeClose" className="auth-input w-full" value={formData.timeClose} onChange={handleTextChange} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: MÔN THI ĐẤU */}
                    <div className="section-block">
                        <h3 className="section-title">🏅 MÔN THI ĐẤU</h3>
                        <div className="flex flex-wrap gap-3 mb-4">
                            {SPORTS_LIST.map(sport => (
                                <div key={sport} className={`sport-tag ${sportsConfig[sport].selected ? 'active' : ''}`} onClick={() => toggleSport(sport)}>
                                    {sportsConfig[sport].selected ? '✅ ' : ''}{sport}
                                </div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            {SPORTS_LIST.filter(sport => sportsConfig[sport].selected).map(sport => (
                                <div key={sport} className="p-4 border border-cyan-800 rounded-lg bg-slate-900/50 animate-fade-in">
                                    <h4 className="text-cyan-400 font-bold mb-3 uppercase">{sport}</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div className="form-group">
                                            <label className="info-label-tech text-[10px]">Lệ phí</label>
                                            <input type="number" className="auth-input w-full text-sm" value={sportsConfig[sport].feeEntry} onChange={(e) => handleSportSettingChange(sport, 'feeEntry', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="info-label-tech text-[10px]">Giới hạn Đội</label>
                                            <input type="number" className="auth-input w-full text-sm" value={sportsConfig[sport].maxTeams} onChange={(e) => handleSportSettingChange(sport, 'maxTeams', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES_LIST.map(cat => (
                                            <label key={cat.id} className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
                                                <input type="checkbox" checked={sportsConfig[sport].categories.includes(cat.id)} onChange={() => toggleCategory(sport, cat.id)} className="accent-cyan-500" />
                                                {cat.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 4: GALA & MEDIA */}
                    <div className="section-block">
                        <h3 className="section-title">📸 MEDIA & GALA</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="form-group">
                                <label className="info-label-tech">Logo</label>
                                <div className="preview-box h-24 border-cyan-600 border-dashed rounded-lg bg-slate-800">
                                    {previews.logo ? <img src={previews.logo} alt="Logo" className="h-full object-contain" /> : <span className="text-[10px]">+ LOGO</span>}
                                    <input type="file" name="logo" onChange={handleFileChange} className="opacity-0 absolute inset-0 cursor-pointer" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="info-label-tech">Banner</label>
                                <div className="preview-box h-24 border-cyan-600 border-dashed rounded-lg bg-slate-800">
                                    {previews.banner ? <img src={previews.banner} alt="Banner" className="h-full object-cover" /> : <span className="text-[10px]">+ BANNER</span>}
                                    <input type="file" name="banner" onChange={handleFileChange} className="opacity-0 absolute inset-0 cursor-pointer" />
                                </div>
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-cyan-400 text-xs font-bold cursor-pointer">
                            <input type="checkbox" checked={galaConfig.hasGala} onChange={(e) => setGalaConfig(p => ({ ...p, hasGala: e.target.checked }))} className="accent-cyan-500" />
                            CÓ TỔ CHỨC GALA DINNER
                        </label>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="auth-button bg-transparent border border-red-500 text-red-500 hover:bg-red-500/20 w-1/3">TERMINATE</button>
                        <button type="submit" className="auth-button flex-1" disabled={loading}>
                            {loading ? "PROCESSING..." : mode === 'create' ? "🚀 KHỞI TẠO GIẢI" : "💾 LƯU THAY ĐỔI"}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                .modal-overlay { position: fixed; inset: 0; background: rgba(7, 11, 20, 0.95); display: flex; justify-content: center; align-items: center; z-index: 2000; padding: 20px; }
                .modal-container { background: #0F172A; border: 1px solid #00F0FF; padding: 25px; width: 100%; max-width: 800px; max-height: 95vh; overflow-y: auto; border-radius: 12px; }
                .section-block { background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; padding: 15px; border-radius: 8px; }
                .section-title { color: #fff; font-size: 1rem; font-weight: 900; margin-bottom: 12px; border-left: 4px solid #00F0FF; padding-left: 10px; }
                .info-label-tech { color: #00F0FF; font-size: 0.7rem; text-transform: uppercase; font-weight: bold; margin-bottom: 3px; display: block; }
                .full-width { grid-column: 1 / -1; }
                .preview-box { position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                .sport-tag { padding: 6px 12px; border: 1px solid #00F0FF; border-radius: 4px; cursor: pointer; color: #94a3b8; font-size: 0.8rem; transition: 0.2s; }
                .sport-tag.active { background: #00F0FF; color: #000; box-shadow: 0 0 10px rgba(0,240,255,0.4); }
                .animate-fade-in { animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default TournamentModal;