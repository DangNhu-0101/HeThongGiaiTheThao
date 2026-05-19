import mongoose from 'mongoose';
import { parseExcelFile } from '../utils/excelHelper.js';
import {
    importUsers, importTournaments, importTeams, importPlayers,
    importGroups, importCourts, importMatches
} from '../services/importDataService.js';

export const importExcel = async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng upload file Excel' });

    const { tournamentId } = req.body;

    const parseResult = await parseExcelFile(req.file.path);
    if (!parseResult.success) {
        return res.status(400).json({ success: false, errors: parseResult.summary.errors });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const data = parseResult.data;

        if (data['Người dùng']?.validRows.length)
            await importUsers(data['Người dùng'].validRows, session);
        if (data['Giải đấu']?.validRows.length)
            await importTournaments(data['Giải đấu'].validRows, session);
        if (data['Đội']?.validRows.length) {
            const teamsWithTournament = data['Đội'].validRows.map(row => ({
                ...row,
                tournamentId: tournamentId || row.tournamentName
            }));
            await importTeams(teamsWithTournament, session);
        }
        if (data['Cầu thủ']?.validRows.length)
            await importPlayers(data['Cầu thủ'].validRows, session);
        if (data['Bảng']?.validRows.length)
            await importGroups(data['Bảng'].validRows, session);
        if (data['Sân']?.validRows.length)
            await importCourts(data['Sân'].validRows, session);
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