import React from 'react';
import MatchCard from './MatchCard';

const KnockoutBracket = ({ matches, onEdit }) => {
    if (!matches || matches.length === 0) return null;

    const rounds = [...new Set(matches.map(m => m.round))];

    return (
        <div style={{ marginTop: 20 }}>
            <h4 style={{ margin: '0 0 12px' }}>⚔️ Lịch Knock-out ({matches.length} trận)</h4>
            {rounds.map(round => (
                <div key={round} style={{ marginBottom: 16 }}>
                    <h5 style={{ color: '#8b5cf6', margin: '0 0 8px', textTransform: 'uppercase' }}>{round}</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                        {matches.filter(m => m.round === round).map(m => (
                            <MatchCard key={m._id || m.matchNumber} match={m} onEdit={onEdit} variant="knockout" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KnockoutBracket;