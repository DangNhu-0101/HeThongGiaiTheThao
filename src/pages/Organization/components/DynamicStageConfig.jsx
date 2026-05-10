import React, { useState, useEffect } from 'react';

const DynamicStageConfig = () => {
    const [stageCount, setStageCount] = useState(1);
    
    // 1. CẬP NHẬT INITIAL STATE THÊM 'hasWildcards' VÀ 'wildcardsCount'
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
        // --- THÊM TÍNH NĂNG VỚT ---
        hasWildcards: false,
        wildcardsCount: 0
    }]);

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
                    // --- THÊM TÍNH NĂNG VỚT ---
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

    const handleSave = () => {
        console.log("Payload gửi Backend:", stages);
        alert("Đã lưu cấu hình vòng đấu! Kiểm tra Console để xem Payload.");
    };

    return (
        <div className="p-6 bg-slate-900 text-cyan-400 rounded-xl max-w-3xl mx-auto border border-cyan-700 custom-scrollbar">
            <h2 className="text-xl font-black mb-4 uppercase">🏆 Cấu hình giai đoạn thi đấu</h2>
            
            <div className="mb-8 flex items-center gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <label className="font-bold uppercase text-sm">Số lượng vòng đấu (Stages):</label>
                <input 
                    type="number" 
                    min="1" max="10"
                    value={stageCount}
                    onChange={(e) => setStageCount(e.target.value)}
                    className="w-20 p-2 bg-slate-900 border border-cyan-500 rounded text-center text-white font-bold"
                />
                <span className="text-xs text-gray-400 italic">Thay đổi số lượng để hệ thống tự động sinh form</span>
            </div>

            {/* RENDER DYNAMIC STAGES */}
            <div className="space-y-6">
                {stages.map((stage, index) => (
                    <div key={stage.id} className="p-5 border border-slate-600 bg-slate-800/80 rounded-lg shadow-xl">
                        <h3 className="text-lg font-black text-white mb-4 border-b border-cyan-800 pb-2 flex justify-between">
                            <span>🔹 VÒNG {index + 1}</span>
                            <span className="text-xs font-normal text-cyan-500 bg-cyan-950 px-2 py-1 rounded">
                                {stage.type === 'GROUP_STAGE' ? 'VÒNG BẢNG' : 'LOẠI TRỰC TIẾP'}
                            </span>
                        </h3>

                        {/* THÔNG TIN CHUNG CỦA VÒNG */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[10px] text-cyan-400 font-bold uppercase mb-1">Tên vòng đấu</label>
                                <input 
                                    type="text" 
                                    value={stage.stageName}
                                    onChange={(e) => updateStage(index, 'stageName', e.target.value)}
                                    className="w-full p-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:border-cyan-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-cyan-400 font-bold uppercase mb-1">Hình thức</label>
                                <select 
                                    value={stage.type}
                                    onChange={(e) => updateStage(index, 'type', e.target.value)}
                                    className="w-full p-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:border-cyan-500 outline-none"
                                >
                                    <option value="GROUP_STAGE">Vòng Bảng (Group Stage)</option>
                                    <option value="KNOCKOUT">Loại trực tiếp (Knockout)</option>
                                    <option value="SWISS_SYSTEM">Hệ Thụy Sĩ (Swiss)</option>
                                </select>
                            </div>
                        </div>

                        {/* CẤU HÌNH NHÁNH ĐẤU (CHIA KHU VỰC/BẢNG LỚN) */}
                        <div className="bg-slate-900/50 p-3 rounded mb-4 border border-slate-700">
                            <label className="flex items-center gap-2 text-sm font-bold text-yellow-500 mb-1 cursor-pointer w-fit">
                                <input 
                                    type="checkbox" 
                                    checked={stage.hasBranches}
                                    onChange={(e) => updateStage(index, 'hasBranches', e.target.checked)}
                                    className="accent-yellow-500 w-4 h-4 cursor-pointer"
                                />
                                CHIA NHÁNH THI ĐẤU KHU VỰC Ở VÒNG NÀY?
                            </label>
                            
                            {stage.hasBranches && (
                                <div className="flex items-center gap-4 mt-3 pl-6 animate-fade-in">
                                    <span className="text-xs text-gray-300">Nhập số lượng nhánh (VD: Bắc, Trung, Nam = 3):</span>
                                    <input 
                                        type="number" min="2"
                                        value={stage.branchCount}
                                        onChange={(e) => updateStage(index, 'branchCount', parseInt(e.target.value) || 1)}
                                        className="w-16 p-1 bg-slate-900 border border-yellow-600 rounded text-center text-white text-sm outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        {/* CẤU HÌNH ĐẶC THÙ THEO HÌNH THỨC */}
                        {stage.type === 'GROUP_STAGE' && (
                            <div className="grid grid-cols-3 gap-4 bg-cyan-950/30 p-4 rounded border border-cyan-900/50 mb-4">
                                <div>
                                    <label className="block text-[10px] text-cyan-200 uppercase mb-1">Số lượng bảng</label>
                                    <input type="number" value={stage.numberOfGroups} onChange={(e) => updateStage(index, 'numberOfGroups', e.target.value)} className="w-full p-2 bg-slate-900 border border-cyan-800 rounded text-white text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-cyan-200 uppercase mb-1">Số Đội/Bảng</label>
                                    <input type="number" value={stage.playersPerGroup} onChange={(e) => updateStage(index, 'playersPerGroup', e.target.value)} className="w-full p-2 bg-slate-900 border border-cyan-800 rounded text-white text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-cyan-200 uppercase mb-1">Điều kiện lấy vé chính</label>
                                    <select value={stage.advanceCriteria} onChange={(e) => updateStage(index, 'advanceCriteria', e.target.value)} className="w-full p-2 bg-slate-900 border border-cyan-800 rounded text-white text-sm outline-none">
                                        <option value="TOP_1">Chỉ lấy Nhất Bảng (Top 1)</option>
                                        <option value="TOP_2">Lấy Nhất & Nhì (Top 2)</option>
                                        <option value="TOP_3">Lấy Nhất, Nhì, Ba (Top 3)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {stage.type === 'KNOCKOUT' && (
                            <div className="bg-purple-950/30 p-3 rounded mb-4 border border-purple-900/50">
                                <label className="flex items-center gap-2 text-sm text-purple-300 font-bold cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={stage.hasBronzeMatch}
                                        onChange={(e) => updateStage(index, 'hasBronzeMatch', e.target.checked)}
                                        className="accent-purple-500 w-4 h-4"
                                    />
                                    CÓ TỔ CHỨC TRẬN TRANH HẠNG 3 (HUY CHƯƠNG ĐỒNG)
                                </label>
                            </div>
                        )}

                        {/* --- KHỐI VÉ VỚT (LUÔN HIỆN Ở MỌI VÒNG ĐẤU) --- */}
                        <div className="bg-orange-950/20 p-3 rounded border border-orange-900/50">
                            <label className="flex items-center gap-2 text-sm font-bold text-orange-400 cursor-pointer w-fit">
                                <input 
                                    type="checkbox" 
                                    checked={stage.hasWildcards}
                                    onChange={(e) => updateStage(index, 'hasWildcards', e.target.checked)}
                                    className="accent-orange-500 w-4 h-4 cursor-pointer"
                                />
                                ÁP DỤNG VÉ VỚT (LUCKY LOSERS / WILDCARDS)?
                            </label>
                            
                            {stage.hasWildcards && (
                                <div className="flex items-center gap-4 mt-3 pl-6 animate-fade-in bg-slate-900/50 p-3 rounded border border-orange-900/30">
                                    <span className="text-xs text-orange-200">Nhập số lượng vé vớt ở vòng này:</span>
                                    <input 
                                        type="number" min="1"
                                        value={stage.wildcardsCount}
                                        onChange={(e) => updateStage(index, 'wildcardsCount', parseInt(e.target.value) || 0)}
                                        className="w-20 p-2 bg-slate-900 border border-orange-600 rounded text-center text-orange-400 font-bold text-sm outline-none focus:bg-slate-800 transition"
                                    />
                                    <span className="text-[10px] text-gray-500 italic max-w-xs leading-tight">
                                        *Hệ thống sẽ tự động chọn các đội bị loại có thành tích tốt nhất (Điểm số, Hiệu số) để lấp vào nhánh vòng trong.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            <button onClick={handleSave} className="mt-8 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-lg tracking-widest shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all transform active:scale-95">
                XÁC NHẬN & LƯU CẤU HÌNH VÒNG ĐẤU
            </button>
            
            <style>{`
                .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default DynamicStageConfig;