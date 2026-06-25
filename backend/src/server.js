// server.js
import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

import { connectDB } from './libs/db.js';
import initRoles from './scripts/initialRole.js';

// Import routes (không có 's' ở cuối)
import authRoutes from './routes/authRoute.js';
import tournamentRoutes from './routes/tournamentRoute.js';
import stageRoutes from './routes/stageRoute.js';
import ruleRoutes from './routes/ruleRoute.js';
import sponsorRoutes from './routes/sponsorRoute.js';
import courtRoutes from './routes/courtRoute.js';
import participantRoutes from './routes/teamRoute.js';
import matchRoutes from './routes/matchRoute.js';
import userRoutes from './routes/userRoute.js';
import adminRoutes from './routes/adminRoute.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/matches', matchRoutes);

// Route health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Kết nối DB và khởi động server
connectDB().then(async () => {
    try {
        const roleCount = await mongoose.model('Role').countDocuments();
        if (roleCount === 0) {
            await initRoles();
            console.log('✅ Roles initialized');
        } else {
            console.log('✅ Roles already exist, skipping init.');
        }
    } catch (error) {
        console.warn('⚠️ Không thể kiểm tra roles, bỏ qua init:', error.message);
    }

    app.listen(PORT, () => {
        console.log(`🚀 Server started on port: ${PORT}`);
        console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}).catch((error) => {
    console.error("❌ Kết nối Database thất bại:", error);
    process.exit(1);
});

export default app;