
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/users.js';
import Tournament from '../models/tournaments.js';
import Team from '../models/teams.js';
import Player from '../models/players.js';
import Group from '../models/groups.js';
import Match from '../models/matches.js';
import Court from '../models/courts.js';


// Helper tìm tournamentId theo tên
async function getTournamentIdByName(name, session) {
    const tournament = await Tournament.findOne({ displayName: name }).session(session);
    if (!tournament) throw new Error(`Không tìm thấy giải đấu: ${name}`);
    return tournament._id;
}


// Helper tìm userId theo username
async function getUserIdByUsername(username, session) {
    const user = await User.findOne({ username }).session(session);
    if (!user) throw new Error(`Không tìm thấy người dùng: ${username}`);
    return user._id;
}


// Helper tìm teamId theo tên đội và tournament
async function getTeamIdByName(name, tournamentId, session) {
    const team = await Team.findOne({ name, tournamentId }).session(session);
    if (!team) throw new Error(`Không tìm thấy đội: ${name} trong giải`);
    return team._id;
}


export const importUsers = async (rows, session) => {
    const created = [];
    for (const row of rows) {
        const hashed = await bcrypt.hash(row.password, 10);
        const user = await User.create([{
            username: row.username,
            email: row.email,
            phoneNumber: row.phoneNumber,
            password: hashed,
            role: row.role,
            status: row.status || 'active'
        }], { session });
        created.push(user[0]);
    }
    return created;
};


export const importTournaments = async (rows, session) => {
    const created = [];
    for (const row of rows) {
        const tournament = await Tournament.create([{
            displayName: row.name,
            description: row.description || '',
            sport: row.sport,
            venue: row.venue,
            timeLine: { timeOpen: new Date(row.timeOpen), timeClose: row.timeClose ? new Date(row.timeClose) : null },
            location: row.location || '',
            status: 'upcoming'
        }], { session });
        created.push(tournament[0]);
    }
    return created;
};


export const importTeams = async (rows, session) => {
    const created = [];
    for (const row of rows) {
        const tournamentId = await getTournamentIdByName(row.tournamentName, session);
        const ownerId = await getUserIdByUsername(row.ownerUsername, session);
        const team = await Team.create([{
            name: row.name,
            tournamentId,
            sportType: row.sportType,
            categoryId: row.categoryId,
            createdBy: ownerId,
            status: row.status || 'pending'
        }], { session });
        created.push(team[0]);
    }
    return created;
};


export const importPlayers = async (rows, session) => {
    const created = [];
    for (const row of rows) {
        const userId = await getUserIdByUsername(row.username, session);
        const player = await Player.create([{
            userId,
            name: row.displayName,
            birthYear: parseInt(row.birthYear),
            gender: row.gender,
            skillLevel: parseFloat(row.skillLevel) || 3.0
        }], { session });
        created.push(player[0]);
    }
    return created;
};


export const importGroups = async (rows, session) => {
    const created = [];
    for (const row of rows) {
        const tournamentId = await getTournamentIdByName(row.tournamentName, session);
        // teamNames: chuỗi tên đội cách nhau bằng dấu phẩy hoặc xuống dòng
        const teamNames = row.teamNames ? row.teamNames.split(/[,\n]+/).map(s => s.trim()) : [];
        const teamIds = [];
        for (const tn of teamNames) {
            if (tn) {
                const tid = await getTeamIdByName(tn, tournamentId, session);
                teamIds.push(tid);
            }
        }
        const group = await Group.create([{
            name: row.name,
            tournamentId,
            sport: row.sport,
            teamInGroup: teamIds,
            standings: teamIds.map(tid => ({ teamId: tid, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 })),
            status: row.status || 'pending'
        }], { session });
        created.push(group[0]);
    }
    return created;
};


export const importCourts = async (rows, session) => {
    const created = [];
    for (const row of rows) {
        const tournamentId = await getTournamentIdByName(row.tournamentName, session);
        const sports = row.sportTypes ? row.sportTypes.split(/[,\n]+/).map(s => s.trim()) : [];
        const court = await Court.create([{
            name: row.name,
            tournamentId,
            sportTypes: sports,
            location: row.location || '',
            status: row.status || 'empty'
        }], { session });
        created.push(court[0]);
    }
    return created;
};


export const importMatches = async (rows, session) => {
    const created = [];
    for (const row of rows) {
        const tournamentId = await getTournamentIdByName(row.tournamentName, session);
        const team1Id = await getTeamIdByName(row.team1Name, tournamentId, session);
        const team2Id = await getTeamIdByName(row.team2Name, tournamentId, session);
        let groupId = null;
        if (row.groupName) {
            const group = await Group.findOne({ name: row.groupName, tournamentId }).session(session);
            if (!group) throw new Error(`Không tìm thấy bảng: ${row.groupName}`);
            groupId = group._id;
        }
        const match = await Match.create([{
            tournamentId,
            groupId,
            round: parseInt(row.round) || 1,
            matchNumber: parseInt(row.matchNumber) || 1,
            matchType: groupId ? 'group' : 'knockout',
            sportType: row.sportType || '',
            ruleId: null, // có thể để trống hoặc tìm rule
            team1: team1Id,
            team2: team2Id,
            scheduledStartTime: new Date(row.scheduledStartTime),
            courtName: row.courtName || '',
            status: row.status || 'SCHEDULED'
        }], { session });
        created.push(match[0]);
    }
    return created;
};



