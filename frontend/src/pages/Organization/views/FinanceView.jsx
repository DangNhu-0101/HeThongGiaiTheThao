import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api/axiosConfig';

const FinanceView = () => {
    const { id: tourId } = useParams();
    const [tournament, setTournament] = useState(null);

    useEffect(() => {
        if (tourId) {
            api.get(`/tournaments/getTournament/${tourId}`).then(res => setTournament(res.data.data)).catch(e => console.error("Lỗi lấy thông tin giải đấu:", e));
        }
    }, [tourId]);

    const budget = tournament?.budget;
    const income = (budget?.totalEntryFee || 0) + (budget?.totalSponsor || 0);
    const balance = income - (budget?.totalExpense || 0);

    return (
        <>
            <style>{`
                .fv-container {
                    padding: 20px;
                }

                @media (max-width: 768px) {
                    .fv-container {
                        padding: 16px;
                    }
                }

                @media (max-width: 640px) {
                    .fv-container {
                        padding: 12px;
                    }
                }

                .fv-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                }

                @media (max-width: 768px) {
                    .fv-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                }

                .fv-card {
                    background: #fff;
                    border: 1px solid rgba(1,138,190,0.15);
                    border-radius: 20px;
                    padding: 24px;
                    transition: all 0.2s;
                }

                @media (max-width: 640px) {
                    .fv-card {
                        padding: 16px;
                    }
                }

                .fv-card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .fv-card-icon {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    font-size: 20px;
                }

                .fv-card-label {
                    font-size: 11px;
                    font-weight: 800;
                    color: #018ABE;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                }

                .fv-card-amount {
                    font-size: 28px;
                    font-weight: 700;
                    color: #02457A;
                    margin-top: 8px;
                }

                @media (max-width: 640px) {
                    .fv-card-amount {
                        font-size: 22px;
                    }
                }

                .fv-balance-card {
                    background: linear-gradient(135deg, #02457A, #018ABE);
                    border-radius: 20px;
                    padding: 32px;
                    text-align: center;
                    margin-top: 20px;
                }

                @media (max-width: 640px) {
                    .fv-balance-card {
                        padding: 24px;
                        margin-top: 16px;
                    }
                }

                .fv-balance-label {
                    font-size: 12px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.8);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }

                .fv-balance-amount {
                    font-size: 48px;
                    font-weight: 700;
                    color: #fff;
                    margin-top: 12px;
                }

                @media (max-width: 768px) {
                    .fv-balance-amount {
                        font-size: 36px;
                    }
                }

                @media (max-width: 640px) {
                    .fv-balance-amount {
                        font-size: 28px;
                    }
                }
            `}</style>

            <div className="fv-container">
                <div className="fv-grid">
                    <div className="fv-card">
                        <div className="fv-card-header">
                            <div className="fv-card-icon" style={{ background: 'rgba(1,138,190,0.1)' }}>📥</div>
                            <div>
                                <div className="fv-card-label">Lệ phí thi đấu</div>
                                <div className="fv-card-amount">{(budget?.totalEntryFee || 0).toLocaleString()} VND</div>
                            </div>
                        </div>
                    </div>
                    <div className="fv-card">
                        <div className="fv-card-header">
                            <div className="fv-card-icon" style={{ background: 'rgba(1,138,190,0.1)' }}>🤝</div>
                            <div>
                                <div className="fv-card-label">Tài trợ</div>
                                <div className="fv-card-amount">{(budget?.totalSponsor || 0).toLocaleString()} VND</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fv-card" style={{ background: 'rgba(194, 67, 66, 0.05)', borderColor: 'rgba(194, 67, 66, 0.2)' }}>
                    <div className="fv-card-header">
                        <div className="fv-card-icon" style={{ background: 'rgba(194, 67, 66, 0.1)', color: '#BD0014' }}>📤</div>
                        <div>
                            <div className="fv-card-label" style={{ color: '#BD0014' }}>Tổng chi</div>
                            <div className="fv-card-amount" style={{ color: '#BD0014' }}>{(budget?.totalExpense || 0).toLocaleString()} VND</div>
                        </div>
                    </div>
                </div>

                <div className="fv-balance-card">
                    <div className="fv-balance-label">SỐ DƯ GIẢI ĐẤU HIỆN TẠI</div>
                    <div className="fv-balance-amount">{balance.toLocaleString()} VND</div>
                </div>
            </div>
        </>
    );
};

export default FinanceView;