import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api/axiosConfig';

const RuleFormModal = ({ mode, initialData, onClose, onSuccess, tournamentId }) => {
    const { id: tourIdFromParams } = useParams(); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        ruleName: "",
        description: "", 
        sportType: "Pickleball",
        participantType: "Team",
        genderFormat: "Any",
        registration: { maxTeams: 16, deadline: "" },
        rosterConfig: { minParticipantsPerSide: 2, maxParticipantsPerSide: 4, officialLimit: 0 },
        economics: { entryFee: 0, currency: "VND" },
        competitionFormat: "Group+Knockout",
        scoringSystem: { winPoints: 3, drawPoints: 1, lossPoints: 0, rankingCriteria: ['points', 'headToHead', 'diff'] },
        footballConfig: {
            pitchFormat: '5v5',
            matchStructure: { halfDuration: 20, breakTime: 15, hasExtraTime: false, extraTimeDuration: 0 }
        },
        racketConfig: {
            subSportType: 'Pickleball',
            setsToWin: 2,
            pointsPerSet: 11,
            winCondition: { winByTwo: true, maxPointCap: 15 }
        },
        volleyballConfig: {
            matchType: 'Indoor',
            setsToWin: 3,
            pointsRegularSet: 25,
            pointsFinalSet: 15,
            roster: { playersOnField: 6, allowLibero: true }
        }
    });

    useEffect(() => {
        if (mode === 'edit' && initialData) setFormData(initialData);
    }, [mode, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            // Ưu tiên lấy tournamentId từ props, nếu không có thì lấy từ URL
            const finalTournamentId = tournamentId || tourIdFromParams;

            let payload = {
                ruleName: formData.ruleName,
                description: formData.description,
                participantType: formData.participantType,
                genderFormat: formData.genderFormat,
                competitionFormat: formData.competitionFormat,
                rosterConfig: formData.rosterConfig,
                registration: formData.registration,
                scoringSystem: formData.scoringSystem,
                economics: formData.economics,
                tournamentId: finalTournamentId // Đảm bảo luôn gửi ID giải đấu
            };

            const racketSports = ['Pickleball', 'Tennis', 'Badminton', 'TableTennis'];

            if (formData.sportType === 'Football') {
                payload.sportType = 'Football';
                payload.footballConfig = formData.footballConfig;
            } 
            else if (racketSports.includes(formData.sportType)) {
                payload.sportType = 'RacketSport';
                payload.racketConfig = {
                    ...formData.racketConfig,
                    subSportType: formData.sportType
                };
            } 
            else if (formData.sportType === 'Volleyball') {
                payload.sportType = 'Volleyball';
                payload.volleyballConfig = formData.volleyballConfig;
            }

            if (mode === 'create') {
                await api.post('/rules/create', payload);
            } else {
                // CHÚ Ý: Kiểm tra chính xác URL này với Backend của bạn
                // Nếu Backend là route.patch('/editRule/:id'), thì dòng dưới đây là chuẩn:
                await api.patch(`/rules/editRule/${formData._id}`, payload);
            }
            
            onSuccess();
        } catch (err) {
            console.error("Lỗi Engine:", err);
            // Hiện thông báo lỗi chi tiết từ Backend nếu có
            alert("Lỗi: " + (err.response?.data?.message || "Không thể thực hiện thao tác"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const isRacketSport = ['Pickleball', 'Tennis', 'Badminton', 'TableTennis'].includes(formData.sportType);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2500, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
            <div className="modern-card" style={{ width: '1100px', maxHeight: '95vh', overflowY: 'auto', padding: '40px', background: '#fff', borderRadius: '30px' }}>
                
                <div className="flex-between" style={{ marginBottom: '30px' }}>
                    <h2 className="text-forest uppercase font-black">⚙️ ENGINE LUẬT: {mode === 'edit' ? 'CẬP NHẬT' : 'THIẾT LẬP'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '30px', cursor: 'pointer', color: '#ccc' }}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* TẦNG 0: MÔ TẢ LUẬT CHI TIẾT */}
                    <section>
                        <h4 className="section-title">00. LUẬT CHI TIẾT (VĂN BẢN PUBLIC)</h4>
                        <div className="modern-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
                            <div>
                                <label className="info-label">Tên bộ luật</label>
                                <input className="auth-input" required value={formData.ruleName} onChange={e => setFormData({...formData, ruleName: e.target.value})} placeholder="VD: Luật Pickleball 2026" />
                            </div>
                            <div>
                                <label className="info-label">Nội dung luật công khai</label>
                                <textarea className="auth-input" rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Nhập các quy định..." />
                            </div>
                        </div>
                    </section>

                    {/* TẦNG 1: CẤU HÌNH CẤP GIẢI ĐẤU */}
                    <section>
                        <h4 className="section-title">01. CẤU HÌNH CẤP GIẢI ĐẤU (TOURNAMENT)</h4>
                        <div className="modern-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                            <div><label className="info-label">Môn thi</label>
                                <select className="auth-input" value={formData.sportType} 
                                    onChange={e => {
                                        const val = e.target.value;
                                        setFormData(prev => ({
                                            ...prev, 
                                            sportType: val,
                                            racketConfig: { ...prev.racketConfig, subSportType: val }
                                        }));
                                    }}>
                                    <option value="Football">Bóng Đá</option>
                                    <option value="Pickleball">Pickleball</option>
                                    <option value="Tennis">Tennis</option>
                                    <option value="Badminton">Cầu lông</option>
                                    <option value="Volleyball">Bóng Chuyền</option>
                                    <option value="TableTennis">Bóng bàn</option>
                                </select>
                            </div>
                            <div><label className="info-label">Giới hạn Đội</label><input type="number" className="auth-input" value={formData.registration.maxTeams} onChange={e => setFormData({...formData, registration: {...formData.registration, maxTeams: e.target.value}})} /></div>
                            <div><label className="info-label">Lệ phí (VND)</label><input type="number" className="auth-input" value={formData.economics.entryFee} onChange={e => setFormData({...formData, economics: {...formData.economics, entryFee: e.target.value}})} /></div>
                            <div><label className="info-label">VĐV Tối đa/Đội</label><input type="number" className="auth-input" value={formData.rosterConfig.maxParticipantsPerSide} onChange={e => setFormData({...formData, rosterConfig: {...formData.rosterConfig, maxParticipantsPerSide: e.target.value}})} /></div>
                        </div>
                    </section>

                    {/* TẦNG 2: LUẬT VÒNG ĐẤU */}
                    <section>
                        <h4 className="section-title">02. CẤU HÌNH VÒNG ĐẤU & XẾP HẠNG</h4>
                        <div className="modern-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                            <div><label className="info-label">Hình thức tổ chức</label>
                                <select className="auth-input" value={formData.competitionFormat} onChange={e => setFormData({...formData, competitionFormat: e.target.value})}>
                                    <option value="Group+Knockout">Vòng bảng + Loại trực tiếp</option>
                                    <option value="League">Vòng tròn tính điểm (League)</option>
                                    <option value="Knockout">Loại trực tiếp (Single Elim)</option>
                                </select>
                            </div>
                            <div><label className="info-label">Điểm Thắng</label><input type="number" className="auth-input" value={formData.scoringSystem.winPoints} onChange={e => setFormData({...formData, scoringSystem: {...formData.scoringSystem, winPoints: e.target.value}})} /></div>
                            <div>
                                <label className="info-label">Điểm Hòa</label>
                                <input 
                                    type="number" 
                                    className="auth-input" 
                                    disabled={formData.sportType !== 'Football'} 
                                    value={formData.sportType === 'Football' ? formData.scoringSystem.drawPoints : 0} 
                                    onChange={e => setFormData({...formData, scoringSystem: {...formData.scoringSystem, drawPoints: Number(e.target.value)}})} 
                                />
                            </div>                            
                            <div><label className="info-label">Điểm Thua</label><input type="number" className="auth-input" value={formData.scoringSystem.lossPoints} onChange={e => setFormData({...formData, scoringSystem: {...formData.scoringSystem, lossPoints: e.target.value}})} /></div>
                        </div>
                    </section>

                    {/* TẦNG 3: CHI TIẾT TRẬN ĐẤU */}
                    <section className="engine-box">
                        <h4 className="section-title text-lime">03. CHI TIẾT TRẬN ĐẤU (ENGINE DYNAMICS)</h4>
                        
                        {formData.sportType === 'Football' && (
                            <div className="modern-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                                <div><label className="info-label">Sân</label><select className="auth-input" value={formData.footballConfig.pitchFormat} onChange={e => setFormData({...formData, footballConfig: {...formData.footballConfig, pitchFormat: e.target.value}})}><option value="5v5">5vs5</option><option value="7v7">7vs7</option><option value="11v11">11vs11</option></select></div>
                                <div><label className="info-label">Phút/Hiệp</label><input type="number" className="auth-input" value={formData.footballConfig.matchStructure.halfDuration} onChange={e => setFormData({...formData, footballConfig: {...formData.footballConfig, matchStructure: {...formData.footballConfig.matchStructure, halfDuration: e.target.value}}})} /></div>
                                <div><label className="info-label">Nghỉ giữa hiệp</label><input type="number" className="auth-input" value={formData.footballConfig.matchStructure.breakTime} onChange={e => setFormData({...formData, footballConfig: {...formData.footballConfig, matchStructure: {...formData.footballConfig.matchStructure, breakTime: e.target.value}}})} /></div>
                                <div><label className="info-label">Hiệp phụ (Phút)</label><input type="number" className="auth-input" value={formData.footballConfig.matchStructure.extraTimeDuration} onChange={e => setFormData({...formData, footballConfig: {...formData.footballConfig, matchStructure: {...formData.footballConfig.matchStructure, extraTimeDuration: e.target.value}}})} /></div>
                            </div>
                        )}

                        {isRacketSport && (
                            <div className="modern-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                <div><label className="info-label">BO (Số Set thắng)</label><input type="number" className="auth-input" value={formData.racketConfig.setsToWin} onChange={e => setFormData({...formData, racketConfig: {...formData.racketConfig, setsToWin: e.target.value}})} /></div>
                                <div><label className="info-label">Điểm chạm/Set</label><input type="number" className="auth-input" value={formData.racketConfig.pointsPerSet} onChange={e => setFormData({...formData, racketConfig: {...formData.racketConfig, pointsPerSet: e.target.value}})} /></div>
                                <div><label className="info-label">Win by two</label><select className="auth-input" value={formData.racketConfig.winCondition.winByTwo} onChange={e => setFormData({...formData, racketConfig: {...formData.racketConfig, winCondition: {...formData.racketConfig.winCondition, winByTwo: e.target.value === 'true'}}})}><option value="true">Có</option><option value="false">Không</option></select></div>
                            </div>
                        )}

                        {formData.sportType === 'Volleyball' && (
                            <div className="modern-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                <div><label className="info-label">Loại sân</label><select className="auth-input" value={formData.volleyballConfig.matchType} onChange={e => setFormData({...formData, volleyballConfig: {...formData.volleyballConfig, matchType: e.target.value}})}><option value="Indoor">Trong nhà</option><option value="Beach">Bãi biển</option></select></div>
                                <div><label className="info-label">Điểm Set thường</label><input type="number" className="auth-input" value={formData.volleyballConfig.pointsRegularSet} onChange={e => setFormData({...formData, volleyballConfig: {...formData.volleyballConfig, pointsRegularSet: e.target.value}})} /></div>
                                <div><label className="info-label">Điểm Set quyết định</label><input type="number" className="auth-input" value={formData.volleyballConfig.pointsFinalSet} onChange={e => setFormData({...formData, volleyballConfig: {...formData.volleyballConfig, pointsFinalSet: e.target.value}})} /></div>
                            </div>
                        )}
                    </section>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '50px' }}>
                        <button type="button" onClick={onClose} className="tab-btn" style={{ flex: 1 }}>ĐÓNG</button>
                        <button type="submit" disabled={isSubmitting} className="auth-button" style={{ flex: 2, margin: 0 }}>
                            {isSubmitting ? "ĐANG XỬ LÝ..." : "XÁC NHẬN CẤU HÌNH"}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .section-title { font-size: 0.9rem; font-weight: 900; color: #555; margin-bottom: 20px; border-left: 5px solid var(--primary-lime); padding-left: 15px; }
                .info-label { font-size: 0.7rem; font-weight: 800; color: #999; text-transform: uppercase; margin-bottom: 8px; display: block; }
                .engine-box { background: #f8fdf0; padding: 30px; border-radius: 20px; border: 1px solid #e1f5d4; }
                .text-lime { color: var(--primary-lime) !important; }
                .modern-grid { display: grid; gap: 20px; }
                .auth-input { width: 100%; padding: 12px; border: 1px solid #eee; border-radius: 10px; outline: none; }
                .auth-input:focus { border-color: var(--primary-lime); }
            `}</style>
        </div>
    );
};

export default RuleFormModal;