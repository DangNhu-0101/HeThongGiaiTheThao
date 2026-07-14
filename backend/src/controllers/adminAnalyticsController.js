import User from '../models/users.js';
import Role from '../models/roles.js';
import Organization from '../models/orgs.js';
import Player from '../models/players.js';
import Participant from '../models/participants.js';
import Tournament from '../models/tournaments.js';
import TournamentItem from '../models/tournamentItem.js';
import Match from '../models/matches.js';
import Court from '../models/courts.js';
import TournamentReferee from '../models/tournamentReferees.js';

const monthKey = (date) => {
    const value = date ? new Date(date) : new Date();
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
};

const viMonth = (key) => {
    const [, month] = String(key).split('-');
    return `Th ${Number(month || 0)}`;
};

const lastMonthKeys = (count = 6) => {
    const now = new Date();
    return Array.from({ length: count }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
        return monthKey(date);
    });
};

const statusLabel = (status) => ({
    actived: 'Hoạt động',
    active: 'Hoạt động',
    pending: 'Chờ duyệt',
    inactived: 'Dinh chi',
    inactive: 'Dinh chi',
    banned: 'Dinh chi',
    completed: 'Hoàn thành',
    playing: 'Đang diễn ra',
    live: 'Đang diễn ra',
    pending_match: 'Cho dau',
}[status] || status || 'Khac');

const formatDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '';

const buildMonthlySeries = async (Model, dateField = 'createdAt', valueName = 'value', months = lastMonthKeys()) => {
    const start = new Date(`${months[0]}-01T00:00:00.000Z`);
    const rows = await Model.aggregate([
        { $match: { [dateField]: { $gte: start } } },
        {
            $group: {
                _id: { year: { $year: `$${dateField}` }, month: { $month: `$${dateField}` } },
                count: { $sum: 1 },
            },
        },
    ]);
    const counts = new Map(rows.map((row) => [`${row._id.year}-${String(row._id.month).padStart(2, '0')}`, row.count]));
    return months.map((key) => ({ month: viMonth(key), [valueName]: counts.get(key) || 0 }));
};

export const getAdminDashboard = async (req, res) => {
    try {
        const [
            orgCount,
            pendingOrgCount,
            tournamentCount,
            playingTournamentCount,
            completedTournamentCount,
            itemCount,
            userCount,
            activeUserCount,
            participantCount,
            playerCount,
            matchCount,
            liveMatchCount,
            completedMatchCount,
            courtCount,
            refereeCount,
            roleDocs,
        ] = await Promise.all([
            Organization.countDocuments(),
            Organization.countDocuments({ status: 'pending' }),
            Tournament.countDocuments(),
            Tournament.countDocuments({ status: 'playing' }),
            Tournament.countDocuments({ status: 'completed' }),
            TournamentItem.countDocuments(),
            User.countDocuments(),
            User.countDocuments({ status: 'actived' }),
            Participant.countDocuments(),
            Player.countDocuments(),
            Match.countDocuments(),
            Match.countDocuments({ status: 'live' }),
            Match.countDocuments({ status: { $in: ['completed', 'walkover', 'forfeited'] } }),
            Court.countDocuments(),
            TournamentReferee.countDocuments(),
            Role.find().select('name').lean(),
        ]);

        const stats = [
            { id: 'tournaments', label: 'Tổng giải đấu', value: tournamentCount, trend: `${playingTournamentCount} đang diễn ra`, isPositive: true, type: 'tournaments' },
            { id: 'users', label: 'Tài khoản hoat dong', value: activeUserCount, trend: `${userCount} tong tài khoản`, isPositive: true, type: 'users' },
            { id: 'teams', label: 'Đội / VĐV', value: participantCount, trend: `${playerCount} vận động viên`, isPositive: true, type: 'sports' },
            { id: 'matches', label: 'Tổng trận đấu', value: matchCount, trend: `${completedMatchCount} đã xong`, isPositive: true, type: 'tournaments' },
            { id: 'pending', label: 'Chờ duyệt', value: pendingOrgCount, trend: `${liveMatchCount} trận live`, isPositive: pendingOrgCount === 0, type: 'pending' },
        ];

        const orgsRaw = await Organization.find()
            .populate('ownerId', 'username email status')
            .sort({ createdAt: -1 })
            .limit(12)
            .lean();
        const orgs = await Promise.all(orgsRaw.map(async (org) => {
            const tournamentsCount = await Tournament.countDocuments({ organization: org.ownerId?._id || org.ownerId });
            return {
                id: String(org._id),
                name: org.name,
                email: org.contactEmail || org.ownerId?.email || '',
                plan: 'Co ban',
                status: org.status === 'pending' ? 'Chờ duyệt' : org.status === 'actived' ? 'Hoạt động' : 'Đình chỉ',
                tournamentsCount,
                usersCount: org.ownerId ? 1 : 0,
                joinedAt: formatDate(org.createdAt),
            };
        }));

        const tournamentData = await buildMonthlySeries(Tournament, 'createdAt', 'revenue');
        const usersByRole = await Promise.all(roleDocs.map(async (role) => ({
            name: role.name,
            value: await User.countDocuments({ roles: role._id }),
        })));
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'];
        const pieData = usersByRole
            .filter((item) => item.value > 0)
            .map((item, index) => ({ ...item, color: colors[index % colors.length] }));

        return res.json({
            success: true,
            data: {
                stats,
                orgs,
                revenueData: tournamentData,
                pieData,
                totals: {
                    tournaments: tournamentCount,
                    playingTournaments: playingTournamentCount,
                    completedTournaments: completedTournamentCount,
                    tournamentItems: itemCount,
                    users: userCount,
                    activeUsers: activeUserCount,
                    teams: participantCount,
                    players: playerCount,
                    matches: matchCount,
                    liveMatches: liveMatchCount,
                    completedMatches: completedMatchCount,
                    courts: courtCount,
                    referees: refereeCount,
                },
            },
        });
    } catch (error) {
        console.error('[admin.dashboard] failed', error);
        return res.status(500).json({ success: false, message: 'Không thể tai dashboard admin' });
    }
};

export const getAdminReports = async (req, res) => {
    try {
        const months = lastMonthKeys(6);
        const [
            athletes,
            teams,
            tournaments,
            matches,
            completedMatches,
            courts,
            referees,
            trend,
            matchStatusRows,
        ] = await Promise.all([
            Player.countDocuments(),
            Participant.countDocuments(),
            Tournament.countDocuments(),
            Match.countDocuments(),
            Match.countDocuments({ status: { $in: ['completed', 'walkover', 'forfeited'] } }),
            Court.countDocuments(),
            TournamentReferee.countDocuments(),
            buildMonthlySeries(Player, 'createdAt', 'athletes', months),
            Match.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        ]);

        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#14b8a6'];
        const distribution = matchStatusRows.map((row, index) => ({
            name: statusLabel(row._id),
            value: row.count,
            color: colors[index % colors.length],
        }));

        return res.json({
            success: true,
            data: {
                stats: [
                    { id: 'athletes', label: 'Vận động viên', value: athletes, trend: 'Tu database', isPositive: true, iconType: 'athletes' },
                    { id: 'teams', label: 'Đội tham gia', value: teams, trend: `${tournaments} giải đấu`, isPositive: true, iconType: 'teams' },
                    { id: 'matches', label: 'Trận đấu', value: matches, trend: `${completedMatches} da hoan thanh`, isPositive: true, iconType: 'revenue' },
                ],
                trend,
                distribution,
                exports: [
                    { id: 'matches', name: 'Bao cao trận đấu', description: `${matches} tran, ${completedMatches} da hoan thanh`, format: 'CSV', size: 'Theo bộ lọc' },
                    { id: 'resources', name: 'Bao cao tai nguyen', description: `${courts} san, ${referees} trọng tài`, format: 'CSV', size: 'Theo bộ lọc' },
                ],
            },
        });
    } catch (error) {
        console.error('[admin.reports] failed', error);
        return res.status(500).json({ success: false, message: 'Không thể tải báo cáo admin' });
    }
};
