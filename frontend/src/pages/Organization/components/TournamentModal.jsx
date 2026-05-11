import React, { useState } from 'react';
import api from '../../../api/axiosConfig';

const SPORTS_LIST = ["Pickleball", "Tennis", "Badminton", "Table Tennis", "Football",  "Volleyball"];
const CATEGORIES_LIST = [
    { id: 'MS', label: 'Đơn Nam (MS)' },
    { id: 'WS', label: 'Đơn Nữ (WS)' },
    { id: 'MD', label: 'Đôi Nam (MD)' },
    { id: 'WD', label: 'Đôi Nữ (WD)' },
    { id: 'XD', label: 'Đôi Nam Nữ (XD)' }
];

const TournamentModal = ({ mode, tourId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    
    // 1. STATE THÔNG TIN CƠ BẢN & LỊCH TRÌNH
    const [formData, setFormData] = useState({
        displayName: "",
        slogan: "",
        contactPerson: "",
        targetAudience: "",
        venue: "",
        description: "",
        prizes: "",
        timeRegister: "",
        timeCloseRegister: "",
        timeOpen: "",
        timeClose: ""
    });

    // 2. STATE QUẢN LÝ MÔN THI ĐẤU (Khởi tạo động dựa trên SPORTS_LIST)
    const initialSports = SPORTS_LIST.reduce((acc, sport) => {
        acc[sport] = { selected: false, feeEntry: "", maxTeams: "", categories: [] };
        return acc;
    }, {});
    const [sportsConfig, setSportsConfig] = useState(initialSports);

    // 3. STATE QUẢN LÝ GALA
    const [galaConfig, setGalaConfig] = useState({
        hasGala: false, time: "", venue: "", description: ""
    });

    // 4. STATE QUẢN LÝ FILE UPLOAD & PREVIEW
    const [files, setFiles] = useState({ logo: null, banner: null, paymentQR: null });
    const [previews, setPreviews] = useState({ logo: null, banner: null, paymentQR: null });

    // --- HANDLERS ---
    const handleTextChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGalaChange = (e) => {
        const { name, value, type, checked } = e.target;
        setGalaConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        const file = selectedFiles[0];
        if (file) {
            setFiles(prev => ({ ...prev, [name]: file }));
            setPreviews(prev => ({ ...prev, [name]: URL.createObjectURL(file) }));
        }
    };

    // Handler riêng cho mảng Thể Thao
    const toggleSport = (sport) => {
        setSportsConfig(prev => ({
            ...prev,
            [sport]: { ...prev[sport], selected: !prev[sport].selected }
        }));
    };

    const handleSportSettingChange = (sport, field, value) => {
        setSportsConfig(prev => ({
            ...prev,
            [sport]: { ...prev[sport], [field]: value }
        }));
    };

    const toggleCategory = (sport, categoryId) => {
        setSportsConfig(prev => {
            const currentCats = prev[sport].categories;
            const newCats = currentCats.includes(categoryId)
                ? currentCats.filter(c => c !== categoryId)
                : [...currentCats, categoryId];
            return {
                ...prev,
                [sport]: { ...prev[sport], categories: newCats }
            };
        });
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = new FormData();
        
        // 1. Append Thông tin cơ bản
        Object.keys(formData).forEach(key => {
            if (formData[key]) payload.append(key, formData[key]);
        });

        // 2. Build & Append mảng SportsConfig
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

        // 3. Build & Append GalaConfig
        payload.append('galaConfig', JSON.stringify(galaConfig));

        // 4. Append Files
        if (files.logo) payload.append('logo', files.logo);
        if (files.banner) payload.append('banner', files.banner);
        if (files.paymentQR) payload.append('paymentQR', files.paymentQR);

        try {
            
            const endpoint = mode === 'create' 
                ? '/tournaments/createTournament' 
                : `/tournaments/editTournament/${tourId}`;
            
            const method = mode === 'create' ? 'post' : 'patch';
            
            await api[method](endpoint, payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onSuccess();
        }catch (err) {
            alert(err.response?.data?.message || "LỖI HỆ THỐNG GIAO TIẾP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container glass-card custom-scrollbar">
                <div className="modal-header border-b border-cyan-500/30 pb-3 mb-5 flex justify-between items-center">
                    <h2 className="text-xl font-black text-neon-cyan tracking-widest uppercase">
                        {mode === 'create' ? "🏆 KHỞI TẠO GIẢI ĐẤU / HỘI THAO" : "🔧 CẬP NHẬT GIẢI ĐẤU"}
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
                                <input name="displayName" className="auth-input w-full" required value={formData.displayName} onChange={handleTextChange} placeholder="VD: Hội Thao Mùa Hè 2026" />
                            </div>
                            <div className="form-group">
                                <label className="info-label-tech">Slogan</label>
                                <input name="slogan" className="auth-input w-full" value={formData.slogan} onChange={handleTextChange} placeholder="VD: Bứt phá giới hạn" />
                            </div>
                            <div className="form-group">
                                <label className="info-label-tech">Đối tượng tham gia</label>
                                <input name="targetAudience" className="auth-input w-full" value={formData.targetAudience} onChange={handleTextChange} placeholder="VD: Sinh viên toàn quốc" />
                            </div>
                            <div className="form-group full-width">
                                <label className="info-label-tech">Địa điểm tổ chức (Venue)</label>
                                <input name="venue" className="auth-input w-full" value={formData.venue} onChange={handleTextChange} placeholder="VD: Cụm sân trung tâm Vũng Tàu" />
                            </div>
                            <div className="form-group full-width">
                                <label className="info-label-tech">Mô tả giải đấu</label>
                                <textarea name="description" className="auth-input w-full min-h-[80px]" value={formData.description} onChange={handleTextChange} placeholder="Giới thiệu mục đích, ý nghĩa..." />
                            </div>
                            <div className="form-group full-width">
                                <label className="info-label-tech">Người liên hệ / Hotline</label>
                                <input 
                                    name="contactPerson" 
                                    className="auth-input w-full" 
                                    value={formData.contactPerson} 
                                    onChange={handleTextChange} 
                                    placeholder="VD: Mr. A - 090xxxxxxx" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: LỊCH TRÌNH */}
                    <div className="section-block">
                        <h3 className="section-title">⏱️ LỊCH TRÌNH THỜI GIAN</h3>
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
                                <label className="info-label-tech">Khai mạc giải</label>
                                <input type="datetime-local" name="timeOpen" className="auth-input w-full" required value={formData.timeOpen} onChange={handleTextChange} />
                            </div>
                            <div className="form-group">
                                <label className="info-label-tech">Bế mạc giải</label>
                                <input type="datetime-local" name="timeClose" className="auth-input w-full" value={formData.timeClose} onChange={handleTextChange} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: MÔN THI ĐẤU & LỆ PHÍ */}
                    <div className="section-block">
                        <h3 className="section-title">🏅 MÔN THI ĐẤU & NỘI DUNG</h3>
                        <div className="mb-4">
                            <label className="info-label-tech mb-2 block">Chọn các môn tổ chức (*)</label>
                            <div className="flex flex-wrap gap-3">
                                {SPORTS_LIST.map(sport => (
                                    <div key={sport} className={`sport-tag ${sportsConfig[sport].selected ? 'active' : ''}`} onClick={() => toggleSport(sport)}>
                                        {sportsConfig[sport].selected ? '✅ ' : ''}{sport}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* HIỂN THỊ CHI TIẾT CÁC MÔN ĐÃ CHỌN */}
                        <div className="space-y-4">
                            {SPORTS_LIST.filter(sport => sportsConfig[sport].selected).map(sport => (
                                <div key={sport} className="p-4 border border-cyan-800 rounded-lg bg-slate-900/50">
                                    <h4 className="text-cyan-400 font-bold mb-3 uppercase tracking-wider">{sport}</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div className="form-group">
                                            <label className="info-label-tech text-[10px]">Lệ phí (VNĐ)</label>
                                            <input type="number" className="auth-input w-full text-sm" placeholder="VD: 200000" value={sportsConfig[sport].feeEntry} onChange={(e) => handleSportSettingChange(sport, 'feeEntry', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="info-label-tech text-[10px]">Giới hạn Đội (Để trống = KGH)</label>
                                            <input type="number" className="auth-input w-full text-sm" placeholder="VD: 32" value={sportsConfig[sport].maxTeams} onChange={(e) => handleSportSettingChange(sport, 'maxTeams', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="info-label-tech text-[10px] mb-2 block">Nội dung thi đấu:</label>
                                        <div className="flex flex-wrap gap-2">
                                            {CATEGORIES_LIST.map(cat => (
                                                <label key={cat.id} className="flex items-center gap-1 text-sm text-gray-300 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={sportsConfig[sport].categories.includes(cat.id)}
                                                        onChange={() => toggleCategory(sport, cat.id)}
                                                        className="accent-cyan-500"
                                                    />
                                                    {cat.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 4: GIẢI THƯỞNG & THANH TOÁN */}
                    <div className="section-block">
                        <h3 className="section-title">💰 GIẢI THƯỞNG & THANH TOÁN</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group full-width">
                                <label className="info-label-tech">Cơ cấu giải thưởng</label>
                                <textarea name="prizes" className="auth-input w-full min-h-[60px]" value={formData.prizes} onChange={handleTextChange} placeholder="Nhất: Cúp + 5tr | Nhì: Cờ + 2tr..." />
                            </div>
                            <div className="form-group full-width">
                                <label className="info-label-tech">QR Code Thanh toán (Momo/Bank)</label>
                                <div className="preview-box h-32 w-32 border-cyan-600 border-dashed rounded-lg bg-slate-800">
                                    {previews.paymentQR ? <img src={previews.paymentQR} alt="QR" className="h-full w-full object-cover" /> : <span className="text-xs text-gray-500">+ TẢI QR LÊN</span>}
                                    <input type="file" name="paymentQR" onChange={handleFileChange} accept="image/*" className="opacity-0 absolute inset-0 cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: SỰ KIỆN GALA */}
                    <div className="section-block">
                        <h3 className="section-title">🥂 SỰ KIỆN GALA LÊN NGÔI</h3>
                        <label className="flex items-center gap-2 text-cyan-400 font-bold cursor-pointer mb-4">
                            <input type="checkbox" name="hasGala" checked={galaConfig.hasGala} onChange={handleGalaChange} className="w-5 h-5 accent-cyan-500" />
                            Có tổ chức Gala Dinner tổng kết và trao giải
                        </label>
                        
                        {galaConfig.hasGala && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 animate-fade-in">
                                <div className="form-group">
                                    <label className="info-label-tech">Thời gian Gala</label>
                                    <input type="datetime-local" name="time" className="auth-input w-full" value={galaConfig.time} onChange={handleGalaChange} />
                                </div>
                                <div className="form-group">
                                    <label className="info-label-tech">Địa điểm Gala</label>
                                    <input type="text" name="venue" className="auth-input w-full" placeholder="Nhà hàng..." value={galaConfig.venue} onChange={handleGalaChange} />
                                </div>
                                <div className="form-group full-width">
                                    <label className="info-label-tech">Mô tả Gala</label>
                                    <input type="text" name="description" className="auth-input w-full" placeholder="Dresscode, Chi phí người nhà..." value={galaConfig.description} onChange={handleGalaChange} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 6: HÌNH ẢNH NHẬN DIỆN */}
                    <div className="section-block">
                        <h3 className="section-title">🖼️ HÌNH ẢNH NHẬN DIỆN</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="info-label-tech">Logo Giải</label>
                                <div className="preview-box h-32 border-cyan-600 border-dashed rounded-lg bg-slate-800">
                                    {previews.logo ? <img src={previews.logo} alt="logo preview" className="h-full w-full object-contain" /> : <span className="text-xs text-gray-500">+ TẢI LOGO</span>}
                                    <input type="file" name="logo" onChange={handleFileChange} accept="image/*" className="opacity-0 absolute inset-0 cursor-pointer" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="info-label-tech">Banner Giải</label>
                                <div className="preview-box h-32 border-cyan-600 border-dashed rounded-lg bg-slate-800">
                                    {previews.banner ? <img src={previews.banner} alt="banner preview" className="h-full w-full object-cover" /> : <span className="text-xs text-gray-500">+ TẢI BANNER</span>}
                                    <input type="file" name="banner" onChange={handleFileChange} accept="image/*" className="opacity-0 absolute inset-0 cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-cyan-900">
                        <button type="button" onClick={onClose} className="auth-button bg-transparent border border-red-500 text-red-500 hover:bg-red-500/20 w-1/3">
                            HỦY BỎ
                        </button>
                        <button type="submit" className="auth-button flex-1" disabled={loading}>
                            {loading ? "ĐANG XỬ LÝ HỆ THỐNG..." : "🚀 TẠO GIẢI & LƯU THÔNG TIN"}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .modal-overlay { position: fixed; inset: 0; background: rgba(7, 11, 20, 0.95); display: flex; justify-content: center; align-items: center; z-index: 2000; padding: 20px; }
                .modal-container { background: #0F172A; border: 1px solid #00F0FF; padding: 30px; width: 100%; max-width: 800px; max-height: 95vh; overflow-y: auto; box-shadow: 0 0 30px rgba(0, 240, 255, 0.1); border-radius: 12px; }
                .full-width { grid-column: 1 / -1; }
                .section-block { background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; padding: 20px; border-radius: 8px; }
                .section-title { color: #fff; font-size: 1.1rem; font-weight: 900; margin-bottom: 15px; border-left: 4px solid #00F0FF; padding-left: 10px; }
                .info-label-tech { color: #00F0FF; font-size: 0.75rem; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; display: block; }
                .preview-box { position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: all 0.3s; }
                .preview-box:hover { border-color: #fff; background: rgba(0,240,255,0.1); }
                .sport-tag { padding: 8px 16px; border: 1px solid #00F0FF; border-radius: 6px; cursor: pointer; color: #94a3b8; font-weight: bold; font-size: 0.9rem; transition: all 0.2s; }
                .sport-tag.active { background: #00F0FF; color: #000; box-shadow: 0 0 10px rgba(0,240,255,0.5); border-color: #00F0FF; }
                .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default TournamentModal;