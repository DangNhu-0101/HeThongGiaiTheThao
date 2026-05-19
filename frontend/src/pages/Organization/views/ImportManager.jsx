// frontend/src/pages/Organization/views/ImportManager.jsx
import React, { useState } from 'react';
import api from '../../../api/axiosConfig';

const ImportManager = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.type === 'application/vnd.ms-excel')) {
            setFile(selectedFile);
            setMessage(null);
        } else {
            setMessage({ type: 'error', text: 'Vui lòng chọn file Excel (.xlsx hoặc .xls)' });
            e.target.value = '';
        }
    };

   const handleImport = async () => {
    if (!file) {
        setMessage({ type: 'error', text: 'Vui lòng chọn file Excel!' });
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    // DEBUG: In ra thông tin
    console.log('=== DEBUG IMPORT ===');
    console.log('File:', file.name, file.size, file.type);
    console.log('API baseURL:', api.defaults.baseURL);
    console.log('Full URL:', api.defaults.baseURL + '/xlsx/import');
    console.log('Token:', localStorage.getItem('token')?.substring(0, 20) + '...');

    setUploading(true);
    setMessage(null);
    
    try {
        const res = await api.post('/xlsx/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        console.log('✅ Response:', res.status, res.data);

        if (res.data.success) {
            setMessage({ 
                type: 'success', 
                text: res.data.message || '✅ Import thành công!' 
            });
            setFile(null);
            const fileInput = document.getElementById('excel-file-input');
            if (fileInput) fileInput.value = '';
        } else {
            setMessage({ type: 'error', text: res.data.message || '❌ Import thất bại!' });
            if (res.data.errors) {
                console.error('Validation errors:', res.data.errors);
            }
        }
    } catch (error) {
    // DEBUG: In chi tiết lỗi
    console.error('=== IMPORT ERROR ===');
    console.error('Status:', error.response?.status);
    console.error('StatusText:', error.response?.statusText);
    console.error('Message:', error.message);
    
    // In chi tiết errors array
    const errors = error.response?.data?.errors;
    console.error('Errors:', errors);
    
    // Log từng lỗi riêng biệt
    if (errors && Array.isArray(errors)) {
        errors.forEach((err, i) => {
            console.error(`❌ Lỗi ${i + 1}:`, JSON.stringify(err, null, 2));
        });
        setMessage({ 
            type: 'error', 
            text: `❌ Import thất bại! Có ${errors.length} lỗi. Mở Console (F12) để xem chi tiết.` 
        });
    } else {
        setMessage({ 
            type: 'error', 
            text: error.response?.data?.message || `❌ Lỗi ${error.response?.status || ''}: ${error.message}` 
        });
    }
} finally {
    setUploading(false);
}
   };
    const downloadTemplate = () => {
    window.open('http://localhost:5001/api/xlsx/template', '_blank');
};

    const importTypes = [
        { id: 'all', name: '📦 Tất cả', desc: 'Import toàn bộ dữ liệu' },
        { id: 'users', name: '👤 Người dùng', desc: 'Import danh sách người dùng' },
        { id: 'tournaments', name: '🏆 Giải đấu', desc: 'Import danh sách giải đấu' },
        { id: 'teams', name: '👥 Đội tuyển', desc: 'Import danh sách đội' },
        { id: 'players', name: '🏃 Cầu thủ', desc: 'Import danh sách cầu thủ' },
        { id: 'groups', name: '📊 Bảng đấu', desc: 'Import cấu hình bảng' },
        { id: 'courts', name: '🏟️ Sân bãi', desc: 'Import danh sách sân' },
        { id: 'matches', name: '⚡ Trận đấu', desc: 'Import lịch thi đấu' }
    ];

    return (
        <div className="import-manager">
            <style>{`
                .import-manager {
                    padding: 24px;
                    max-width: 1200px;
                    margin: 0 auto;
                    min-height: 100vh;
                    background: #f8fafc;
                }
                .import-header {
                    margin-bottom: 32px;
                }
                .import-header h1 {
                    font-size: 28px;
                    color: #02457A;
                    margin-bottom: 8px;
                }
                .import-header p {
                    color: #64748b;
                }
                .import-tabs {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 32px;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 16px;
                }
                .import-tab {
                    padding: 10px 20px;
                    background: #f1f5f9;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .import-tab:hover {
                    background: #e2e8f0;
                }
                .import-tab.active {
                    background: #018ABE;
                    color: white;
                }
                .import-card {
                    background: white;
                    border-radius: 20px;
                    padding: 32px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                    border: 1px solid #e2e8f0;
                }
                .dropzone {
                    border: 2px dashed #cbd5e1;
                    border-radius: 16px;
                    padding: 48px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 24px;
                }
                .dropzone:hover {
                    border-color: #018ABE;
                    background: #f8fafc;
                }
                .dropzone.has-file {
                    border-color: #10b981;
                    background: #f0fdf4;
                }
                .dropzone-icon {
                    font-size: 48px;
                    margin-bottom: 12px;
                }
                .file-info {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: #f1f5f9;
                    border-radius: 12px;
                    margin-bottom: 24px;
                }
                .btn-primary {
                    background: #018ABE;
                    color: white;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.2s;
                }
                .btn-primary:hover:not(:disabled) {
                    background: #02457A;
                }
                .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .btn-secondary {
                    background: #f1f5f9;
                    color: #018ABE;
                    padding: 12px 24px;
                    border: 1px solid #018ABE;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-secondary:hover {
                    background: #e2e8f0;
                }
                .message {
                    margin-top: 16px;
                    padding: 12px 16px;
                    border-radius: 12px;
                }
                .message.success {
                    background: #f0fdf4;
                    color: #10b981;
                    border: 1px solid #bbf7d0;
                }
                .message.error {
                    background: #fef2f2;
                    color: #ef4444;
                    border: 1px solid #fecaca;
                }
                .info-box {
                    margin-top: 24px;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                }
                .info-title {
                    margin-bottom: 12px;
                    color: #02457A;
                    font-size: 16px;
                    font-weight: 700;
                }
                .info-list {
                    color: #64748b;
                    font-size: 14px;
                    line-height: 1.8;
                    padding-left: 20px;
                    margin: 0;
                }
                .info-list li {
                    margin-bottom: 4px;
                }
                @media (max-width: 768px) {
                    .import-manager { padding: 16px; }
                    .import-card { padding: 20px; }
                    .dropzone { padding: 32px; }
                    .import-tab { padding: 8px 16px; font-size: 12px; }
                }
            `}</style>

            <div className="import-header">
                <h1>📥 Quản lý Import dữ liệu</h1>
                <p>Import dữ liệu hàng loạt từ file Excel vào hệ thống</p>
            </div>

            <div className="import-tabs">
                {importTypes.map(type => (
                    <button
                        key={type.id}
                        className={`import-tab ${activeTab === type.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(type.id)}
                    >
                        {type.name}
                    </button>
                ))}
            </div>

            <div className="import-card">
                <div 
                    className={`dropzone ${file ? 'has-file' : ''}`}
                    onClick={() => document.getElementById('excel-file-input').click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const droppedFile = e.dataTransfer.files[0];
                        if (droppedFile && droppedFile.name.match(/\.(xlsx|xls)$/)) {
                            setFile(droppedFile);
                            setMessage(null);
                        } else {
                            setMessage({ type: 'error', text: 'Vui lòng chọn file Excel!' });
                        }
                    }}
                >
                    <div className="dropzone-icon">📁</div>
                    <div><strong>Nhấp để chọn file Excel</strong> hoặc kéo thả</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                        Hỗ trợ: .xlsx, .xls
                    </div>
                    <input
                        id="excel-file-input"
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>

                {file && (
                    <div className="file-info">
                        <span>📄 {file.name}</span>
                        <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" onClick={downloadTemplate}>
                        📥 Tải file mẫu
                    </button>
                </div>

                <button className="btn-primary" onClick={handleImport} disabled={!file || uploading}>
                    {uploading ? '⏳ Đang xử lý...' : '🚀 Import dữ liệu'}
                </button>

                {message && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}
            </div>

            <div className="info-box">
                <h3 className="info-title">📌 Lưu ý khi import:</h3>
                <ul className="info-list">
                    <li>Thứ tự import quan trọng: Người dùng → Giải đấu → Đội → Cầu thủ → Bảng → Sân → Trận đấu</li>
                    <li>Các trường có dấu * là bắt buộc phải nhập</li>
                    <li>Tên giải đấu, tên đội, username phải tồn tại trong hệ thống (hoặc được import trước)</li>
                    <li>Định dạng ngày: YYYY-MM-DD hoặc YYYY-MM-DD HH:MM</li>
                    <li>Sau khi import thành công, dữ liệu sẽ được cập nhật ngay vào hệ thống</li>
                </ul>
            </div>
        </div>
    );
};

export default ImportManager;