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
import teamRoute from './routes/teamRoute.js';
import refereeRoute from './routes/refereeRoute.js';
import courtRoute from './routes/courtRoute.js';
import matchRoute from './routes/matchRoute.js';
import sponsorRoute from './routes/sponsorRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();
// --- Cấu hình Middleware ---
// Danh sách các domain được phép truy cập
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://ten-mien-cua-ban.onrender.com' // THÊM DOMAIN HOSTING CỦA BẠN VÀO ĐÂY
];

app.use(cors({
    origin: function (origin, callback) {
        // Cho phép các yêu cầu không có origin (như Postman) hoặc nằm trong danh sách allowedOrigins
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Chặn bởi CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());
app.use(cookieParser()); // Bây giờ biến này đã được định nghĩa

// --- Đăng ký Routes ---
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/rules', ruleRoute);
app.use('/api/matches', matchRoute);
app.use('/api/teams', teamRoute);
app.use('/api/tournaments', tournamentRoute);
app.use('/api/referees', refereeRoute);
app.use('/api/courts', courtRoute);
app.use('/api/sponsors', sponsorRoute);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
    app.get('/{*path}', (req, res) => {
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