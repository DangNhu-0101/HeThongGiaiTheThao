import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api/axiosConfig';

const TeamView = ({ tourId: propTourId }) => {
    const { id: urlTourId } = useParams();
    const activeTourId = propTourId || urlTourId || localStorage.getItem('activeTournamentId');

    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // State cho import Excel
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [importMessage, setImportMessage] = useState(null);

    const fetchTeams = useCallback(async () => {
        if (!activeTourId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await api.get(`/teams/tournament/${activeTourId}`);
            if (res.data && res.data.success) {
                setTeams(res.data.data);
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách đội:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTourId]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    // Xử lý import Excel
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.type === 'application/vnd.ms-excel')) {
            setFile(selectedFile);
            setImportMessage(null);
        } else {
            setImportMessage({ type: 'error', text: 'Vui lòng chọn file Excel (.xlsx hoặc .xls)' });
            e.target.value = '';
        }
    };

    const handleImportExcel = async () => {
        if (!file) {
            setImportMessage({ type: 'error', text: 'Vui lòng chọn file Excel!' });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        if (activeTourId) {
            formData.append('tournamentId', activeTourId);
        }

        setUploading(true);
        setImportMessage(null);
        
        try {
            const res = await api.post('/xlxs/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setImportMessage({ 
                    type: 'success', 
                    text: res.data.message || '✅ Import thành công! Dữ liệu đã được cập nhật.' 
                });
                setFile(null);
                // Reset file input
                const fileInput = document.getElementById('excel-file-input');
                if (fileInput) fileInput.value = '';
                // Refresh danh sách đội
                fetchTeams();
            } else {
                setImportMessage({ type: 'error', text: res.data.message || '❌ Import thất bại!' });
                if (res.data.errors) {
                    console.error('Validation errors:', res.data.errors);
                }
            }
        } catch (error) {
            console.error('Import error:', error);
            setImportMessage({ 
                type: 'error', 
                text: error.response?.data?.message || '❌ Lỗi kết nối server!' 
            });
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        window.open('http://localhost:5001/api/xlxs/template', '_blank');
    };

    const handleApproveTeam = async (teamId) => {
        try {
            await api.patch(`/teams/${teamId}/payment`, { isPaid: true });
            setTeams(teams.map(t => t._id === teamId ? { ...t, isPaid: true } : t));
        } catch (e) { 
            alert("Lỗi duyệt đội!"); 
        }
    };

    const handleUnapproveTeam = async (teamId) => {
        try {
            await api.patch(`/teams/${teamId}/payment`, { isPaid: false });
            setTeams(teams.map(t => t._id === teamId ? { ...t, isPaid: false } : t));
        } catch (e) { 
            alert("Lỗi hủy duyệt!"); 
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm("Xóa đội này khỏi giải đấu?")) return;
        try {
            await api.delete(`/teams/delete/${teamId}`);
            setTeams(teams.filter(t => t._id !== teamId));
        } catch (e) {
            alert("Lỗi khi xóa đội!");
        }
    };

    if (isLoading) return <div className="tv-loading">Đang tải danh sách đội...</div>;

    const confirmedTeams = teams.filter(t => t.isPaid);
    const pendingTeams = teams.filter(t => !t.isPaid);

    const TeamCard = ({ t, isConfirmed }) => (
        <div className="tv-team-card">
            <div className="tv-team-avatar">
                {(t.name || t.teamName || 'T').charAt(0).toUpperCase()}
            </div>
            <div className="tv-team-info">
                <div className="tv-team-name">{t.name || t.teamName}</div>
                <div className="tv-team-meta">{t.sportCategory || t.sportType || 'Chưa phân môn'} | {t.memberCount || 0} thành viên</div>
                <div className="tv-team-actions">
                    <button onClick={() => handleDeleteTeam(t._id)} className="tv-delete-btn">Xóa</button>
                </div>
            </div>
            {isConfirmed ? (
                <button 
                    onClick={() => handleUnapproveTeam(t._id)}
                    className="tv-btn-confirmed">
                    ĐÃ DUYỆT
                </button>
            ) : (
                <button 
                    onClick={() => handleApproveTeam(t._id)}
                    className="tv-btn-pending">
                    DUYỆT ĐỘI
                </button>
            )}
        </div>
    );

    return (
        <div className="tv-container">
            <style>{`
                .tv-container {
                    padding: 20px;
                    background: #fcfcfc;
                    min-height: 100vh;
                    font-family: 'Be Vietnam Pro', sans-serif;
                    animation: tvFadeIn 0.3s ease-out;
                }

                @keyframes tvFadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 768px) {
                    .tv-container {
                        padding: 16px;
                    }
                }

                @media (max-width: 640px) {
                    .tv-container {
                        padding: 12px;
                    }
                }

                .tv-loading {
                    color: #018ABE;
                    font-weight: 800;
                    padding: 40px;
                    text-align: center;
                    font-size: 14px;
                }

                @media (max-width: 640px) {
                    .tv-loading {
                        padding: 24px;
                        font-size: 12px;
                    }
                }

                /* Import Excel Section */
                .import-excel-container {
                    background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
                    border: 1px solid rgba(1,138,190,0.2);
                    border-radius: 20px;
                    padding: 24px;
                    margin-bottom: 28px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                }

                @media (max-width: 640px) {
                    .import-excel-container {
                        padding: 16px;
                        margin-bottom: 20px;
                    }
                }

                .import-excel-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                    padding-bottom: 12px;
                    border-bottom: 2px solid rgba(1,138,190,0.15);
                    flex-wrap: wrap;
                }

                .import-excel-icon {
                    font-size: 28px;
                }

                .import-excel-title {
                    font-size: 16px;
                    font-weight: 800;
                    color: #02457A;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .import-excel-sub {
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 4px;
                }

                .import-excel-actions {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                    align-items: center;
                    margin-bottom: 20px;
                }

                @media (max-width: 640px) {
                    .import-excel-actions {
                        flex-direction: column;
                        align-items: stretch;
                    }
                }

                .import-excel-dropzone {
                    flex: 1;
                    padding: 20px;
                    background: #F1F5F9;
                    border: 2px dashed #CBD5E1;
                    border-radius: 16px;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.2s;
                }

                .import-excel-dropzone:hover {
                    border-color: #018ABE;
                    background: rgba(1,138,190,0.05);
                }

                .import-excel-dropzone.has-file {
                    border-color: #10b981;
                    background: rgba(16,185,129,0.05);
                }

                .import-excel-dropzone-icon {
                    font-size: 32px;
                    margin-bottom: 8px;
                }

                .import-excel-dropzone-text {
                    font-size: 13px;
                    color: #64748b;
                }

                .import-excel-dropzone-text strong {
                    color: #018ABE;
                }

                .import-excel-file-input {
                    display: none;
                }

                .import-excel-file-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    background: #F1F5F9;
                    border-radius: 12px;
                    margin-top: 12px;
                    flex-wrap: wrap;
                }

                .import-excel-file-name {
                    flex: 1;
                    font-size: 13px;
                    font-weight: 500;
                    color: #02457A;
                    word-break: break-all;
                }

                .import-excel-remove-btn {
                    background: none;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    font-size: 18px;
                    padding: 4px 8px;
                }

                .import-excel-btn {
                    padding: 12px 28px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }

                .import-excel-btn-primary {
                    background: #018ABE;
                    color: #fff;
                    box-shadow: 0 2px 4px rgba(1,138,190,0.2);
                }

                .import-excel-btn-primary:hover:not(:disabled) {
                    background: #02457A;
                    transform: translateY(-1px);
                }

                .import-excel-btn-secondary {
                    background: #fff;
                    color: #018ABE;
                    border: 1px solid #018ABE;
                }

                .import-excel-btn-secondary:hover {
                    background: rgba(1,138,190,0.05);
                }

                .import-excel-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .import-excel-message {
                    margin-top: 16px;
                    padding: 14px 16px;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .import-excel-message-success {
                    background: rgba(16,185,129,0.1);
                    color: #10b981;
                    border: 1px solid rgba(16,185,129,0.2);
                }

                .import-excel-message-error {
                    background: rgba(239,68,68,0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239,68,68,0.2);
                }

                .import-excel-features {
                    display: flex;
                    gap: 20px;
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid #e2e8f0;
                    font-size: 11px;
                    color: #94a3b8;
                    flex-wrap: wrap;
                }

                .import-excel-feature {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                /* Team Section */
                .tv-section {
                    border-radius: 20px;
                    padding: 20px;
                    margin-bottom: 24px;
                    background: #fff;
                }

                @media (max-width: 640px) {
                    .tv-section {
                        padding: 16px;
                        margin-bottom: 16px;
                        border-radius: 16px;
                    }
                }

                .tv-section-confirmed {
                    border: 1px solid rgba(1,138,190,0.15);
                }

                .tv-section-pending {
                    border: 1px solid rgba(100,116,139,0.12);
                }

                .tv-section-title {
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    margin-bottom: 18px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .tv-section-title::before {
                    content: "";
                    width: 4px;
                    height: 14px;
                    background: #018ABE;
                    border-radius: 4px;
                }

                .tv-section-title-confirmed {
                    color: #018ABE;
                }

                .tv-section-title-pending::before {
                    background: #64748b;
                }

                .tv-section-title-pending {
                    color: #64748b;
                }

                .tv-count-badge {
                    background: #F1F5F9;
                    padding: 2px 10px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #018ABE;
                    margin-left: 8px;
                }

                .tv-count-badge-pending {
                    color: #64748b;
                }

                .tv-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                }

                @media (max-width: 768px) {
                    .tv-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                }

                .tv-team-card {
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    background: #F8FAFC;
                    border: 1px solid #EEF6FB;
                    border-radius: 16px;
                    transition: all 0.2s ease;
                }

                @media (max-width: 640px) {
                    .tv-team-card {
                        flex-wrap: wrap;
                        gap: 12px;
                    }
                }

                .tv-team-card:hover {
                    border-color: rgba(1,138,190,0.3);
                    box-shadow: 0 4px 12px rgba(1,138,190,0.08);
                }

                .tv-team-avatar {
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(1,138,190,0.12);
                    color: #018ABE;
                    font-weight: 800;
                    font-size: 20px;
                    border-radius: 50%;
                    margin-right: 16px;
                    flex-shrink: 0;
                }

                @media (max-width: 640px) {
                    .tv-team-avatar {
                        width: 44px;
                        height: 44px;
                        font-size: 18px;
                    }
                }

                .tv-team-info {
                    flex: 1;
                }

                .tv-team-name {
                    font-weight: 800;
                    color: #02457A;
                    font-size: 16px;
                    margin-bottom: 4px;
                    word-break: break-word;
                }

                @media (max-width: 640px) {
                    .tv-team-name {
                        font-size: 14px;
                    }
                }

                .tv-team-meta {
                    font-size: 11px;
                    color: #64748b;
                    font-weight: 500;
                }

                @media (max-width: 640px) {
                    .tv-team-meta {
                        font-size: 10px;
                    }
                }

                .tv-team-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 6px;
                }

                .tv-delete-btn {
                    background: transparent;
                    border: none;
                    color: #ef4444;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    padding: 0;
                    transition: opacity 0.2s;
                }

                .tv-delete-btn:hover {
                    opacity: 0.7;
                    text-decoration: underline;
                }

                @media (max-width: 640px) {
                    .tv-delete-btn {
                        font-size: 11px;
                    }
                }

                .tv-btn-confirmed {
                    padding: 8px 18px;
                    border-radius: 12px;
                    font-weight: 800;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: 1.5px solid #10b981;
                    background: rgba(16,185,129,0.1);
                    color: #10b981;
                    cursor: pointer;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                @media (max-width: 640px) {
                    .tv-btn-confirmed, .tv-btn-pending {
                        padding: 8px 14px;
                        font-size: 10px;
                    }
                }

                .tv-btn-confirmed:hover {
                    background: rgba(16,185,129,0.2);
                    border-color: #059669;
                }

                .tv-btn-pending {
                    padding: 8px 18px;
                    border-radius: 12px;
                    font-weight: 800;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: 1.5px solid #eab308;
                    background: rgba(234,179,8,0.1);
                    color: #eab308;
                    cursor: pointer;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .tv-btn-pending:hover {
                    background: rgba(234,179,8,0.2);
                    border-color: #ca8a04;
                }

                .tv-empty {
                    color: #94a3b8;
                    font-style: italic;
                    font-size: 13px;
                    padding: 24px;
                    text-align: center;
                    background: #F8FAFC;
                    border-radius: 16px;
                    border: 1px dashed #CBD5E1;
                }

                @media (max-width: 640px) {
                    .tv-empty {
                        padding: 16px;
                        font-size: 12px;
                    }
                }
            `}</style>

            {/* Import Excel Section */}
            <div className="import-excel-container">
                <div className="import-excel-header">
                    <span className="import-excel-icon">📊</span>
                    <div>
                        <div className="import-excel-title">IMPORT DANH SÁCH ĐỘI TỪ EXCEL</div>
                        <div className="import-excel-sub">Nhập nhiều đội cùng lúc bằng file Excel chuẩn</div>
                    </div>
                </div>

                <div className="import-excel-actions">
                    <label 
                        className={`import-excel-dropzone ${file ? 'has-file' : ''}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const droppedFile = e.dataTransfer.files[0];
                            if (droppedFile && (droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || droppedFile.type === 'application/vnd.ms-excel')) {
                                setFile(droppedFile);
                                setImportMessage(null);
                            } else {
                                setImportMessage({ type: 'error', text: 'Vui lòng chọn file Excel!' });
                            }
                        }}
                    >
                        <div className="import-excel-dropzone-icon">📁</div>
                        <div className="import-excel-dropzone-text">
                            <strong>Nhấp để chọn file Excel</strong> hoặc kéo thả file vào đây
                        </div>
                        <input
                            id="excel-file-input"
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            className="import-excel-file-input"
                        />
                    </label>

                    <button 
                        onClick={downloadTemplate}
                        className="import-excel-btn import-excel-btn-secondary"
                    >
                        📥 Tải file mẫu
                    </button>

                    <button 
                        onClick={handleImportExcel} 
                        disabled={!file || uploading}
                        className="import-excel-btn import-excel-btn-primary"
                    >
                        {uploading ? '⏳ Đang xử lý...' : '🚀 Import dữ liệu'}
                    </button>
                </div>

                {file && (
                    <div className="import-excel-file-info">
                        <span>📄</span>
                        <span className="import-excel-file-name">{file.name}</span>
                        <button 
                            onClick={() => {
                                setFile(null);
                                const fileInput = document.getElementById('excel-file-input');
                                if (fileInput) fileInput.value = '';
                            }}
                            className="import-excel-remove-btn"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {importMessage && (
                    <div className={`import-excel-message import-excel-message-${importMessage.type}`}>
                        <span>{importMessage.type === 'success' ? '✅' : '❌'}</span>
                        <span>{importMessage.text}</span>
                    </div>
                )}

                <div className="import-excel-features">
                    <div className="import-excel-feature">📋 Hỗ trợ import: Đội, Cầu thủ, Người dùng</div>
                    <div className="import-excel-feature">🔍 Tự động validate dữ liệu</div>
                    <div className="import-excel-feature">⚡ Xử lý hàng loạt nhanh chóng</div>
                </div>
            </div>
            
            {/* Teams Section */}
            <div className="tv-section tv-section-confirmed">
                <div className="tv-section-title tv-section-title-confirmed">
                    Đội đã duyệt
                    <span className="tv-count-badge">{confirmedTeams.length}</span>
                </div>
                <div className="tv-grid">
                    {confirmedTeams.map(t => <TeamCard key={t._id} t={t} isConfirmed={true} />)}
                    {confirmedTeams.length === 0 && <div className="tv-empty">Chưa có đội nào được duyệt.</div>}
                </div>
            </div>

            <div className="tv-section tv-section-pending">
                <div className="tv-section-title tv-section-title-pending">
                    Chờ duyệt
                    <span className="tv-count-badge tv-count-badge-pending">{pendingTeams.length}</span>
                </div>
                <div className="tv-grid">
                    {pendingTeams.map(t => <TeamCard key={t._id} t={t} isConfirmed={false} />)}
                    {pendingTeams.length === 0 && <div className="tv-empty">Không có đội chờ duyệt.</div>}
                </div>
            </div>
        </div>
    );
};

export default TeamView;