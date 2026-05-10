import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../../api/axiosConfig";

const DashboardView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActiveTournamentInfo = async () => {
            if (!id) {
                setLoading(false);
                return;
            }
            
            try {
                // Đảm bảo route này khớp với Backend của bạn
                const res = await api.get(`/tournaments/getTournament/${id}`);
                if (res.data.success || res.data.data) {
                    setTournament(res.data.data);
                }
            } catch (error) {
                console.error("Lỗi lấy dữ liệu dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveTournamentInfo();
    }, [id]);

    // Hàm tự động tính doanh thu dự kiến dựa trên mảng sportsConfig mới
    const calculatePlannedRevenue = () => {
        if (!tournament?.sportsConfig || tournament.sportsConfig.length === 0) return 0;
        return tournament.sportsConfig.reduce((sum, sport) => {
            const fee = Number(sport.feeEntry) || 0;
            const max = Number(sport.maxTeams) || 0; 
            return sum + (fee * max);
        }, 0);
    };

    // UI ĐANG TẢI
    if (loading) return (
        <div className="flex justify-center items-center h-64 bg-slate-900 rounded-2xl border border-cyan-800/50">
            <div className="text-xl font-black text-cyan-400 animate-pulse tracking-widest uppercase">
                Đang trích xuất dữ liệu lõi...
            </div>
        </div>
    );

    // UI CHƯA CHỌN GIẢI
    if (!id || !tournament) return (
        <div className="flex flex-col justify-center items-center h-64 border-2 border-dashed border-cyan-800/50 rounded-2xl bg-slate-900/50">
            <span className="text-4xl mb-4 animate-bounce">👈</span>
            <p className="text-cyan-600 text-sm font-bold uppercase tracking-widest">
                Vui lòng chọn một giải đấu từ bảng điều khiển bên trái
            </p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6 animate-fade-in custom-scrollbar">
            {/* HEADER KHU VỰC & ĐIỀU HƯỚNG */}
            <div className="flex justify-between items-end mb-8 border-b border-cyan-900 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
                        {tournament.displayName}
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className={`px-3 py-1 rounded font-bold text-[10px] uppercase tracking-widest ${tournament.status === 'upcoming' ? 'bg-cyan-900 text-cyan-300 border border-cyan-500' : 'bg-green-900 text-green-300 border border-green-500'}`}>
                            {tournament.status || "UPCOMING"}
                        </span>
                        <span className="text-xs text-gray-400 font-bold bg-slate-800 px-3 py-1 rounded border border-slate-600">
                            Niên khóa: {tournament.year}
                        </span>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => navigate(`/admin/tournament/${id}/settings`)} 
                        className="bg-transparent border border-cyan-500 text-cyan-400 px-5 py-2.5 rounded text-xs font-bold uppercase tracking-widest hover:bg-cyan-900/40 transition-all shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                    >
                        🔧 Sửa Thông Tin 
                    </button>
                    <button 
                        onClick={() => navigate(`/admin/tournament/${id}/rules`)} 
                        className="bg-cyan-600 text-white px-5 py-2.5 rounded text-xs font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                    >
                        ⚙️ Cấu Hình Vòng Đấu
                    </button>
                </div>
            </div>

            {/* THÔNG TIN TỔNG QUAN (INFO BAR) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Địa điểm (Venue)</p>
                    <p className="text-sm text-gray-200 font-bold truncate" title={tournament.venue}>{tournament.venue || "Chưa cập nhật"}</p>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Thời gian tranh tài</p>
                    <p className="text-sm text-gray-200 font-bold">
                        {tournament.timeLine?.timeOpen ? new Date(tournament.timeLine.timeOpen).toLocaleDateString('vi-VN') : "Chưa cập nhật"}
                        {tournament.timeLine?.timeClose ? ` - ${new Date(tournament.timeLine.timeClose).toLocaleDateString('vi-VN')}` : ""}
                    </p>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl md:col-span-2">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Slogan & Thông điệp</p>
                    <p className="text-sm text-cyan-300 font-bold italic truncate">"{tournament.slogan || "Chưa cập nhật thông điệp giải đấu"}"</p>
                </div>
            </div>

            {/* CÁC THẺ THỐNG KÊ CHI TIẾT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                
                {/* 1. Thẻ Doanh Thu */}
                <div className="relative overflow-hidden bg-slate-900 border border-cyan-800 p-6 rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.05)]">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-900/30 rounded-full blur-2xl"></div>
                    <h3 className="text-cyan-600 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span>💰</span> Tài Chính Dự Kiến
                    </h3>
                    <p className="text-3xl font-black text-cyan-400 mt-3">
                        {calculatePlannedRevenue().toLocaleString()} <span className="text-lg text-cyan-700">VNĐ</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-2 italic">*Tính dựa trên tổng lệ phí x số đội giới hạn</p>
                </div>

                {/* 2. Thẻ Quy Mô Môn Thi */}
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span>🏅</span> Quy Mô Giải Đấu
                    </h3>
                    <div className="flex items-baseline gap-2 mt-3">
                        <p className="text-3xl font-black text-white">
                            {tournament.sportsConfig?.length || 0}
                        </p>
                        <span className="text-sm text-gray-400 font-bold">Môn thi đấu</span>
                    </div>
                    
                    {/* Liệt kê các môn dạng tags */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {tournament.sportsConfig?.map((s, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-800 text-cyan-400 px-2 py-1 rounded border border-slate-600 uppercase font-bold">
                                {s.sport}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 3. Thẻ Gala Event */}
                <div className={`p-6 rounded-2xl shadow-lg border ${tournament.galaConfig?.hasGala ? 'bg-indigo-950/20 border-indigo-500/50' : 'bg-slate-900 border-slate-700'}`}>
                    <h3 className={`text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${tournament.galaConfig?.hasGala ? 'text-indigo-400' : 'text-gray-500'}`}>
                        <span>🥂</span> Sự Kiện Gala
                    </h3>
                    
                    {tournament.galaConfig?.hasGala ? (
                        <div className="mt-3">
                            <p className="text-xl font-black text-indigo-200 mb-1">CÓ TỔ CHỨC</p>
                            <p className="text-xs text-indigo-300/80 font-bold truncate">📍 {tournament.galaConfig.venue}</p>
                            <p className="text-[11px] text-indigo-400/60 mt-2">
                                🕒 {tournament.galaConfig.time ? new Date(tournament.galaConfig.time).toLocaleString('vi-VN') : 'Chưa định thời gian'}
                            </p>
                        </div>
                    ) : (
                        <p className="text-lg font-black text-gray-600 mt-4">KHÔNG TỔ CHỨC GALA</p>
                    )}
                </div>
            </div>
            
            {/* KHU VỰC THỐNG KÊ (GIỮ CHỖ CHO CHART) */}
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 min-h-[250px] flex items-center justify-center relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#00F0FF 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="z-10 text-center">
                    <span className="text-4xl">📊</span>
                    <p className="text-cyan-800 mt-4 uppercase tracking-widest text-sm font-black">
                        Hệ thống biểu đồ đang được mã hóa
                    </p>
                    <p className="text-xs text-gray-600 mt-2">Vui lòng quay lại sau khi giải đấu bắt đầu nhận đăng ký.</p>
                </div>
            </div>

            <style>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default DashboardView;