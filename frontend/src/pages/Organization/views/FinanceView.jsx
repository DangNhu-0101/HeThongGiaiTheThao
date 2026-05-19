import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api/axiosConfig';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const FinanceView = () => {
    const { id: tourId } = useParams();
    const [tournament, setTournament] = useState(null);

    useEffect(() => {
        if (!tourId) return;
        api.get(`/tournaments/${tourId}`)
            .then(res => setTournament(res.data.data))
            .catch(e => console.error('Lỗi lấy thông tin giải đấu:', e));
    }, [tourId]);

    const budget = tournament?.budget || {};
    const finance = tournament?.finance || {};
    const sponsor = budget.totalSponsor || 0;
    const expense = finance.totalExpense ?? budget.totalExpense ?? 0;
    const entryFee = finance.actualRevenue ? Math.max(finance.actualRevenue - sponsor, 0) : 0;
    const balance = finance.balance ?? (entryFee + sponsor - expense);

    return (
        <>
            <style>{`
                .fv-container { padding: 20px; }
                .fv-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
                .fv-card { background: #fff; border: 1px solid rgba(1,138,190,0.15); border-radius: 20px; padding: 24px; transition: all 0.2s; }
                .fv-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
                .fv-card-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 20px; }
                .fv-card-label { font-size: 11px; font-weight: 800; color: #018ABE; text-transform: uppercase; letter-spacing: 1.5px; }
                .fv-card-amount { font-size: 28px; font-weight: 700; color: #02457A; margin-top: 8px; }
                .fv-balance-card { background: linear-gradient(135deg, #02457A, #018ABE); border-radius: 20px; padding: 32px; text-align: center; margin-top: 20px; }
                .fv-balance-label { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 2px; }
                .fv-balance-amount { font-size: 48px; font-weight: 700; color: #fff; margin-top: 12px; }
                @media (max-width: 768px) { .fv-container { padding: 16px; } .fv-grid { grid-template-columns: 1fr; gap: 16px; } .fv-balance-amount { font-size: 36px; } }
                @media (max-width: 640px) { .fv-container { padding: 12px; } .fv-card { padding: 16px; } .fv-card-amount { font-size: 22px; } .fv-balance-card { padding: 24px; margin-top: 16px; } .fv-balance-amount { font-size: 28px; } }
            `}</style>

            <div className="fv-container">
                <div className="fv-grid">
                    <FinanceCard label="Lệ phí thi đấu" amount={entryFee} />
                    <FinanceCard label="Tài trợ" amount={sponsor} />
                </div>

                <div className="fv-card" style={{ background: 'rgba(194, 67, 66, 0.05)', borderColor: 'rgba(194, 67, 66, 0.2)' }}>
                    <div className="fv-card-header">
                        <div className="fv-card-icon" style={{ background: 'rgba(194, 67, 66, 0.1)', color: '#BD0014' }}>-</div>
                        <div>
                            <div className="fv-card-label" style={{ color: '#BD0014' }}>Tổng chi</div>
                            <div className="fv-card-amount" style={{ color: '#BD0014' }}>{money(expense)} VND</div>
                        </div>
                    </div>
                </div>

                <div className="fv-balance-card">
                    <div className="fv-balance-label">Số dư giải đấu hiện tại</div>
                    <div className="fv-balance-amount">{money(balance)} VND</div>
                </div>
            </div>
        </>
    );
};

const FinanceCard = ({ label, amount }) => (
    <div className="fv-card">
        <div className="fv-card-header">
            <div className="fv-card-icon" style={{ background: 'rgba(1,138,190,0.1)' }}>+</div>
            <div>
                <div className="fv-card-label">{label}</div>
                <div className="fv-card-amount">{money(amount)} VND</div>
            </div>
        </div>
    </div>
);

export default FinanceView;
