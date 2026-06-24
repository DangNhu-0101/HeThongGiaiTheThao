import mongoose from 'mongoose';
import Participant from '../models/participant.js';
import TournamentItem from '../models/tournamentItem.js';
import Player from '../models/players.js';
import User from '../models/users.js';
import CategoryRule from '../models/rules/categories.js';
import ParticipantInvitation from '../models/participantInvitation.js';

// ==================== HELPERS ====================

const isPlayerRegistered = async (tournamentItemId, playerId) => {
    const participants = await Participant.find({ tournamentItemId });
    for (const p of participants) {
        if (p.lineup.some(item => item.Player.toString() === playerId.toString())) {
            return true;
        }
    }
    return false;
};

const validateTeamSize = async (tournamentItemId, lineupLength) => {
    const tournamentItem = await TournamentItem.findById(tournamentItemId).populate('categoryRule');
    if (!tournamentItem) {
        throw new Error('Tournament item not found');
    }
    if (!tournamentItem.categoryRule) {
        return;
    }
    const { minPlayers, maxPlayers } = tournamentItem.categoryRule;
    if (minPlayers && lineupLength < minPlayers) {
        throw new Error(`Team must have at least ${minPlayers} players`);
    }
    if (maxPlayers && lineupLength > maxPlayers) {
        throw new Error(`Team cannot have more than ${maxPlayers} players`);
    }
};

const isRegistrationOpen = (tournamentItem) => {
    const now = new Date();
    const { registrationStart, registrationEnd } = tournamentItem.timeLine;
    return now >= registrationStart && now <= registrationEnd;
};

const getActivePlayerProfile = async (userId) => {
    const player = await Player.findOne({ userId, status: 'active' });
    if (!player) {
        throw new Error('User does not have an active player profile');
    }
    return player;
};

const isMemberOfParticipant = (participant, userId) => {
    return participant.lineup.some(item => item.Player.toString() === userId.toString());
};

// ==================== CRUD PARTICIPANT ====================

export const createParticipant = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user._id;
        const userPlayer = req.profile;

        const { tournamentItemId, type, name, logo, lineup, invitees } = req.body;

        const tournamentItem = await TournamentItem.findById(tournamentItemId).session(session);
        if (!tournamentItem) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Tournament item not found' });
        }

        if (!isRegistrationOpen(tournamentItem)) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Registration is not open' });
        }

        if (!['player', 'team'].includes(type)) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Invalid type. Must be "player" or "team"' });
        }

        if (!userPlayer) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'You must have a player profile to register' });
        }

        let finalLineup = [];
        let invitedPlayerIds = [];

        if (type === 'player') {
            if (await isPlayerRegistered(tournamentItemId, userPlayer._id)) {
                await session.abortTransaction();
                return res.status(409).json({ success: false, message: 'You are already registered in this tournament' });
            }
            finalLineup = [{ Player: userPlayer._id }];
            const participantName = name || userPlayer.name;
            const participantLogo = logo || userPlayer.avatar || '';

            const participant = new Participant({
                type: 'player',
                tournamentItemId,
                name: participantName,
                logo: participantLogo,
                lineup: finalLineup
            });
            await participant.save({ session });

            await session.commitTransaction();
            return res.status(201).json({
                success: true,
                message: 'Player registered successfully',
                data: participant
            });
        } else {
            if (lineup && Array.isArray(lineup) && lineup.length >= 2) {
                const playerIds = lineup.map(item => item.Player);
                if (!playerIds.some(id => id.toString() === userId.toString())) {
                    await session.abortTransaction();
                    return res.status(400).json({ success: false, message: 'Captain (you) must be included in the lineup' });
                }
                const players = await Player.find({ _id: { $in: playerIds }, status: 'active' }).session(session);
                if (players.length !== playerIds.length) {
                    await session.abortTransaction();
                    return res.status(400).json({ success: false, message: 'One or more players do not exist or are not active' });
                }
                for (const pid of playerIds) {
                    if (await isPlayerRegistered(tournamentItemId, pid)) {
                        const player = await Player.findById(pid);
                        await session.abortTransaction();
                        return res.status(409).json({ success: false, message: `Player ${player ? player.name : pid} is already registered in this tournament` });
                    }
                }
                try {
                    await validateTeamSize(tournamentItemId, playerIds.length);
                } catch (err) {
                    await session.abortTransaction();
                    return res.status(400).json({ success: false, message: err.message });
                }
                finalLineup = playerIds.map(pid => ({ Player: pid }));
            } else {
                if (await isPlayerRegistered(tournamentItemId, userId)) {
                    await session.abortTransaction();
                    return res.status(409).json({ success: false, message: 'You are already registered in this tournament' });
                }
                finalLineup = [{ Player: userPlayer._id }];
            }

            if (invitees && Array.isArray(invitees)) {
                invitedPlayerIds = invitees;
            }

            if (!name || !name.trim()) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: 'Team name is required' });
            }

            const participant = new Participant({
                type: 'team',
                tournamentItemId,
                name: name.trim(),
                logo: logo || '',
                lineup: finalLineup
            });
            await participant.save({ session });

            for (const inviteeId of invitedPlayerIds) {
                const inviteePlayer = await Player.findOne({ userId: inviteeId, status: 'active' }).session(session);
                if (!inviteePlayer) {
                    await session.abortTransaction();
                    return res.status(400).json({ success: false, message: `Invitee ${inviteeId} does not have an active player profile` });
                }
                if (participant.lineup.some(item => item.Player.toString() === inviteeId.toString())) {
                    continue;
                }
                if (await isPlayerRegistered(tournamentItemId, inviteeId)) {
                    await session.abortTransaction();
                    return res.status(409).json({ success: false, message: `Invitee ${inviteePlayer.name} is already registered in this tournament` });
                }
                const existingInvite = await ParticipantInvitation.findOne({
                    participantId: participant._id,
                    receiverId: inviteeId,
                    status: 'pending'
                }).session(session);
                if (existingInvite) continue;

                const invitation = new ParticipantInvitation({
                    senderId: userId,
                    receiverId: inviteeId,
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
        }
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const getParticipantsByTournament = async (req, res) => {
    try {
        const { tournamentItemId } = req.params;
        const participants = await Participant.find({ tournamentItemId })
            .populate('lineup.Player', 'name email avatar');
        return res.status(200).json({ success: true, data: participants });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getParticipant = async (req, res) => {
    try {
        const { id } = req.params;
        const participant = await Participant.findById(id)
            .populate('lineup.Player', 'name email avatar');
        if (!participant) {
            return res.status(404).json({ success: false, message: 'Participant not found' });
        }
        return res.status(200).json({ success: true, data: participant });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateParticipant = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { name, logo, lineup } = req.body;
        const userId = req.user._id;

        const participant = await Participant.findById(id).session(session);
        if (!participant) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Participant not found' });
        }

        if (!isMemberOfParticipant(participant, userId)) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'You are not a member of this participant' });
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
                if (!Array.isArray(lineup) || lineup.length < 2) {
                    await session.abortTransaction();
                    return res.status(400).json({ success: false, message: 'Team must have at least 2 players' });
                }
                const playerIds = lineup.map(item => item.Player);
                if (!playerIds.some(id => id.toString() === userId.toString())) {
                    await session.abortTransaction();
                    return res.status(403).json({ success: false, message: 'You cannot remove yourself from the team' });
                }
                const players = await Player.find({ _id: { $in: playerIds }, status: 'active' }).session(session);
                if (players.length !== playerIds.length) {
                    await session.abortTransaction();
                    return res.status(400).json({ success: false, message: 'One or more players are invalid or inactive' });
                }
                try {
                    await validateTeamSize(participant.tournamentItemId, playerIds.length);
                } catch (err) {
                    await session.abortTransaction();
                    return res.status(400).json({ success: false, message: err.message });
                }
                const existingPlayerIds = participant.lineup.map(item => item.Player.toString());
                const newPlayerIds = playerIds.filter(id => !existingPlayerIds.includes(id.toString()));
                for (const pid of newPlayerIds) {
                    if (await isPlayerRegistered(participant.tournamentItemId, pid)) {
                        const player = await Player.findById(pid);
                        await session.abortTransaction();
                        return res.status(409).json({ success: false, message: `Player ${player ? player.name : pid} is already registered in this tournament` });
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

export const deleteParticipant = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const participant = await Participant.findById(id).session(session);
        if (!participant) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Participant not found' });
        }

        if (!isMemberOfParticipant(participant, userId)) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'You are not a member of this participant' });
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

        await ParticipantInvitation.deleteMany({ participantId: id }).session(session);
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

        const participant = await Participant.findById(participantId).session(session);
        if (!participant) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Participant not found' });
        }
        if (participant.type !== 'team') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Only team participants can have invitations' });
        }

        if (!isMemberOfParticipant(participant, senderId)) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'You are not a member of this team' });
        }

        const receiverPlayer = await Player.findOne({ userId: receiverId, status: 'active' }).session(session);
        if (!receiverPlayer) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Receiver does not have an active player profile' });
        }

        if (participant.lineup.some(item => item.Player.toString() === receiverId.toString())) {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: 'Player is already in the team' });
        }

        if (await isPlayerRegistered(participant.tournamentItemId, receiverId)) {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: 'Player is already registered in this tournament' });
        }

        const existingInvite = await ParticipantInvitation.findOne({
            participantId,
            receiverId,
            status: 'pending'
        }).session(session);
        if (existingInvite) {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: 'An invitation is already pending for this player' });
        }

        const invitation = new ParticipantInvitation({
            senderId,
            receiverId,
            participantId,
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

        const invitation = await ParticipantInvitation.findById(invitationId).session(session);
        if (!invitation || invitation.status !== 'pending') {
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

        if (participant.lineup.some(item => item.Player.toString() === userId.toString())) {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: 'You are already in this team' });
        }

        if (await isPlayerRegistered(participant.tournamentItemId, userId)) {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: 'You are already registered in this tournament' });
        }

        try {
            await validateTeamSize(participant.tournamentItemId, participant.lineup.length + 1);
        } catch (err) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: err.message });
        }

        participant.lineup.push({ Player: userId });
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

        const invitation = await ParticipantInvitation.findById(invitationId).session(session);
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

        const invitation = await ParticipantInvitation.findById(invitationId).session(session);
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

        const participant = await Participant.findById(participantId);
        if (!participant) {
            return res.status(404).json({ success: false, message: 'Participant not found' });
        }
        if (!isMemberOfParticipant(participant, userId)) {
            return res.status(403).json({ success: false, message: 'You are not a member of this team' });
        }

        const invitations = await ParticipantInvitation.find({ participantId, status: 'pending' })
            .populate('senderId', 'username email avatar')
            .populate('receiverId', 'username email avatar');
        return res.status(200).json({ success: true, data: invitations });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyParticipantInvitations = async (req, res) => {
    try {
        const userId = req.user._id;
        const invitations = await ParticipantInvitation.find({ receiverId: userId, status: 'pending' })
            .populate('senderId', 'username email avatar')
            .populate('participantId', 'name tournamentItemId');
        return res.status(200).json({ success: true, data: invitations });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const removeMemberFromParticipant = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { participantId, memberId } = req.params;
        const captainId = req.user._id;

        const participant = await Participant.findById(participantId).session(session);
        if (!participant) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Participant not found' });
        }
        if (participant.type !== 'team') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Only team participants can have members removed' });
        }

        if (!isMemberOfParticipant(participant, captainId)) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'You are not a member of this team' });
        }

        if (memberId.toString() === captainId.toString()) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'You cannot remove yourself. Use leaveTeam or delete participant' });
        }

        const memberIndex = participant.lineup.findIndex(item => item.Player.toString() === memberId.toString());
        if (memberIndex === -1) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Player is not in the team' });
        }

        participant.lineup.splice(memberIndex, 1);
        await participant.save({ session });

        await ParticipantInvitation.updateMany(
            { participantId, receiverId: memberId, status: 'pending' },
            { status: 'rejected' },
            { session }
        );

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

        const participant = await Participant.findById(participantId).session(session);
        if (!participant) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Participant not found' });
        }
        if (participant.type !== 'team') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Only team participants allow leaving' });
        }

        const memberIndex = participant.lineup.findIndex(item => item.Player.toString() === userId.toString());
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