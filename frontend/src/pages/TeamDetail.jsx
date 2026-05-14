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
            const res = await api.get(`/teams/users/${id}`);  // ← ĐÚNG: GET /teams/users/:id
            if (res.data.success) {
                setTeam(res.data.data);
                setNewName(res.data.data.name);  // ← team.name, không phải teamName
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
            await api.put(`/teams/edit/${id}`, { name: newName });  // ← PUT, field: name
            setIsEditing(false);
            fetchTeamDetail();
        } catch (err) { alert("Lỗi cập nhật tên đội"); }
    };

    const handleDeleteTeam = async () => {
        if (!window.confirm("CẢNH BÁO: Bạn có chắc muốn HỦY ĐĂNG KÝ?")) return;
        try {
            await api.delete(`/teams/delete/${id}`);
            navigate('/my-teams');
        } catch (err) { alert("Lỗi khi xóa đội"); }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm("Bạn có chắc muốn xóa thành viên này?")) return;
        try {
            await api.delete(`/teams/${id}/members/${memberId}`);  // ← ĐÚNG route kickMember
            fetchTeamDetail();
        } catch (err) { alert("Lỗi thao tác"); }
    };

    if (loading) return <div className="text-center py-20 text-cyan-400 font-black text-xl">⚡ ĐANG TẢI...</div>;
    if (!team) return <div className="text-center py-20 text-red-500 font-black">❌ KHÔNG TÌM THẤY</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
            {/* HEADER */}
            <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="flex gap-2">
                                <input 
                                    className="bg-slate-800 border border-cyan-500 text-white px-4 py-2 rounded-lg text-xl font-black"
                                    value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus
                                />
                                <button onClick={handleUpdateName} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold">LƯU</button>
                                <button onClick={() => {setIsEditing(false); setNewName(team.name)}} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg">HỦY</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-black text-white uppercase">{team.name}</h1>
                                <button onClick={() => setIsEditing(true)} className="text-cyan-500 text-sm hover:underline">✎ Sửa</button>
                            </div>
                        )}
                        
                        <div className="flex gap-3 mt-3">
                            <span className="text-cyan-400 font-bold text-xs bg-cyan-900/20 px-3 py-1 rounded-full">
                                {team.sportCategory} | {team.tournamentId?.name || "N/A"}
                            </span>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                team.status === 'validated' ? 'bg-green-900/20 text-green-400' : 'bg-yellow-900/20 text-yellow-400'
                            }`}>
                                {team.status}
                            </span>
                        </div>
                    </div>
                    
                    <button onClick={handleDeleteTeam} className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-2 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white">
                        HỦY ĐĂNG KÝ
                    </button>
                </div>
            </div>

            {/* MEMBERS */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-white uppercase">Thành viên</h2>
                    <span className="text-cyan-500 font-bold">{team.members?.length || 0} người</span>
                </div>

                <div className="grid gap-3">
                    {team.members?.map((m) => (
                        <div key={m._id} className="flex justify-between items-center p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-cyan-900/30 flex items-center justify-center font-black text-white text-xl">
                                    {m.userId?.username?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="text-white font-bold">
                                        {m.userId?.username || "N/A"} 
                                        {m.role === 'Captain' && ' ⭐'}
                                    </p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        m.status === 'active' ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'
                                    }`}>
                                        {m.status === 'active' ? 'Thành viên' : 'Đang chờ'}
                                    </span>
                                </div>
                            </div>
                            
                            {m.role !== 'Captain' && (
                                <button onClick={() => handleRemoveMember(m._id)} className="text-red-400 hover:text-red-300 text-xs font-bold">
                                    Xóa
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeamDetail;