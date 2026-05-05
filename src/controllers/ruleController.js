import { RuleRegister } from '../utils/ruleRegister.js';
import BaseRule from '../models/Rule/baseRules.js';
import Tournament from '../models/tournament.js';

/**
 * 1. LẤY TẤT CẢ BỘ LUẬT (Thư viện luật hoặc theo giải đấu)
 * @route GET /api/rules/all
 */
export const getAllRules = async (req, res) => {
    try {
        const { tournamentId } = req.query;

        // Nếu có tournamentId thì lọc theo giải, không thì lấy toàn bộ thư viện luật
        let filter = {};
        if (tournamentId) filter.tournamentId = tournamentId;

        // Truy vấn trên BaseRule sẽ lấy được tất cả các môn (Football, Racket...) 
        // nhờ tính chất Polymorphism của Discriminators
        const rules = await BaseRule.find(filter)
            .sort({ createdAt: -1 })
            .lean(); // .lean() giúp tăng tốc độ truy vấn bằng cách trả về POJO thay vì Mongoose Documents

        return res.status(200).json({
            success: true,
            message: tournamentId 
                ? `Danh sách luật của giải đấu ID: ${tournamentId}` 
                : "Danh sách tất cả bộ luật trong hệ thống",
            count: rules.length,
            data: rules
        });
    } catch (error) {
        console.error("Lỗi getAllRules:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi hệ thống khi lấy danh sách luật", 
            error: error.message 
        });
    }
};

/**
 * 2. LẤY CHI TIẾT LUẬT THEO ID HOẶC THEO MÔN
 * @route GET /api/rules/detail/:ruleId
 */
export const getDetailRules = async (req, res) => {
    const { ruleId } = req.params;
    const { sportType } = req.params; // Dùng nếu muốn lấy theo tên môn
    const { tournamentId } = req.query;

    try {
        // Ưu tiên tìm theo ID cụ thể nếu có
        if (ruleId) {
            const rule = await BaseRule.findById(ruleId).lean();
            if (!rule) return res.status(404).json({ success: false, message: "Không tìm thấy bộ luật." });
            return res.status(200).json({ success: true, data: rule });
        }

        // Nếu tìm theo sportType (football, racket...)
        const formattedSportType = sportType.charAt(0).toUpperCase() + sportType.slice(1).toLowerCase();
        const SelectedModel = RuleRegister[formattedSportType];

        if (!SelectedModel) {
            return res.status(400).json({
                success: false,
                message: `Loại môn thi '${sportType}' không hỗ trợ.`
            });
        }

        let filter = {};
        if (tournamentId) filter.tournamentId = tournamentId;

        const rules = await SelectedModel.findOne(filter).lean();

        if (!rules) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy luật môn ${formattedSportType} cho yêu cầu này.`
            });
        }

        return res.status(200).json({
            success: true,
            data: rules
        });

    } catch (error) {
        console.error(`Lỗi getDetailRules:`, error);
        return res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
};

/**
 * 3. TẠO LUẬT MỚI (Hỗ trợ tạo nhiều luật cùng lúc cho giải đấu)
 * Dùng cho internal logic khi tạo Tournament
 */
export const createRules = async (sportConfigs, tournamentId, session = null) => {
    try {
        if (!Array.isArray(sportConfigs) || sportConfigs.length === 0) {
            throw new Error("Không có cấu hình môn thi đấu.");
        }

        const rulePromises = sportConfigs.map(async (config) => {
            const { sportType, ...details } = config;
            const Model = RuleRegister[sportType] || RuleRegister.Default;

            const newRule = new Model({
                ...details,
                sportType,
                tournamentId: tournamentId
            });

            return newRule.save({ session });
        });

        return await Promise.all(rulePromises);
    } catch (error) {
        console.error("Lỗi createRules:", error);
        throw error; 
    }
};

/**
 * 4. CẬP NHẬT LUẬT
 * @route PATCH /api/rules/editRule/:ruleId
 */
export const editRule = async (req, res) => {
    try {
        const { id: ruleId } = req.params;
        const updateData = req.body;

        const currentRule = await BaseRule.findById(ruleId);
        if (!currentRule) {
            return res.status(404).json({ message: "Không tìm thấy bộ luật." });
        }

        const SelectedModel = RuleRegister[currentRule.sportType] || RuleRegister.Default;

        const updatedRule = await SelectedModel.findByIdAndUpdate(
            ruleId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: `Cập nhật luật môn ${currentRule.sportType} thành công`,
            data: updatedRule
        });
    } catch (error) {
        console.error("Lỗi editRule:", error);
        return res.status(500).json({ message: "Lỗi hệ thống khi sửa luật", error: error.message });
    }
};

/**
 * 5. XÓA LUẬT
 * @route DELETE /api/rules/deleteRule/:ruleId
 */
export const deleteRule = async (req, res) => {
    try {
        const { ruleId } = req.params;

        const deletedRule = await BaseRule.findByIdAndDelete(ruleId);
        if (!deletedRule) {
            return res.status(404).json({ message: "Bộ luật không tồn tại." });
        }

        // Xóa liên kết trong Tournament
        await Tournament.updateMany(
            { rules: ruleId },
            { $pull: { rules: ruleId } }
        );

        return res.status(200).json({
            success: true,
            message: `Đã xóa thành công bộ luật môn ${deletedRule.sportType}.`
        });
    } catch (error) {
        console.error("Lỗi deleteRule:", error);
        return res.status(500).json({ message: "Lỗi hệ thống khi xóa luật", error: error.message });
    }
};