// controllers/excelController.js
import mongoose from 'mongoose';
import { parseExcelFile } from '../utils/excelHelper.js';
import {
    importUsersWithPlayers, importTeams,
    importGroups,  importMatches
} from '../services/ImportDataService.js';


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


        // Thứ tự import: Users → Tournaments → Teams → Players → Groups → Courts → Matches
        if (data['Người dùng']?.validRows.length)
            await importUsersWithPlayers(data['Người dùng'].validRows, session);
        if (data['Đội']?.validRows.length)
            await importTeams(data['Đội'].validRows, session);
        if (data['Bảng']?.validRows.length)
            await importGroups(data['Bảng'].validRows, session);
        if (data['Trận đấu']?.validRows.length)
            await importMatches(data['Trận đấu'].validRows, session);


        await session.commitTransaction();
        res.json({ success: true, message: 'Import dữ liệu thành công' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};


export const exportExcel = async (req, res) => {
    try {
        const workbook = new exceljs.Workbook();


        // 1. Sheet: Người dùng (gộp cả cầu thủ)
        const wsUser = workbook.addWorksheet('Người dùng');
        wsUser.columns = [
            { header: 'username', key: 'username', width: 15 },
            { header: 'email', key: 'email', width: 25 },
            { header: 'phoneNumber', key: 'phoneNumber', width: 15 },
            { header: 'password', key: 'password', width: 20 },
            { header: 'role', key: 'role', width: 12 },
            { header: 'displayName', key: 'displayName', width: 20 },
            { header: 'birthYear', key: 'birthYear', width: 12 },
            { header: 'gender', key: 'gender', width: 8 },
            { header: 'skillLevel', key: 'skillLevel', width: 10 },
            { header: 'status', key: 'status', width: 12 }
        ];
        // Lấy danh sách user + player info
        const users = await User.find().lean();
        for (const user of users) {
            let playerInfo = null;
            if (user.role === 'player') {
                playerInfo = await Player.findOne({ userId: user._id }).lean();
            }
            wsUser.addRow({
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber,
                password: '', // không xuất mật khẩu thật
                role: user.role,
                displayName: playerInfo?.name || '',
                birthYear: playerInfo?.birthYear || '',
                gender: playerInfo?.gender || '',
                skillLevel: playerInfo?.skillLevel || '',
                status: user.status
            });
        }


        // 2. Sheet: Đội (kèm danh sách thành viên)
        const wsTeam = workbook.addWorksheet('Đội');
        wsTeam.columns = [
            { header: 'name', key: 'name', width: 20 },
            { header: 'tournamentName', key: 'tournamentName', width: 25 },
            { header: 'sportType', key: 'sportType', width: 15 },
            { header: 'categoryId', key: 'categoryId', width: 10 },
            { header: 'ownerUsername', key: 'ownerUsername', width: 15 },
            { header: 'members', key: 'members', width: 40 },
            { header: 'status', key: 'status', width: 12 }
        ];
        const teams = await Team.find().populate('tournamentId', 'displayName').lean();
        for (const team of teams) {
            const owner = await User.findById(team.createdBy).lean();
            // Lấy danh sách member (username)
            const members = await Member.find({ teamId: team._id, status: 'Active' }).populate('userId', 'username');
            const memberUsernames = members.map(m => m.userId?.username).filter(Boolean).join(', ');
            wsTeam.addRow({
                name: team.name,
                tournamentName: team.tournamentId?.displayName || '',
                sportType: team.sportType,
                categoryId: team.categoryId,
                ownerUsername: owner?.username || '',
                members: memberUsernames,
                status: team.status
            });
        }


        // 3. Sheet: Trận đấu
        const wsMatch = workbook.addWorksheet('Trận đấu');
        wsMatch.columns = [
            { header: 'tournamentName', key: 'tournamentName', width: 25 },
            { header: 'team1Name', key: 'team1Name', width: 20 },
            { header: 'team2Name', key: 'team2Name', width: 20 },
            { header: 'groupName', key: 'groupName', width: 12 },
            { header: 'round', key: 'round', width: 8 },
            { header: 'matchNumber', key: 'matchNumber', width: 10 },
            { header: 'scheduledStartTime', key: 'scheduledStartTime', width: 20 },
            { header: 'courtName', key: 'courtName', width: 15 },
            { header: 'status', key: 'status', width: 12 }
        ];
        const matches = await Match.find()
            .populate('tournamentId', 'displayName')
            .populate('team1', 'name')
            .populate('team2', 'name')
            .populate('groupId', 'name')
            .lean();
        for (const match of matches) {
            wsMatch.addRow({
                tournamentName: match.tournamentId?.displayName || '',
                team1Name: match.team1?.name || '',
                team2Name: match.team2?.name || '',
                groupName: match.groupId?.name || '',
                round: match.round,
                matchNumber: match.matchNumber,
                scheduledStartTime: match.scheduledStartTime ? new Date(match.scheduledStartTime).toISOString().slice(0, 19).replace('T', ' ') : '',
                courtName: match.courtName || '',
                status: match.status
            });
        }


        // 4. Sheet: Bảng
        const wsGroup = workbook.addWorksheet('Bảng');
        wsGroup.columns = [
            { header: 'name', key: 'name', width: 15 },
            { header: 'tournamentName', key: 'tournamentName', width: 25 },
            { header: 'sport', key: 'sport', width: 15 },
            { header: 'teamNames', key: 'teamNames', width: 40 },
            { header: 'status', key: 'status', width: 12 }
        ];
        const groups = await Group.find().populate('tournamentId', 'displayName').populate('teamInGroup', 'name').lean();
        for (const group of groups) {
            const teamNames = group.teamInGroup.map(t => t?.name).filter(Boolean).join(', ');
            wsGroup.addRow({
                name: group.name,
                tournamentName: group.tournamentId?.displayName || '',
                sport: group.sport,
                teamNames: teamNames,
                status: group.status
            });
        }


        // 5. Sheet: Sân
        const wsCourt = workbook.addWorksheet('Sân');
        wsCourt.columns = [
            { header: 'name', key: 'name', width: 20 },
            { header: 'tournamentName', key: 'tournamentName', width: 25 },
            { header: 'sportTypes', key: 'sportTypes', width: 25 },
            { header: 'location', key: 'location', width: 30 },
            { header: 'status', key: 'status', width: 12 }
        ];
        const courts = await Court.find().populate('tournamentId', 'displayName').lean();
        for (const court of courts) {
            wsCourt.addRow({
                name: court.name,
                tournamentName: court.tournamentId?.displayName || '',
                sportTypes: court.sportTypes?.join(', ') || '',
                location: court.location || '',
                status: court.status
            });
        }


        // Thiết lập header response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=export_data.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export Excel error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};



