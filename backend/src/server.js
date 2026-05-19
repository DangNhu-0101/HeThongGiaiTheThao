import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { connectDB } from './libs/db.js';

import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';
import ruleRoute from './routes/ruleRoute.js';
import tournamentRoute from './routes/tournamentRoute.js';
import stageRoutes from './routes/stageRoutes.js';
import refereeRoute from './routes/refereeRoute.js';
import notificationRoute from './routes/notificationRoute.js';
import xlxsRoute from './routes/xlxsRoute.js';
import teamRoute from './routes/teamRoute.js';
import courtRoute from './routes/courtRoute.js';
import matchRoute from './routes/matchRoute.js';
import sponsorRoute from './routes/sponsorRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// --- Cấu hình Middleware ---
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://hethonggiaithethao.onrender.com'
];

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Disposition']
}));

app.use(express.json());
app.use(cookieParser());

// 2. 👉 QUAN TRỌNG: CẤU HÌNH TRUY CẬP FILE ẢNH (STATIC FILES)
// Dòng này giúp link http://localhost:5001/uploads/... hoạt động
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Đăng ký Routes ---
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/rules', ruleRoute);
app.use('/api/matches', matchRoute);
app.use('/api/xlxs', xlxsRoute);
app.use('/api/teams', teamRoute);
// Lưu ý: Đổi tên cho khớp với Frontend đang gọi (/api/tournaments)
app.use('/api/tournaments', tournamentRoute);
app.use('/api/stages', stageRoutes);
app.use('/api/referees', refereeRoute);
app.use('/api/courts', courtRoute);
app.use('/api/sponsors', sponsorRoute);

// 3.  ĐĂNG KÝ ROUTE THÔNG BÁO
app.use('/api/notifications', notificationRoute);

// --- Xử lý Production ---
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
    app.get('/{*path}', (req, res) => { // Sửa lại regex cho chuẩn
        res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    });
}

// --- Khởi động hệ thống ---
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(` Server started on port: ${PORT}`);
    });
}).catch((error) => {
    console.error("Kết nối Database thất bại:", error);
    process.exit(1);
});