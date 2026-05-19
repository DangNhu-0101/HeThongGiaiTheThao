import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api/axiosConfig';

const CourtView = () => {
    const { id: tourId } = useParams();
    const [courts, setCourts] = useState([]);
    const [newCourtName, setNewCourtName] = useState("");
    const [selectedSports, setSelectedSports] = useState([]);
    const [isAdding, setIsAdding] = useState(false);

    const availableSports = ['Pickleball', 'Tennis', 'Badminton', 'Table Tennis', 'Football', 'Volleyball'];

    const fetchCourts = async () => {
        try {
            console.log("📥 Đang lấy sân cho tournament:", tourId);
            const res = await api.get(`/courts/tournaments/${tourId}/courts`);
            console.log("✅ API Response:", res.data);
            setCourts(res.data.data || []);
            console.log(`📊 Tìm thấy ${res.data.data?.length || 0} sân`);
        } catch (e) { 
            console.error("❌ Lỗi lấy danh sách sân:", e); 
        }
    };

    useEffect(() => { 
        if (tourId) fetchCourts(); 
    }, [tourId]);

    const handleSportToggle = (sport) => {
        setSelectedSports(prev => 
            prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
        );
    };

    const handleAddCourt = async (e) => {
        e.preventDefault();
        if (!newCourtName.trim() || selectedSports.length === 0) return alert("Vui lòng nhập tên và chọn môn!");
        
        try {
            await api.post('/courts/courts', { 
                name: newCourtName, 
                tournamentId: tourId, 
                sportTypes: selectedSports,
                status: 'empty' 
            });
            setNewCourtName("");
            setSelectedSports([]);
            setIsAdding(false);
            fetchCourts();
        } catch (e) { 
            alert("Lỗi: " + (e.response?.data?.message || "Không thể thêm sân mới!")); 
        }
    };

    const toggleCourtStatus = async (id, currentStatus) => {
        if (currentStatus === 'busy') return alert("Sân đang có trận đấu!");
        const nextStatus = currentStatus === 'inactive' ? 'empty' : 'inactive';
        try {
            await api.patch(`/courts/courts/${id}/status`, { status: nextStatus });
            fetchCourts();
        } catch (e) { alert("Lỗi cập nhật trạng thái!"); }
    };

    const handleDeleteCourt = async (id, name) => {
        if (!window.confirm(`Xóa sân [${name}]?`)) return;
        try {
            await api.delete(`/courts/courts/${id}`);
            fetchCourts();
        } catch (e) { alert("Lỗi khi xóa sân!"); }
    };

    return (
        <>
            <style>{`
                .cv-container {
                    padding: 16px;
                }

                @media (max-width: 640px) {
                    .cv-container {
                        padding: 12px;
                    }
                }

                .cv-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                    margin-bottom: 32px;
                }

                .cv-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                }

                @media (max-width: 640px) {
                    .cv-title {
                        font-size: 1.25rem;
                    }
                }

                .cv-btn-primary {
                    background: #000;
                    color: #fff;
                    padding: 8px 16px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                }

                @media (max-width: 640px) {
                    .cv-btn-primary {
                        padding: 10px 16px;
                        font-size: 14px;
                    }
                }

                .cv-add-form {
                    background: #f8fafc;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                    border: 2px dashed #cbd5e1;
                }

                .cv-input {
                    width: 100%;
                    padding: 10px;
                    margin-bottom: 16px;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    font-size: 16px;
                }

                .cv-sports-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 16px;
                }

                .cv-sport-btn {
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    border: none;
                    cursor: pointer;
                    background: #e2e8f0;
                }

                .cv-sport-btn.selected {
                    background: #84cc16;
                }

                .cv-courts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                }

                @media (max-width: 640px) {
                    .cv-courts-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                }

                .cv-court-card {
                    border: 1px solid #e2e8f0;
                    padding: 16px;
                    border-radius: 8px;
                    background: #fff;
                }

                .cv-court-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .cv-court-name {
                    font-weight: 700;
                    font-size: 1.125rem;
                }

                .cv-court-sports {
                    font-size: 0.7rem;
                    color: #2563eb;
                    margin-bottom: 16px;
                    word-break: break-word;
                }

                .cv-court-status {
                    font-size: 0.875rem;
                    margin-bottom: 16px;
                }

                .cv-status-empty {
                    color: #22c55e;
                }

                .cv-status-busy, .cv-status-inactive {
                    color: #ef4444;
                }

                .cv-court-action {
                    width: 100%;
                    padding: 8px;
                    background: #f1f5f9;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .cv-delete-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1.25rem;
                    padding: 4px;
                }

                @media (max-width: 640px) {
                    .cv-court-name {
                        font-size: 1rem;
                    }
                    
                    .cv-court-action {
                        padding: 10px;
                    }
                }
            `}</style>

            <div className="cv-container">
                <div className="cv-header">
                    <h2 className="cv-title">🏟️ QUẢN LÝ SÂN THI ĐẤU</h2>
                    <button onClick={() => setIsAdding(!isAdding)} className="cv-btn-primary">
                        {isAdding ? "HỦY" : "+ THÊM SÂN"}
                    </button>
                </div>

                {isAdding && (
                    <div className="cv-add-form">
                        <form onSubmit={handleAddCourt}>
                            <input className="cv-input" placeholder="Tên sân..." 
                                   value={newCourtName} onChange={e => setNewCourtName(e.target.value)} />
                            <div className="cv-sports-grid">
                                {availableSports.map(s => (
                                    <button key={s} type="button" onClick={() => handleSportToggle(s)}
                                        className={`cv-sport-btn ${selectedSports.includes(s) ? 'selected' : ''}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <button type="submit" className="cv-btn-primary" style={{ width: '100%', background: '#84cc16', color: '#000' }}>LƯU SÂN</button>
                        </form>
                    </div>
                )}

                <div className="cv-courts-grid">
                    {courts.map(c => (
                        <div key={c._id} className="cv-court-card">
                            <div className="cv-court-header">
                                <span className="cv-court-name">{c.name}</span>
                                <button onClick={() => handleDeleteCourt(c._id, c.name)} className="cv-delete-btn">🗑️</button>
                            </div>
                            <div className="cv-court-sports">{c.sportTypes?.join(', ')}</div>
                            <div className={`cv-court-status ${c.status === 'empty' ? 'cv-status-empty' : 'cv-status-inactive'}`}>
                                ● {c.status === 'empty' ? 'Sẵn sàng' : c.status === 'busy' ? 'Đang thi đấu' : 'Tạm ngưng'}
                            </div>
                            <button onClick={() => toggleCourtStatus(c._id, c.status)} className="cv-court-action">
                                {c.status === 'inactive' ? "Mở lại" : c.status === 'busy' ? "Đang có trận" : "Tạm đóng"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>      
        </>
    );
};

export default CourtView;
