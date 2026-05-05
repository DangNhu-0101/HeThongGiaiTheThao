import React, { useState, useEffect } from 'react';
import api from '../../../api/axiosConfig';

const TournamentModal = ({ mode, tourId, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        displayName: "", sportType: "RacketSport", startDate: "", endDate: "", year: 2026
    });

    useEffect(() => {
        if (mode === 'edit' && tourId) {
            api.get(`/tournaments/${tourId}`).then(res => {
                const d = res.data.data;
                setFormData({
                    displayName: d.displayName,
                    year: d.year,
                    startDate: d.startDate.split('T')[0],
                    endDate: d.endDate.split('T')[0],
                    status: d.status
                });
            });
        }
    }, [mode, tourId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (mode === 'create') {
                await api.post('/api/tournaments/createTournament', formData);
            } else {
                await api.patch(`/api/tournaments/${tourId}`, formData);
            }
            onSuccess();
        } catch (e) { alert("Lỗi xử lý giải đấu"); }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="modern-card" style={{ width: '500px', padding: '40px' }}>
                <h2 className="text-forest">{mode === 'create' ? "TẠO GIẢI MỚI" : "SỬA GIẢI ĐẤU"}</h2>
                <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                    <label className="info-label">Tên giải đấu</label>
                    <input className="auth-input" required value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                        <div><label className="info-label">Ngày bắt đầu</label><input type="date" className="auth-input" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} /></div>
                        <div><label className="info-label">Ngày kết thúc</label><input type="date" className="auth-input" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} /></div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                        <button type="button" onClick={onClose} className="tab-btn">HỦY</button>
                        <button type="submit" className="auth-button" style={{ margin: 0 }}>LƯU THÔNG TIN</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TournamentModal;