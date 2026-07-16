import mongoose from "mongoose";
import TournamentReferee from "../models/tournamentReferees.js";
import User from "../models/users.js";
import { checkTournamentItemPermission } from "../utils/tournamentHelper.js";

const allowedStatus = ["available", "assigned", "unavailable"];

const assertTournamentPermission = async (userId, tournamentItemId) => {
    const perm = await checkTournamentItemPermission(tournamentItemId, userId);
    return perm;
};

export const getTournamentReferees = async (req, res) => {
    try {
        const { tournamentItemId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(tournamentItemId)) {
            return res.status(400).json({ success: false, message: "tournamentItemId không hợp lệ" });
        }

        const referees = await TournamentReferee.find({ tournamentItemId }).populate("userId", "username email phoneNumber avatar").sort({ createdAt: -1 }).lean();
        return res.status(200).json({ success: true, data: referees });
    } catch (error) {
        console.error("getTournamentReferees error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createTournamentReferee = async (req, res) => {
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

        const referee = await TournamentReferee.create({
            tournamentItemId,
            name: name.trim(),
            phoneNumber: phoneNumber || "",
            qualification: qualification || "",
            experience: Number(experience || 0),
            status: status || "available"
        });

        return res.status(201).json({ success: true, message: "Thêm trọng tài thành công", data: referee });
    } catch (error) {
        console.error("createTournamentReferee error:", error);
        return res.status(500).json({ success: false, message: error.message });
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
        return res.status(200).json({ success: true, message: "Cập nhật trọng tài thành công", data: referee });
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

        const user = await User.findById(userId).select("_id username email phoneNumber");
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });

        const linked = await TournamentReferee.findOne({ _id: { $ne: referee._id }, userId: user._id });
        if (linked) return res.status(409).json({ success: false, message: "Tài khoản nay da lien ket voi trọng tài khac" });

        referee.userId = user._id;
        await referee.save();
        const populated = await TournamentReferee.findById(referee._id).populate("userId", "username email phoneNumber avatar").lean();
        return res.status(200).json({ success: true, message: "Đã liên kết tài khoản", data: populated });
    } catch (error) {
        console.error("linkTournamentRefereeAccount error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

