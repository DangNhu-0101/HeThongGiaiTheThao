// services/importDataService.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/users.js';
import Player from '../models/players.js';
import Tournament from '../models/tournaments.js';
import Team from '../models/teams.js';
import Group from '../models/groups.js';
import Court from '../models/courts.js';
import Match from '../models/matches.js';
import Member from '../models/membersOfTeam.js';


// Helper tìm tournamentId theo tên
async function getTournamentIdByName(name, session) {
    const tournament = await Tournament.findOne({ name: name }).session(session);
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


// 1. Import Người dùng + Cầu thủ (gộp)
export const importUsersWithPlayers = async (rows, session) => {
    const created = [];
    for (const row of rows) {
         for (const row of rows) {
        // Kiểm tra password
        if (!row.hashedPassword || row.hashedPassword.toString().trim() === '') {
            throw new Error(`User ${row.username}: hashedPassword không được để trống`);
        }}
        // Tạo User
        const hashed = await bcrypt.hash(row.hashedPassword, 10);
        const [user] = await User.create([{
            username: row.username,
            email: row.email,
            phoneNumber: row.phoneNumber,
            hashedPassword: hashed,
            role: row.role,
            status: row.status || 'active'
        }], { session });
        created.push(user);


       // Nếu role là player, tạo Player tương ứng
if (row.role === 'player') {
    let birthDate = null;
    if (row.birthDate) {
        // Nếu là số serial của Excel (ví dụ: 36892)
        const num = parseFloat(row.birthDate);
        if (!isNaN(num) && num > 30000 && num < 50000) {
            // Chuyển từ Excel serial date sang Date
            birthDate = new Date((num - 25569) * 86400 * 1000);
        } else {
            birthDate = new Date(row.birthDate);
        }
        // Kiểm tra hợp lệ
        if (isNaN(birthDate.getTime())) {
            birthDate = null;
        }
    }
    
    await Player.create([{
        userId: user._id,
        name: row.name,
        birthDate: birthDate,
        gender: row.gender || null,
        skillLevel: parseFloat(row.skillLevel) || 3.0
    }], { session });
}
    }
    return created;
};


// 3. Import Đội
export const importTeams = async (rows, session) => {
    const created = [];
    for (const row of rows) {
        const tournamentId = await getTournamentIdByName(row.tournamentName, session);
        const ownerId = await getUserIdByUsername(row.ownerUsername, session);

        // Tạo team
        const [team] = await Team.create([{
            name: row.name,                          // DÙNG name
            tournamentId,
            sportCategory: row.sportType,            
            createdBy: ownerId,
            ownerId: ownerId,                        
            status: 'pending',                       // SỬA: 'pending' thay vì 'active'
            isPaid: false
        }], { session });

        // Tạo member cho chủ đội (Captain)
        await Member.create([{
            teamId: team._id,
            userId: ownerId,
            role: 'Captain',
            status: 'active',
            joinedAt: new Date()
        }], { session });

        // Xử lý danh sách thành viên (members)
        if (row.members) {
            const memberUsernames = row.members.split(/[,\n]+/).map(s => s.trim()).filter(s => s);
            for (const username of memberUsernames) {
                const userId = await getUserIdByUsername(username, session);
                if (userId.toString() !== ownerId.toString()) {
                    await Member.create([{
                        teamId: team._id,
                        userId,
                        role: 'Member',
                        status: 'active',
                        joinedAt: new Date()
                    }], { session });
                }
            }
        }

        created.push(team);
    }
    return created;
};






// 4. Import Bảng
export const importGroups = async (rows, session) => {
    const created = [];
    for (const row of rows) {
        const tournamentId = await getTournamentIdByName(row.tournamentName, session);
        const teamNames = row.teamNames ? row.teamNames.split(/[,\n]+/).map(s => s.trim()).filter(s => s) : [];
        const teamIds = [];
        for (const tn of teamNames) {
            const tid = await getTeamIdByName(tn, tournamentId, session);
            teamIds.push(tid);
        }
        const [group] = await Group.create([{
            name: row.name,
            tournamentId,
            sport: row.sport,
            teamInGroup: teamIds,
            standings: teamIds.map(tid => ({ teamId: tid, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 })),
            status: row.status || 'pending'
        }], { session });
        created.push(group);
    }
    return created;
};




// 6. Import Trận đấu
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
        const [match] = await Match.create([{
            tournamentId,
            groupId,
            round: parseInt(row.round) || 1,
            matchNumber: parseInt(row.matchNumber) || 1,
            matchType: groupId ? 'group' : 'knockout',
            sportType: row.sportType || '',
            ruleId: null,
            team1: team1Id,
            team2: team2Id,
            scheduledStartTime: new Date(row.scheduledStartTime),
            courtName: row.courtName || '',
            status: row.status || 'SCHEDULED'
        }], { session });
        created.push(match);
    }
    return created;
};



