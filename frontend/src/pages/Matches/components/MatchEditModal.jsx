import React from 'react';

const MatchEditModal = ({ match, editForm, setEditForm, onSave, onCancel, isProcessing }) => {
    if (!match) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: 24, borderRadius: 16, width: 400, maxWidth: '90%' }}>
                <h3 style={{ margin: '0 0 16px' }}>✏️ Sửa trận {match.matchNumber}</h3>
                
                <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Giờ bắt đầu</label>
                    <input type="datetime-local" style={{ width: '100%', padding: 10, borderRadius: 8, border: '2px solid #e2e8f0' }}
                        value={editForm.scheduledStartTime} 
                        onChange={e => setEditForm({...editForm, scheduledStartTime: e.target.value})} />
                </div>
                
                <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Sân</label>
                    <input type="text" style={{ width: '100%', padding: 10, borderRadius: 8, border: '2px solid #e2e8f0' }}
                        value={editForm.courtName} 
                        onChange={e => setEditForm({...editForm, courtName: e.target.value})} />
                </div>
                
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                    <button onClick={onSave} disabled={isProcessing}
                        style={{ flex: 1, padding: 12, background: '#018ABE', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                        💾 Lưu
                    </button>
                    <button onClick={onCancel}
                        style={{ flex: 1, padding: 12, background: '#e2e8f0', color: '#333', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                        Hủy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MatchEditModal;