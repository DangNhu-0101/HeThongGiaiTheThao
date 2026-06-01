// routes/sponsorRoutes.js
import express from 'express';
import multer from 'multer';
import {
    getSponsorsByTournament,
    getSponsorById,
    createSponsor,
    updateSponsor,
    deactivateSponsor,
    activateSponsor,
    deleteSponsor
} from '../controllers/sponsorController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Public routes (hoặc có thể cần authenticate tùy nhu cầu)
router.get('/tournaments/:tournamentId/sponsors', getSponsorsByTournament);
router.get('/sponsors/:id', getSponsorById);

// Routes yêu cầu đăng nhập và quyền tổ chức (org) hoặc admin
router.post('/sponsors', protectedRoute('org'), upload.single('logo'), createSponsor);
router.put('/sponsors/:id', protectedRoute('org'), upload.single('logo'), updateSponsor);
router.patch('/sponsors/:id/deactivate', protectedRoute('org'), deactivateSponsor);
router.patch('/sponsors/:id/activate', protectedRoute('org'), activateSponsor);
router.delete('/sponsors/:id', protectedRoute('org'), deleteSponsor);

export default router;