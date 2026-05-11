import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from "../../../api/axiosConfig";

const MatchView = () => {
    const { id: tournamentId } = useParams();
    const rules = []; 
    const [selectedRule, setSelectedRule] = useState("");
    const [startTime, setStartTime] = useState("");
    const [courts, setCourts] = useState(["Sân 1", "Sân 2", "Sân 3"]);
    const [draftMatches, setDraftMatches] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAutoDraw = async () => {
        if (!selectedRule || !startTime) {
            alert("Vui lòng chọn môn thi đấu và giờ bắt đầu!");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await api.post(`/matches/auto-draw/${tournamentId}`, {
                ruleId: selectedRule,
                startTime: startTime,
                courts: courts
            });

            if (res.data.success) {
                setDraftMatches(res.data.data);
                alert("AI đã bốc thăm và xếp lịch nháp thành công!");
            }
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi khi bốc thăm từ Server");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePublish = async () => {
        try {
            const res = await api.post('/matches/publish', { matches: draftMatches });
            if (res.data.success) {
                alert("Lịch thi đấu đã được công khai!");
                setDraftMatches([]);
            }
        } catch (error) {
            alert("Lỗi khi lưu lịch thi đấu chính thức");
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            {/* Khối AI Engine (Unified Container V2) */}
            <div className="bg-gradient-to-br from-[#0e2a07] to-[#16400b] text-white p-10 rounded-[24px] shadow-[0_20px_40px_rgba(14,42,7,0.2)] relative overflow-hidden mb-10">
                {/* Hào quang nền */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(206,241,95,0.05),transparent_50%)]"></div>

                <h3 className="text-3xl font-black font-title text-primary-lime mb-8 flex items-center relative z-10">
                    <span className="w-12 h-12 bg-primary-lime/20 rounded-xl flex items-center justify-center mr-4 text-2xl shadow-[0_0_15px_rgba(206,241,95,0.3)]">🤖</span> 
                    AI TOURNAMENT ENGINE
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
                    <div className="bg-white/5 border border-white/10 p-5 rounded-[16px] backdrop-blur-md transition-all hover:border-primary-lime/50">
                        <label className="block text-xs font-black text-primary-lime uppercase tracking-widest mb-2">1. Chọn môn thi đấu</label>
                        <select 
                            className="w-full bg-black/40 border border-white/20 text-white p-3 rounded-xl focus:border-primary-lime focus:ring-1 focus:ring-primary-lime outline-none transition"
                            value={selectedRule}
                            onChange={(e) => setSelectedRule(e.target.value)}
                            disabled={rules.length === 0}
                        >
                            <option value="" className="text-gray-900">-- Click để chọn --</option>
                            {rules?.length > 0 ? (
                                rules.map(r => (
                                    <option key={r._id} value={r._id} className="text-gray-900">{r.ruleName} ({r.sportType})</option>
                                ))
                            ) : (
                                <option value="" disabled className="text-gray-900">Đang tải dữ liệu luật...</option>
                            )}
                        </select>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-5 rounded-[16px] backdrop-blur-md transition-all hover:border-primary-lime/50">
                        <label className="block text-xs font-black text-primary-lime uppercase tracking-widest mb-2">2. Giờ bắt đầu</label>
                        <input 
                            type="datetime-local" 
                            className="w-full bg-black/40 border border-white/20 text-white p-3 rounded-xl focus:border-primary-lime focus:ring-1 focus:ring-primary-lime outline-none transition [color-scheme:dark]"
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div>
                </div>

                <button 
                    onClick={handleAutoDraw}
                    disabled={isProcessing}
                    className={`relative z-10 w-full py-4 rounded-xl font-title font-black text-xl uppercase tracking-widest transition-all duration-300 shadow-[0_10px_20px_rgba(206,241,95,0.2)]
                        ${isProcessing ? 'bg-white/10 text-gray-400 cursor-not-allowed' : 'bg-primary-lime text-dark-forest hover:bg-[#bad94b] hover:-translate-y-1'}`}
                >
                    {isProcessing ? 'Đang tính toán ma trận lịch...' : 'Khởi chạy Bốc Thăm & Xếp Lịch'}
                </button>
            </div>

            {/* Danh sách trận đấu nháp */}
            {draftMatches?.length > 0 && (
                <div className="animate-fade-in">
                    <div className="flex items-center gap-4 mb-6">
                        <h4 className="text-2xl font-black font-title text-dark-forest uppercase">Lịch Thi Đấu Dự Kiến</h4>
                        <span className="bg-brick-red text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-md">Bản Nháp (Draft)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {draftMatches.map((m, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-[#0a1d05] to-[#112a0d] border-t-4 border-primary-lime p-5 rounded-[20px] shadow-lg flex justify-between items-center group transition hover:-translate-y-1 hover:shadow-xl">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400">
                                        <span className="bg-white/10 text-primary-lime px-2 py-1 rounded-md">
                                            {new Date(m.timestart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        <span>•</span>
                                        <span className="text-gray-300">{m.court}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-lg font-black text-white mt-1">
                                        <span className="group-hover:text-primary-lime transition-colors">{m.team1Name}</span>
                                        <span className="text-sm font-bold text-gray-500">VS</span>
                                        <span className="group-hover:text-primary-lime transition-colors">{m.team2Name}</span>
                                    </div>
                                </div>
                                <div className="bg-white/5 text-gray-300 font-bold text-xs px-3 py-2 rounded-xl text-center leading-none border border-white/10">
                                    BẢNG <br/> <span className="text-xl font-title font-black text-primary-lime">{m.group}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handlePublish}
                        className="w-full mt-8 py-4 bg-teal-accent hover:bg-[#1f5c45] text-white font-title font-bold text-xl uppercase tracking-wide rounded-2xl shadow-xl transition hover:-translate-y-1"
                    >
                        Xác Nhận & Công Khai Lịch Trận Đấu
                    </button>
                </div>
            )}
        </div>
    );
};

export default MatchView;