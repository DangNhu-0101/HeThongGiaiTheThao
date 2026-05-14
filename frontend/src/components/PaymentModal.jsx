import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const PaymentModal = ({ isOpen, onClose, team, onSuccess }) => {
    const [transactionCode, setTransactionCode] = useState('');
    const [senderName, setSenderName] = useState('');
    const [receiptFile, setReceiptFile] = useState(null);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    // ==========================================
    // XỬ LÝ URL QR CHUẨN
    // ==========================================
    const qrUrl = team?.tournamentId?.paymentQR
        ? `http://localhost:5001/${team.tournamentId.paymentQR
              .replace(/\\/g, '/')
              .replace(/^\/+/, '')}`
        : null;

    // ==========================================
    // LOG KIỂM TRA DỮ LIỆU TỪ TOURNAMENT
    // ==========================================
    useEffect(() => {
        if (isOpen && team) {
            console.log("=== THÔNG TIN TEAM TRONG MODAL ===");
            console.log(team);

            console.log("=== THÔNG TIN PAYMENT QR CỦA TOURNAMENT ===");
            console.log("tournamentId Object:", team.tournamentId);

            console.log(
                "Giá trị paymentQR gốc:",
                team.tournamentId?.paymentQR
            );

            if (team.tournamentId?.paymentQR) {
                const formattedQR = team.tournamentId.paymentQR
                    .replace(/\\/g, '/')
                    .replace(/^\/+/, '');

                console.log(
                    "URL Web đã xử lý chuẩn:",
                    `http://localhost:5001/${formattedQR}`
                );
            } else {
                console.log(
                    "⚠️ KHÔNG TÌM THẤY paymentQR trong team.tournamentId"
                );
            }
        }
    }, [isOpen, team]);

    if (!isOpen) return null;

    const handleSubmitPayment = async (e) => {
        e.preventDefault();

        if (!transactionCode || !senderName) {
            return alert(
                "Vui lòng nhập Tên người chuyển và Mã giao dịch!"
            );
        }

        setIsSubmittingPayment(true);

        try {
            const formData = new FormData();

            formData.append('transactionCode', transactionCode);
            formData.append('senderName', senderName);

            if (receiptFile) {
                formData.append('receipt', receiptFile);
            }

            // ==========================================
            // GỌI API THẬT Ở ĐÂY
            // ==========================================
            await api.post(
                `/teams/submit-payment/${team._id}`,
                formData
            );

            setTimeout(() => {
                alert(
                    "Đã gửi minh chứng thanh toán thành công! Vui lòng chờ BTC duyệt."
                );

                setTransactionCode('');
                setSenderName('');
                setReceiptFile(null);

                setIsSubmittingPayment(false);

                onSuccess();
                onClose();
            }, 1000);

        } catch (error) {
            console.error(error);

            alert("Lỗi khi gửi thông tin thanh toán");

            setIsSubmittingPayment(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 md:p-8 relative shadow-2xl max-h-[95vh] overflow-y-auto">

                {/* Nút đóng */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors"
                >
                    ✕
                </button>

                {/* HEADER */}
                <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">
                    Gửi Minh Chứng
                </h2>

                <p className="text-slate-400 mb-6 text-sm">
                    Xác nhận chuyển khoản cho đội{' '}
                    <strong className="text-cyan-400">
                        {team?.teamName}
                    </strong>
                </p>

                {/* DEBUG LINK */}
                <div className="bg-black/50 p-2 rounded text-xs text-green-400 font-mono mb-4 break-all">
                    Link QR: {qrUrl || "Chưa có"}
                </div>

                {/* ==========================================
                    HIỂN THỊ QR
                ========================================== */}
                <div className="mb-6">
                    {qrUrl ? (
                        <div className="bg-white p-4 rounded-3xl shadow-xl">
                            <img
                                src={qrUrl}
                                alt="QR Thanh Toán"
                                className="w-full h-auto object-contain rounded-2xl"
                                onLoad={() => {
                                    console.log("✅ QR LOAD THÀNH CÔNG");
                                }}
                                onError={(e) => {
                                    console.log(
                                        "❌ LỖI LOAD ẢNH QR:",
                                        e.target.src
                                    );

                                    e.target.onerror = null;

                                    e.target.src =
                                        "https://via.placeholder.com/400x400?text=QR+Load+Error";
                                }}
                            />
                        </div>
                    ) : (
                        <div className="bg-slate-800 border border-dashed border-slate-600 rounded-3xl p-10 text-center">
                            <div className="text-5xl mb-4">🏦</div>

                            <p className="text-slate-400 font-bold">
                                BTC chưa cung cấp mã QR
                            </p>
                        </div>
                    )}
                </div>

                {/* FORM */}
                <form
                    onSubmit={handleSubmitPayment}
                    className="flex flex-col gap-4"
                >

                    {/* TÊN NGƯỜI CHUYỂN */}
                    <div>
                        <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">
                            Tên người chuyển khoản *
                        </label>

                        <input
                            type="text"
                            placeholder="VD: Nguyen Van A"
                            value={senderName}
                            onChange={(e) =>
                                setSenderName(e.target.value)
                            }
                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>

                    {/* MÃ GIAO DỊCH */}
                    <div>
                        <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">
                            Mã giao dịch (Txn Ref) *
                        </label>

                        <input
                            type="text"
                            placeholder="Nhập mã in trên biên lai..."
                            value={transactionCode}
                            onChange={(e) =>
                                setTransactionCode(e.target.value)
                            }
                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>

                    {/* FILE BIÊN LAI */}
                    <div>
                        <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">
                            Ảnh chụp biên lai (Tuỳ chọn)
                        </label>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setReceiptFile(e.target.files[0])
                            }
                            className="w-full text-sm text-slate-400
                            file:mr-4
                            file:py-2
                            file:px-4
                            file:rounded-full
                            file:border-0
                            file:text-sm
                            file:font-bold
                            file:bg-cyan-900/30
                            file:text-cyan-400
                            hover:file:bg-cyan-900/50
                            cursor-pointer"
                        />
                    </div>

                    {/* BUTTON SUBMIT */}
                    <button
                        type="submit"
                        disabled={isSubmittingPayment}
                        className={`mt-4 w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all ${
                            isSubmittingPayment
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                        }`}
                    >
                        {isSubmittingPayment
                            ? 'Đang gửi...'
                            : 'GỬI XÁC NHẬN CHO BTC'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;