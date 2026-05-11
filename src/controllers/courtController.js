import Court from "../models/courts.js";
import mongoose from "mongoose";

// Lấy tất cả sân của 1 giải đấu
export const getCourtsByTournament = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
            return res.status(400).json({ success: false, message: "ID giải đấu không hợp lệ" });
        }

        const courts = await Court.find({ 
            $or: [
                { tournamentId: tournamentId },
                { tournamentId: null },
                { tournamentId: { $exists: false } }
            ]
        });
        
        console.log(`Tìm thấy ${courts.length} sân cho giải đấu ${tournamentId}`);
        
        return res.status(200).json({ success: true, data: courts });
    } catch (error) {
        console.error("Lỗi getCourtsByTournament:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách sân" });
    }
};

// Thêm sân mới (Hỗ trợ lưu môn thi đấu)
export const addCourt = async (req, res) => {
    try {
        const { name, tournamentId, sportTypes } = req.body;

        if (!name || !tournamentId) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin" });
        }

        // Tạo sân mới
        const newCourt = await Court.create({ 
            name, 
            tournamentId, 
            sportTypes: sportTypes || ['Pickleball'], // Mặc định là Pickleball nếu không chọn
            status: 'empty' 
        });

        return res.status(201).json({ 
            success: true, 
            message: "Thêm sân thành công", 
            data: newCourt 
        });
    } catch (error) {
        console.error("Lỗi addCourt:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi thêm sân" });
    }
};

// Cập nhật trạng thái sân (Rảnh <-> Bận)
export const toggleCourtStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { courtId } = req.params;

        const updatedCourt = await Court.findByIdAndUpdate(
            courtId, 
            { status }, 
            { new: true }
        );

        if (!updatedCourt) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sân" });
        }

        return res.status(200).json({ success: true, data: updatedCourt });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái sân" });
    }
};