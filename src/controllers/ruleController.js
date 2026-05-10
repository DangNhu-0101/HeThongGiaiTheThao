import BaseRule from '../models/Rule/baseRules.js';
import StageRule from '../models/Rule/stageRules.js'; // Import cái này để dùng trong stages
import RuleSystem from '../models/RuleSystem.js'; // Bạn quên import cái này!
import Tournament from '../models/tournament.js';

export const getRuleSystems = async (req, res) => {
    try {
        const { sport } = req.query;
        let query = {};
        if (sport) query.sport = { $regex: new RegExp(`^${sport}$`, "i") };

        const rules = await RuleSystem.find(query);
        return res.status(200).json({ success: true, count: rules.length, data: rules });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi hệ thống", error: error.message });
    }
};

export const getAllRules = async (req, res) => {
    try {
        const { tournamentId } = req.query;
        let filter = {};
        if (tournamentId) filter.tournamentId = tournamentId;

        // Populate sâu để lấy hết config của vòng đấu, điểm số...
        const rules = await BaseRule.find(filter)
            .populate('tournamentStructure.stages')
            .populate('tournamentStructure.ScoringRule')
            .sort({ createdAt: -1 })
            .lean(); 

        return res.status(200).json({ success: true, count: rules.length, data: rules });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getDetailRules = async (req, res) => {
    try {
        const { id } = req.params; // Đổi thành id cho chuẩn RESTful
        const rule = await BaseRule.findById(id)
            .populate('tournamentStructure.stages')
            .populate('tournamentStructure.ScoringRule')
            .lean();
            
        if (!rule) return res.status(404).json({ success: false, message: "Không tìm thấy bộ luật." });
        return res.status(200).json({ success: true, data: rule });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const editRule = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Cập nhật thẳng vào BaseRule (Hoặc phải update các bảng phụ như ScoringRule nếu có sửa đổi chi tiết)
        const updatedRule = await BaseRule.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedRule) return res.status(404).json({ message: "Không tìm thấy bộ luật." });

        return res.status(200).json({ success: true, data: updatedRule });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const deleteRule = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedRule = await BaseRule.findByIdAndDelete(id);
        
        if (!deletedRule) return res.status(404).json({ message: "Bộ luật không tồn tại." });

        await Tournament.updateMany(
            { rules: id },
            { $pull: { rules: id } }
        );

        return res.status(200).json({ success: true, message: "Đã xóa thành công." });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
export const saveTournamentStages = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { stages, sportType } = req.body; // Hứng payload { sportType, stages } từ React gửi lên

        console.log(`Đang lưu cấu hình vòng đấu cho giải: ${tournamentId}, môn: ${sportType}`);

        // 1. Kiểm tra giải đấu có tồn tại không
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giải đấu tương ứng!" });
        }

        // 2. Tìm xem môn này trong giải đã từng cấu hình vòng đấu chưa
        let stageRule = await StageRule.findOne({ tournamentId, sport: sportType });

        if (stageRule) {
            // Đã có cấu hình -> Chỉ cập nhật mảng stages mới ghi đè lên
            stageRule.stages = stages;
            await stageRule.save();
        } else {
            // Chưa cấu hình -> Tạo mới bộ luật vòng đấu cho môn thi này
            stageRule = await StageRule.create({
                tournamentId,
                sport: sportType || 'Pickleball',
                ruleName: `Cấu hình vòng đấu môn ${sportType || 'Pickleball'}`,
                stages: stages
            });

            // 3. Đút ID của bộ luật mới tạo vào mảng rules của giải đấu để liên kết
            await Tournament.findByIdAndUpdate(tournamentId, {
                $addToSet: { rules: stageRule._id } // Dùng $addToSet để không bị push trùng lặp ID
            });
        }

        return res.status(200).json({
            success: true,
            message: `Lưu cấu hình vòng đấu môn ${sportType} thành công!`,
            data: stageRule
        });

    } catch (error) {
        console.error("🔥 Lỗi tại saveTournamentStages:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống khi lưu cấu hình vòng đấu",
            error: error.message
        });
    }
};