import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/users.js";
import Role from "../models/roles.js";
import { connectDB } from "../libs/db.js";

dotenv.config();

const createAdmin = async () => {
    try {
        // 1. Kết nối DB
        await connectDB();
        console.log("✅ Kết nối DB thành công");

        // 2. Tạo role SUPER_ADMIN nếu chưa có
        let adminRole = await Role.findOne({ name: "SUPER_ADMIN" });
        if (!adminRole) {
            adminRole = new Role({
                name: "SUPER_ADMIN",
                displayName: "Super Admin",
                permissions: ["ALL"],
                isDefault: false,
            });
            await adminRole.save();
            console.log("✅ Đã tạo role SUPER_ADMIN");
        }

        // 3. Lấy tất cả các role hiện có trong DB
        const allRoles = await Role.find({});
        const roleIds = allRoles.map(role => role._id);
        console.log(`✅ Tìm thấy ${allRoles.length} roles: ${allRoles.map(r => r.name).join(', ')}`);

        // 4. Kiểm tra admin đã tồn tại chưa
        const existingAdmin = await User.findOne({
            email: process.env.ADMIN_EMAIL,
        });

        if (existingAdmin) {
            console.log("⚠️ Admin đã tồn tại:");
            existingAdmin.roles = roleIds;
            await existingAdmin.save();
            console.log("✅ Đã cập nhật admin với tất cả các role");
            process.exit(0);
        }

        // 5. Hash password
        const hashedPassword = await bcrypt.hash(
            process.env.ADMIN_PASSWORD || "Admin@123",
            10
        );

        // 6. Tạo admin với tất cả các role
        const admin = new User({
            username:"admin",
            email: process.env.ADMIN_EMAIL ,
            phoneNumber: process.env.ADMIN_PHONE,
            hashedPassword,
            roles: roleIds,
            avatar: "",
            status: "actived",
        });

        await admin.save();
        console.log("✅ Tạo admin thành công!");

        // 7. Đóng kết nối
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi tạo admin:", error);
        process.exit(1);
    }
};

createAdmin();