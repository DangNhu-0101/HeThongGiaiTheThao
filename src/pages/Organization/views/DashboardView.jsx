import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../../api/axiosConfig";

const DashboardView = () => {
    // Tự động nhận diện giải đấu đang được chọn thông qua URL
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
                // Gọi API lấy dữ liệu Mongoose giống như bên trang Detail
                const res = await api.get(`/tournaments/getTournament/${id}`);
                if (res.data.success) {
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

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="text-xl font-title text-primary-lime animate-pulse">
                Đang tổng hợp số liệu giải đấu...
            </div>
        </div>
    );

    // Màn hình chờ khi chưa có giải đấu nào được chọn trên URL
    if (!id || !tournament) return (
        <div className="flex flex-col justify-center items-center h-64 border-2 border-dashed border-gray-300 rounded-[24px] bg-white">
            <span className="text-4xl mb-4">👈</span>
            <p className="text-gray-500 text-lg uppercase tracking-widest">
                Vui lòng chọn một giải đấu từ danh sách bên trái
            </p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-title text-dark-forest uppercase tracking-wide">
                        Dashboard: {tournament.displayName}
                    </h1>
                    <p className="text-gray-500 mt-1 uppercase text-sm font-black tracking-widest">
                        Trạng thái: <span className="text-primary-lime">{tournament.status}</span>
                    </p>
                </div>
                
                {/* Nút chuyển sang trang TournamentDetailView để chỉnh sửa form */}
                <button 
                    onClick={() => navigate(`/admin/tournament/${id}/settings`)} 
                    className="bg-dark-forest text-primary-lime px-6 py-3 rounded-lg text-sm uppercase tracking-widest shadow-lg hover:bg-black transition-colors"
                >
                    Cấu Hình Giải Đấu
                </button>
            </div>

            {/* Các thẻ thống kê nhanh cho giải đấu đang chọn */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#133809] to-[#1a4f10] p-6 rounded-[24px] shadow-lg">
                    <h3 className="text-primary-lime text-xs uppercase tracking-widest mb-2 opacity-80">
                        Tài Chính Dự Kiến
                    </h3>
                    <p className="text-3xl font-title text-transparent bg-clip-text bg-gradient-to-br from-[#FFE000] to-[#799F0C]">
                        {tournament.finance?.plannedEntryFeeRevenue?.toLocaleString() || 0} VNĐ
                    </p>
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-2 font-black">
                        Quy Mô Môn Thi
                    </h3>
                    <p className="text-3xl font-title text-dark-forest">
                        {tournament.sportsCount || 1} Môn
                    </p>
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-2 font-black">
                        Niên Khóa
                    </h3>
                    <p className="text-3xl font-title text-dark-forest">
                        {tournament.year || new Date().getFullYear()}
                    </p>
                </div>
            </div>
            
            {/* Vùng không gian để bạn ghép thêm các biểu đồ hoặc bảng xếp hạng đội tuyển sau này */}
            <div className="mt-8 bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 min-h-[300px]">
                <p className="text-gray-400 text-center mt-20 uppercase tracking-widest text-sm">
                    Khu vực hiển thị biểu đồ thống kê trận đấu (Sẽ tích hợp ở Sprint sau)
                </p>
            </div>
        </div>
    );
};

export default DashboardView;