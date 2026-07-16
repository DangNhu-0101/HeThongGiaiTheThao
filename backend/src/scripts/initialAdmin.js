import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/users.js";
import Role from "../models/roles.js";
import { connectDB } from "../libs/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const requiredEnv = ["ADMIN_EMAIL", "ADMIN_PHONE", "ADMIN_PASSWORD"];

const createAdmin = async () => {
    try {
        const missingEnv = requiredEnv.filter((key) => !process.env[key]);
        if (missingEnv.length) {
            throw new Error(`Thiếu biến môi trường: ${missingEnv.join(", ")}`);
        }

        await connectDB();
        console.log("MongoDB connected");

        const adminUsername = process.env.ADMIN_USERNAME || "admin";
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPhone = process.env.ADMIN_PHONE;

        let adminRole = await Role.findOne({ name: "admin" });
        if (!adminRole) {
            adminRole = await Role.create({
                name: "admin",
                displayName: "Quản trị viên",
                permissions: ["*"],
                isDefault: false
            });
            console.log("Admin role created");
        }

        const existingAdmin = await User.findOne({
            $or: [
                { username: adminUsername },
                { email: adminEmail },
                { phoneNumber: adminPhone }
            ]
        }).populate("roles", "name");

        if (existingAdmin) {
            const hasAdminRole = existingAdmin.roles.some((role) => role?.name === "admin");
            const update = {
                $set: {
                    username: existingAdmin.username || adminUsername,
                    email: existingAdmin.email || adminEmail,
                    phoneNumber: existingAdmin.phoneNumber || adminPhone,
                    status: "actived"
                },
                $addToSet: { roles: adminRole._id }
            };

            await User.updateOne({ _id: existingAdmin._id }, update);

            const roleNames = existingAdmin.roles.map((role) => role.name).join(", ");
            console.log(
                hasAdminRole
                    ? `Admin already exists: ${existingAdmin.email} (${roleNames || "no roles"})`
                    : `Admin repaired: ${existingAdmin.email} (added role admin)`
            );
            return;
        }

        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

        const admin = await User.create({
            username: adminUsername,
            email: adminEmail,
            phoneNumber: adminPhone,
            hashedPassword,
            roles: [adminRole._id],
            avatar: "",
            status: "actived"
        });

        console.log(`Admin created: ${admin.email}`);
    } catch (error) {
        console.error("Create admin failed:", error);
        process.exitCode = 1;
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log("MongoDB disconnected");
        }
    }
};

createAdmin();
