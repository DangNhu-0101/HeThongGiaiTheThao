import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const TeamDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');

    const fetchTeamDetail = async () => {
        try {
            const res = await api.get(`/teams/detail/${id}`);
            if (res.data.success) {
                setTeam(res.data.data);
                setNewName(res.data.data.teamName);
            }
        } catch (err) { 
            console.error(err); 
            alert("Không thể tải thông tin đội bóng");
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchTeamDetail(); }, [id]);

    const handleUpdateName = async () => {
        if (!newName.trim()) return alert("Tên đội không được để trống");
        try {
            await api.patch(`/teams/update/${id}`, { teamName: newName });
            setIsEditing(false);
            fetchTeamDetail();
        } catch (err) { alert("Lỗi cập nhật tên đội"); }
    };

    const handleDeleteTeam = async () => {
        if (!window.confirm("CẢNH BÁO: Bạn có chắc muốn HỦY ĐĂNG KÝ? Đội sẽ bị xóa hoàn toàn khỏi giải đấu!")) return;
        try {
            await api.delete(`/teams/delete/${id}`);
            navigate('/my-teams');
        } catch (err) { alert("Lỗi khi xóa đội"); }
    };

    const handleRemoveMember = async (memberId, name) => {
        if (!window.confirm(`Bạn có chắc muốn mời ${name} ra khỏi đội/hủy lời mời?`)) return;
        try {
            await api.delete(`/teams/remove-member/${memberId}`);
            fetchTeamDetail();
        } catch (err) { alert("Lỗi thao tác"); }
    };

    if (loading) return <div className="text-center py-20 text-cyan-400 font-black text-xl">⚡ ĐANG TẢI DỮ LIỆU ĐỘI...</div>;
    if (!team) return <div className="text-center py-20 text-red-500 font-black">❌ KHÔNG TÌM THẤY THÔNG TIN ĐỘI</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
            {/* ================= HEADER ================= */}
            <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl mb-6 relative overflow-hidden shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                    <div className="flex-1 w-full">
                        {isEditing ? (
                            <div className="flex flex-wrap gap-2 w-full">
                                <input 
                                    className="bg-slate-800 border border-cyan-500 text-white px-4 py-2 rounded-lg text-xl md:text-2xl font-black flex-1 min-w-[200px]"
                                    value={newName} onChange={(e) => setNewName(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={handleUpdateName} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">LƯU</button>
                                <button onClick={() => {setIsEditing(false); setNewName(team.teamName)}} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold transition-colors">HỦY</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter break-words">{team.teamName}</h1>
                                <button onClick={() => setIsEditing(true)} className="text-cyan-500 text-sm hover:underline hover:text-cyan-400 font-bold bg-slate-800 px-3 py-1 rounded-full shrink-0">
                                    ✎ Sửa tên
                                </button>
                            </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                            <p className="text-cyan-400 font-bold uppercase tracking-widest text-xs border border-cyan-900/50 bg-cyan-900/20 px-3 py-1 rounded-full">
                                {team.sport} | {team.tournamentId?.displayName || "Chưa chọn giải"}
                            </p>
                            
                            {team.isPaid ? (
                                <span className="text-[10px] font-black uppercase tracking-wider text-green-400 border border-green-500/30 bg-green-500/10 px-3 py-1 rounded-full flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Đã thanh toán
                                </span>
                            ) : (
                                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 rounded-full flex items-center gap-1">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span> Chưa đóng lệ phí
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleDeleteTeam}
                        className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 md:py-2 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition-all w-full md:w-auto shrink-0"
                    >
                        HỦY ĐĂNG KÝ GIẢI
                    </button>
                </div>
            </div>

            {/* ================= NỘI DUNG: THÀNH VIÊN ================= */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Danh sách thành viên</h2>
                    <span className="text-cyan-500 font-bold bg-cyan-900/30 px-3 py-1 rounded-full text-sm">
                        {team.members?.length || 0} người
                    </span>
                </div>

                <div className="grid gap-3">
                    {team.members?.length > 0 ? (
                        team.members.map((m) => (
                            <div key={m._id} className="flex justify-between items-center p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-inner ${m.status === 'Active' ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white' : 'bg-slate-700 text-gray-400 border border-slate-600'}`}>
                                        {m.userId?.displayName?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-lg flex items-center gap-2">
                                            {m.userId?.displayName || "Người dùng ẩn"} 
                                            {m.role === 'Captain' && <span title="Đội trưởng">⭐</span>}
                                        </p>
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block ${m.status === 'Active' ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                                            {m.status === 'Active' ? 'Thành viên chính thức' : '⏳ Đang chờ phản hồi...'}
                                        </span>
                                    </div>
                                </div>
                                
                                {m.role !== 'Captain' && (
                                    <button 
                                        onClick={() => handleRemoveMember(m._id, m.userId?.displayName)}
                                        className="text-slate-500 hover:text-red-500 hover:bg-red-900/20 p-2 rounded-lg text-xs font-bold uppercase transition-all"
                                        title={m.status === 'Active' ? 'Mời ra khỏi đội' : 'Thu hồi lời mời'}
                                    >
                                        {m.status === 'Active' ? 'Kích' : 'Hủy mời'}
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-center py-4">Chưa có dữ liệu thành viên</p>
                    )}
                    
                    <button 
                        onClick={() => alert("Chức năng Mời Thêm đang được cập nhật")} 
                        className="mt-2 border-2 border-dashed border-slate-700 hover:border-cyan-500 bg-slate-900/30 p-4 rounded-2xl text-slate-400 font-bold hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">+</span> MỜI THÊM ĐỒNG ĐỘI
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeamDetail;