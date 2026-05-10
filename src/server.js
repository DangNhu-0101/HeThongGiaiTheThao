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
import courtRoute from './routes/courtRoute.js';
import matchRoute from './routes/matchRoute.js';
import sponsorRoute from './routes/sponsorRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;


// --- Cấu hình Middleware ---

app.use(express.json());
app.use(cookieParser());

// --- Đăng ký Routes ---
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/rules', ruleRoute);
app.use('/api/matches', matchRoute);
app.use('/api/teams', teamRoute);
app.use('/api/tournaments', tournamentRoute);
app.use('/api/courts', courtRoute);
app.use('/api/sponsors', sponsorRoute);

// --- Kết nối Database & Khởi động Server ---
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(` Server bắt đầu trên cổng: ${PORT}`);
    });
}).catch((error) => {
    console.error("Kết nối Database thất bại:", error);
    process.exit(1);
});