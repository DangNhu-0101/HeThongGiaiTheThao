import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from "../../../api/axiosConfig";

const MatchView = () => {
    const { id: tournamentId } = useParams();
    const [rules, setRules] = useState([]);
    const [selectedRule, setSelectedRule] = useState("");
    const [startTime, setStartTime] = useState("");
    const [courts, setCourts] = useState(["Sân 1", "Sân 2", "Sân 3"]);
    const [draftMatches, setDraftMatches] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!tournamentId) return;

        const fetchSetupData = async () => {
            try {
                const [ruleRes, courtRes] = await Promise.all([
                    api.get('/rules', { params: { tournamentId } }),
                    api.get(`/courts/tournaments/${tournamentId}/courts`).catch(() => ({ data: { data: [] } }))
                ]);

                setRules(ruleRes.data?.data || []);
                const courtNames = (courtRes.data?.data || []).map(c => c.name).filter(Boolean);
                if (courtNames.length) setCourts(courtNames);
            } catch (error) {
                console.error("Lỗi tải dữ liệu xếp lịch:", error);
            }
        };

        fetchSetupData();
    }, [tournamentId]);

    const handleAutoDraw = async () => {
        if (!selectedRule || !startTime) {
            alert("Vui lòng chọn môn thi đấu và giờ bắt đầu!");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await api.post(`/matches/auto-draw/${tournamentId}`, {
                ruleId: selectedRule,
                startTime: startTime,
                courts: courts
            });

            if (res.data.success) {
                setDraftMatches(res.data.data);
                alert("AI đã bốc thăm và xếp lịch nháp thành công!");
            }
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi khi bốc thăm từ Server");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePublish = async () => {
        try {
            const res = await api.post('/matches/publish', { matches: draftMatches });
            if (res.data.success) {
                alert("Lịch thi đấu đã được công khai!");
                setDraftMatches([]);
            }
        } catch (error) {
            alert("Lỗi khi lưu lịch thi đấu chính thức");
        }
    };

    return (
        <>
            <style>{`
                .mv-container {
                    max-width: 1024px;
                    margin: 0 auto;
                    animation: fadeIn 0.4s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .mv-ai-engine {
                    background: linear-gradient(135deg, #0e2a07, #16400b);
                    color: #fff;
                    padding: 40px;
                    border-radius: 24px;
                    margin-bottom: 40px;
                    position: relative;
                    overflow: hidden;
                }

                @media (max-width: 768px) {
                    .mv-ai-engine {
                        padding: 24px;
                        margin-bottom: 24px;
                    }
                }

                @media (max-width: 640px) {
                    .mv-ai-engine {
                        padding: 20px;
                        border-radius: 20px;
                    }
                }

                .mv-ai-title {
                    font-size: 1.875rem;
                    font-weight: 900;
                    margin-bottom: 32px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                @media (max-width: 640px) {
                    .mv-ai-title {
                        font-size: 1.25rem;
                        gap: 12px;
                        margin-bottom: 24px;
                    }
                }

                .mv-ai-icon {
                    width: 48px;
                    height: 48px;
                    background: rgba(206,241,95,0.2);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                }

                .mv-form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 24px;
                    margin-bottom: 32px;
                }

                @media (max-width: 768px) {
                    .mv-form-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                }

                .mv-form-field {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 20px;
                    border-radius: 16px;
                }

                @media (max-width: 640px) {
                    .mv-form-field {
                        padding: 16px;
                    }
                }

                .mv-form-label {
                    display: block;
                    font-size: 0.7rem;
                    font-weight: 900;
                    color: #cef15f;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 8px;
                }

                .mv-select, .mv-input {
                    width: 100%;
                    background: rgba(0,0,0,0.4);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: #fff;
                    padding: 12px;
                    border-radius: 12px;
                    font-size: 0.875rem;
                    outline: none;
                }

                @media (max-width: 640px) {
                    .mv-select, .mv-input {
                        padding: 12px;
                        font-size: 16px;
                    }
                }

                .mv-btn-primary {
                    width: 100%;
                    padding: 16px;
                    background: #cef15f;
                    color: #0e2a07;
                    font-weight: 900;
                    font-size: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                @media (max-width: 640px) {
                    .mv-btn-primary {
                        padding: 14px;
                        font-size: 0.875rem;
                    }
                }

                .mv-btn-primary:disabled {
                    background: rgba(255,255,255,0.1);
                    color: #64748b;
                    cursor: not-allowed;
                }

                .mv-draft-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                }

                .mv-draft-title {
                    font-size: 1.5rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    color: #0e2a07;
                }

                @media (max-width: 640px) {
                    .mv-draft-title {
                        font-size: 1.125rem;
                    }
                }

                .mv-draft-badge {
                    background: #BD0014;
                    color: #fff;
                    font-size: 0.7rem;
                    font-weight: 700;
                    padding: 4px 12px;
                    border-radius: 20px;
                    animation: pulse 1.5s ease-in-out infinite;
                }

                .mv-matches-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                    max-height: 500px;
                    overflow-y: auto;
                    padding-right: 8px;
                }

                @media (max-width: 768px) {
                    .mv-matches-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                }

                .mv-match-card {
                    background: linear-gradient(135deg, #0a1d05, #112a0d);
                    border-top: 4px solid #cef15f;
                    padding: 20px;
                    border-radius: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                @media (max-width: 640px) {
                    .mv-match-card {
                        flex-direction: column;
                        text-align: center;
                    }
                }

                .mv-match-time {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #9ca3af;
                    margin-bottom: 8px;
                }

                .mv-match-teams {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 1rem;
                    font-weight: 900;
                    color: #fff;
                    flex-wrap: wrap;
                }

                @media (max-width: 640px) {
                    .mv-match-teams {
                        justify-content: center;
                    }
                }

                .mv-match-vs {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #6b7280;
                }

                .mv-match-group {
                    background: rgba(255,255,255,0.05);
                    text-align: center;
                    padding: 8px 12px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #cef15f;
                }

                .mv-publish-btn {
                    width: 100%;
                    margin-top: 32px;
                    padding: 16px;
                    background: #14b8a6;
                    color: #fff;
                    font-weight: 900;
                    font-size: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    border: none;
                    border-radius: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                @media (max-width: 640px) {
                    .mv-publish-btn {
                        padding: 14px;
                        font-size: 0.875rem;
                        margin-top: 24px;
                    }
                }

                .mv-publish-btn:hover {
                    background: #0d9488;
                    transform: translateY(-2px);
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
            `}</style>

            <div className="mv-container">
                <div className="mv-ai-engine">
                    <h3 className="mv-ai-title">
                        <span className="mv-ai-icon">🤖</span>
                        AI TOURNAMENT ENGINE
                    </h3>

                    <div className="mv-form-grid">
                        <div className="mv-form-field">
                            <label className="mv-form-label">1. Chọn môn thi đấu</label>
                            <select 
                                className="mv-select"
                                value={selectedRule}
                                onChange={(e) => setSelectedRule(e.target.value)}
                                disabled={rules.length === 0}
                            >
                                <option value="" className="text-gray-900">-- Click để chọn --</option>
                                {rules?.length > 0 ? (
                                    rules.map(r => (
                                        <option key={r._id} value={r._id} className="text-gray-900">{r.ruleName} ({r.sport || r.sportType})</option>
                                    ))
                                ) : (
                                    <option value="" disabled className="text-gray-900">Đang tải dữ liệu luật...</option>
                                )}
                            </select>
                        </div>

                        <div className="mv-form-field">
                            <label className="mv-form-label">2. Giờ bắt đầu</label>
                            <input 
                                type="datetime-local" 
                                className="mv-input"
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleAutoDraw}
                        disabled={isProcessing}
                        className="mv-btn-primary"
                    >
                        {isProcessing ? 'Đang tính toán ma trận lịch...' : 'Khởi chạy Bốc Thăm & Xếp Lịch'}
                    </button>
                </div>

                {draftMatches?.length > 0 && (
                    <div>
                        <div className="mv-draft-header">
                            <h4 className="mv-draft-title">Lịch Thi Đấu Dự Kiến</h4>
                            <span className="mv-draft-badge">Bản Nháp (Draft)</span>
                        </div>

                        <div className="mv-matches-grid">
                            {draftMatches.map((m, idx) => (
                                <div key={idx} className="mv-match-card">
                                    <div>
                                        <div className="mv-match-time">
                                            {new Date(m.timestart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {m.court}
                                        </div>
                                        <div className="mv-match-teams">
                                            <span>{m.team1Name}</span>
                                            <span className="mv-match-vs">VS</span>
                                            <span>{m.team2Name}</span>
                                        </div>
                                    </div>
                                    <div className="mv-match-group">
                                        BẢNG <br/> <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>{m.group}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={handlePublish}
                            className="mv-publish-btn"
                        >
                            Xác Nhận & Công Khai Lịch Trận Đấu
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default MatchView;
