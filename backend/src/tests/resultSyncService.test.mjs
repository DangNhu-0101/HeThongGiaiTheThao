import assert from 'node:assert/strict';
import test from 'node:test';
import TeamAchievement from '../models/teamAchievements.js';
import PlayerMatchStat from '../models/playerMatchStats.js';
import {
    buildAchievementTargets,
    buildPlayerMatchStatTargets,
} from '../services/resultSyncService.js';

const id = (value) => `0000000000000000000000${value}`.slice(-24);

test('one final branch creates exactly one champion and one runner-up target', () => {
    const targets = buildAchievementTargets({
        tournamentItemId: id(1),
        branchId: id(2),
        branchKey: 'A',
        branchName: 'Nhánh A',
        finalMatchId: id(25),
        finalStageId: id(3),
        championParticipantId: id(7),
        runnerUpParticipantId: id(5),
    });

    assert.equal(targets.length, 2);
    assert.deepEqual(targets.map((item) => item.achievementType).sort(), ['champion', 'runner-up']);
    assert.equal(String(targets.find((item) => item.achievementType === 'champion').participantId), id(7));
    assert.equal(String(targets.find((item) => item.achievementType === 'runner-up').participantId), id(5));
});

test('two final branches create two champions and two runner-ups without merging branches', () => {
    const finals = [
        { finalMatchId: id(25), branchKey: 'A', championParticipantId: id(7), runnerUpParticipantId: id(5) },
        { finalMatchId: id(26), branchKey: 'B', championParticipantId: id(12), runnerUpParticipantId: id(6) },
    ];
    const targets = finals.flatMap((final) => buildAchievementTargets({
        tournamentItemId: id(1),
        branchId: id(2),
        branchName: final.branchKey,
        finalStageId: id(3),
        ...final,
    }));

    assert.equal(targets.filter((item) => item.achievementType === 'champion').length, 2);
    assert.equal(targets.filter((item) => item.achievementType === 'runner-up').length, 2);
    assert.deepEqual(targets.map((item) => `${item.branchKey}:${item.participantId}:${item.achievementType}`), [
        `${'A'}:${id(7)}:champion`,
        `${'A'}:${id(5)}:runner-up`,
        `${'B'}:${id(12)}:champion`,
        `${'B'}:${id(6)}:runner-up`,
    ]);
});

test('same team cannot be champion and runner-up for the same final', () => {
    const targets = buildAchievementTargets({
        tournamentItemId: id(1),
        branchKey: 'A',
        finalMatchId: id(25),
        finalStageId: id(3),
        championParticipantId: id(7),
        runnerUpParticipantId: id(7),
    });

    assert.equal(targets.length, 0);
});

test('achievement model has unique constraints for final/type and branch/team/type', () => {
    const indexes = TeamAchievement.schema.indexes().map(([fields]) => JSON.stringify(fields));
    assert.ok(indexes.includes(JSON.stringify({ tournamentItemId: 1, finalMatchId: 1, achievementType: 1 })));
    assert.ok(indexes.includes(JSON.stringify({ tournamentItemId: 1, branchKey: 1, participantId: 1, achievementType: 1 })));
});

test('player stat targets count win/loss once per player per match', () => {
    const targets = buildPlayerMatchStatTargets({
        match: {
            _id: id(100),
            tournamentItemId: id(1),
            participants: [id(7), id(5)],
            winnerParticipantId: id(7),
        },
        result: { isDraw: false, confirmedAt: new Date('2026-07-17T00:00:00Z') },
        roster: [
            { playerId: id(71), participantId: id(7) },
            { playerId: id(71), participantId: id(7) },
            { playerId: id(51), participantId: id(5) },
        ],
    });

    assert.equal(targets.length, 2);
    assert.equal(targets.find((item) => String(item.playerId) === id(71)).wins, 1);
    assert.equal(targets.find((item) => String(item.playerId) === id(51)).wins, 0);
    assert.equal(targets.find((item) => String(item.playerId) === id(51)).losses, 1);
});

test('changing winner updates result without increasing player target count', () => {
    const base = {
        _id: id(100),
        tournamentItemId: id(1),
        participants: [id(7), id(5)],
    };
    const roster = [
        { playerId: id(71), participantId: id(7) },
        { playerId: id(51), participantId: id(5) },
    ];
    const first = buildPlayerMatchStatTargets({ match: { ...base, winnerParticipantId: id(7) }, roster });
    const changed = buildPlayerMatchStatTargets({ match: { ...base, winnerParticipantId: id(5) }, roster });

    assert.equal(first.length, 2);
    assert.equal(changed.length, 2);
    assert.equal(changed.find((item) => String(item.playerId) === id(71)).result, 'loss');
    assert.equal(changed.find((item) => String(item.playerId) === id(51)).result, 'win');
});

test('player match stat model prevents duplicate counting by player and match', () => {
    const indexes = PlayerMatchStat.schema.indexes().map(([fields]) => JSON.stringify(fields));
    assert.ok(indexes.includes(JSON.stringify({ playerId: 1, matchId: 1 })));
});
