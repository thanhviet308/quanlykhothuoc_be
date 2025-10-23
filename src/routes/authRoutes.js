// src/routes/authRoutes.js
import express from 'express';
import { login, me, changePassword, register, logout } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/change-password', requireAuth, changePassword);
// Đăng ký: cho phép công khai khi KHÔNG có người dùng nào (bootstrap ADMIN),
// các lần sau yêu cầu token ADMIN. Logic được kiểm tra trong controller.
router.post('/register', register);
router.post('/logout', requireAuth, logout);

export default router;
