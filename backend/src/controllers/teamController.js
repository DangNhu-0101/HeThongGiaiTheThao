import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Participant from '../models/participants.js';
import TournamentItem from '../models/tournamentItem.js';
import Player from '../models/players.js';
import User from '../models/users.js';
import Role from '../models/roles.js';
import Invitation from '../models/invitations.js';
import TeamJoinRequest from '../models/teamJoinRequests.js';
import { checkPermission } from '../utils/tournamentHelper.js';

import {
    buildImportTemplateBuffer,
    buildLoginWorkbookBuffer,
    parseImportRows,
    buildImportGroups,
    slugifyUsername,
    makeImportPassword,
    getUniqueUsername
} from '../utils/excelConfig.js';

// ==================== HELPERS ====================

const buildMemberFees = (lineup = [], amount = 0) => lineup
    .filter(item => item.Player)
    .map(item => ({
        playerId: item.Player,
        amount: Number(amount || 0),
        status: amount > 0 ? 'unpaid' : 'exempted'
    }));

const getPlayerIdValue = (value) => value?._id || value;
const toIdString = (value) => getPlayerIdValue(value)?.toString();

const syncParticipantMembersAndFees = (participant, amount = 0) => {
    const seenLineup = new Set();
    participant.lineup = (participant.lineup || []).filter((item) => {
        const playerId = toIdString(item.Player);
        if (!playerId || seenLineup.has(playerId)) return false;
        seenLineup.add(playerId);
        return true;
    });

    const validPlayerIds = new Set((participant.lineup || []).map(item => toIdString(item.Player)).filter(Boolean));
    const feeByPlayer = new Map();
    for (const fee of participant.memberFees || []) {
        const playerId = toIdString(fee.playerId);
        if (!playerId || !validPlayerIds.has(playerId) || feeByPlayer.has(playerId)) continue;
        feeByPlayer.set(playerId, fee);
    }

    participant.memberFees = (participant.lineup || []).map((item) => {
        const playerId = getPlayerIdValue(item.Player);
        const key = toIdString(playerId);
        return feeByPlayer.get(key) || {
            playerId,
            amount: Number(amount || 0),
            status: amount > 0 ? 'unpaid' : 'exempted'
        };
    });

    return participant;
};

const ensureParticipantFees = async (participant) => {
    if (!participant) return participant;
    const tournamentItem = await TournamentItem.findById(participant.tournamentItemId);
    syncParticipantMembersAndFees(participant, Number(tournamentItem?.feeEntry || 0));
    await participant.save();
    return participant;
};

/**
 * Kiểm tra một player đã đăng ký trong giải đấu chưa (dùng Player._id)
 */
const isPlayerRegistered = async (tournamentItemId, playerId) => {
    const participant = await Participant.findOne({
        tournamentItemId,
        'lineup.Player': playerId
    });
    return !!participant;
};

/**
 * Validate số lượng thành viên trong team (dùng CategoryRule.playerSlotsPerTeam)
 */
const validateTeamSize = async (tournamentItemId, lineupLength) => {
    const tournamentItem = await TournamentItem.findById(tournamentItemId).populate('categoryRule');
    if (!tournamentItem) {
        return { valid: false, message: 'Tournament item not found' };
    }
    const categoryRule = tournamentItem.categoryRule;
    if (!categoryRule) {
        return { valid: true };
    }
    const min = categoryRule.playerSlotsPerTeam?.min ?? 1;
    const max = categoryRule.playerSlotsPerTeam?.max ?? 1;
    if (lineupLength < min) {
        return { valid: false, message: `Team must have at least ${min} players` };
    }
    if (lineupLength > max) {
        return { valid: false, message: `Team cannot have more than ${max} players` };
    }
    return { valid: true };
};

/**
 * Kiểm tra thời gian đăng ký còn mở không
 */
const isRegistrationOpen = (tournamentItem) => {
    const now = new Date();
    const { registrationStart, registrationEnd } = tournamentItem.timeLine;
    if (!registrationStart || !registrationEnd) return false;
    return now >= new Date(registrationStart) && now <= new Date(registrationEnd);
};

/**
 * Kiểm tra user có phải thành viên của participant không (dùng Player._id)
 */
const isMemberOfParticipant = (participant, playerId) => {
    return participant.lineup.some(item => item.Player && item.Player.toString() === playerId.toString());
};

const isCaptainOfParticipant = (participant, playerId) => {
    const captain = participant.lineup?.[0]?.Player;
    return Boolean(captain && playerId && captain.toString() === playerId.toString());
};

/**
 * Kiểm tra quyền trên participant:
 * - User là thành viên (có Player._id trong lineup)
 * - Hoặc user là admin/owner của tournament
 */
const checkParticipantPermission = async (participant, userId, playerId) => {
    // 1. Kiểm tra thành viên
    if (isMemberOfParticipant(participant, playerId)) {
        return { allowed: true, message: '' };
    }
    // 2. Kiểm tra admin/owner của tournament
    const item = await TournamentItem.findById(participant.tournamentItemId);
    if (!item) {
        return { allowed: false, message: 'Tournament item not found' };
    }
    const perm = await checkPermission(userId, item.organization);
    if (perm.allowed) {
        return { allowed: true, message: '' };
    }
    return { allowed: false, message: 'You do not have permission to perform this action on this participant' };
};

// ==================== CREATE PARTICIPANT ====================

export const createParticipant = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id; // User ID
        const playerProfile = req.profile; // Player document (từ middleware)
        if (!playerProfile) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'You must have an active player profile to register' });
        }
        const playerId = playerProfile._id; // Player._id

        const { tournamentItemId, type, name, logo, lineup, invitees } = req.body;

        // 1. Kiểm tra tournament item
        const tournamentItem = await TournamentItem.findById(tournamentItemId).session(session);
        if (!tournamentItem) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Tournament item not found' });
        }

        // 2. Kiểm tra thời gian đăng ký
        if (!isRegistrationOpen(tournamentItem)) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Registration is not open' });
        }

        // 3. Kiểm tra type
        if (!['player', 'team'].includes(type)) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Invalid type. Must be "player" or "team"' });
        }

        // 4. Xử lý đăng ký cá nhân
        if (type === 'player') {
            if (await isPlayerRegistered(tournamentItemId, playerId)) {
                await session.abortTransaction();
                return res.status(409).json({ success: false, message: 'You are already registered in this tournament' });
            }

            const participantName = name || playerProfile.name;
            const participantLogo = logo || playerProfile.avatar || '';

            const participant = new Participant({
                type: 'player',
                tournamentItemId,
                name: participantName,
                logo: participantLogo,
                lineup: [{ Player: playerId }],
                memberFees: buildMemberFees([{ Player: playerId }], tournamentItem.feeEntry)
            });
            await participant.save({ session });

            await session.commitTransaction();
            return res.status(201).json({
                success: true,
                message: 'Player registered successfully',
                data: participant
            });
        }

        // 5. Xử lý đăng ký đội (type === 'team')
        let finalLineup = [];
        let invitedPlayerIds = [];

        if (lineup && Array.isArray(lineup) && lineup.length >= 1) {
            // Kiểm tra captain có trong lineup không (dùng playerId)
            const captainInLineup = lineup.some(item => item.Player && item.Player.toString() === playerId.toString());
            if (!captainInLineup) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: 'Captain (you) must be included in the lineup' });
            }
            const playerIds = lineup.map(item => item.Player);
            // Kiểm tra các player có tồn tại và active không
            const players = await Player.find({ _id: { $in: playerIds }, status: 'actived' }).session(session);
            if (players.length !== playerIds.length) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: 'One or more players do not exist or are not active' });
            }
            // Kiểm tra từng player đã đăng ký giải đấu chưa
            for (const pid of playerIds) {
                if (await isPlayerRegistered(tournamentItemId, pid)) {
                    const player = await Player.findById(pid);
                    await session.abortTransaction();
                    return res.status(409).json({
                        success: false,
                        message: `Player ${player ? player.name : pid} is already registered in this tournament`
                    });
                }
            }
            // Validate số lượng
            const sizeCheck = await validateTeamSize(tournamentItemId, playerIds.length);
            if (!sizeCheck.valid) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: sizeCheck.message });
            }
            finalLineup = playerIds.map(pid => ({ Player: pid }));
        } else {
            // Không có lineup, tạo lineup chỉ có captain
            if (await isPlayerRegistered(tournamentItemId, playerId)) {
                await session.abortTransaction();
                return res.status(409).json({ success: false, message: 'You are already registered in this tournament' });
            }
            finalLineup = [{ Player: playerId }];
        }

        // Xử lý invitees (nếu có)
        if (invitees && Array.isArray(invitees)) {
            invitedPlayerIds = invitees;
        }

        // Tên đội bắt buộc
        if (!name || !name.trim()) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Team name is required' });
        }

        // Tạo participant
        const participant = new Participant({
            type: 'team',
            tournamentItemId,
            name: name.trim(),
            logo: logo || '',
            lineup: finalLineup,
            memberFees: buildMemberFees(finalLineup, tournamentItem.feeEntry)
        });
        await participant.save({ session });

        // Tạo invitations cho từng invitee (lưu User._id vì Invitation.receiverId là User)
        for (const inviteeUserId of invitedPlayerIds) {
            // Kiểm tra invitee có player profile active không
            const inviteePlayer = await Player.findOne({ userId: inviteeUserId, status: 'actived' }).session(session);
            if (!inviteePlayer) continue;
            const inviteePlayerId = inviteePlayer._id;

            // Nếu đã có trong lineup thì bỏ qua
            if (participant.lineup.some(item => item.Player && item.Player.toString() === inviteePlayerId.toString())) {
                continue;
            }
            // Kiểm tra invitee đã đăng ký giải đấu chưa
            if (await isPlayerRegistered(tournamentItemId, inviteePlayerId)) {
                continue;
            }
            // Kiểm tra đã có invitation pending chưa
            const existingInvite = await Invitation.findOne({
                participantId: participant._id,
                receiverId: inviteeUserId,
                status: 'pending'
            }).session(session);
            if (existingInvite) continue;

            const invitation = new Invitation({
                senderId: userId, // User._id
                receiverId: inviteeUserId, // User._id
                participantId: participant._id,
                message: `You are invited to join team ${participant.name}`
            });
            await invitation.save({ session });
        }

        await session.commitTransaction();
        return res.status(201).json({
            success: true,
            message: 'Team registered successfully',
            data: participant
        });

    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==================== GET PARTICIPANTS ====================

export const getParticipantsByTournament = async (req, res) => {
    try {
        const { tournamentItemId } = req.params;
        const participants = await Participant.find({ tournamentItemId })
            .populate({
                path: 'lineup.Player',
                select: 'name gender birthDate skill userId avatar username status sports',
                populate: { path: 'userId', select: 'username email phoneNumber avatar' }
            })
            .sort({ createdAt: -1 })
            .lean();
        return res.status(200).json({ success: true, data: participants });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createParticipantByOrganization = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            tournamentItemId,
            type = 'team',
            name,
            logo = '',
            representative = {},
            athletes = [],
            paymentStatus = 'unpaid',
            registrationStatus = 'approved',
            source = 'organization'
        } = req.body;

        if (!tournamentItemId || !name?.trim()) {
            return res.status(400).json({ success: false, message: 'Thiếu tournamentItemId hoặc tên đội' });
        }

        const tournamentItem = await TournamentItem.findById(tournamentItemId);
        if (!tournamentItem) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nội dung giải' });
        }

        const perm = await checkPermission(userId, tournamentItem.organization);
        if (!perm.allowed) {
            return res.status(403).json({ success: false, message: perm.message });
        }

        const createdPlayers = [];
        for (const athlete of athletes) {
            if (!athlete?.name?.trim()) continue;
            const player = await Player.create({
                userId: null,
                name: athlete.name.trim(),
                birthDate: athlete.birthDate ? new Date(athlete.birthDate) : new Date('2000-01-01'),
                gender: ['male', 'female', 'other'].includes(athlete.gender) ? athlete.gender : 'other',
                skill: Number(athlete.skill || 1),
                sports: athlete.sports || [],
                status: 'actived'
            });
            createdPlayers.push(player);
        }

        const participant = await Participant.create({
            type,
            tournamentItemId,
            name: name.trim(),
            logo,
            representative,
            registrationStatus,
            paymentStatus,
            source,
            lineup: createdPlayers.map(player => ({ Player: player._id })),
            memberFees: buildMemberFees(createdPlayers.map(player => ({ Player: player._id })), tournamentItem.feeEntry)
        });

        const populated = await Participant.findById(participant._id).populate('lineup.Player', 'name gender birthDate skill');
        return res.status(201).json({ success: true, message: 'Đã tạo đội/VĐV', data: populated });
    } catch (error) {
        console.error('createParticipantByOrganization error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const downloadOrganizationImportTemplate = async (req, res) => {
    try {
        const buffer = await buildImportTemplateBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="mau-nhap-6-doi-vdv.xlsx"');
        return res.send(Buffer.from(buffer));
    } catch (error) {
        console.error('downloadOrganizationImportTemplate error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const importParticipantsByOrganization = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const { tournamentItemId } = req.body;

        if (!tournamentItemId) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Thiếu tournamentItemId' });
        }
        if (!req.file) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Vui lòng chọn file nhập đội và VĐV' });
        }

        const tournamentItem = await TournamentItem.findById(tournamentItemId).session(session);
        if (!tournamentItem) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Không tìm thấy nội dung giải' });
        }

        const perm = await checkPermission(userId, tournamentItem.organization);
        if (!perm.allowed) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: perm.message });
        }

        const rows = await parseImportRows(req.file);
        const { groups, errors } = buildImportGroups(rows);
        if (errors.length) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'File nhập có lỗi. Vui lòng sửa theo danh sách lỗi rồi nhập lại.',
                errors,
                notes: [
                    'Số điện thoại phải nhập dạng Text để giữ số 0 đầu.',
                    'Ngày sinh phải theo dạng dd-mm-yyyy, ví dụ 20-05-1995.',
                    'Không xóa hoặc đổi tên các cột header trong file mẫu.'
                ]
            });
        }
        if (!groups.length) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'File không có dòng dữ liệu hợp lệ' });
        }

        const playerRole = await Role.findOne({ name: 'player' }).session(session);
        if (!playerRole) {
            await session.abortTransaction();
            return res.status(500).json({ success: false, message: 'Thiếu role player trong hệ thống.' });
        }

        const participants = [];
        const loginRows = [];
        const usedUsernames = new Set();
        const usedEmails = new Set();
        const usedPhones = new Set();
        const existingUsers = await User.find({
            $or: groups.flatMap(group => [
                { email: group.representative.email },
                { phoneNumber: group.representative.phone }
            ])
        }).select('email phoneNumber username').lean().session(session);
        existingUsers.forEach((user) => {
            if (user.email) usedEmails.add(user.email.toLowerCase());
            if (user.phoneNumber) usedPhones.add(user.phoneNumber);
            if (user.username) usedUsernames.add(user.username);
        });

        const password = makeImportPassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        for (const group of groups) {
            const players = [];
            for (let athleteIndex = 0; athleteIndex < group.athletes.length; athleteIndex += 1) {
                const athlete = group.athletes[athleteIndex];
                const username = await getUniqueUsername(slugifyUsername(`${athlete.name}${group.code}`), usedUsernames);
                const importedEmail = group.representative.email.toLowerCase();
                const importedPhone = group.representative.phone;
                const canUseImportedEmail = athleteIndex === 0 && importedEmail && !usedEmails.has(importedEmail);
                const canUseImportedPhone = athleteIndex === 0 && importedPhone && !usedPhones.has(importedPhone);
                const accountEmail = canUseImportedEmail ? importedEmail : `${username}@import.local`;
                const accountPhone = canUseImportedPhone ? importedPhone : `import-${username}`;
                usedEmails.add(accountEmail);
                usedPhones.add(accountPhone);

                const user = await User.create([{
                    username,
                    email: accountEmail,
                    phoneNumber: accountPhone,
                    hashedPassword,
                    roles: [playerRole._id],
                    status: 'actived'
                }], { session }).then(items => items[0]);

                const player = await Player.create([{
                    userId: user._id,
                    name: athlete.name,
                    birthDate: athlete.birthDate,
                    gender: athlete.gender,
                    skill: Number.isFinite(athlete.skill) ? athlete.skill : 1,
                    sports: [],
                    status: 'actived'
                }], { session }).then(items => items[0]);
                players.push(player);
                loginRows.push({
                    teamCode: group.code,
                    teamName: group.name,
                    athleteName: athlete.name,
                    username,
                    password,
                    note: 'Tài khoản đã kích hoạt. Người dùng nên đổi mật khẩu sau lần đăng nhập đầu tiên.'
                });
            }

            const participant = await Participant.create([{
                type: 'team',
                tournamentItemId,
                name: group.name,
                representative: group.representative,
                registrationStatus: 'pending',
                paymentStatus: group.paymentStatus,
                source: 'import',
                lineup: players.map(player => ({ Player: player._id })),
                memberFees: buildMemberFees(players.map(player => ({ Player: player._id })), tournamentItem.feeEntry)
            }], { session }).then(items => items[0]);
            participants.push(participant);
        }

        await session.commitTransaction();

        const populated = await Participant.find({ _id: { $in: participants.map(item => item._id) } })
            .populate('lineup.Player', 'name gender birthDate skill');
        const loginWorkbook = await buildLoginWorkbookBuffer(loginRows);

        return res.status(201).json({
            success: true,
            message: `Đã nhập ${participants.length} đội và ${loginRows.length} VĐV từ file. Hồ sơ VĐV đã được kích hoạt.`,
            data: populated,
            loginFile: {
                fileName: `tai-khoan-vdv-${Date.now()}.xlsx`,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                base64: Buffer.from(loginWorkbook).toString('base64')
            }
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('importParticipantsByOrganization error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const updateParticipantReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { registrationStatus, paymentStatus } = req.body;
        const participant = await Participant.findById(id);
        if (!participant) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đội/VĐV' });
        }

        const tournamentItem = await TournamentItem.findById(participant.tournamentItemId);
        if (!tournamentItem) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nội dung giải' });
        }

        const perm = await checkPermission(userId, tournamentItem.organization);
        if (!perm.allowed) {
            return res.status(403).json({ success: false, message: perm.message });
        }

        if (registrationStatus !== undefined) participant.registrationStatus = registrationStatus;
        if (paymentStatus !== undefined) participant.paymentStatus = paymentStatus;
        await participant.save();

        const populated = await Participant.findById(participant._id).populate('lineup.Player', 'name gender birthDate skill');
        return res.status(200).json({ success: true, message: 'Đã cập nhật trạng thái đội/VĐV', data: populated });
    } catch (error) {
        console.error('updateParticipantReview error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createJoinRequest = async (req, res) => {
    try {
        const { participantId } = req.params;
        const { message = '' } = req.body;
        const userId = req.user._id;
        const playerProfile = req.profile;
        if (!playerProfile) {
            return res.status(403).json({ success: false, message: 'Bạn cần có Player profile' });
        }

        const participant = await Participant.findById(participantId);
        if (!participant || participant.type !== 'team') {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đội' });
        }
        if (participant.lineup.some(item => item.Player?.toString() === playerProfile._id.toString())) {
            return res.status(409).json({ success: false, message: 'Bạn đã là thành viên đội này' });
        }
        if (await isPlayerRegistered(participant.tournamentItemId, playerProfile._id)) {
            return res.status(409).json({ success: false, message: 'Bạn đã tham gia đội khác trong giải này' });
        }

        const existing = await TeamJoinRequest.findOne({
            participantId,
            requesterId: userId,
            status: 'pending'
        });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Bạn đã gửi yêu cầu gia nhập đội này' });
        }

        const request = await TeamJoinRequest.create({
            participantId,
            tournamentItemId: participant.tournamentItemId,
            requesterId: userId,
            requesterPlayerId: playerProfile._id,
            message
        });
        const populated = await TeamJoinRequest.findById(request._id)
            .populate('participantId', 'name logo tournamentItemId')
            .populate('requesterPlayerId', 'name gender birthDate skill');
        return res.status(201).json({ success: true, data: populated });
    } catch (error) {
        console.error('createJoinRequest error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyJoinRequests = async (req, res) => {
    try {
        const requests = await TeamJoinRequest.find({ requesterId: req.user._id })
            .sort({ createdAt: -1 })
            .populate('participantId', 'name logo tournamentItemId')
            .populate('requesterPlayerId', 'name gender birthDate skill');
        return res.status(200).json({ success: true, data: requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const cancelJoinRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await TeamJoinRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu gia nhập đội' });
        }
        if (request.requesterId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền rút yêu cầu này' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Chỉ có thể rút yêu cầu đang chờ duyệt' });
        }
        request.status = 'cancelled';
        await request.save();

        const populated = await TeamJoinRequest.findById(request._id)
            .populate('participantId', 'name logo tournamentItemId')
            .populate('requesterPlayerId', 'name gender birthDate skill');
        return res.status(200).json({ success: true, message: 'Đã rút yêu cầu gia nhập đội', data: populated });
    } catch (error) {
        console.error('cancelJoinRequest error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getParticipantJoinRequests = async (req, res) => {
    try {
        const { participantId } = req.params;
        const participant = await Participant.findById(participantId);
        if (!participant) return res.status(404).json({ success: false, message: 'Không tìm thấy đội' });

        const perm = await checkParticipantPermission(participant, req.user._id, req.profile?._id);
        if (!perm.allowed) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: perm.message });
        }
        if (!perm.allowed) return res.status(403).json({ success: false, message: perm.message });

        const requests = await TeamJoinRequest.find({ participantId, status: 'pending' })
            .sort({ createdAt: -1 })
            .populate('participantId', 'name logo tournamentItemId')
            .populate('requesterPlayerId', 'name gender birthDate skill');
        return res.status(200).json({ success: true, data: requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const reviewJoinRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { requestId } = req.params;
        const { decision } = req.body;
        if (!['accept', 'reject'].includes(decision)) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Quyết định không hợp lệ' });
        }

        const request = await TeamJoinRequest.findOneAndUpdate(
            { _id: requestId, status: 'pending' },
            { $set: { status: decision === 'accept' ? 'accepted' : 'rejected' } },
            { new: true, session }
        );
        if (!request) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu đang chờ' });
        }
        const participant = await Participant.findById(request.participantId).session(session);
        if (!participant) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Team not found' });
        }
        if (!participant) return res.status(404).json({ success: false, message: 'Không tìm thấy đội' });

        const perm = await checkParticipantPermission(participant, req.user._id, req.profile?._id);
        if (!perm.allowed) return res.status(403).json({ success: false, message: perm.message });

        if (decision === 'reject') {
            await session.commitTransaction();
            return res.status(200).json({ success: true, data: request });
        }

        if (await isPlayerRegistered(participant.tournamentItemId, request.requesterPlayerId)) {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: 'VĐV đã tham gia đội khác trong giải này' });
        }
        const sizeCheck = await validateTeamSize(participant.tournamentItemId, participant.lineup.length + 1);
        if (!sizeCheck.valid) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: sizeCheck.message });
        }

        const tournamentItem = await TournamentItem.findById(participant.tournamentItemId).session(session);
        const alreadyInTeam = participant.lineup.some(item => toIdString(item.Player) === request.requesterPlayerId.toString());
        if (!alreadyInTeam) participant.lineup.push({ Player: request.requesterPlayerId });
        syncParticipantMembersAndFees(participant, Number(tournamentItem?.feeEntry || 0));
        await participant.save({ session });

        await session.commitTransaction();
        return res.status(200).json({ success: true, data: request });
    } catch (error) {
        await session.abortTransaction();
        console.error('reviewJoinRequest error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const linkPlayerAccount = async (req, res) => {
    try {
        const { playerId } = req.params;
        const { userId, tournamentItemId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(playerId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'ID khong hop le' });
        }

        const player = await Player.findById(playerId);
        if (!player) return res.status(404).json({ success: false, message: 'Không tìm thấy vận động viên' });

        const participantQuery = { 'lineup.Player': player._id };
        if (tournamentItemId && mongoose.Types.ObjectId.isValid(tournamentItemId)) participantQuery.tournamentItemId = tournamentItemId;
        const participant = await Participant.findOne(participantQuery).populate('tournamentItemId');
        if (!participant) return res.status(404).json({ success: false, message: 'Không tìm thấy danh sach thi dau cua vận động viên' });

        const item = participant.tournamentItemId;
        const perm = item ? await checkPermission(req.user._id, item.organization) : { allowed: false };
        if (!perm.allowed) return res.status(403).json({ success: false, message: perm.message || 'Permission denied' });

        const user = await User.findById(userId).select('_id username email phoneNumber');
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });

        const linked = await Player.findOne({ _id: { $ne: player._id }, userId: user._id });
        if (linked) return res.status(409).json({ success: false, message: 'Tài khoản nay da lien ket voi vận động viên khac' });

        player.userId = user._id;
        await player.save();
        const populated = await Player.findById(player._id).populate('userId', 'username email phoneNumber avatar').lean();
        return res.status(200).json({ success: true, message: 'Đã liên kết tài khoản', data: populated });
    } catch (error) {
        console.error('linkPlayerAccount error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getParticipantFees = async (req, res) => {
    try {
        const participant = await Participant.findById(req.params.participantId)
            .populate('memberFees.playerId', 'name gender birthDate skill')
            .populate('lineup.Player', 'name gender birthDate skill');
        if (!participant) return res.status(404).json({ success: false, message: 'Không tìm thấy đội' });
        await ensureParticipantFees(participant);
        const refreshed = await Participant.findById(participant._id).populate('memberFees.playerId', 'name gender birthDate skill');
        return res.status(200).json({ success: true, data: refreshed.memberFees });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const submitParticipantFee = async (req, res) => {
    try {
        const { participantId } = req.params;
        const { receiptImage = '' } = req.body;
        const participant = await Participant.findById(participantId);
        if (!participant) return res.status(404).json({ success: false, message: 'Không tìm thấy đội' });
        await ensureParticipantFees(participant);
        const playerId = req.profile?._id?.toString();
        const fee = participant.memberFees.find(item => item.playerId?.toString() === playerId);
        if (!fee) return res.status(403).json({ success: false, message: 'Bạn không thuộc đội này' });
        fee.receiptImage = receiptImage;
        fee.status = 'pending';
        await participant.save();
        return res.status(200).json({ success: true, data: fee });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getParticipant = async (req, res) => {
    try {
        const { id } = req.params;
        const participant = await Participant.findById(id)
            .populate('lineup.Player', 'name gender birthDate skill userId avatar username')
            .populate('tournamentItemId', 'name sportType feeEntry paymentQR paymentConfig')
            .lean();
        if (!participant) {
            return res.status(404).json({ success: false, message: 'Participant not found' });
        }
        return res.status(200).json({ success: true, data: participant });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyParticipants = async (req, res) => {
    try {
        const playerProfile = req.profile;
        if (!playerProfile) {
            return res.status(403).json({ success: false, message: 'Bạn cần có Player profile' });
        }
        const playerId = playerProfile._id;
        const participants = await Participant.find({
            'lineup.Player': playerId
        }).populate('lineup.Player', 'name gender birthDate skill')
            .populate('tournamentItemId', 'name sportType');
        return res.status(200).json({ success: true, data: participants });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== UPDATE PARTICIPANT ====================

export const updateParticipant = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { name, logo, lineup } = req.body;
        const userId = req.user._id;
        const playerProfile = req.profile;
        if (!playerProfile) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Bạn cần có Player profile' });
        }
        const playerId = playerProfile._id;

        const participant = await Participant.findById(id).session(session);
        if (!participant) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Participant not found' });
        }

        const perm = await checkParticipantPermission(participant, userId, playerId);
        if (!perm.allowed) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: perm.message });
        }

        if (participant.type === 'player') {
            if (lineup) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: 'Cannot change lineup for a player participant' });
            }
            if (name) participant.name = name.trim();
            if (logo !== undefined) participant.logo = logo;
            await participant.save({ session });
            await session.commitTransaction();
            return res.status(200).json({ success: true, message: 'Participant updated', data: participant });
        }

        if (participant.type === 'team') {
            if (name) participant.name = name.trim();
            if (logo !== undefined) participant.logo = logo;

            if (lineup) {
                if (!Array.isArray(lineup) || lineup.length < 1) {
                    await session.abortTransaction();
                    return res.status(400).json({ success: false, message: 'Team must have at least 1 player' });
                }
                const playerIds = lineup.map(item => item.Player);
                if (!playerIds.some(id => id.toString() === playerId.toString())) {
                    await session.abortTransaction();
                    return res.status(403).json({ success: false, message: 'You cannot remove yourself from the team' });
                }
                const players = await Player.find({ _id: { $in: playerIds }, status: 'actived' }).session(session);
                if (players.length !== playerIds.length) {
                    await session.abortTransaction();
                    return res.status(400).json({ success: false, message: 'One or more players are invalid or inactive' });
                }
                const sizeCheck = await validateTeamSize(participant.tournamentItemId, playerIds.length);
                if (!sizeCheck.valid) {
                    await session.abortTransaction();
                    return res.status(400).json({ success: false, message: sizeCheck.message });
                }
                const existingPlayerIds = participant.lineup.map(item => item.Player.toString());
                const newPlayerIds = playerIds.filter(id => !existingPlayerIds.includes(id.toString()));
                for (const pid of newPlayerIds) {
                    if (await isPlayerRegistered(participant.tournamentItemId, pid)) {
                        const player = await Player.findById(pid);
                        await session.abortTransaction();
                        return res.status(409).json({
                            success: false,
                            message: `Player ${player ? player.name : pid} is already registered in this tournament`
                        });
                    }
                }
                participant.lineup = playerIds.map(pid => ({ Player: pid }));
            }

            await participant.save({ session });
            await session.commitTransaction();
            return res.status(200).json({ success: true, message: 'Team updated', data: participant });
        }
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==================== DELETE PARTICIPANT ====================

export const deleteParticipant = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const playerProfile = req.profile;
        if (!playerProfile) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Bạn cần có Player profile' });
        }
        const playerId = playerProfile._id;

        const participant = await Participant.findById(id).session(session);
        if (!participant) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Participant not found' });
        }

        const item = await TournamentItem.findById(participant.tournamentItemId).session(session);
        const orgPermission = item ? await checkPermission(userId, item.organization) : { allowed: false };
        const allowedToRemove = isCaptainOfParticipant(participant, playerId) || orgPermission.allowed;
        if (!allowedToRemove) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Only the team captain or tournament owner can remove members' });
        }

        const tournamentItem = await TournamentItem.findById(participant.tournamentItemId).session(session);
        if (!tournamentItem) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Tournament item not found' });
        }
        if (!isRegistrationOpen(tournamentItem)) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Cannot delete participant after registration period' });
        }

        await Invitation.deleteMany({ participantId: id }).session(session);
        await participant.deleteOne({ session });

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Participant deleted successfully' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==================== INVITATIONS ====================

export const sendParticipantInvitation = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { participantId } = req.params;
        const { receiverId, message } = req.body;
        const senderId = req.user._id;
        const playerProfile = req.profile;
        if (!playerProfile) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Bạn cần có Player profile' });
        }
        const playerId = playerProfile._id;

        const participant = await Participant.findById(participantId).session(session);
        if (!participant) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Participant not found' });
        }
        if (participant.type !== 'team') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Only team participants can have invitations' });
        }

        const perm = await checkParticipantPermission(participant, senderId, playerId);
        if (!perm.allowed) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: perm.message });
        }

        // Tìm Player của người nhận (dùng userId)
        const receiverPlayer = await Player.findOne({ userId: receiverId, status: 'actived' }).session(session);
        if (!receiverPlayer) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Receiver does not have an active player profile' });
        }
        const receiverPlayerId = receiverPlayer._id;

        // Kiểm tra đã có trong team chưa
        if (participant.lineup.some(item => item.Player && item.Player.toString() === receiverPlayerId.toString())) {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: 'Player is already in the team' });
        }

        // Kiểm tra đã đăng ký giải đấu chưa
        if (await isPlayerRegistered(participant.tournamentItemId, receiverPlayerId)) {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: 'Player is already registered in this tournament' });
        }

        // Kiểm tra đã có invitation pending chưa
        const existingInvite = await Invitation.findOne({
            participantId: participant._id,
            receiverId: receiverId,
            status: 'pending'
        }).session(session);
        if (existingInvite) {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: 'An invitation is already pending for this player' });
        }

        const invitation = new Invitation({
            senderId: senderId,
            receiverId: receiverId,
            participantId: participant._id,
            message: message || `You are invited to join team ${participant.name}`
        });
        await invitation.save({ session });

        await session.commitTransaction();
        return res.status(201).json({ success: true, data: invitation });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const acceptParticipantInvitation = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { invitationId } = req.params;
        const userId = req.user._id;
        const playerProfile = req.profile;
        if (!playerProfile) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Bạn cần có Player profile' });
        }
        const playerId = playerProfile._id;

        const invitation = await Invitation.findOneAndUpdate(
            { _id: invitationId, status: 'pending' },
            { $set: { status: 'accepted' } },
            { new: true, session }
        );
        if (!invitation) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Invitation not valid or already processed' });
        }
        if (invitation.receiverId.toString() !== userId.toString()) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'You are not the recipient of this invitation' });
        }

        const participant = await Participant.findById(invitation.participantId).session(session);
        if (!participant) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Participant no longer exists' });
        }

        // Kiểm tra đã có trong team chưa
        if (participant.lineup.some(item => item.Player && item.Player.toString() === playerId.toString())) {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: 'You are already in this team' });
        }

        // Kiểm tra đã đăng ký giải đấu chưa
        if (await isPlayerRegistered(participant.tournamentItemId, playerId)) {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: 'You are already registered in this tournament' });
        }

        // Kiểm tra số lượng thành viên
        const sizeCheck = await validateTeamSize(participant.tournamentItemId, participant.lineup.length + 1);
        if (!sizeCheck.valid) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: sizeCheck.message });
        }

        const tournamentItem = await TournamentItem.findById(participant.tournamentItemId).session(session);
        participant.lineup.push({ Player: playerId });
        syncParticipantMembersAndFees(participant, Number(tournamentItem?.feeEntry || 0));
        await participant.save({ session });

        invitation.status = 'accepted';
        await invitation.save({ session });

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Invitation accepted, you are now in the team' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const rejectParticipantInvitation = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { invitationId } = req.params;
        const userId = req.user._id;

        const invitation = await Invitation.findById(invitationId).session(session);
        if (!invitation || invitation.status !== 'pending') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Invitation not valid' });
        }
        if (invitation.receiverId.toString() !== userId.toString()) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'You are not the recipient' });
        }

        invitation.status = 'rejected';
        await invitation.save({ session });

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Invitation rejected' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const cancelParticipantInvitation = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { invitationId } = req.params;
        const userId = req.user._id;

        const invitation = await Invitation.findById(invitationId).session(session);
        if (!invitation || invitation.status !== 'pending') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Invitation not valid' });
        }
        if (invitation.senderId.toString() !== userId.toString()) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'You are not the sender of this invitation' });
        }

        invitation.status = 'expired';
        await invitation.save({ session });

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Invitation cancelled' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const getParticipantInvitations = async (req, res) => {
    try {
        const { participantId } = req.params;
        const userId = req.user._id;
        const playerProfile = req.profile;
        if (!playerProfile) {
            return res.status(403).json({ success: false, message: 'Bạn cần có Player profile' });
        }
        const playerId = playerProfile._id;

        const participant = await Participant.findById(participantId);
        if (!participant) {
            return res.status(404).json({ success: false, message: 'Participant not found' });
        }
        const perm = await checkParticipantPermission(participant, userId, playerId);
        if (!perm.allowed) {
            return res.status(403).json({ success: false, message: perm.message });
        }

        const invitations = await Invitation.find({ participantId, status: 'pending' })
            .populate('senderId', 'username email avatar')
            .populate('receiverId', 'username email avatar');
        return res.status(200).json({ success: true, data: invitations });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getSentParticipantInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({ senderId: req.user._id })
            .sort({ createdAt: -1 })
            .populate('receiverId', 'username email avatar')
            .populate('participantId', 'name tournamentItemId');
        return res.status(200).json({ success: true, data: invitations });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyParticipantInvitations = async (req, res) => {
    try {
        const userId = req.user._id;
        const invitations = await Invitation.find({ receiverId: userId, status: 'pending' })
            .populate('senderId', 'username email avatar')
            .populate('participantId', 'name tournamentItemId');
        return res.status(200).json({ success: true, data: invitations });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== REMOVE MEMBER ====================

export const removeMemberFromParticipant = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { participantId, memberId } = req.params;
        const userId = req.user._id;
        const playerProfile = req.profile;
        if (!playerProfile) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Bạn cần có Player profile' });
        }
        const playerId = playerProfile._id;

        const participant = await Participant.findById(participantId).session(session);
        if (!participant) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Participant not found' });
        }
        if (participant.type !== 'team') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Only team participants can have members removed' });
        }

        const item = await TournamentItem.findById(participant.tournamentItemId).session(session);
        const orgPermission = item ? await checkPermission(userId, item.organization) : { allowed: false };
        const allowedToRemove = isCaptainOfParticipant(participant, playerId) || orgPermission.allowed;
        if (!allowedToRemove) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Only the team captain or tournament owner can remove members' });
        }

        if (memberId.toString() === playerId.toString()) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'You cannot remove yourself. Use leaveTeam or delete participant' });
        }

        // Kiểm tra thành viên cần xóa có tồn tại trong lineup không (dùng Player._id)
        const memberIndex = participant.lineup.findIndex(item => item.Player && item.Player.toString() === memberId.toString());
        if (memberIndex === -1) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Player is not in the team' });
        }

        participant.lineup.splice(memberIndex, 1);
        participant.memberFees = (participant.memberFees || []).filter(
            item => item.playerId && item.playerId.toString() !== memberId.toString()
        );
        const tournamentItem = await TournamentItem.findById(participant.tournamentItemId).session(session);
        syncParticipantMembersAndFees(participant, Number(tournamentItem?.feeEntry || 0));
        await participant.save({ session });

        // Từ chối các invitation pending của member đó với participant này
        // memberId là Player._id, cần tìm User._id của player đó
        const memberPlayer = await Player.findById(memberId).session(session);
        if (memberPlayer) {
            await Invitation.updateMany(
                { participantId, receiverId: memberPlayer.userId, status: 'pending' },
                { status: 'rejected' },
                { session }
            );
        }

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const leaveParticipant = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { participantId } = req.params;
        const userId = req.user._id;
        const playerProfile = req.profile;
        if (!playerProfile) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Bạn cần có Player profile' });
        }
        const playerId = playerProfile._id;

        const participant = await Participant.findById(participantId).session(session);
        if (!participant) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Participant not found' });
        }
        if (participant.type !== 'team') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Only team participants allow leaving' });
        }

        const memberIndex = participant.lineup.findIndex(item => item.Player && item.Player.toString() === playerId.toString());
        if (memberIndex === -1) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'You are not a member of this team' });
        }

        participant.lineup.splice(memberIndex, 1);
        await participant.save({ session });

        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'You have left the team' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};
