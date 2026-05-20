import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../../api/axiosConfig";

const DashboardView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);

    const IMAGE_BASE_URL = "http://localhost:5001/"; 
    const formatImagePath = (path) => path ? path.replace(/\\/g, '/') : '';

    useEffect(() => {
        const fetchActiveTournamentInfo = async () => {
            if (!id) {
                setLoading(false);
                return;
            }
            try {
                const res = await api.get(`/tournaments/${id}`);
                if (res.data.success || res.data.data) {
                    setTournament(res.data.data);
                }
            } catch (error) {
                console.error("Lỗi đồng bộ Dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchActiveTournamentInfo();
    }, [id]);

    const calculatePlannedRevenue = () => {
        if (!tournament?.sportsConfig || tournament.sportsConfig.length === 0) return 0;
        return tournament.sportsConfig.reduce((sum, sport) => {
            const fee = Number(sport.feeEntry ?? sport.feePerAthlete) || 0;
            const max = Number(sport.maxTeams) || 0;
            return sum + (fee * max);
        }, 0);
    };

    if (loading) return (
        <div className="dv-loading">
            <div className="dv-loading-text">Đang nạp dữ liệu lõi...</div>
        </div>
    );

    if (!id || !tournament) return (
        <div className="dv-empty">
            <span><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#3aafbd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg></span>
            <p className="dv-empty-text">Chọn giải đấu bên trái</p>
        </div>
    );

    return (
        <>
            <style>{`
                .dv-container {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 16px;
                    animation: fadeIn 0.6s ease-out;
                }

                @media (max-width: 768px) {
                    .dv-container {
                        padding: 12px;
                    }
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .dv-action-buttons {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                }

                @media (max-width: 640px) {
                    .dv-action-buttons {
                        gap: 8px;
                    }
                }

                .dv-btn-outline {
                    background: transparent;
                    border: 1.5px solid var(--ocean-mid);
                    color: var(--ocean-mid);
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .dv-btn-outline:hover {
                    background: var(--ocean-mid);
                    color: white;
                    transform: translateY(-1px);
                }

                .dv-btn-primary {
                    background: linear-gradient(90deg, var(--ocean-deep), var(--ocean-mid));
                    color: #fff;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 0.7rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .dv-btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(1, 138, 190, 0.3);
                }

                @media (max-width: 640px) {
                    .dv-btn-outline, .dv-btn-primary {
                        padding: 10px 16px;
                        font-size: 0.65rem;
                        flex: 1;
                        text-align: center;
                    }
                }

                .dv-header {
                    background: var(--bg-white);
                    border-bottom: 3px solid var(--ocean-mid);
                    padding: 24px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    flex-wrap: wrap;
                    gap: 16px;
                    box-shadow: 0 2px 12px rgba(2, 69, 122, 0.08);
                }

                @media (max-width: 768px) {
                    .dv-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }

                .dv-header-id {
                    font-size: 0.55rem;
                    font-weight: 900;
                    color: var(--ocean-mid);
                    letter-spacing: 5px;
                    text-transform: uppercase;
                }

                .dv-header-title {
                    font-size: 2rem;
                    font-weight: 900;
                    color: var(--ocean-deep);
                    text-transform: uppercase;
                    margin: 8px 0;
                }

                @media (max-width: 768px) {
                    .dv-header-title {
                        font-size: 1.5rem;
                    }
                }

                @media (max-width: 640px) {
                    .dv-header-title {
                        font-size: 1.25rem;
                    }
                }

                .dv-status-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-top: 8px;
                }

                .dv-status-tag {
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-size: 0.55rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    border: 1px solid;
                }

                .dv-banner-section {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 24px;
                    margin: 24px 0;
                }

                @media (max-width: 768px) {
                    .dv-banner-section {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                }

                .dv-banner {
                    position: relative;
                    height: 224px;
                    border-radius: 16px;
                    overflow: hidden;
                    border: 1px solid var(--ocean-pale);
                    background: linear-gradient(135deg, var(--ocean-deep), var(--ocean-mid));
                }

                .dv-banner-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    opacity: 0.7;
                }

                .dv-banner-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(2,69,122,0.8), rgba(1,138,190,0.2));
                }

                .dv-banner-text {
                    position: absolute;
                    bottom: 24px;
                    left: 24px;
                }

                .dv-banner-label {
                    font-size: 0.6rem;
                    font-weight: 900;
                    color: var(--ocean-pale);
                    text-transform: uppercase;
                    letter-spacing: 3px;
                }

                .dv-banner-slogan {
                    font-size: 1.5rem;
                    font-weight: 900;
                    color: #fff;
                    margin-top: 8px;
                }

                @media (max-width: 640px) {
                    .dv-banner-slogan {
                        font-size: 1rem;
                    }
                }

                .dv-logo-box {
                    background: var(--bg-white);
                    border: 1px solid var(--ocean-pale);
                    border-radius: 16px;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(2, 69, 122, 0.05);
                }

                .dv-logo-img {
                    height: 144px;
                    width: 144px;
                    object-fit: contain;
                }

                @media (max-width: 640px) {
                    .dv-logo-img {
                        height: 100px;
                        width: 100px;
                    }
                }

                .dv-info-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }

                @media (max-width: 1024px) {
                    .dv-info-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 640px) {
                    .dv-info-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                }

                .dv-info-card {
                    background: var(--bg-white);
                    border-left: 4px solid var(--ocean-mid);
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(2, 69, 122, 0.05);
                }

                .dv-info-icon {
                    font-size: 0.875rem;
                    margin-right: 8px;
                }

                .dv-info-label {
                    font-size: 0.55rem;
                    color: var(--ocean-mid);
                    text-transform: uppercase;
                    font-weight: 900;
                    letter-spacing: 1px;
                }

                .dv-info-value {
                    font-size: 0.75rem;
                    color: var(--ocean-deep);
                    font-weight: 900;
                    margin-top: 4px;
                    word-break: break-word;
                }

                .dv-main-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 24px;
                    margin-bottom: 24px;
                }

                @media (max-width: 1024px) {
                    .dv-main-grid {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }
                }

                .dv-sport-card {
                    background: var(--bg-white);
                    border: 1px solid var(--ocean-pale);
                    border-radius: 16px;
                    padding: 32px;
                    box-shadow: 0 2px 8px rgba(2, 69, 122, 0.05);
                }

                .dv-sport-title {
                    color: var(--ocean-mid);
                    font-size: 0.7rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                    margin-bottom: 32px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .dv-sport-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .dv-sport-item {
                    background: var(--sky-mist);
                    border: 1px solid var(--ocean-pale);
                    padding: 24px;
                    border-radius: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                    transition: all 0.2s;
                }

                .dv-sport-item:hover {
                    border-color: var(--ocean-mid);
                    box-shadow: 0 4px 12px rgba(1, 138, 190, 0.1);
                }

                @media (max-width: 640px) {
                    .dv-sport-item {
                        flex-direction: column;
                        text-align: center;
                    }
                }

                .dv-sport-name {
                    font-size: 1.5rem;
                    font-weight: 900;
                    color: var(--ocean-deep);
                }

                .dv-sport-categories {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 8px;
                }

                .dv-sport-cat-badge {
                    font-size: 0.55rem;
                    background: rgba(1, 138, 190, 0.1);
                    color: var(--ocean-mid);
                    padding: 4px 12px;
                    border-radius: 4px;
                    border: 1px solid var(--ocean-pale);
                    text-transform: uppercase;
                    font-weight: 700;
                }

                .dv-sport-fee {
                    text-align: right;
                }

                @media (max-width: 640px) {
                    .dv-sport-fee {
                        text-align: center;
                    }
                }

                .dv-revenue-box {
                    background: linear-gradient(135deg, var(--ocean-deep), var(--ocean-mid));
                    padding: 24px;
                    border-radius: 16px;
                    margin-bottom: 24px;
                    box-shadow: 0 4px 12px rgba(1, 138, 190, 0.2);
                }

                .dv-revenue-label {
                    font-size: 0.55rem;
                    color: var(--ocean-pale);
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .dv-revenue-amount {
                    font-size: 2rem;
                    font-weight: 900;
                    color: #fff;
                    margin-top: 8px;
                }

                @media (max-width: 640px) {
                    .dv-revenue-amount {
                        font-size: 1.5rem;
                    }
                }

                .dv-timeline-box {
                    background: var(--bg-white);
                    border: 1px solid var(--ocean-pale);
                    padding: 24px;
                    border-radius: 16px;
                    margin-bottom: 24px;
                    box-shadow: 0 2px 8px rgba(2, 69, 122, 0.05);
                }

                .dv-gala-box {
                    padding: 24px;
                    border-radius: 16px;
                    margin-bottom: 24px;
                }

                .dv-gala-active {
                    background: linear-gradient(135deg, rgba(1, 138, 190, 0.1), rgba(2, 69, 122, 0.05));
                    border: 1px solid var(--ocean-mid);
                }

                .dv-gala-inactive {
                    background: var(--bg-white);
                    border: 1px solid var(--ocean-pale);
                    opacity: 0.5;
                }

                .dv-qr-box {
                    background: var(--bg-white);
                    border: 1px solid var(--ocean-pale);
                    padding: 24px;
                    border-radius: 16px;
                    text-align: center;
                    box-shadow: 0 2px 8px rgba(2, 69, 122, 0.05);
                }

                .dv-qr-img {
                    width: 160px;
                    height: 160px;
                    object-fit: contain;
                    margin: 0 auto;
                }

                @media (max-width: 640px) {
                    .dv-qr-img {
                        width: 120px;
                        height: 120px;
                    }
                }

                .dv-footer-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 24px;
                    margin-top: 32px;
                    padding-top: 32px;
                    border-top: 1px solid var(--ocean-pale);
                }

                @media (max-width: 1024px) {
                    .dv-footer-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 640px) {
                    .dv-footer-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                }

                .dv-loading {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 256px;
                    background: var(--bg-white);
                    border-radius: 16px;
                    border: 1px solid var(--ocean-mid);
                }

                .dv-loading-text {
                    font-size: 1.25rem;
                    font-weight: 900;
                    color: var(--ocean-mid);
                    animation: pulse 1.5s ease-in-out infinite;
                    text-transform: uppercase;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .dv-empty {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 256px;
                    border: 2px dashed var(--ocean-mid);
                    border-radius: 16px;
                    background: rgba(1, 138, 190, 0.05);
                }

                .dv-empty-icon {
                    font-size: 2.5rem;
                    margin-bottom: 16px;
                }

                .dv-empty-text {
                    color: var(--ocean-mid);
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
            `}</style>

            <div className="dv-container">
                <div className="dv-action-buttons">
                    <button onClick={() => navigate(`/admin/tournament/${id}/settings`)} className="dv-btn-outline">
                        🔧 Sửa Thông Tin 
                    </button>
                    <button onClick={() => navigate(`/admin/tournament/${id}/rules`)} className="dv-btn-primary">
                        ⚙️ Cấu Hình Vòng Đấu
                    </button>
                </div>

                <div className="dv-header">
                    <div>
                        <p className="dv-header-id">Core-ID: {tournament._id}</p>
                        <h1 className="dv-header-title">{tournament.displayName || tournament.name}</h1>
                        <div className="dv-status-tags">
                            <span className="dv-status-tag" style={{ background: 'rgba(1,138,190,0.15)', color: 'var(--ocean-mid)', borderColor: 'var(--ocean-mid)' }}>
                                Status: {tournament.status}
                            </span>
                            <span className="dv-status-tag" style={{ background: 'var(--sky-mist)', color: 'var(--ocean-deep)', borderColor: 'var(--ocean-pale)' }}>
                                Môn: {(tournament.sportsConfig || []).map(s => s.sport).join(', ') || 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="dv-banner-section">
                    <div className="dv-banner">
                        {tournament.banner ? (
                            <img src={IMAGE_BASE_URL + formatImagePath(tournament.banner)} alt="Banner" className="dv-banner-img" />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: 'var(--ocean-pale)' }}>No Banner</span>
                            </div>
                        )}
                        <div className="dv-banner-overlay"></div>
                        <div className="dv-banner-text">
                            <p className="dv-banner-label">Tournament Mission</p>
                            <h2 className="dv-banner-slogan">"{tournament.slogan}"</h2>
                        </div>
                    </div>
                    <div className="dv-logo-box">
                        {tournament.logo ? (
                            <img src={IMAGE_BASE_URL + formatImagePath(tournament.logo)} alt="Logo" className="dv-logo-img" />
                        ) : (
                            <span style={{ color: 'var(--ocean-pale)' }}>No Logo</span>
                        )}
                    </div>
                </div>

                <div className="dv-info-grid">
                    <InfoCard label="Thiết lập địa điểm" value={tournament.venue} icon="📍" />
                    <InfoCard label="Phân khúc mục tiêu" value={tournament.targetAudience} icon="👥" />
                    <InfoCard label="Nhân sự liên hệ" value={tournament.organization?.orgName || tournament.organization?.name || "N/A"} icon="📞" />
                    <InfoCard label="Tổng hợp giải thưởng" value={tournament.prizes} icon="🎁" />
                </div>

                <div className="dv-main-grid">
                    <div className="dv-sport-card">
                        <h3 className="dv-sport-title">
                            <span style={{ width: 32, height: 2, background: 'var(--ocean-mid)' }}></span> Sports Configuration
                        </h3>
                        <div className="dv-sport-list">
                            {tournament.sportsConfig?.map((sport, idx) => (
                                <div key={idx} className="dv-sport-item">
                                    <div>
                                        <h4 className="dv-sport-name">{sport.sport}</h4>
                                        <div className="dv-sport-categories">
                                            {(sport.categoryConfig || sport.categories || []).map(cat => (
                                                <span key={cat} className="dv-sport-cat-badge">{cat}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="dv-sport-fee">
                                        <p style={{ fontSize: '0.55rem', color: 'var(--ocean-mid)', fontWeight: 900, textTransform: 'uppercase' }}>Fee / Limit</p>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ocean-deep)' }}>
                                            {(sport.feeEntry ?? sport.feePerAthlete) ? Number(sport.feeEntry ?? sport.feePerAthlete).toLocaleString() : "N/A"} <span style={{ fontSize: '0.7rem', color: 'var(--ocean-mid)' }}>VNĐ</span>
                                        </p>
                                        <p style={{ fontSize: '0.7rem', color: '#7a8fa0', fontWeight: 700 }}>Max: {sport.maxTeams || "Unlimited"} Teams</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="dv-revenue-box">
                            <label className="dv-revenue-label">Estimated Revenue</label>
                            <p className="dv-revenue-amount">{calculatePlannedRevenue().toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--ocean-pale)' }}>VNĐ</span></p>
                        </div>

                        <div className="dv-timeline-box">
                            <h3 style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--ocean-deep)', textTransform: 'uppercase', borderBottom: '1px solid var(--ocean-pale)', paddingBottom: 12 }}>
                                Critical Timeline
                            </h3>
                            <TimelineRow label="Đăng ký" start={tournament.timeLine?.timeRegister} end={tournament.timeLine?.timeCloseRegister} />
                            <TimelineRow label="Thi đấu" start={tournament.timeLine?.timeOpen} end={tournament.timeLine?.timeClose} />
                        </div>

                        {tournament.galaConfig && (
                            <div className={`dv-gala-box ${tournament.galaConfig?.hasGala ? 'dv-gala-active' : 'dv-gala-inactive'}`}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                                    <h3 style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--ocean-mid)', textTransform: 'uppercase' }}>Gala Event</h3>
                                    {tournament.galaConfig?.hasGala && <span style={{ width: 8, height: 8, background: 'var(--logo-red)', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }}></span>}
                                </div>
                                {tournament.galaConfig?.hasGala ? (
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--ocean-deep)', fontWeight: 700 }}>📍 {tournament.galaConfig.venue || tournament.galaConfig.location}</p>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--ocean-mid)', marginTop: 8 }}>🕒 {new Date(tournament.galaConfig.time).toLocaleString('vi-VN')}</p>
                                        <p style={{ fontSize: '0.6rem', color: '#7a8fa0', marginTop: 8 }}>"{tournament.galaConfig.description}"</p>
                                    </div>
                                ) : <p style={{ fontSize: '0.7rem', color: '#7a8fa0', fontWeight: 700 }}>No Gala Configured</p>}
                            </div>
                        )}

                        <div className="dv-qr-box">
                            <label className="dv-revenue-label">Official Payment QR</label>
                            <div style={{ marginTop: 16 }}>
                                {tournament.paymentQR ? (
                                    <img src={IMAGE_BASE_URL + formatImagePath(tournament.paymentQR)} alt="Payment QR" className="dv-qr-img" />
                                ) : (
                                    <span style={{ color: '#7a8fa0', fontSize: '0.7rem' }}>No QR Code</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dv-footer-grid">
                    <MetaItem label="Created At" value={new Date(tournament.createdAt).toLocaleString()} />
                    <MetaItem label="Last Update" value={new Date(tournament.updatedAt).toLocaleString()} />
                    <MetaItem label="Organizer" value={tournament.org?.orgName || tournament.org?.name || "N/A"} />
                    <MetaItem label="Location" value={tournament.venue || "N/A"} />
                </div>
            </div>
        </>
    );
};

const InfoCard = ({ label, value, icon }) => (
    <div className="dv-info-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="dv-info-icon">{icon}</span>
            <label className="dv-info-label">{label}</label>
        </div>
        <p className="dv-info-value">{value || "Not Set"}</p>
    </div>
);

const TimelineRow = ({ label, start, end }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--ocean-pale)' }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--ocean-mid)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
        <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--ocean-deep)', fontWeight: 700 }}>{start ? new Date(start).toLocaleDateString('vi-VN') : '---'}</p>
            {end && <p style={{ fontSize: '0.55rem', color: 'var(--logo-red)', fontWeight: 700 }}>➔ {new Date(end).toLocaleDateString('vi-VN')}</p>}
        </div>
    </div>
);

const MetaItem = ({ label, value }) => (
    <div>
        <p style={{ fontSize: '0.5rem', color: 'var(--ocean-mid)', fontWeight: 900, textTransform: 'uppercase' }}>{label}</p>
        <p style={{ fontSize: '0.55rem', color: '#7a8fa0', wordBreak: 'break-all' }}>{value}</p>
    </div>
);

export default DashboardView;