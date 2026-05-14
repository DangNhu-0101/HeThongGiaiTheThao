import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

// 🎯 BẢN ĐỒ DỊCH NỘI DUNG THI ĐẤU SANG TIẾNG VIỆT
const CATEGORY_MAPPER = {
    'MS': 'Đơn Nam (MS)',
    'WS': 'Đơn Nữ (WS)',
    'MD': 'Đôi Nam (MD)',
    'WD': 'Đôi Nữ (WD)',
    'XD': 'Đôi Nam Nữ (XD)'
};

const RegisterTeam = () => {
    const navigate = useNavigate();

    // --- 1. STATE DỮ LIỆU TỪ BACKEND ---
    const [upcomingTournaments, setUpcomingTournaments] = useState([]);
    
    // --- 2. STATE FORM ĐĂNG KÝ ---
    const [selectedTour, setSelectedTour] = useState(null);
    const [selectedSport, setSelectedSport] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null); // Ví dụ: 'MD'
    const [regMode, setRegMode] = useState("create"); // 'solo' | 'create' | 'random'
    
    // State cho lập đội
    const [teamName, setTeamName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [invitedMembers, setInvitedMembers] = useState([]); // Mảng chứa VĐV được mời

    // --- 3. STATE UI & KẾT QUẢ ---
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState(null);

    // BƯỚC 1: Fetch Giải đấu đang mở
    useEffect(() => {
        const fetchTours = async () => {
            try {
                const res = await api.get('/tournaments');
                if (res.data?.data) {
                    const upcomingTours = res.data.data.filter(t => t.status === 'upcoming');
                    setUpcomingTournaments(upcomingTours);
                }
            } catch (err) {
                console.error("Lỗi lấy giải đấu:", err);
            }
        };
        fetchTours();
    }, []);

    // RESET logic khi đổi lựa chọn
    const handleTourChange = (e) => {
        const tourId = e.target.value;
        const fetchTourDetail = async () => {
            try {
                const res = await api.get(`/tournaments/${tourId}`);
                if (res.data?.success && res.data?.data) {
                    setSelectedTour(res.data.data);
                }
            } catch (error) {
                console.error("Lỗi lấy chi tiết giải đấu:", error);
            }
        };
        fetchTourDetail();
        setSelectedSport(null);
        setSelectedCategory(null);
        setInvitedMembers([]);
    };

    const handleCategoryChange = (e) => {
        const catValue = e.target.value;
        setSelectedCategory(catValue);
        // Tự động chuyển sang chế độ đánh đơn (Solo) nếu nội dung chứa chữ 'S' (MS, WS)
        if (catValue.includes('S')) { 
            setRegMode('solo');
        } else {
            setRegMode('create');
        }
        setInvitedMembers([]);
    };

    // TÌM KIẾM THÀNH VIÊN
    const handleSearchUser = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
        // Backend searchUsers dùng query 'name', không phải 'keyword'
        const res = await api.get(`/users/search?name=${searchQuery}`);
        setSearchResults(res.data?.data || []);
    } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
        setSearchResults([]);
    } finally {
        setIsSearching(false);
    }
};

    const addMember = (user) => {
        if (invitedMembers.find(m => m._id === user._id)) return;
        if (invitedMembers.length >= 1) {
            alert("Nội dung Đôi chỉ cho phép mời thêm 1 đồng đội!");
            return;
        }
        setInvitedMembers([...invitedMembers, user]);
        setSearchResults([]);
        setSearchQuery("");
    };

    const removeMember = (userId) => {
        setInvitedMembers(invitedMembers.filter(m => m._id !== userId));
    };

    const getCalculatedFee = () => {
        if (!selectedSport) return 0;
        const baseFee = selectedSport.feePerAthlete || 0;
        
        return baseFee;
    };

    // SUBMIT ĐĂNG KÝ
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                tournamentId: selectedTour._id,
                sport: selectedSport.sport,
                categoryId: selectedCategory,
                regMode: regMode,
                teamName: regMode === 'create' ? teamName : null,
                invitedUserIds: invitedMembers.map(m => m._id) 
            };

            const res = await api.post('/teams/register-flow', payload);
            setResult({ 
                ...res.data, 
                fee: getCalculatedFee()
            });
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi quá trình đăng ký, vui lòng thử lại!");
        } finally {
            setIsSaving(false);
        }
    };

    // ==========================================
    // MÀN HÌNH 2: KẾT QUẢ THÀNH CÔNG & THANH TOÁN ĐỘNG
    // ==========================================
    if (result) {
        return (
            <div className="auth-container custom-scrollbar">
                <div className="auth-card text-center shadow-2xl max-w-lg mx-auto border border-cyan-500">
                    <h2 className="text-neon-cyan font-black uppercase tracking-widest text-2xl mb-2">
                        {regMode === 'random' ? "⏳ ĐÃ ĐƯA VÀO HÀNG ĐỢI" : "🎉 ĐĂNG KÝ THÀNH CÔNG"}
                    </h2>
                    
                    {regMode === 'create' && invitedMembers.length > 0 && (
                        <div className="p-4 bg-orange-950/30 border border-orange-500/50 rounded-lg mb-6 mt-4 text-orange-200 text-sm">
                            <span className="block font-bold text-orange-400 mb-1">⚠️ ĐỘI CHƯA HỢP LỆ</span>
                            Hệ thống đã gửi lời mời đến đồng đội của bạn. Đội chỉ đủ điều kiện thi đấu sau khi họ xác nhận tham gia.
                        </div>
                    )}

                    {regMode === 'random' && (
                        <div className="p-4 bg-purple-950/30 border border-purple-500/50 rounded-lg mb-6 mt-4 text-purple-200 text-sm">
                            Hệ thống đang rà soát các VĐV có cùng trình độ (Skill Level). Bạn sẽ nhận được thông báo ngay khi ghép đội thành công!
                        </div>
                    )}

                    <div className="text-left p-6 bg-slate-900 border border-cyan-800 rounded-2xl mb-6 shadow-inner">
                        <h4 className="font-black border-b border-cyan-800 pb-2 mb-4 text-cyan-400 flex justify-between uppercase text-xs tracking-widest">
                            💳 THÔNG TIN LỆ PHÍ: {selectedTour?.name}
                        </h4>
                        
                        {selectedTour?.paymentQR ? (
                            <div className="flex flex-col items-center mb-4">
                                <img 
                                    src={selectedTour.paymentQR} 
                                    alt="Mã QR Thanh toán Giải" 
                                    className="h-44 w-44 object-cover rounded-lg border-2 border-cyan-500 p-1 bg-white" 
                                />
                                <span className="text-[10px] text-cyan-500 font-bold tracking-widest mt-2 uppercase">Quét mã để thanh toán nhanh</span>
                            </div>
                        ) : (
                            <div className="text-center p-3 border border-slate-700 rounded-lg mb-4 text-gray-500 text-xs italic">
                                * Ban tổ chức chưa cập nhật ảnh QR cho giải đấu này.
                            </div>
                        )}

                        <div className="space-y-2 text-sm text-gray-300">
                            <p>Đơn vị tổ chức: <b className="text-white uppercase">{selectedTour?.Organization?.name || "Ban tổ chức"}</b></p>
                            {/* 👉 ĐÃ FIX: Dịch nội dung thi đấu sang Tiếng Việt đầy đủ */}
                            <p>Hạng mục thi đấu: <b className="text-cyan-400">{selectedSport?.sport} - {CATEGORY_MAPPER[selectedCategory] || selectedCategory}</b></p>
                            <p>Địa điểm thi đấu: <b className="text-white">{selectedTour?.location}</b></p>
                            
                            <div className="border-t border-slate-800/80 my-3 pt-3 space-y-2">
                                <p>Số tiền thanh toán: <b className="text-cyan-400 text-lg">{result.fee?.toLocaleString()} VNĐ</b></p>
                                <p>Nội dung chuyển khoản: <b className="text-white bg-slate-800 px-2 py-1 rounded">DK {result.teamId?.slice(-6).toUpperCase() || "CODE"}</b></p>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-4 italic text-center">* Bạn có thể nộp ảnh biên lai chuyển tiền trong phần Quản lý Đội sau.</p>
                    </div>

                    <button onClick={() => navigate('/')} className="auth-button w-full shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                        VỀ TRANG CHỦ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container p-4 custom-scrollbar">
            <div className="auth-card shadow-2xl max-w-xl mx-auto">
                <h2 className="text-neon-cyan text-center font-black uppercase tracking-widest text-xl mb-6 border-b border-cyan-900 pb-4">
                    🚀 CỔNG ĐĂNG KÝ VẬN ĐỘNG VIÊN
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
    {/* KHỐI 1: LỰA CHỌN GIẢI & MÔN */}
    <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
        <div>
            <label className="info-label-tech">1. Giải đấu đang mở (*)</label>
            <select className="auth-input w-full" required onChange={handleTourChange} defaultValue="">
                <option value="" disabled>-- Chọn giải đấu bạn muốn tham gia --</option>
                {upcomingTournaments.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                ))}
            </select>
        </div>

        {selectedTour && (
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
                <div>
                    <label className="info-label-tech">Môn thi đấu</label>
                    <select 
                        className="auth-input w-full" required 
                        onChange={(e) => setSelectedSport(selectedTour.sportsConfig?.find(s => s.sport === e.target.value))}
                        defaultValue=""
                    >
                        <option value="" disabled>-- Chọn môn --</option>
                        {selectedTour.sportsConfig?.map((s, idx) => (
                            <option key={idx} value={s.sport}>{s.sport}</option>
                        ))}
                    </select>
                </div>

                {selectedSport && (
                    <div>
                        <label className="info-label-tech">Nội dung</label>
                        <select className="auth-input w-full" required onChange={handleCategoryChange} defaultValue="">
                            <option value="" disabled>-- Hạng mục --</option>
                            {selectedSport.categories?.map((cat, idx) => (
                                <option key={idx} value={cat}>
                                    {CATEGORY_MAPPER[cat] || cat}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        )}

        {selectedSport && selectedCategory && (
            <div className="flex justify-between items-center bg-slate-800 p-3 rounded border border-cyan-900/50 text-sm mt-2 animate-fade-in">
                <span className="text-gray-400">Lệ phí quy định (100%):</span>
                <span className="text-cyan-400 font-bold text-lg">
                    {getCalculatedFee().toLocaleString()} VNĐ
                </span>
            </div>
        )}
    </div>

    {/* KHỐI 2: HÌNH THỨC LẬP ĐỘI */}
    {selectedCategory && regMode !== 'solo' && (
        <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700 animate-fade-in">
            <label className="info-label-tech">2. Hình thức tham gia</label>
            <div className="flex gap-2">
                <button type="button" onClick={() => setRegMode('create')} className={`flex-1 py-2 rounded font-bold text-xs transition-all border ${regMode === 'create' ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]' : 'bg-slate-800 text-gray-400 border-slate-600'}`}>
                    TẠO ĐỘI & MỜI
                </button>
                <button type="button" onClick={() => setRegMode('random')} className={`flex-1 py-2 rounded font-bold text-xs transition-all border ${regMode === 'random' ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'bg-slate-800 text-gray-400 border-slate-600'}`}>
                    GHÉP ĐỘI NGẪU NHIÊN
                </button>
            </div>

            {regMode === 'random' && (
                <div className="p-3 bg-purple-950/20 border border-purple-900/50 rounded text-sm text-purple-200">
                    🤝 Bạn chọn ghép ngẫu nhiên. Hệ thống sẽ tự động quét và ghép bạn với người chơi có cùng <b className="text-purple-400">Skill Level</b> đang chờ.
                </div>
            )}

            {regMode === 'create' && (
                <div className="space-y-4 mt-4 animate-fade-in">
                    <input 
                        className="auth-input w-full border-cyan-700 focus:border-cyan-400" 
                        placeholder="Nhập tên đội của bạn (VD: Vũng Tàu Smashers)..." 
                        required value={teamName} onChange={e => setTeamName(e.target.value)} 
                    />

                    {/* THANH TÌM KIẾM */}
                    <div className="relative">
                        <div className="flex gap-2">
                            <input 
                                className="auth-input flex-1 text-sm bg-slate-800" 
                                placeholder="🔍 Tìm đồng đội theo Tên hoặc Email..." 
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearchUser())}
                            />
                            <button type="button" onClick={handleSearchUser} className="px-4 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold text-xs border border-slate-500">
                                {isSearching ? "..." : "TÌM"}
                            </button>
                        </div>

                        {/* KẾT QUẢ TÌM KIẾM */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-cyan-800 rounded shadow-xl z-10 max-h-48 overflow-y-auto">
                                {searchResults.map(user => (
                                    <div key={user._id} className="flex justify-between items-center p-3 border-b border-slate-700 hover:bg-slate-700/50">
                                        <div>
                                            <p className="text-sm font-bold text-white">
                                                {user.playerInfo?.name || user.username}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                Level: {user.playerInfo?.level || 'N/A'} | Email: {user.email}
                                            </p>
                                        </div>
                                        <button type="button" onClick={() => addMember(user)} className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-[10px] font-bold text-white">
                                            + MỜI
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* DANH SÁCH ĐÃ CHỌN */}
                    {invitedMembers.length > 0 && (
                        <div className="bg-slate-800 p-3 rounded border border-slate-600">
                            <p className="text-xs font-bold text-cyan-500 mb-2 uppercase">Đồng đội chờ xác nhận:</p>
                            {invitedMembers.map(member => (
                                <div key={member._id} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-700">
                                    <span className="text-sm text-gray-200">
                                        👤 {member.playerInfo?.name || member.username}
                                    </span>
                                    <button type="button" onClick={() => removeMember(member._id)} className="text-red-400 hover:text-red-300 text-xs font-bold">
                                        ✕ BỎ
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )}

    <button 
        type="submit" 
        disabled={isSaving || !selectedCategory} 
        className={`auth-button w-full mt-6 py-4 text-sm tracking-widest ${isSaving ? 'opacity-50 cursor-not-allowed' : 'shadow-[0_0_15px_rgba(0,240,255,0.4)]'}`}
    >
        {isSaving ? "ĐANG XỬ LÝ DỮ LIỆU..." : "🚀 TIẾN HÀNH ĐĂNG KÝ"}
    </button>
</form>
                
            </div>

            <style>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
                .info-label-tech { color: #00F0FF; font-size: 0.75rem; text-transform: uppercase; font-weight: 900; margin-bottom: 6px; display: block; letter-spacing: 1px;}
            `}</style>
        </div>
    );
};

export default RegisterTeam;