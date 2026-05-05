import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../../api/axiosConfig";

const TournamentDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        displayName: "",
        startDate: "",
        status: "upcoming",
        logoUrl: "",
        appliedRules: []
    });
    const [availableRules, setAvailableRules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Tối ưu hiệu suất: Gọi song song 2 API bằng Promise.all
               const [tourRes, rulesRes] = await Promise.all([
                api.get(`/tournaments/getTournament/${id}`),
                api.get('/rules/all')
            ]);
                if (tourRes.data.success) {
                    const tour = tourRes.data.data;
                    setFormData({
                        displayName: tour.displayName || "",
                        startDate: tour.startDate ? new Date(tour.startDate).toISOString().slice(0, 16) : "",
                        status: tour.status || "upcoming",
                        logoUrl: tour.logoUrl || "",
                        appliedRules: tour.appliedRules || []
                    });
                }
                if (rulesRes.data) {
                    setAvailableRules(rulesRes.data.data || rulesRes.data);
                }
            } catch (error) {
                console.error("Lỗi lấy dữ liệu:", error);
                alert("Không thể tải thông tin giải đấu.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await api.patch(`/tournaments/editTournament/${id}`, formData);
            if (res.data.success) {
                alert("Cập nhật thông tin giải đấu thành công!");
                navigate('/dashboard');
            }
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi cập nhật Server");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("HÀNH ĐỘNG NGUY HIỂM: Bạn có chắc chắn muốn xóa toàn bộ giải đấu này không? Dữ liệu sẽ không thể khôi phục!")) {
            try {
                const res = await api.delete(`/tournaments/cancelTournament/${id}`);
                if (res.data.success) {
                    alert("Đã xóa giải đấu!");
                    navigate('/dashboard');
                }
            } catch (error) {
                alert("Lỗi khi xóa giải đấu");
            }
        }
    };

    if (isLoading) return <div className="text-center p-10 text-primary-lime font-title text-2xl">Đang nạp hệ thống...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fade-in">
            <div className="about-unified-container-v2">
                <h2 className="text-4xl font-title text-primary-lime mb-8 flex items-center gap-3">
                    <span>⚙️</span> QUẢN LÝ CHI TIẾT GIẢI ĐẤU
                </h2>

                <form onSubmit={handleUpdate} className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 p-5 rounded-[16px] border border-white/10">
                            <label className="block text-primary-lime text-xs font-black uppercase tracking-widest mb-2">Tên Giải Đấu</label>
                            <input 
                                type="text" name="displayName" value={formData.displayName} onChange={handleInputChange}
                                className="w-full bg-black/40 border border-white/20 text-white p-3 rounded-xl focus:border-primary-lime outline-none transition"
                                required
                            />
                        </div>

                        <div className="bg-white/5 p-5 rounded-[16px] border border-white/10">
                            <label className="block text-primary-lime text-xs font-black uppercase tracking-widest mb-2">Trạng Thái</label>
                            <select 
                                name="status" value={formData.status} onChange={handleInputChange}
                                className="w-full bg-black/40 border border-white/20 text-white p-3 rounded-xl focus:border-primary-lime outline-none transition"
                            >
                                <option value="upcoming" className="text-black">Sắp diễn ra</option>
                                <option value="ongoing" className="text-black">Đang thi đấu</option>
                                <option value="finished" className="text-black">Đã kết thúc</option>
                            </select>
                        </div>

                        <div className="bg-white/5 p-5 rounded-[16px] border border-white/10">
                            <label className="block text-primary-lime text-xs font-black uppercase tracking-widest mb-2">Thời gian bắt đầu</label>
                            <input 
                                type="datetime-local" name="startDate" value={formData.startDate} onChange={handleInputChange}
                                className="w-full bg-black/40 border border-white/20 text-white p-3 rounded-xl focus:border-primary-lime outline-none transition [color-scheme:dark]"
                            />
                        </div>

                        <div className="bg-white/5 p-5 rounded-[16px] border border-white/10">
                            <label className="block text-primary-lime text-xs font-black uppercase tracking-widest mb-2">URL Logo Giải Đấu</label>
                            <input 
                                type="text" name="logoUrl" value={formData.logoUrl} onChange={handleInputChange} placeholder="https://..."
                                className="w-full bg-black/40 border border-white/20 text-white p-3 rounded-xl focus:border-primary-lime outline-none transition"
                            />
                        </div>
                    </div>

                    <div className="bg-white/5 p-5 rounded-[16px] border border-white/10">
                        <label className="block text-primary-lime text-xs font-black uppercase tracking-widest mb-4">Luật Thi Đấu Áp Dụng</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {availableRules.map(rule => (
                                <label key={rule._id} className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 accent-primary-lime bg-black/40 border-white/20"
                                        checked={formData.appliedRules.includes(rule._id)}
                                        onChange={(e) => {
                                            const newRules = e.target.checked 
                                                ? [...formData.appliedRules, rule._id]
                                                : formData.appliedRules.filter(id => id !== rule._id);
                                            setFormData(prev => ({ ...prev, appliedRules: newRules }));
                                        }}
                                    />
                                    <span className="text-gray-300 group-hover:text-white transition">{rule.ruleName}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6 mt-6 border-t border-white/10">
                        <button 
                            type="button" 
                            onClick={handleDelete}
                            className="px-6 py-3 bg-[#fee2e2] text-[#C24342] hover:bg-[#C24342] hover:text-white font-title font-bold text-lg uppercase rounded-xl transition shadow-lg"
                        >
                            Xóa Giải Đấu
                        </button>
                        
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="flex-1 py-3 bg-primary-lime text-dark-forest hover:bg-[#bad94b] font-title font-black text-xl uppercase tracking-widest rounded-xl transition shadow-[0_10px_20px_rgba(206,241,95,0.2)] disabled:opacity-50"
                        >
                            {isSaving ? "Đang xử lý..." : "Lưu Thay Đổi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TournamentDetailView;