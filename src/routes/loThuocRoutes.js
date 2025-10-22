// src/routes/loThuocRoutes.js
import express from 'express';
import { listLoThuoc } from '../controllers/loThuocController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Lấy danh sách lô thuốc (chi tiết tồn kho)
// Yêu cầu đăng nhập (ADMIN hoặc STAFF)
router.get('/', requireAuth, listLoThuoc);

export default router;