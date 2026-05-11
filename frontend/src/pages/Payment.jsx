import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; 

const Payment = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);

    const [transactionCode, setTransactionCode] = useState('');
    const [senderName, setSenderName] = useState('');
    const [receiptFile, setReceiptFile] = useState(null);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    useEffect(() => {
        // Nếu không có ID trên URL thì văng ra luôn
        if (!id) {
            alert("ID Đội không hợp lệ!");
            navigate('/my-teams');
            return;
        }

        const fetchTeamData = async () => {
            try {
                console.log("Đang gọi API lấy chi tiết đội, ID:", id);
                const res = await api.get(`/teams/detail/${id}`);
                console.log("Kết quả API:", res.data);

                if (res.data.success) {
                    setTeam(res.data.data);
                }
            } catch (err) {
                console.error("Lỗi API fetchTeamData:", err);
                // Tạm tắt navigate(-1) để bạn nhìn thấy lỗi trên màn hình
                // navigate(-1); 
            } finally {
                setLoading(false);
            }
        };
        fetchTeamData();
    }, [id, navigate]);

    const qrUrl = team?.tournamentId?.paymentQR
        ? `http://localhost:5001/${team.tournamentId.paymentQR.replace(/\\/g, '/').replace(/^\/+/, '')}`
        : null;

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        if (!transactionCode || !senderName) {
            return alert("Vui lòng nhập Tên người chuyển và Mã giao dịch!");
        }

        setIsSubmittingPayment(true);

        try {
            const formData = new FormData();
            formData.append('transactionCode', transactionCode);
            formData.append('senderName', senderName);
            if (receiptFile) formData.append('receipt', receiptFile);

            // GỌI API THẬT:
            // await api.post(`/teams/submit-payment/${id}`, formData);

            setTimeout(() => {
                alert("Đã gửi minh chứng thanh toán thành công! Vui lòng chờ BTC duyệt.");
                navigate('/my-teams'); 
            }, 1000);

        } catch (error) {
            console.error(error);
            alert("Lỗi khi gửi thông tin thanh toán");
            setIsSubmittingPayment(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-black text-2xl animate-pulse">ĐANG TẢI DỮ LIỆU THANH TOÁN...</div>;
    
    // Đã thay thế return null bằng giao diện báo lỗi rõ ràng
    if (!team) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-red-500 font-black text-2xl mb-2 uppercase tracking-widest">Không tìm thấy thông tin</h2>
            <p className="text-slate-400 mb-6">Dữ liệu đội bóng không tồn tại hoặc có lỗi kết nối.</p>
            <button 
                onClick={() => navigate('/my-teams')}
                className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-700"
            >
                Quay lại quản lý đội
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-12 animate-fade-in flex flex-col items-center">
            
            <div className="w-full max-w-5xl mb-8 flex justify-between items-center">
                <button 
                    onClick={() => navigate(-1)}
                    className="text-slate-400 hover:text-cyan-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2 transition-colors"
                >
                    <span>←</span> QUAY LẠI
                </button>
                <div className="text-right">
                    <h1 className="text-2xl font-black text-white uppercase tracking-widest">Thanh toán lệ phí</h1>
                    <p className="text-cyan-500 font-bold text-sm">Đội: {team.teamName}</p>
                </div>
            </div>

            <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                <div className="flex flex-col items-center lg:items-start border-b lg:border-b-0 lg:border-r border-slate-800 pb-8 lg:pb-0 lg:pr-12">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">1. Thông tin chuyển khoản</h2>
                    <p className="text-slate-400 mb-8 text-sm text-center lg:text-left">Quét mã QR dưới đây bằng ứng dụng ngân hàng của bạn.</p>

                    <div className="bg-white p-4 rounded-3xl shadow-xl w-full max-w-[300px] mb-8">
                        {qrUrl ? (
                            <img
                                src={qrUrl}
                                alt="QR Thanh Toán"
                                className="w-full h-auto object-contain rounded-2xl"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/400x400?text=QR+Load+Error"; }}
                            />
                        ) : (
                            <div className="w-full aspect-square border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 rounded-2xl">
                                <div className="text-5xl mb-4">🏦</div>
                                <p className="text-gray-500 font-bold text-center px-6">BTC chưa cung cấp mã QR tĩnh</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-800 w-full p-5 rounded-2xl border border-slate-700 shadow-inner">
                        <p className="text-cyan-400 font-bold mb-3 uppercase text-xs tracking-widest border-b border-slate-700 pb-2">Nội dung chuyển khoản bắt buộc</p>
                        <p className="text-white font-mono font-bold select-all bg-slate-950 p-3 rounded-lg text-center text-lg">
                            {team.teamName} - {team.sport}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col justify-center">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">2. Gửi minh chứng</h2>
                    <p className="text-slate-400 mb-8 text-sm">Điền thông tin bên dưới sau khi bạn đã chuyển khoản thành công.</p>

                    <form onSubmit={handleSubmitPayment} className="flex flex-col gap-5">
                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">
                                Tên người chuyển khoản *
                            </label>
                            <input
                                type="text"
                                placeholder="VD: NGUYEN VAN A"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value.toUpperCase())}
                                className="w-full bg-slate-950 border border-slate-700 text-white px-5 py-4 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">
                                Mã giao dịch (Txn Ref) *
                            </label>
                            <input
                                type="text"
                                placeholder="VD: FT231..."
                                value={transactionCode}
                                onChange={(e) => setTransactionCode(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 text-white px-5 py-4 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">
                                Ảnh chụp màn hình biên lai
                            </label>
                            <div className="bg-slate-950 border border-slate-700 rounded-xl p-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setReceiptFile(e.target.files[0])}
                                    className="w-full text-sm text-slate-400 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-cyan-900/30 file:text-cyan-400 hover:file:bg-cyan-900/50 cursor-pointer"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmittingPayment}
                            className={`mt-6 w-full py-5 rounded-xl font-black uppercase tracking-widest transition-all ${
                                isSubmittingPayment
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-[1.02]'
                            }`}
                        >
                            {isSubmittingPayment ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐÃ CHUYỂN KHOẢN'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Payment;