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

    const budget = tournament?.budget; // [cite: 54, 71]
    const income = (budget?.totalEntryFee || 0) + (budget?.totalSponsor || 0); // 
    const balance = income - (budget?.totalExpense || 0); // [cite: 54, 55]

    return (
        <div className="modern-grid">
            <div className="about-unified-container-v2" style={{ gridColumn: 'span 2' }}>
                <h2 className="text-primary">BÁO CÁO TÀI CHÍNH CHI TIẾT</h2>
                <div className="about-info-grid">
                    <div className="about-info-item-v2">
                        <div className="icon-wrapper">📥</div>
                        <div>
                            <div className="about-info-label">Lệ phí thi đấu</div>
                            <div className="about-info-text">{(budget?.totalEntryFee || 0).toLocaleString()} VND</div>
                        </div>
                    </div>
                    <div className="about-info-item-v2">
                        <div className="icon-wrapper">🤝</div>
                        <div>
                            <div className="about-info-label">Tài trợ</div>
                            <div className="about-info-text">{(budget?.totalSponsor || 0).toLocaleString()} VND</div>
                        </div>
                    </div>
                    <div className="about-info-item-v2" style={{ background: 'rgba(194, 67, 66, 0.1)' }}>
                        <div className="icon-wrapper" style={{ color: 'var(--brick-red)' }}>📤</div>
                        <div>
                            <div className="about-info-label" style={{ color: 'var(--brick-red)' }}>Tổng chi</div>
                            <div className="about-info-text">{(budget?.totalExpense || 0).toLocaleString()} VND</div>
                        </div>
                    </div>
                </div>
                
                <div className="prize-card-vip" style={{ marginTop: '30px', padding: '30px', textAlign: 'center' }}>
                    <div style={{ opacity: 0.8, fontWeight: 'bold' }}>SỐ DƯ GIẢI ĐẤU HIỆN TẠI</div>
                    <div className="prize-amount-gold" style={{ fontSize: '3rem' }}>
                        {balance.toLocaleString()} VND
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceView;