import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api/axiosConfig';

const TournamentRulesView = () => {
    const { id } = useParams(); // Lấy ID giải đấu từ URL
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tournament, setTournament] = useState(null);
    const [selectedSport, setSelectedSport] = useState("");

    // --- STATE CHO DYNAMIC STAGES ---
    const [stageCount, setStageCount] = useState(1);
    const [stages, setStages] = useState([{
        id: crypto.randomUUID(), 
        stageName: "Vòng 1",
        type: "GROUP_STAGE", 
        hasBranches: false,
        branchCount: 1,
        numberOfGroups: 2,
        playersPerGroup: 4,
        advanceCriteria: "TOP_2",
        hasBronzeMatch: false,
        hasWildcards: false,
        wildcardsCount: 0
    }]);

    // LẤY DỮ LIỆU GIẢI ĐẤU ĐỂ BIẾT CÓ MÔN GÌ
   // LẤY DỮ LIỆU GIẢI ĐẤU ĐỂ BIẾT CÓ MÔN GÌ
    useEffect(() => {
        const fetchTournament = async () => {
            try {
                // ĐÃ SỬA: Khớp chính xác route GET chi tiết giải đấu của Backend
                const res = await api.get(`/tournaments/getTournament/${id}`); 
                
                // ĐÃ SỬA: Kiểm tra an toàn dữ liệu trả về
                if (res.data && res.data.success && res.data.data) {
                    const tourData = res.data.data;
                    setTournament(tourData);
                    
                    // Mặc định chọn môn đầu tiên trong danh sách sportsConfig mới
                    if (tourData.sportsConfig && tourData.sportsConfig.length > 0) {
                        setSelectedSport(tourData.sportsConfig[0].sport);
                    }
                } else {
                    console.error("Dữ liệu giải đấu không đúng định dạng:", res.data);
                }
            } catch (error) {
                console.error("Lỗi lấy thông tin giải đấu:", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchTournament();
    }, [id]);

    // LOGIC RENDER FORM ĐỘNG
    useEffect(() => {
        setStages(prevStages => {
            const currentLength = prevStages.length;
            const newCount = Number(stageCount);

            if (newCount > currentLength) {
                const additionalStages = Array.from({ length: newCount - currentLength }).map((_, index) => ({
                    id: crypto.randomUUID(),
                    stageName: `Vòng ${currentLength + index + 1}`,
                    type: "GROUP_STAGE",
                    hasBranches: false,
                    branchCount: 1,
                    numberOfGroups: 2,
                    playersPerGroup: 4,
                    advanceCriteria: "TOP_2",
                    hasBronzeMatch: false,
                    hasWildcards: false,
                    wildcardsCount: 0
                }));
                return [...prevStages, ...additionalStages];
            } else if (newCount < currentLength && newCount > 0) {
                return prevStages.slice(0, newCount);
            }
            return prevStages;
        });
    }, [stageCount]);

    const updateStage = (index, field, value) => {
        const newStages = [...stages];
        newStages[index][field] = value;
        setStages(newStages);
    };

    // LƯU CẤU HÌNH XUỐNG BACKEND
    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                sportType: selectedSport,
                stages: stages
            };
            
            // Gọi API lưu rules mà chúng ta vừa bàn ở Backend
            await api.post(`/rules/save-stages/${id}`, payload);
            
            alert(`✅ Đã lưu cấu hình vòng đấu cho môn ${selectedSport} thành công!`);
        } catch (error) {
            console.error("Lỗi lưu cấu hình:", error);
            alert("❌ Có lỗi xảy ra khi lưu dữ liệu. Vui lòng kiểm tra lại.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-cyan-400 text-center mt-20 animate-pulse font-black text-xl">ĐANG TRÍCH XUẤT DỮ LIỆU...</div>;
    if (!tournament) return <div className="text-red-400 text-center mt-20">Không tìm thấy dữ liệu giải đấu!</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 animate-fade-in custom-scrollbar">
            {/* HEADER */}
            <div className="mb-8 border-b border-cyan-900 pb-6">
                <h1 className="text-3xl font-black text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
                    ⚙️ CẤU HÌNH VÒNG ĐẤU
                </h1>
                <p className="text-gray-400 mt-2 uppercase text-sm tracking-widest">
                    Giải đấu: <span className="text-white font-bold">{tournament.displayName}</span>
                </p>
            </div>

            {/* TAB CHỌN MÔN THI ĐẤU (Dành cho Hội Thao nhiều môn) */}
            {tournament.sportsConfig && tournament.sportsConfig.length > 1 && (
                <div className="mb-6 bg-slate-900 border border-slate-700 p-2 rounded-lg flex gap-2 overflow-x-auto">
                    {tournament.sportsConfig.map((s, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setSelectedSport(s.sport)}
                            className={`px-6 py-3 rounded text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                                selectedSport === s.sport 
                                ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(0,240,255,0.4)]' 
                                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                            }`}
                        >
                            {s.sport}
                        </button>
                    ))}
                </div>
            )}

            {/* BẢNG ĐIỀU KHIỂN SỐ VÒNG */}
            <div className="mb-8 flex items-center gap-4 bg-slate-800/80 p-4 rounded-xl border border-cyan-900/50 shadow-lg">
                <label className="font-black uppercase text-sm text-cyan-300">
                    SỐ LƯỢNG VÒNG ĐẤU ({selectedSport}):
                </label>
                <input 
                    type="number" min="1" max="10"
                    value={stageCount}
                    onChange={(e) => setStageCount(e.target.value)}
                    className="w-20 p-2 bg-slate-900 border border-cyan-500 rounded text-center text-white font-black text-lg outline-none focus:shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                />
            </div>

            {/* RENDER DYNAMIC STAGES (CÁC VÒNG ĐẤU) */}
            <div className="space-y-6">
                {stages.map((stage, index) => (
                    <div key={stage.id} className="p-6 border border-slate-600 bg-slate-900/80 rounded-xl shadow-2xl relative overflow-hidden">
                        {/* Trang trí nền */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-900/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        
                        <h3 className="text-xl font-black text-white mb-6 border-b border-slate-700 pb-3 flex justify-between items-center relative z-10">
                            <span className="text-cyan-400 drop-shadow-md">🔹 VÒNG {index + 1}</span>
                            <span className="text-xs font-bold text-slate-900 bg-cyan-400 px-3 py-1 rounded uppercase tracking-wider">
                                {stage.type === 'GROUP_STAGE' ? 'Vòng Bảng' : 'Loại Trực Tiếp'}
                            </span>
                        </h3>

                        {/* Tên & Hình thức */}
                        <div className="grid grid-cols-2 gap-6 mb-6 relative z-10">
                            <div>
                                <label className="block text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-2">Tên vòng đấu</label>
                                <input 
                                    type="text" 
                                    value={stage.stageName}
                                    onChange={(e) => updateStage(index, 'stageName', e.target.value)}
                                    className="w-full p-3 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:border-cyan-400 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-2">Hình thức thi đấu</label>
                                <select 
                                    value={stage.type}
                                    onChange={(e) => updateStage(index, 'type', e.target.value)}
                                    className="w-full p-3 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:border-cyan-400 outline-none transition-all"
                                >
                                    <option value="GROUP_STAGE">Vòng Bảng (Group Stage)</option>
                                    <option value="KNOCKOUT">Loại trực tiếp (Knockout)</option>
                                </select>
                            </div>
                        </div>

                        {/* CẤU HÌNH NHÁNH ĐẤU KHU VỰC */}
                        <div className="bg-slate-800 p-4 rounded-lg mb-5 border border-slate-700 relative z-10">
                            <label className="flex items-center gap-3 text-sm font-black text-yellow-500 cursor-pointer w-fit">
                                <input 
                                    type="checkbox" 
                                    checked={stage.hasBranches}
                                    onChange={(e) => updateStage(index, 'hasBranches', e.target.checked)}
                                    className="accent-yellow-500 w-5 h-5 cursor-pointer"
                                />
                                CHIA NHÁNH THI ĐẤU KHU VỰC Ở VÒNG NÀY?
                            </label>
                            
                            {stage.hasBranches && (
                                <div className="flex items-center gap-4 mt-4 pl-8 animate-fade-in border-l-2 border-yellow-600/50">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Số lượng nhánh:</span>
                                    <input 
                                        type="number" min="2"
                                        value={stage.branchCount}
                                        onChange={(e) => updateStage(index, 'branchCount', parseInt(e.target.value) || 1)}
                                        className="w-20 p-2 bg-slate-900 border border-yellow-600 rounded text-center text-yellow-400 font-black outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        {/* CẤU HÌNH ĐẶC THÙ */}
                        {stage.type === 'GROUP_STAGE' && (
                            <div className="grid grid-cols-3 gap-4 bg-cyan-950/20 p-5 rounded-lg border border-cyan-900/50 mb-5 relative z-10 animate-fade-in">
                                <div>
                                    <label className="block text-[10px] text-cyan-200 font-bold uppercase tracking-wide mb-2">Số lượng bảng</label>
                                    <input type="number" value={stage.numberOfGroups} onChange={(e) => updateStage(index, 'numberOfGroups', e.target.value)} className="w-full p-2 bg-slate-900 border border-cyan-800 rounded text-white text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-cyan-200 font-bold uppercase tracking-wide mb-2">Số Đội/Bảng</label>
                                    <input type="number" value={stage.playersPerGroup} onChange={(e) => updateStage(index, 'playersPerGroup', e.target.value)} className="w-full p-2 bg-slate-900 border border-cyan-800 rounded text-white text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-cyan-200 font-bold uppercase tracking-wide mb-2">Vé đi tiếp / Bảng</label>
                                    <select value={stage.advanceCriteria} onChange={(e) => updateStage(index, 'advanceCriteria', e.target.value)} className="w-full p-2 bg-slate-900 border border-cyan-800 rounded text-white text-sm outline-none">
                                        <option value="TOP_1">Lấy Top 1</option>
                                        <option value="TOP_2">Lấy Top 2 (Nhất & Nhì)</option>
                                        <option value="TOP_3">Lấy Top 3</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {stage.type === 'KNOCKOUT' && (
                            <div className="bg-purple-950/20 p-4 rounded-lg mb-5 border border-purple-900/50 relative z-10 animate-fade-in">
                                <label className="flex items-center gap-3 text-sm text-purple-400 font-black cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={stage.hasBronzeMatch}
                                        onChange={(e) => updateStage(index, 'hasBronzeMatch', e.target.checked)}
                                        className="accent-purple-500 w-5 h-5"
                                    />
                                    CÓ TỔ CHỨC TRẬN TRANH HẠNG 3 (HUY CHƯƠNG ĐỒNG)
                                </label>
                            </div>
                        )}

                        {/* VÉ VỚT */}
                        <div className="bg-orange-950/10 p-4 rounded-lg border border-orange-900/30 relative z-10">
                            <label className="flex items-center gap-3 text-sm font-black text-orange-400 cursor-pointer w-fit">
                                <input 
                                    type="checkbox" 
                                    checked={stage.hasWildcards}
                                    onChange={(e) => updateStage(index, 'hasWildcards', e.target.checked)}
                                    className="accent-orange-500 w-5 h-5 cursor-pointer"
                                />
                                ÁP DỤNG VÉ VỚT (LUCKY LOSERS / WILDCARDS)
                            </label>
                            
                            {stage.hasWildcards && (
                                <div className="flex flex-col gap-2 mt-4 pl-8 border-l-2 border-orange-600/50 animate-fade-in">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Số lượng vé vớt:</span>
                                        <input 
                                            type="number" min="1"
                                            value={stage.wildcardsCount}
                                            onChange={(e) => updateStage(index, 'wildcardsCount', parseInt(e.target.value) || 0)}
                                            className="w-20 p-2 bg-slate-900 border border-orange-600 rounded text-center text-orange-400 font-black outline-none"
                                        />
                                    </div>
                                    <span className="text-[10px] text-gray-500 italic max-w-md">
                                        * Hệ thống sẽ tự động đối chiếu điểm số và hiệu số để chọn ra các đội bị loại có thành tích tốt nhất đi tiếp vào vòng trong.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ACTION BUTTON */}
            <div className="mt-10 pb-10">
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className={`w-full py-5 rounded-xl font-black text-lg tracking-widest transition-all uppercase ${
                        saving 
                        ? 'bg-slate-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-cyan-700 to-cyan-500 text-white hover:from-cyan-600 hover:to-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.4)] transform hover:-translate-y-1'
                    }`}
                >
                    {saving ? "ĐANG ĐỒNG BỘ DỮ LIỆU..." : "💾 LƯU CẤU HÌNH VÒNG ĐẤU MÁY CHỦ"}
                </button>
            </div>

            <style>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default TournamentRulesView;