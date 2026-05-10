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
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTeamDetail(); }, [id]);

    const handleUpdateName = async () => {
        try {
            await api.patch(`/teams/update/${id}`, { teamName: newName });
            setIsEditing(false);
            fetchTeamDetail();
        } catch (err) { alert("Lỗi cập nhật"); }
    };

    const handleDeleteTeam = async () => {
        if (!window.confirm("CẢNH BÁO: Bạn có chắc muốn HỦY ĐĂNG KÝ? Đội sẽ bị xóa hoàn toàn!")) return;
        try {
            await api.delete(`/teams/delete/${id}`);
            navigate('/my-teams');
        } catch (err) { alert("Lỗi khi xóa"); }
    };

    const handleRemoveMember = async (memberId, name) => {
        if (!window.confirm(`Bạn có chắc muốn mời ${name} ra khỏi đội?`)) return;
        try {
            await api.delete(`/teams/remove-member/${memberId}`);
            fetchTeamDetail();
        } catch (err) { alert("Lỗi thao tác"); }
    };

    if (loading) return <div className="text-center py-20 text-cyan-400 font-black">⚡ ĐANG TẢI DỮ LIỆU ĐỘI...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fade-in">
            {/* Header: Tên đội & Hủy đăng ký */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl mb-8 relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="flex gap-2">
                                <input 
                                    className="bg-slate-800 border border-cyan-500 text-white px-4 py-2 rounded-lg text-2xl font-black"
                                    value={newName} onChange={(e) => setNewName(e.target.value)}
                                />
                                <button onClick={handleUpdateName} className="bg-green-600 text-white px-4 rounded-lg font-bold">LƯU</button>
                                <button onClick={() => setIsEditing(false)} className="bg-slate-700 text-white px-4 rounded-lg font-bold">HỦY</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">{team.teamName}</h1>
                                <button onClick={() => setIsEditing(true)} className="text-cyan-500 text-sm hover:underline">✎ Sửa</button>
                            </div>
                        )}
                        <p className="text-cyan-400 font-bold mt-2 uppercase tracking-widest text-xs">
                            {team.sport} | {team.tournamentId?.displayName}
                        </p>
                    </div>
                    <button 
                        onClick={handleDeleteTeam}
                        className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-red-500 hover:text-white transition-all"
                    >
                        HỦY ĐĂNG KÝ
                    </button>
                </div>
            </div>

            {/* Danh sách thành viên */}
            <div className="grid gap-4">
                <h2 className="text-lg font-black text-white uppercase tracking-widest mb-2">👥 Thành viên & Lời mời</h2>
                {team.members?.map((m) => (
                    <div key={m._id} className="flex justify-between items-center p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${m.status === 'Active' ? 'bg-cyan-500 text-black' : 'bg-slate-700 text-gray-400'}`}>
                                {m.userId?.displayName?.charAt(0)}
                            </div>
                            <div>
                                <p className="text-white font-bold">{m.userId?.displayName} {m.role === 'Captain' && '⭐'}</p>
                                <span className={`text-[10px] font-black uppercase ${m.status === 'Active' ? 'text-green-500' : 'text-yellow-500'}`}>
                                    {m.status === 'Active' ? 'Chính thức' : 'Đang chờ phản hồi...'}
                                </span>
                            </div>
                        </div>
                        
                        {m.role !== 'Captain' && (
                            <button 
                                onClick={() => handleRemoveMember(m._id, m.userId?.displayName)}
                                className="text-gray-500 hover:text-red-500 text-xs font-bold uppercase transition-colors"
                            >
                                {m.status === 'Active' ? 'Kích' : 'Hủy lời mời'}
                            </button>
                        )}
                    </div>
                ))}
                
                {/* Nút mời thêm */}
                <button 
                    onClick={() => navigate('/register-team')} // Hoặc mở một Modal tìm người mời thêm
                    className="mt-4 border-2 border-dashed border-slate-800 p-4 rounded-2xl text-gray-500 font-bold hover:border-cyan-500 hover:text-cyan-500 transition-all"
                >
                    + MỜI THÊM THÀNH VIÊN
                </button>
            </div>
        </div>
    );
};

export default TeamDetail;