// frontend/src/components/ImportTeams.jsx
import React, { useState, useRef } from 'react';
import api from '../api/axiosConfig';

const ImportTeams = ({ tournamentId, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState([]);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    // Template mẫu
    const sampleData = [
        {
            name: "Vũng Tàu 1",
            sportCategory: "MD",
            ownerEmail: "captain1@gmail.com"
        },
        {
            name: "TP HCM 2",
            sportCategory: "XD",
            ownerEmail: "captain2@gmail.com"
        },
        {
            name: "Hà Nội 3",
            sportCategory: "MS",
            ownerEmail: "captain3@gmail.com"
        }
    ];

    // Tải file mẫu
    const handleDownloadSample = () => {
        const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mau_import_doi.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Xử lý khi upload file
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (!Array.isArray(data)) {
                    alert('File JSON phải chứa mảng các đội!');
                    return;
                }
                
                // Validate cấu trúc
                const valid = data.every(team => team.name && team.sportCategory);
                if (!valid) {
                    alert('Mỗi đội cần có ít nhất "name" và "sportCategory"!');
                    return;
                }
                
                setPreview(data);
                setImportResult(null);
            } catch (err) {
                alert('File không phải JSON hợp lệ! ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    // Import
    const handleImport = async () => {
        if (preview.length === 0) return alert("Vui lòng chọn file hợp lệ!");
        
        setLoading(true);
        setImportResult(null);
        try {
            const res = await api.post('/teams/import-teams', {
                tournamentId,
                teams: preview
            });
            
            setImportResult(res.data);
            if (res.data.data?.success?.length > 0) {
                setPreview([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            setImportResult({
                success: false,
                message: err.response?.data?.message || "Lỗi khi import",
                data: { success: [], errors: [{ name: 'Lỗi', error: err.message }] }
            });
        } finally {
            setLoading(false);
        }
    };

    // Xóa preview
    const handleClear = () => {
        setPreview([]);
        setImportResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <>
            <style>{`
                /* IMPORT TEAMS STYLES - inspired by TournamentModal & Sidebar */
                
                .it-container {
                    background: #fff;
                    border: 1px solid rgba(1,138,190,0.12);
                    border-radius: 20px;
                    padding: 20px;
                    margin-bottom: 20px;
                    font-family: 'Be Vietnam Pro', sans-serif;
                }

                .it-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .it-title {
                    font-size: 11px;
                    font-weight: 800;
                    color: #018ABE;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 0;
                }

                .it-title::before {
                    content: "";
                    width: 4px;
                    height: 14px;
                    background: #018ABE;
                    border-radius: 4px;
                }

                .it-sample-btn {
                    background: transparent;
                    border: 1.5px solid #E2E8F0;
                    border-radius: 12px;
                    padding: 6px 14px;
                    font-size: 10px;
                    font-weight: 700;
                    color: #018ABE;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 0.5px;
                }

                .it-sample-btn:hover {
                    background: rgba(1,138,190,0.05);
                    border-color: #018ABE;
                }

                .it-description {
                    font-size: 11px;
                    color: #64748b;
                    margin-bottom: 18px;
                    line-height: 1.5;
                }

                .it-upload-area {
                    border: 2px dashed #CBD5E1;
                    border-radius: 16px;
                    padding: 28px 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: #F8FAFC;
                    margin-bottom: 16px;
                }

                .it-upload-area:hover {
                    border-color: #018ABE;
                    background: rgba(1,138,190,0.02);
                }

                .it-upload-icon {
                    font-size: 32px;
                    margin-bottom: 8px;
                }

                .it-upload-title {
                    font-weight: 700;
                    color: #1e293b;
                    font-size: 13px;
                    margin-bottom: 4px;
                }

                .it-upload-sub {
                    font-size: 10px;
                    color: #94a3b8;
                }

                .it-upload-success {
                    color: #10b981;
                }

                .it-upload-success .it-upload-title {
                    color: #10b981;
                }

                .it-actions {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .it-import-btn {
                    flex: 1;
                    background: #018ABE;
                    border: none;
                    border-radius: 14px;
                    padding: 12px;
                    font-weight: 800;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .it-import-btn:hover:not(:disabled) {
                    background: #02457A;
                    transform: translateY(-1px);
                }

                .it-import-btn:disabled {
                    background: #CBD5E1;
                    cursor: not-allowed;
                    color: #94a3b8;
                }

                .it-clear-btn {
                    background: #F1F5F9;
                    border: 1.5px solid #E2E8F0;
                    border-radius: 14px;
                    padding: 12px 20px;
                    font-weight: 700;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .it-clear-btn:hover {
                    background: #E2E8F0;
                    color: #475569;
                }

                .it-preview {
                    background: #F8FAFC;
                    border-radius: 16px;
                    padding: 14px;
                    max-height: 200px;
                    overflow-y: auto;
                    margin-bottom: 16px;
                    border: 1px solid #EEF6FB;
                }

                .it-preview-title {
                    font-size: 10px;
                    font-weight: 800;
                    color: #018ABE;
                    letter-spacing: 1px;
                    margin-bottom: 10px;
                }

                .it-preview-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .it-preview-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #E2E8F0;
                    font-size: 11px;
                }

                .it-preview-item:last-child {
                    border-bottom: none;
                }

                .it-preview-name {
                    color: #1e293b;
                    font-weight: 600;
                }

                .it-preview-category {
                    color: #018ABE;
                    font-weight: 500;
                    margin-left: 8px;
                }

                .it-preview-email {
                    color: #94a3b8;
                    font-size: 10px;
                }

                .it-result {
                    border-radius: 14px;
                    padding: 14px;
                }

                .it-result-warning {
                    background: rgba(234,179,8,0.08);
                    border: 1px solid rgba(234,179,8,0.25);
                }

                .it-result-success {
                    background: rgba(16,185,129,0.06);
                    border: 1px solid rgba(16,185,129,0.2);
                }

                .it-result-message {
                    font-size: 12px;
                    font-weight: 700;
                    margin-bottom: 10px;
                }

                .it-result-message-warning {
                    color: #eab308;
                }

                .it-result-message-success {
                    color: #10b981;
                }

                .it-result-success-list {
                    font-size: 10px;
                    color: #10b981;
                    margin-bottom: 10px;
                }

                .it-result-error-title {
                    font-weight: 700;
                    margin-bottom: 6px;
                }

                .it-result-error-item {
                    font-size: 10px;
                    color: #ef4444;
                    margin-bottom: 4px;
                }

                .it-hidden-input {
                    display: none;
                }
            `}</style>

            <div className="it-container">
                <div className="it-header">
                    <h3 className="it-title">Import đội từ file JSON</h3>
                    <button
                        onClick={handleDownloadSample}
                        className="it-sample-btn"
                    >
                        Tải file mẫu
                    </button>
                </div>

                <p className="it-description">
                    Định dạng mỗi đội: {"{"}"name": "Tên đội", "sportCategory": "MS/MD/WS/WD/XD", "ownerEmail": "email@gmail.com"{"}"}
                </p>

                {/* KHU VỰC UPLOAD */}
                <div
                    className="it-upload-area"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="it-hidden-input"
                    />
                    
                    {preview.length === 0 ? (
                        <div>
                            <div className="it-upload-icon">📁</div>
                            <p className="it-upload-title">Nhấp để chọn file JSON</p>
                            <p className="it-upload-sub">hoặc kéo thả file vào đây</p>
                        </div>
                    ) : (
                        <div className="it-upload-success">
                            <div className="it-upload-icon">✅</div>
                            <p className="it-upload-title">{preview.length} đội đã sẵn sàng</p>
                            <p className="it-upload-sub">Nhấp để chọn file khác</p>
                        </div>
                    )}
                </div>

                {/* NÚT HÀNH ĐỘNG */}
                {preview.length > 0 && (
                    <div className="it-actions">
                        <button 
                            onClick={handleImport} 
                            disabled={loading}
                            className="it-import-btn"
                        >
                            {loading ? "Đang import..." : `Import ${preview.length} đội`}
                        </button>
                        <button 
                            onClick={handleClear}
                            className="it-clear-btn"
                        >
                            Hủy
                        </button>
                    </div>
                )}

                {/* PREVIEW */}
                {preview.length > 0 && (
                    <div className="it-preview">
                        <p className="it-preview-title">Danh sách ({preview.length} đội):</p>
                        <div className="it-preview-list">
                            {preview.map((team, idx) => (
                                <div key={idx} className="it-preview-item">
                                    <span>
                                        <span style={{ color: '#018ABE', fontWeight: 600 }}>{idx + 1}.</span>
                                        <span className="it-preview-name"> {team.name}</span>
                                        <span className="it-preview-category">- {team.sportCategory}</span>
                                    </span>
                                    <span className="it-preview-email">{team.ownerEmail || 'Không có email'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* KẾT QUẢ IMPORT */}
                {importResult && (
                    <div className={`it-result ${importResult.data?.errors?.length > 0 ? 'it-result-warning' : 'it-result-success'}`}>
                        <p className={`it-result-message ${importResult.data?.errors?.length > 0 ? 'it-result-message-warning' : 'it-result-message-success'}`}>
                            {importResult.data?.errors?.length > 0 ? '⚠' : '✓'} {importResult.message}
                        </p>
                        
                        {importResult.data?.success?.length > 0 && (
                            <div className="it-result-success-list">
                                ✓ Thành công: {importResult.data.success.map(t => t.name).join(', ')}
                            </div>
                        )}
                        
                        {importResult.data?.errors?.length > 0 && (
                            <div>
                                <p className="it-result-error-title">Lỗi:</p>
                                {importResult.data.errors.map((err, i) => (
                                    <p key={i} className="it-result-error-item">• {err.name}: {err.error}</p>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default ImportTeams;