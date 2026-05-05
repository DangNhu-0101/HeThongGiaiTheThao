import React, { useState, useEffect } from 'react';
import api from '../../../api/axiosConfig';
import RuleFormModal from '../components/RuleFormModal';

const RulesLibraryView = () => {
    const [rules, setRules] = useState([]);
    const [showModal, setShowModal] = useState(null); // 'create' hoặc 'edit'
    const [selectedRule, setSelectedRule] = useState(null);

    const fetchRules = async () => {
        try {
            const res = await api.get('rules/all');
            setRules(res.data.data || []);
        } catch (e) { console.error("Lỗi fetch luật"); }
    };

    useEffect(() => { fetchRules(); }, []);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Xóa bộ luật [${name}]? Các giải đấu đang dùng luật này có thể bị ảnh hưởng!`)) return;
        try {
            await api.delete(`rules/${id}`);
            fetchRules();
        } catch (e) { alert("Lỗi khi xóa"); }
    };

    const handleEdit = (rule) => {
        setSelectedRule(rule);
        setShowModal('edit');
    };

    return (
        <div className="rules-library">
            <div className="flex-between" style={{ marginBottom: '30px' }}>
                <div>
                    <h2 className="text-forest">📜 KHO THƯ VIỆN LUẬT</h2>
                    <p className="text-muted">Quản lý các bộ quy tắc thi đấu mẫu cho hệ thống.</p>
                </div>
                <button className="create-tour-btn" style={{ width: 'auto', padding: '12px 30px' }} 
                    onClick={() => { setSelectedRule(null); setShowModal('create'); }}>
                    + TẠO LUẬT MẪU MỚI
                </button>
            </div>

            <div className="modern-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}>
                {rules.map(r => (
                    <div key={r._id} className="modern-card shadow-hover" style={{ borderTop: '8px solid var(--teal-accent)' }}>
                        <div className="flex-between">
                            <span className="admin-badge primary">{r.sportType}</span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                                <button onClick={() => handleDelete(r._id, r.ruleName)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                            </div>
                        </div>
                        <h3 className="text-forest" style={{ margin: '15px 0 5px' }}>{r.ruleName}</h3>
                        <p style={{ fontSize: '0.8rem', color: '#666' }}>{r.description || "Luật thi đấu tiêu chuẩn."}</p>
                        
                        <div style={{ marginTop: '20px', padding: '15px', background: 'var(--neutral-cream)', borderRadius: '12px', fontSize: '0.85rem' }}>
                            <div className="flex-between"><span>Hình thức:</span> <b>{r.participantType}</b></div>
                            <div className="flex-between"><span>Lệ phí:</span> <b>{r.economics?.entryFee?.toLocaleString()} VND</b></div>
                            <div className="flex-between"><span>Điểm thắng:</span> <b>+{r.scoringSystem?.winPoints} Pts</b></div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <RuleFormModal 
                    mode={showModal} 
                    initialData={selectedRule} 
                    onClose={() => setShowModal(null)} 
                    onSuccess={() => { fetchRules(); setShowModal(null); }} 
                />
            )}
        </div>
    );
};

export default RulesLibraryView;