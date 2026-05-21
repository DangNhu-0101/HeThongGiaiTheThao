import React from 'react';

const QualifiedTeams = ({ qualifiedTeams }) => {
    if (!qualifiedTeams) return null;

    return (
        <div style={{ marginTop: 20 }}>
            <h4 style={{ margin: '0 0 12px' }}>🏅 Đội đi tiếp</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {Object.entries(qualifiedTeams).map(([branch, teams]) => (
                    <div key={branch} style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                        <div style={{ fontWeight: 700, color: '#018ABE', marginBottom: 8 }}>{branch}</div>
                        {teams.map((t, i) => (
                            <div key={i} style={{ fontSize: 13, padding: '2px 0', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{t.teamName || t.teamId}</span>
                                <span style={{ color: '#14b8a6', fontSize: 11 }}>Hạng {t.rank}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QualifiedTeams;