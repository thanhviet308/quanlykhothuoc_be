// src/routes/authRoutes.js
import express from 'express';
import { login, me, changePassword, register, logout } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/change-password', requireAuth, changePassword);
router.post('/register', requireAuth, /*requireRole('ADMIN'),*/ register); // tuỳ chính sách
router.post('/logout', requireAuth, logout);

export default router;
