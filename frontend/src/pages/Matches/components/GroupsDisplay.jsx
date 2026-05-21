import React from 'react';

const GroupsDisplay = ({ groups }) => {
    if (!groups || groups.length === 0) return null;

    return (
        <div style={{ marginTop: 20 }}>
            <h4 style={{ margin: '0 0 12px' }}>📊 Danh sách bảng ({groups.length} bảng)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {groups.map(g => (
                    <div key={g._id} style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 700, color: '#018ABE', marginBottom: 8 }}>{g.name}</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>
                            {g.teamInGroup?.length || 0} đội
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GroupsDisplay;