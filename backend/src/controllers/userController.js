


export const authMe = async (req, res) => {
    return res.status(200).json({
        message: "Lấy thông tin Auth thành công",
        user: req.user
    });
};