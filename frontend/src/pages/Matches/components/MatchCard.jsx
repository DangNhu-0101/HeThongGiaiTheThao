import React from 'react';
const MatchCard = ({ match, onEdit, variant = 'group' }) => {
    const bgColors = {
        group: 'linear-gradient(135deg,#02457A,#018ABE)',
        knockout: 'linear-gradient(135deg,#7c3aed,#8b5cf6)'
    };
    const accentColors = { group: '#14b8a6', knockout: '#fbbf24' };

    const fmt = (d) => d ? new Date(d).toLocaleString('vi-VN', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' }) : '--:--';

    // FIX: team1/team2 có thể là object (đã populate) hoặc string
    const getTeamName = (team) => {
        if (!team) return 'TBD';
        if (typeof team === 'string') return team;
        return team.name || team.teamName || team._id || 'TBD';
    };

    return (
        <div style={{ background: '#D6E7EE', color: '#02457A', padding: 16, borderRadius: 12, position: 'relative' }}>
            <div style={{ fontSize: 11, color: '#A999DC', fontWeight: 700, marginBottom: 4 }}>
                {variant === 'knockout' ? (match.round || match.substageName) : `TRẬN ${match.matchNumber || ''}`}
            </div>
            <div style={{ fontWeight: 700 }}>
                {getTeamName(match.team1)} VS {getTeamName(match.team2)}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                🕐 {fmt(match.scheduledStartTime)} • 🏟️ {match.courtName || match.court || 'Chưa có sân'}
            </div>
            {onEdit && (
                <button onClick={() => onEdit(match)}
                    style={{ position: 'absolute', top: 8, right: 8, background: '#fff', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>
                    ✏️
                </button>
            )}
        </div>
    );
};
export default MatchCard;