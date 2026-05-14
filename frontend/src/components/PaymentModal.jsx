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
        <>
            <style>{`
                /* ──────────────────────────────────────────────────────────── */
                /* PAYMENT MODAL STYLES - inspired by TournamentModal         */
                /* ──────────────────────────────────────────────────────────── */

                .pm-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(2,30,55,0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                    padding: 20px;
                    font-family: 'Be Vietnam Pro', sans-serif;
                }

                .pm-dialog {
                    background: #fff;
                    border-radius: 24px;
                    width: 100%;
                    max-width: 460px;
                    max-height: 95vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.3);
                }

                .pm-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 28px;
                    background: #fcfcfc;
                }

                .pm-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #F1F5F9;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .pm-close:hover {
                    background: #E2E8F0;
                    color: #1e293b;
                }

                .pm-title {
                    font-size: 20px;
                    font-weight: 800;
                    color: #02457A;
                    margin: 0 0 6px 0;
                    letter-spacing: -0.3px;
                }

                .pm-subtitle {
                    color: #64748b;
                    font-size: 13px;
                    margin-bottom: 24px;
                    line-height: 1.4;
                }

                .pm-team-name {
                    color: #018ABE;
                    font-weight: 700;
                }

                .pm-debug {
                    background: #F1F5F9;
                    padding: 8px 12px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-family: monospace;
                    color: #018ABE;
                    margin-bottom: 20px;
                    word-break: break-all;
                    border: 1px solid #E2E8F0;
                }

                .pm-qr-container {
                    margin-bottom: 24px;
                }

                .pm-qr-wrapper {
                    background: #fff;
                    padding: 16px;
                    border-radius: 20px;
                    border: 1px solid #EEF6FB;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.04);
                }

                .pm-qr-img {
                    width: 100%;
                    height: auto;
                    object-fit: contain;
                    border-radius: 16px;
                }

                .pm-qr-placeholder {
                    background: #F8FAFC;
                    border: 2px dashed #CBD5E1;
                    border-radius: 20px;
                    padding: 32px;
                    text-align: center;
                }

                .pm-qr-placeholder-icon {
                    font-size: 48px;
                    margin-bottom: 12px;
                }

                .pm-qr-placeholder-text {
                    color: #64748b;
                    font-weight: 600;
                    font-size: 12px;
                }

                .pm-form {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }

                .pm-field {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .pm-label {
                    font-size: 10px;
                    font-weight: 800;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                }

                .pm-input {
                    width: 100%;
                    padding: 12px 14px;
                    border: 1.5px solid #E2E8F0;
                    border-radius: 14px;
                    font-size: 14px;
                    outline: none;
                    transition: all 0.2s;
                    font-family: inherit;
                }

                .pm-input:focus {
                    border-color: #018ABE;
                    box-shadow: 0 0 0 3px rgba(1,138,190,0.08);
                }

                .pm-file-input {
                    width: 100%;
                    font-size: 12px;
                    color: #64748b;
                    padding: 8px 0;
                }

                .pm-file-input::-webkit-file-upload-button {
                    background: #F1F5F9;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    padding: 8px 16px;
                    font-weight: 600;
                    font-size: 11px;
                    color: #018ABE;
                    cursor: pointer;
                    margin-right: 12px;
                    transition: all 0.2s;
                }

                .pm-file-input::-webkit-file-upload-button:hover {
                    background: #E2E8F0;
                }

                .pm-submit-btn {
                    width: 100%;
                    padding: 14px;
                    border-radius: 14px;
                    font-weight: 800;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 8px;
                    background: #018ABE;
                    color: #fff;
                }

                .pm-submit-btn:hover:not(:disabled) {
                    background: #02457A;
                    transform: translateY(-1px);
                    box-shadow: 0 8px 20px rgba(1,138,190,0.25);
                }

                .pm-submit-btn:disabled {
                    background: #CBD5E1;
                    cursor: not-allowed;
                    color: #94a3b8;
                }

                @keyframes pm-fade-in {
                    from {
                        opacity: 0;
                        transform: scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .pm-dialog {
                    animation: pm-fade-in 0.2s ease-out;
                }
            `}</style>

            <div className="pm-overlay">
                <div className="pm-dialog">
                    <div className="pm-body">
                        <button onClick={onClose} className="pm-close">✕</button>

                        <h2 className="pm-title">Gửi Minh Chứng</h2>
                        <p className="pm-subtitle">
                            Xác nhận chuyển khoản cho đội{' '}
                            <span className="pm-team-name">{team?.teamName}</span>
                        </p>

                        {/* DEBUG LINK */}
                        <div className="pm-debug">
                            Link QR: {qrUrl || "Chưa có"}
                        </div>

                        {/* ==========================================
                            HIỂN THỊ QR
                        ========================================== */}
                        <div className="pm-qr-container">
                            {qrUrl ? (
                                <div className="pm-qr-wrapper">
                                    <img
                                        src={qrUrl}
                                        alt="QR Thanh Toán"
                                        className="pm-qr-img"
                                        onLoad={() => {
                                            console.log("✅ QR LOAD THÀNH CÔNG");
                                        }}
                                        onError={(e) => {
                                            console.log("❌ LỖI LOAD ẢNH QR:", e.target.src);
                                            e.target.onerror = null;
                                            e.target.src = "https://via.placeholder.com/400x400?text=QR+Load+Error";
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="pm-qr-placeholder">
                                    <div className="pm-qr-placeholder-icon">🏦</div>
                                    <p className="pm-qr-placeholder-text">BTC chưa cung cấp mã QR</p>
                                </div>
                            )}
                        </div>

                        {/* FORM */}
                        <form onSubmit={handleSubmitPayment} className="pm-form">
                            {/* TÊN NGƯỜI CHUYỂN */}
                            <div className="pm-field">
                                <label className="pm-label">Tên người chuyển khoản *</label>
                                <input
                                    type="text"
                                    placeholder="VD: Nguyen Van A"
                                    value={senderName}
                                    onChange={(e) => setSenderName(e.target.value)}
                                    className="pm-input"
                                />
                            </div>

                            {/* MÃ GIAO DỊCH */}
                            <div className="pm-field">
                                <label className="pm-label">Mã giao dịch (Txn Ref) *</label>
                                <input
                                    type="text"
                                    placeholder="Nhập mã in trên biên lai..."
                                    value={transactionCode}
                                    onChange={(e) => setTransactionCode(e.target.value)}
                                    className="pm-input"
                                />
                            </div>

                            {/* FILE BIÊN LAI */}
                            <div className="pm-field">
                                <label className="pm-label">Ảnh chụp biên lai (Tuỳ chọn)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setReceiptFile(e.target.files[0])}
                                    className="pm-file-input"
                                />
                            </div>

                            {/* BUTTON SUBMIT */}
                            <button
                                type="submit"
                                disabled={isSubmittingPayment}
                                className="pm-submit-btn"
                            >
                                {isSubmittingPayment ? 'Đang gửi...' : 'GỬI XÁC NHẬN CHO BTC'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentModal;