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
        let adminRole = await Role.findOne({ name: "admin" });
        if (!adminRole) {
            adminRole = new Role({
                name: "admin",
                displayName: "Admin",
                permissions: ["ALL"],
                isDefault: false,
            });
            await adminRole.save();
            console.log("✅ Đã tạo role admin");
        }

        // 3. Kiểm tra admin đã tồn tại chưa
        const existingAdmin = await User.findOne({
            email: process.env.ADMIN_EMAIL,
        });

        if (existingAdmin) {
            console.log("⚠️ Admin đã tồn tại:");
            existingAdmin.roles = [adminRole._id];
            await existingAdmin.save();
            console.log("✅ Đã cập nhật tài khoản với role admin");
            process.exit(0);
        }

        // 4. Hash password
        const hashedPassword = await bcrypt.hash(
            process.env.ADMIN_PASSWORD || "Admin@123",
            10
        );

        // 5. Tạo tài khoản admin
        const admin = new User({
            username:"admin",
            email: process.env.ADMIN_EMAIL ,
            phoneNumber: process.env.ADMIN_PHONE,
            hashedPassword,
            roles: [adminRole._id],
            avatar: "",
            status: "actived",
        });

        await admin.save();
        console.log("✅ Tạo admin thành công!");

        // 6. Đóng kết nối
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi tạo admin:", error);
        process.exit(1);
    }
};

createAdmin();
