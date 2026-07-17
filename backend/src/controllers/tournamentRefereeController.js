import mongoose from "mongoose";
import bcrypt from "bcrypt";
import TournamentReferee from "../models/tournamentReferees.js";
import User from "../models/users.js";
import Role from "../models/roles.js";
import Referee from "../models/referees.js";
import { checkTournamentItemPermission } from "../utils/tournamentHelper.js";
import { getUniqueUsername, makeImportPassword, slugifyUsername } from "../utils/excelConfig.js";

const allowedStatus = ["available", "assigned", "unavailable"];

const assertTournamentPermission = async (userId, tournamentItemId) => {
    const perm = await checkTournamentItemPermission(tournamentItemId, userId);
    return perm;
};

const ensureRefereeRole = async (session = null) => {
    const role = await Role.findOne({ name: "referee" }).session(session);
    if (!role) throw new Error("Thiếu role referee trong hệ thống.");
    return role;
};

const addRefereeRoleToUser = async (user, session = null) => {
    const refereeRole = await ensureRefereeRole(session);
    const hasRole = (user.roles || []).some((role) => {
        const roleId = role?._id || role;
        const roleName = role?.name;
        return roleName === "referee" || roleId?.toString() === refereeRole._id.toString();
    });
    if (!hasRole) {
        user.roles.push(refereeRole._id);
        await user.save({ session });
    }
    return refereeRole;
};

const syncRefereeProfile = async ({ userId, name, phoneNumber, qualification, experience, actorId, session = null }) => {
    const existing = await Referee.findOne({ userId }).session(session);
    if (existing) {
        existing.name = name || existing.name;
        existing.phoneNumber = phoneNumber || existing.phoneNumber || "";
        existing.sports = qualification ? [{ category: qualification, yearsOfExperience: Number(experience || 0) }] : existing.sports;
        if (existing.status !== "actived") existing.status = "actived";
        existing.verifiedAt = existing.verifiedAt || new Date();
        existing.verifiedBy = existing.verifiedBy || actorId;
        await existing.save({ session });
        return existing;
    }

    const [profile] = await Referee.create([{
        userId,
        name,
        phoneNumber: phoneNumber || "",
        sports: qualification ? [{ category: qualification, yearsOfExperience: Number(experience || 0) }] : [],
        status: "actived",
        verifiedAt: new Date(),
        verifiedBy: actorId
    }], { session });
    return profile;
};

const createGeneratedRefereeAccount = async ({ name, phoneNumber, qualification, experience, actorId, session }) => {
    const refereeRole = await ensureRefereeRole(session);
    const username = await getUniqueUsername(slugifyUsername(`tt-${name}`), new Set());
    const password = process.env.DEFAULT_REFEREE_PASSWORD || makeImportPassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const email = `${username}@referee.local`;
    const normalizedPhone = String(phoneNumber || "").trim();
    const canUsePhone = normalizedPhone && !(await User.exists({ phoneNumber: normalizedPhone }).session(session));
    const accountPhone = canUsePhone ? normalizedPhone : `referee-${username}`;

    const [user] = await User.create([{
        username,
        email,
        phoneNumber: accountPhone,
        hashedPassword,
        roles: [refereeRole._id],
        status: "actived",
        fullName: name,
        isDefaultGenerated: true,
        mustChangePassword: true
    }], { session });

    await syncRefereeProfile({ userId: user._id, name, phoneNumber, qualification, experience, actorId, session });
    return { user, password };
};

export const getTournamentReferees = async (req, res) => {
    try {
        const { tournamentItemId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(tournamentItemId)) {
            return res.status(400).json({ success: false, message: "tournamentItemId không hợp lệ" });
        }

        const referees = await TournamentReferee.find({ tournamentItemId })
            .populate({
                path: "userId",
                select: "username email phoneNumber avatar status roles",
                populate: { path: "roles", select: "name" },
            })
            .sort({ createdAt: -1 })
            .lean();
        return res.status(200).json({ success: true, data: referees });
    } catch (error) {
        console.error("getTournamentReferees error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createTournamentReferee = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { tournamentItemId, name, phoneNumber, qualification, experience, status } = req.body;
        if (!tournamentItemId || !name?.trim()) {
            return res.status(400).json({ success: false, message: "Thiếu tournamentItemId hoặc tên trọng tài" });
        }
        if (!mongoose.Types.ObjectId.isValid(tournamentItemId)) {
            return res.status(400).json({ success: false, message: "tournamentItemId không hợp lệ" });
        }
        if (status && !allowedStatus.includes(status)) {
            return res.status(400).json({ success: false, message: "Trạng thái trọng tài không hợp lệ" });
        }

        const perm = await assertTournamentPermission(req.user._id, tournamentItemId);
        if (!perm.allowed) return res.status(403).json({ success: false, message: perm.message });

        await session.startTransaction();
        const cleanName = name.trim();
        const account = await createGeneratedRefereeAccount({
            name: cleanName,
            phoneNumber: phoneNumber || "",
            qualification: qualification || "",
            experience: Number(experience || 0),
            actorId: req.user._id,
            session
        });

        const [referee] = await TournamentReferee.create([{
            tournamentItemId,
            userId: account.user._id,
            name: cleanName,
            phoneNumber: phoneNumber || "",
            qualification: qualification || "",
            experience: Number(experience || 0),
            status: status || "available"
        }], { session });

        await session.commitTransaction();
        const populated = await TournamentReferee.findById(referee._id).populate("userId", "username email phoneNumber avatar").lean();

        return res.status(201).json({
            success: true,
            message: "Thêm trọng tài và tạo tài khoản trọng tài thành công",
            data: populated,
            defaultAccount: {
                username: account.user.username,
                password: account.password,
                email: account.user.email,
                phoneNumber: account.user.phoneNumber
            }
        });
    } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error("createTournamentReferee error:", error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

export const updateTournamentReferee = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID trọng tài không hợp lệ" });
        }

        const referee = await TournamentReferee.findById(id);
        if (!referee) return res.status(404).json({ success: false, message: "Không tìm thấy trọng tài" });

        const perm = await assertTournamentPermission(req.user._id, referee.tournamentItemId);
        if (!perm.allowed) return res.status(403).json({ success: false, message: perm.message });

        const allowedFields = ["name", "phoneNumber", "qualification", "experience", "matchesAssigned", "status"];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) referee[field] = req.body[field];
        }
        if (req.body.name !== undefined) referee.name = String(req.body.name).trim();
        if (req.body.status && !allowedStatus.includes(req.body.status)) {
            return res.status(400).json({ success: false, message: "Trạng thái trọng tài không hợp lệ" });
        }

        await referee.save();
        if (referee.userId) {
            await syncRefereeProfile({
                userId: referee.userId,
                name: referee.name,
                phoneNumber: referee.phoneNumber,
                qualification: referee.qualification,
                experience: referee.experience,
                actorId: req.user._id
            });
        }
        const populated = await TournamentReferee.findById(referee._id).populate("userId", "username email phoneNumber avatar").lean();
        return res.status(200).json({ success: true, message: "Cập nhật trọng tài thành công", data: populated });
    } catch (error) {
        console.error("updateTournamentReferee error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteTournamentReferee = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID trọng tài không hợp lệ" });
        }

        const referee = await TournamentReferee.findById(id);
        if (!referee) return res.status(404).json({ success: false, message: "Không tìm thấy trọng tài" });

        const perm = await assertTournamentPermission(req.user._id, referee.tournamentItemId);
        if (!perm.allowed) return res.status(403).json({ success: false, message: perm.message });

        await TournamentReferee.findByIdAndDelete(id);
        return res.status(200).json({ success: true, message: "Xóa trọng tài thành công" });
    } catch (error) {
        console.error("deleteTournamentReferee error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const linkTournamentRefereeAccount = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ" });
        }

        const referee = await TournamentReferee.findById(id);
        if (!referee) return res.status(404).json({ success: false, message: "Không tìm thấy trọng tài" });

        const perm = await assertTournamentPermission(req.user._id, referee.tournamentItemId);
        if (!perm.allowed) return res.status(403).json({ success: false, message: perm.message });

        const user = await User.findById(userId).select("_id username email phoneNumber roles");
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });

        const linked = await TournamentReferee.findOne({ _id: { $ne: referee._id }, userId: user._id });
        if (linked) return res.status(409).json({ success: false, message: "Tài khoản này đã liên kết với trọng tài khác" });

        await session.startTransaction();
        const previousUserId = referee.userId;
        await addRefereeRoleToUser(user, session);
        await syncRefereeProfile({
            userId: user._id,
            name: referee.name,
            phoneNumber: referee.phoneNumber,
            qualification: referee.qualification,
            experience: referee.experience,
            actorId: req.user._id,
            session
        });
        referee.userId = user._id;
        await referee.save({ session });
        if (previousUserId && previousUserId.toString() !== user._id.toString()) {
            const previousUser = await User.findById(previousUserId).session(session);
            if (previousUser?.isDefaultGenerated) {
                await User.deleteOne({ _id: previousUser._id, isDefaultGenerated: true }).session(session);
                await Referee.deleteOne({ userId: previousUser._id }).session(session);
            }
        }
        await session.commitTransaction();
        const populated = await TournamentReferee.findById(referee._id).populate("userId", "username email phoneNumber avatar").lean();
        return res.status(200).json({ success: true, message: "Đã liên kết tài khoản", data: populated });
    } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error("linkTournamentRefereeAccount error:", error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};
