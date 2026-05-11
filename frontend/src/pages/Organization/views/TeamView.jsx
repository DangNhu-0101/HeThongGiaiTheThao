import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api/axiosConfig';

const TeamView = ({ tourId: propTourId }) => {
    const { id: urlTourId } = useParams();
    const activeTourId = propTourId || urlTourId || localStorage.getItem('activeTournamentId');

    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!activeTourId) {
            console.log("❌ Không tìm thấy Tournament ID. Fallback:", { propTourId, urlTourId });
            setIsLoading(false);
            return;
        }

        console.log("📥 Đang lấy teams cho tournament:", activeTourId);

        const fetchTeams = async () => {
            try {
                const res = await api.get(`/teams/tournament/${activeTourId}`);
                console.log("✅ API Response:", res.data);
                if (res.data && res.data.success) {
                    setTeams(res.data.data);
                    console.log(`📊 Tìm thấy ${res.data.count} teams`);
                } else {
                    console.warn("⚠️ API returned success=false:", res.data);
                    setTeams([]);
                }
            } catch (error) {
                console.error("❌ Lỗi lấy danh sách đội thi đấu:", error);
                if (error.response?.status === 401) {
                    alert("⚠️ Bạn cần đăng nhập lại.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeams();
    }, [activeTourId]);

    // HÀM: Xác nhận đóng phí (Toggle trạng thái)
    const togglePayment = async (teamId, currentStatus) => {
        try {
            await api.patch(`/teams/${teamId}/payment`, { isPaid: !currentStatus });
            setTeams(teams.map(t => t._id === teamId ? { ...t, isPaid: !currentStatus } : t));
        } catch (e) { 
            alert("Lỗi cập nhật thanh toán!"); 
        }
    };

    // HÀM: Xóa đội thi đấu
    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa đội này khỏi giải đấu?")) return;
        try {
            await api.delete(`/teams/${teamId}`); // BẮT BUỘC: Cần có API Delete bên Backend
            setTeams(teams.filter(t => t._id !== teamId));
        } catch (e) {
            alert("Lỗi khi xóa đội!");
        }
    };

    // HÀM: Sửa tên đội (Inline Prompt)
    const handleEditTeam = async (teamId, oldName) => {
        const newName = prompt("Nhập tên mới cho đội:", oldName);
        if (!newName || newName === oldName) return;
        try {
            await api.patch(`/teams/${teamId}`, { teamName: newName }); // BẮT BUỘC: Cần có API Patch bên Backend
            setTeams(teams.map(t => t._id === teamId ? { ...t, teamName: newName } : t));
        } catch (e) {
            alert("Lỗi khi đổi tên đội!");
        }
    };

    if (isLoading) return <div className="text-primary-lime font-title p-10">Đang tải danh sách đội...</div>;

    // Phân loại dữ liệu
    const paidTeams = teams.filter(t => t.isPaid);
    const unpaidTeams = teams.filter(t => !t.isPaid);

    // Component con để render Card Đội (Tránh lặp code)
    const TeamCard = ({ t }) => (
        <div className="flex items-center p-4 bg-neutral-cream border border-gray-200 rounded-xl transition hover:shadow-md">
            <div className="w-12 h-12 flex items-center justify-center bg-dark-forest text-primary-lime font-title text-xl rounded-full mr-4 shrink-0">
                {t.teamName ? t.teamName.charAt(0).toUpperCase() : 'T'}
            </div>
            <div className="flex-1">
                <div className="font-black text-dark-forest text-lg">{t.teamName}</div>
                <div className="flex gap-2 mt-1">
                    <button onClick={() => handleEditTeam(t._id, t.teamName)} className="text-[10px] text-teal-600 font-bold uppercase hover:underline">Sửa</button>
                    <button onClick={() => handleDeleteTeam(t._id)} className="text-[10px] text-red-600 font-bold uppercase hover:underline">Xóa</button>
                </div>
            </div>
            <button 
                onClick={() => togglePayment(t._id, t.isPaid)}
                className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-colors ${
                    t.isPaid ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'
                }`}
            >
                {t.isPaid ? "ĐÃ ĐÓNG PHÍ" : "XÁC NHẬN ĐÓNG"}
            </button>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* PHẦN 1: ĐỘI ĐÃ SẴN SÀNG */}
            <div className="modern-card bg-white p-6 rounded-[24px] shadow-sm border-l-8 border-primary-lime">
                <h2 className="text-dark-forest font-title text-2xl mb-6 uppercase flex items-center gap-2">
                    🏆 Đội Sẵn Sàng Thi Đấu ({paidTeams.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paidTeams.map(t => <TeamCard key={t._id} t={t} />)}
                    {paidTeams.length === 0 && <p className="text-gray-400 italic">Chưa có đội nào đủ điều kiện.</p>}
                </div>
            </div>

            {/* PHẦN 2: DANH SÁCH CHỜ DUYỆT */}
            <div className="modern-card bg-white p-6 rounded-[24px] shadow-sm border-l-8 border-gray-300">
                <h2 className="text-gray-500 font-title text-2xl mb-6 uppercase flex items-center gap-2">
                    ⏳ Danh Sách Chờ Duyệt ({unpaidTeams.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-80">
                    {unpaidTeams.map(t => <TeamCard key={t._id} t={t} />)}
                    {unpaidTeams.length === 0 && <p className="text-gray-400 italic">Hiện không có đội chờ duyệt.</p>}
                </div>
            </div>
        </div>
    );
};

export default TeamView;