import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../../api/axiosConfig";

const DashboardView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);

    const IMAGE_BASE_URL = "http://localhost:5001/"; 
    const formatImagePath = (path) => path ? path.replace(/\\/g, '/') : '';

    useEffect(() => {
        const fetchActiveTournamentInfo = async () => {
            if (!id) {
                setLoading(false);
                return;
            }
            try {
                const res = await api.get(`/tournaments/${id}`);
                if (res.data.success || res.data.data) {
                    setTournament(res.data.data);
                }
            } catch (error) {
                console.error("Lỗi đồng bộ Dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchActiveTournamentInfo();
    }, [id]);

    const calculatePlannedRevenue = () => {
        if (!tournament?.sportsConfig || tournament.sportsConfig.length === 0) return 0;
        return tournament.sportsConfig.reduce((sum, sport) => {
            const fee = Number(sport.feePerAthlete) || 0; // Sửa: feePerAthlete
            const max = Number(sport.maxTeams) || 0;
            return (sum + (fee * max)) * 2;
        }, 0);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64 bg-slate-900 rounded-2xl border border-cyan-800/50">
            <div className="text-xl font-black text-neon-cyan animate-pulse tracking-widest uppercase">
                Đang nạp dữ liệu lõi...
            </div>
        </div>
    );

    if (!id || !tournament) return (
        <div className="flex flex-col justify-center items-center h-64 border-2 border-dashed border-cyan-800/50 rounded-2xl bg-slate-900/50">
            <span className="text-4xl mb-4">📡</span>
            <p className="text-cyan-600 text-sm font-bold uppercase tracking-widest">Hệ thống đang chờ lệnh chọn giải đấu</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 animate-fade-in space-y-6">
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

            {/* HEADER */}
            <div className="bg-slate-900/90 border-b-2 border-neon-cyan p-6 rounded-t-2xl flex justify-between items-end shadow-neon-glow">
                <div className="space-y-1">
                    <p className="text-[9px] text-cyan-500 font-black tracking-[5px] uppercase">Core-ID: {tournament._id}</p>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic">
                        {tournament.name} {/* Sửa: displayName → name */}
                    </h1>
                    <div className="flex gap-3 pt-2">
                        <span className="status-tag bg-cyan-900/40 text-cyan-400 border-cyan-500">Status: {tournament.status}</span>
                        <span className="status-tag bg-slate-800 text-gray-400 border-slate-700">Môn: {tournament.sportType?.join(', ')}</span>
                    </div>
                </div>
            </div>

            {/* BANNER & LOGO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 relative h-56 rounded-2xl overflow-hidden border border-slate-800 group shadow-lg">
                    {tournament.banners && tournament.banners[0] ? (
                        <img 
                            src={IMAGE_BASE_URL + formatImagePath(tournament.banners[0])} 
                            alt="Banner" 
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500" 
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <span className="text-slate-600">No Banner</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                    <div className="absolute bottom-6 left-8">
                        <p className="text-[10px] text-neon-cyan font-black uppercase tracking-[3px] mb-1">Tournament Mission</p>
                        <h2 className="text-3xl font-black text-white italic drop-shadow-md">"{tournament.slogan}"</h2>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center relative shadow-inner">
                    <div className="absolute top-3 right-4 text-[8px] text-slate-600 font-black tracking-widest uppercase">Auth-Logo</div>
                    {tournament.logo ? (
                        <img 
                            src={IMAGE_BASE_URL + formatImagePath(tournament.logo)} 
                            alt="Logo" 
                            className="h-36 w-36 object-contain filter drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]" 
                        />
                    ) : (
                        <span className="text-slate-600">No Logo</span>
                    )}
                </div>
            </div>

            {/* DATA SPECS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoCard label="Thiết lập địa điểm" value={tournament.location} icon="📍" />
                <InfoCard label="Phân khúc mục tiêu" value={tournament.targetParticipants} icon="👥" color="border-l-energy-red" />
                <InfoCard label="Nhân sự liên hệ" value={tournament.contactPerson?.name || "N/A"} icon="📞" />
                <InfoCard label="Tổng hợp giải thưởng" value={tournament.prizes} icon="🎁" color="border-l-cyan-400" />
            </div>

            {/* CONTENT HUB */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
                        <h3 className="text-neon-cyan font-black text-xs uppercase tracking-[4px] mb-8 flex items-center gap-3">
                            <span className="w-8 h-[2px] bg-neon-cyan"></span> Sports Configuration
                        </h3>
                        <div className="grid gap-4">
                            {tournament.sportsConfig?.map((sport, idx) => (
                                <div key={idx} className="bg-slate-800/30 border border-slate-700/50 p-6 rounded-xl flex justify-between items-center hover:border-neon-cyan/40 hover:bg-slate-800/60 transition-all group">
                                    <div className="space-y-3">
                                        <h4 className="text-2xl font-black text-white group-hover:text-neon-cyan transition-colors">{sport.sport}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {sport.categories?.map(cat => (
                                                <span key={cat} className="text-[9px] bg-cyan-900/20 text-cyan-300 px-3 py-1 rounded border border-cyan-800 uppercase font-bold">{cat}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Fee / Limit</p>
                                        <p className="text-xl font-black text-white">
                                            {sport.feePerAthlete ? (sport.feePerAthlete * 2).toLocaleString() : "N/A"} <span className="text-xs text-cyan-600">VNĐ</span>
                                        </p>
                                        <p className="text-xs text-slate-400 font-bold">Max: {sport.maxTeams || "Unlimited"} Teams</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-3">System Description</label>
                        <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-slate-700 pl-4">
                            {tournament.description}
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 border border-cyan-500/30 p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
                        <label className="text-[9px] text-cyan-500 font-black uppercase tracking-widest">Estimated Revenue</label>
                        <p className="text-4xl font-black text-white mt-2 leading-none">
                            {calculatePlannedRevenue().toLocaleString()} <span className="text-xs text-cyan-600">VNĐ</span>
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest border-b border-slate-800 pb-3">Critical Timeline</h3>
                        <TimelineRow label="Đăng ký" start={tournament.timeLine?.registrationStart} end={tournament.timeLine?.registrationEnd} />
                        <TimelineRow label="Thi đấu" start={tournament.timeLine?.tournamentStart} end={tournament.timeLine?.tournamentEnd} />
                    </div>

                    {tournament.galaConfig && (
                        <div className={`p-6 rounded-2xl border ${tournament.galaConfig?.hasGala ? 'bg-indigo-900/10 border-indigo-500/50' : 'bg-slate-900 border-slate-800 opacity-40'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Gala Event</h3>
                                {tournament.galaConfig?.hasGala && <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>}
                            </div>
                            {tournament.galaConfig?.hasGala ? (
                                <div className="space-y-2">
                                    <p className="text-xs text-white font-bold tracking-tight">📍 {tournament.galaConfig.location}</p>
                                    <p className="text-[11px] text-indigo-300 font-medium">🕒 {new Date(tournament.galaConfig.time).toLocaleString('vi-VN')}</p>
                                    <p className="text-[10px] text-slate-500 italic mt-2">"{tournament.galaConfig.description}"</p>
                                </div>
                            ) : <p className="text-xs text-slate-600 font-bold">No Gala Configured</p>}
                        </div>
                    )}

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center">
                        <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-4 block">Official Payment QR</label>
                        <div className="relative inline-block p-2 bg-white rounded-xl shadow-lg hover:scale-105 transition-transform cursor-zoom-in">
                            {tournament.paymentQR ? (
                                <img 
                                    src={IMAGE_BASE_URL + formatImagePath(tournament.paymentQR)} 
                                    alt="Payment QR" 
                                    className="w-40 h-40 object-contain" 
                                />
                            ) : (
                                <span className="text-slate-400 text-xs">No QR Code</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-6">
                <MetaItem label="Created At" value={new Date(tournament.createdAt).toLocaleString()} />
                <MetaItem label="Last Update" value={new Date(tournament.updatedAt).toLocaleString()} />
                <MetaItem label="Organizer" value={tournament.organizer?.name || "N/A"} />
                <MetaItem label="Location" value={tournament.location || "N/A"} />
            </div>

            <style>{`
                .status-tag { padding: 4px 12px; border-radius: 4px; font-weight: 900; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; border: 1px solid; }
                .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

// SUB-COMPONENTS
const InfoCard = ({ label, value, icon, color = "border-l-slate-700" }) => (
    <div className={`bg-slate-900/80 border-l-4 ${color} p-5 rounded-r-xl transition-all hover:bg-slate-800`}>
        <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">{icon}</span>
            <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{label}</label>
        </div>
        <p className="text-xs text-white font-black truncate" title={value}>{value || "Not Set"}</p>
    </div>
);

const TimelineRow = ({ label, start, end }) => (
    <div className="flex justify-between items-center group">
        <span className="text-[10px] text-slate-500 font-bold uppercase">{label}</span>
        <div className="text-right">
            <p className="text-[10px] text-white font-black">{start ? new Date(start).toLocaleDateString('vi-VN') : '---'}</p>
            {end && <p className="text-[9px] text-energy-red font-bold group-hover:translate-x-1 transition-transform">➔ {new Date(end).toLocaleDateString('vi-VN')}</p>}
        </div>
    </div>
);

const MetaItem = ({ label, value }) => (
    <div className="space-y-1">
        <p className="text-[8px] text-slate-600 font-black uppercase tracking-tighter">{label}</p>
        <p className="text-[9px] text-slate-400 font-mono break-all">{value}</p>
    </div>
);

export default DashboardView;