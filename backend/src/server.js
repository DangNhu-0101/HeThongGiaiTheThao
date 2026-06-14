import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';

import { connectDB } from './libs/db.js';
import initRoles from './scripts/initialRole.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cookieParser());
app.use(cors());


connectDB().then(async () => {
    // Chỉ khởi tạo roles nếu cần (có thể kiểm tra số lượng roles)
    const roleCount = await mongoose.model('Role').countDocuments();
    if (roleCount === 0) {
        await initRoles();
    } else {
        console.log('Roles already exist, skipping init.');
    }

    app.listen(PORT, () => {
        console.log(`Server started on port: ${PORT}`);
    });
}).catch((error) => {
    console.error("Kết nối Database thất bại:", error);
    process.exit(1);
});