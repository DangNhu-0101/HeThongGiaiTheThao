



import mongoose from 'mongoose';
import { parseExcelFile } from '../utils/ExcelHelper.js';
import {
    importUsersWithPlayers, importTeams,
    importGroups, importMatches
} from '../services/ImportDataService.js';
import exceljs from 'exceljs';
import User from '../models/users.js';
import Player from '../models/players.js';
import Tournament from '../models/tournaments.js';
import Team from '../models/teams.js';
import Member from '../models/membersOfTeam.js';
import Group from '../models/groups.js';
import Court from '../models/courts.js';
import Match from '../models/matches.js';




export const importExcel = async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng upload file Excel' });




    const parseResult = await parseExcelFile(req.file.path);
    if (!parseResult.success) {
        return res.status(400).json({ success: false, errors: parseResult.summary.errors });
    }




    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const data = parseResult.data;
        if (data['Người dùng']?.validRows.length)
            await importUsersWithPlayers(data['Người dùng'].validRows, session);
        if (data['Đội']?.validRows.length)
            await importTeams(data['Đội'].validRows, session);
        if (data['Bảng']?.validRows.length)
            await importGroups(data['Bảng'].validRows, session);
        if (data['Trận đấu']?.validRows.length)
            await importMatches(data['Trận đấu'].validRows, session);




        await session.commitTransaction();
        res.status(200).json({ success: true, message: 'Import dữ liệu thành công' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};


function styleHeader(ws) {
    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E78' } };
    header.alignment = { vertical: 'middle', horizontal: 'center' };
    header.height = 30;
}


function addValidation(ws, column, values) {
    for (let row = 2; row <= 1000; row++) {
        const cell = ws.getCell(`${column}${row}`);
        cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`"${values.join(',')}"`],
            showDropDown: true
        };
    }
}


export const exportExcel = async (req, res) => {
    try {
        const workbook = new exceljs.Workbook();


        // 1. Sheet Người dùng (gộp User + Player)
        const wsUser = workbook.addWorksheet('Người dùng');
        wsUser.columns = [
            { header: 'username*', key: 'username', width: 15 },
            { header: 'email*', key: 'email', width: 25 },
            { header: 'phoneNumber*', key: 'phoneNumber', width: 15 },
            { header: 'password*', key: 'password', width: 20 },
            { header: 'role*', key: 'role', width: 12 },
            { header: 'name*', key: 'name', width: 20 },
            { header: 'birthDate*', key: 'birthDate', width: 12 },
            { header: 'gender*', key: 'gender', width: 8 },
            { header: 'skillLevel*', key: 'skillLevel', width: 10 },
            { header: 'status', key: 'status', width: 12 }
        ];
        const users = await User.find().lean();
        for (const user of users) {
            let playerInfo = null;
            if (user.role === 'player') {
                playerInfo = await Player.findOne({ userId: user._id }).lean();
            }
            wsUser.addRow({
                username: user.username || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                password: '', // không xuất mật khẩu thật
                role: user.role || '',
                name: playerInfo?.name || '',
                birthDate: playerInfo?.birthDate || '',
                gender: playerInfo?.gender || '',
                skillLevel: playerInfo?.skillLevel || '',
                status: user.status || 'active'
            });
            styleHeader(wsUser);
            addValidation(wsUser, 'E', ['player', 'referee', 'org']);
            addValidation(wsUser, 'H', ['male', 'female', 'other']);
            addValidation(wsUser, 'I', ['1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0']);
            addValidation(wsUser, 'J', ['active', 'inactive', 'banned']);
        }


        // 3. Sheet Đội (có members)
        const wsTeam = workbook.addWorksheet('Đội');
        wsTeam.columns = [
            { header: 'name*', key: 'name', width: 20 },
            { header: 'tournamentName*', key: 'tournamentName', width: 25 },
            { header: 'sportType*', key: 'sportType', width: 15 },
            { header: 'categoryId', key: 'categoryId', width: 10 },
            { header: 'ownerUsername*', key: 'ownerUsername', width: 15 },
            { header: 'members', key: 'members', width: 40 },
            { header: 'status', key: 'status', width: 12 }
        ];
        const teams = await Team.find().populate('tournamentId', 'name').lean();
        for (const team of teams) {
            const owner = await User.findById(team.createdBy).lean();
            const members = await Member.find({ teamId: team._id, status: 'Active' }).populate('userId', 'username');
            const memberUsernames = members.map(m => m.userId?.username).filter(Boolean).join(', ');
            wsTeam.addRow({
                name: team.name || '',
                tournamentName: team.tournamentId?.name || '',
                sportType: team.sportType || '',
                categoryId: team.categoryId || '',
                ownerUsername: owner?.username || '',
                members: memberUsernames,
                status: team.status || ''
            });
            styleHeader(wsTeam);
            addValidation(wsTeam, 'C', ['Pickleball', 'Tennis', 'Badminton', 'Soccer', 'Volleyball', 'Basketball']);
            addValidation(wsTeam, 'G', ['pending', 'active', 'inactive']);


        }


        // 4. Sheet Bảng
        const wsGroup = workbook.addWorksheet('Bảng');
        wsGroup.columns = [
            { header: 'name*', key: 'name', width: 15 },
            { header: 'tournamentName*', key: 'tournamentName', width: 25 },
            { header: 'sport*', key: 'sport', width: 15 },
            { header: 'teamNames', key: 'teamNames', width: 40 },
            { header: 'status', key: 'status', width: 12 }
        ];
        const groups = await Group.find().populate('tournamentId', 'name').populate('teamInGroup', 'name').lean();
        for (const group of groups) {
            const teamNames = group.teamInGroup.map(t => t?.name).filter(Boolean).join(', ');
            wsGroup.addRow({
                name: group.name || '',
                tournamentName: group.tournamentId?.name || '',
                sport: group.sport || '',
                teamNames: teamNames,
                status: group.status || ''
            });
            styleHeader(wsGroup);
            addValidation(wsGroup, 'C', ['Pickleball', 'Tennis', 'Badminton', 'Soccer', 'Volleyball', 'Basketball']);
            addValidation(wsGroup, 'E', ['pending', 'progress', 'completed']);
        }
        // 6. Sheet Trận đấu
        const wsMatch = workbook.addWorksheet('Trận đấu');
        wsMatch.columns = [
            { header: 'tournamentName*', key: 'tournamentName', width: 25 },
            { header: 'team1Name*', key: 'team1Name', width: 20 },
            { header: 'team2Name*', key: 'team2Name', width: 20 },
            { header: 'groupName', key: 'groupName', width: 12 },
            { header: 'round', key: 'round', width: 8 },
            { header: 'matchNumber', key: 'matchNumber', width: 10 },
            { header: 'scheduledStartTime*', key: 'scheduledStartTime', width: 20 },
            { header: 'sportType*', key: 'sportType', width: 15 },
            { header: 'courtName', key: 'courtName', width: 15 },
            { header: 'status', key: 'status', width: 12 }
        ];
        const matches = await Match.find()
            .populate('tournamentId', 'name')
            .populate('team1', 'name')
            .populate('team2', 'name')
            .populate('groupId', 'name')
            .lean();
        for (const match of matches) {
            wsMatch.addRow({
                tournamentName: match.tournamentId?.name || '',
                team1Name: match.team1?.name || '',
                team2Name: match.team2?.name || '',
                groupName: match.groupId?.name || '',
                round: match.round,
                matchNumber: match.matchNumber,
                scheduledStartTime: match.scheduledStartTime ? new Date(match.scheduledStartTime).toISOString().slice(0, 19).replace('T', ' ') : '',
                courtName: match.courtName || '',
                status: match.status || ''
            });
            styleHeader(wsMatch);
            addValidation(wsMatch, 'J', ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']);
        }


        // 7. Sheet Hướng dẫn (có thể giữ nguyên nội dung mẫu hoặc lấy từ DB, nhưng thường là tĩnh)
        const wsGuide = workbook.addWorksheet('Hướng dẫn');
        wsGuide.columns = [{ header: 'Hướng dẫn', width: 80 }];
        const guideContent = [
            '📋 HƯỚNG DẪN NHẬP EXCEL',
            '',
            'THỨ TỰ IMPORT:',
            '1. Người dùng → 2. Giải đấu → 3. Đội → 4. Bảng → 5. Sân → 6. Trận đấu',
            '',
            'QUY TẮC NHẬP:',
            '- Các trường có dấu * là bắt buộc',
            '- members: danh sách username (đã có trong sheet Người dùng), cách nhau bằng dấu phẩy',
            '- teamNames: danh sách tên đội, cách nhau bằng dấu phẩy',
            '- sportTypes: danh sách môn, cách nhau bằng dấu phẩy',
            '- Định dạng ngày: YYYY-MM-DD hoặc YYYY-MM-DD HH:MM',
            '',
            '📌 GIÁ TRỊ HỢP LỆ:',
            'Role: player, referee, org',
            'Gender: male, female, other',
            'SkillLevel: 1.0 → 5.0 (cách 0.5)',
            'Status (User): active, inactive, banned',
            'Status (Team): pending, active, inactive',
            'Status (Group): pending, progress, completed',
            'Status (Court): empty, busy, maintenance, inactive',
            'Status (Match): SCHEDULED, IN_PROGRESS, COMPLETED, CANCELED'
        ];
        guideContent.forEach(line => wsGuide.addRow([line]));
        wsGuide.getColumn(1).alignment = { wrapText: true };


        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=export_data.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export Excel error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};







